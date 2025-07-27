/**
 * LLM Service - Main orchestrator for prompt generation
 * 
 * Coordinates: Config → Scene Data → Variable Injection → LLM → Storage
 * Smart storage using scene IDs in master JSON
 */

import { getAppConfiguration } from '../lib/database';
import { VariableInjection } from '../utils/VariableInjection';
import { PromptProcessor } from '../utils/PromptProcessor';
import { SceneDataTransformer, ScenePromptData } from '../utils/SceneDataTransformer';
import LLMProviderFactory, { LLMProviderType, LLMResponse, LLMConfig } from './LLMProviders';

export interface ScenePromptResult {
  success: boolean;
  sceneId: string;
  generatedPrompt?: string;
  characterCount?: number;
  provider?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  error?: string;
}

export interface BulkPromptResult {
  success: boolean;
  totalScenes: number;
  successfulScenes: number;
  results: ScenePromptResult[];
  errors: string[];
}

export class LLMService {
  private defaultProvider: LLMProviderType = 'openai';
  
  /**
   * Initialize service - simple validation (no caching)
   */
  async initialize(): Promise<void> {
    try {
      const config = await this.getFreshConfig();
      
      if (!config || Object.keys(config).length === 0) {
        throw new Error('No configuration found - please create initial configuration in Config tab');
      }
      
      if (!config?.start_frame_prompt_generation) {
        throw new Error('LLM configuration incomplete - please configure prompts in Config tab');
      }
      
      console.log('✅ LLM Service initialized successfully (no caching)');
      
    } catch (error) {
      console.error('LLM Service initialization failed:', error);
      throw error;
    }
  }
  
  /**
   * Get fresh configuration from database (no caching)
   */
  private async getFreshConfig(): Promise<any> {
    const config = await getAppConfiguration();
    
    console.log('🔍 LLM Service Debug - Fresh config loaded:', {
      configExists: !!config,
      configKeys: Object.keys(config || {}),
      hasStartFrame: !!config?.start_frame_prompt_generation,
      systemPromptLength: config?.start_frame_prompt_generation?.system_prompt?.length || 0,
      userPromptLength: config?.start_frame_prompt_generation?.user_prompt?.length || 0
    });
    
    return config;
  }
  
  /**
   * Generate image prompt for a single scene
   */
  async generateSceneImagePrompt(
    sceneId: string, 
    masterJSON: any,
    options: {
      provider?: LLMProviderType;
      extractionMetadata?: any;
    } = {}
  ): Promise<ScenePromptResult> {
    try {
      // Always get fresh config from database
      const config = await this.getFreshConfig();
      
      if (!config?.start_frame_prompt_generation) {
        throw new Error('LLM configuration not found - please configure prompts in Config tab');
      }
      
      const provider = options.provider || this.defaultProvider;
      console.log(`Generating prompt for ${sceneId} using ${provider}...`);
      
      // 1. Transform scene data to scenes_description format
      const sceneData = SceneDataTransformer.transformSceneForPrompt(
        sceneId, 
        masterJSON, 
        options.extractionMetadata
      );
      
      // 2. Get prompts from fresh configuration
      const systemPrompt = config.start_frame_prompt_generation.system_prompt;
      const userPromptTemplate = config.start_frame_prompt_generation.user_prompt;
      
      if (!systemPrompt || !userPromptTemplate) {
        throw new Error('System or user prompt not configured');
      }
      
      // 3. Process prompts (ensure LLM-ready format)
      const processedSystemTemplate = PromptProcessor.formatForLLM(systemPrompt);
      const processedUserTemplate = PromptProcessor.formatForLLM(userPromptTemplate);
      
      // 4. Variable injection using existing system (BOTH system and user prompts)
      const context = {
        masterJSON,
        sceneId: sceneId.startsWith('scene_') ? sceneId : `scene_${sceneId}`,
        currentScene: sceneData
      };
      
      // 🎨 STYLE DEBUG: Log style values before injection
      const primaryColor = masterJSON?.global_style?.color_palette?.primary;
      const renderingLevel = masterJSON?.global_style?.rendering_style?.level;
      console.log('🤖 LLM SERVICE STYLE DEBUG:', {
        sceneId,
        primaryColor,
        renderingLevel,
        hasGlobalStyle: !!masterJSON?.global_style,
        globalStyleKeys: masterJSON?.global_style ? Object.keys(masterJSON.global_style) : 'none'
      });
      
      const finalSystemPrompt = VariableInjection.processTemplate(processedSystemTemplate, context);
      const finalUserPrompt = VariableInjection.processTemplate(processedUserTemplate, context);
      
      // 🎨 STYLE DEBUG: Check if style variables appear in final prompts
      const systemContainsStyle = finalSystemPrompt.includes(primaryColor) || finalSystemPrompt.includes(renderingLevel);
      const userContainsStyle = finalUserPrompt.includes(primaryColor) || finalUserPrompt.includes(renderingLevel);
      console.log('🎨 FINAL PROMPT STYLE CHECK:', {
        systemContainsStyle,
        userContainsStyle,
        systemPromptLength: finalSystemPrompt.length,
        userPromptLength: finalUserPrompt.length
      });
      
      // 5. Get LLM provider and configuration
      const llmProvider = LLMProviderFactory.getProvider(provider);
      const llmConfig: LLMConfig = {
        model: config.llm_providers?.[provider]?.model || 
               (provider === 'openai' ? 'gpt-4-turbo' : 'claude-3-sonnet-20240229'),
        max_tokens: config.llm_providers?.[provider]?.max_tokens || 1000,
        temperature: config.llm_providers?.[provider]?.temperature || 0.7
      };
      
      console.log('Calling LLM with:', {
        provider,
        model: llmConfig.model,
        systemPromptLength: finalSystemPrompt.length,
        userPromptLength: finalUserPrompt.length
      });
      
      // 6. Call LLM
      const llmResponse: LLMResponse = await llmProvider.generatePrompt(
        finalSystemPrompt,
        finalUserPrompt,
        llmConfig
      );
      
      if (!llmResponse.success) {
        throw new Error(llmResponse.error || 'LLM call failed');
      }
      
      // 7. Parse JSON response (expected format: {"scene_id": number, "prompt": "...", "character_count": number})
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(llmResponse.content);
      } catch (parseError) {
        // Fallback: treat entire response as prompt if JSON parsing fails
        parsedResponse = {
          scene_id: parseInt(sceneId.replace('scene_', '')),
          prompt: llmResponse.content.trim(),
          character_count: llmResponse.content.length
        };
      }
      
      const generatedPrompt = parsedResponse.prompt || parsedResponse.content || llmResponse.content;
      const characterCount = parsedResponse.character_count || generatedPrompt.length;
      
      console.log(`✅ Generated prompt for ${sceneId}:`, {
        provider: llmResponse.provider,
        promptLength: generatedPrompt.length,
        characterCount,
        usage: llmResponse.usage
      });
      
      return {
        success: true,
        sceneId,
        generatedPrompt,
        characterCount,
        provider: llmResponse.provider,
        usage: llmResponse.usage
      };
      
    } catch (error: any) {
      console.error(`❌ Failed to generate prompt for ${sceneId}:`, error);
      
      return {
        success: false,
        sceneId,
        error: error.message || 'Unknown error occurred'
      };
    }
  }
  
  /**
   * Generate prompts for multiple scenes in single batch call (n8n pattern)
   */
  async generateAllScenePrompts(
    masterJSON: any,
    options: {
      provider?: LLMProviderType;
      extractionMetadata?: any;
      onProgress?: (completed: number, total: number, currentScene: string) => void;
      sceneIds?: string[]; // Optional: specific scenes to process
    } = {}
  ): Promise<BulkPromptResult> {
    // Use provided scene IDs or default to all scenes
    const allScenes = Object.keys(masterJSON.scenes || {});
    const scenes = options.sceneIds || allScenes;
    
    console.log(`🚀 Starting BATCH prompt generation for ${scenes.length} scenes...`, {
      requestedScenes: options.sceneIds ? `specific: [${scenes.join(', ')}]` : 'all scenes',
      totalAvailable: allScenes.length,
      processing: scenes.length,
      approach: 'SINGLE BATCH CALL'
    });
    
    try {
      // Always get fresh config from database
      const config = await this.getFreshConfig();
      
      if (!config?.start_frame_prompt_generation) {
        throw new Error('LLM configuration not found - please configure prompts in Config tab');
      }
      
      const provider = options.provider || this.defaultProvider;
      options.onProgress?.(0, scenes.length, 'preparing batch');
      
      // 1. Transform ALL scenes data
      const scenesData = scenes.map(sceneId => {
        return {
          sceneId,
          ...SceneDataTransformer.transformSceneForPrompt(sceneId, masterJSON, options.extractionMetadata)
        };
      });
      
      // 2. Get prompts from fresh configuration
      const systemPromptTemplate = config.start_frame_prompt_generation.system_prompt;
      const userPromptTemplate = config.start_frame_prompt_generation.user_prompt;
      
      if (!systemPromptTemplate || !userPromptTemplate) {
        throw new Error('System or user prompt not configured');
      }
      
      // 3. Create batch context with ALL scenes
      const batchContext = {
        masterJSON,
        scenes: scenesData,
        totalScenes: scenes.length
      };
      
      // 4. Process prompts with batch variables
      const processedSystemPrompt = PromptProcessor.formatForLLM(systemPromptTemplate);
      const processedUserTemplate = PromptProcessor.formatForLLM(userPromptTemplate);
      
      // 5. Create batch user prompt with all scenes
      const batchUserPrompt = `
BATCH PROCESSING REQUEST: Generate prompts for ${scenes.length} scenes in single response.

${scenesData.map(scene => `
--- SCENE ${scene.sceneId} ---
${VariableInjection.processTemplate(processedUserTemplate, { 
  masterJSON, 
  sceneId: scene.sceneId, 
  currentScene: scene 
})}
`).join('\n')}

REQUIRED OUTPUT FORMAT:
{
  "scenes": [
    {"scene_id": 1, "prompt": "...", "character_count": number},
    {"scene_id": 2, "prompt": "...", "character_count": number},
    ...
  ]
}`;
      
      // 6. Get LLM provider and configuration
      const llmProvider = LLMProviderFactory.getProvider(provider);
      const llmConfig: LLMConfig = {
        model: config.llm_providers?.[provider]?.model || 
               (provider === 'openai' ? 'gpt-4-turbo' : 'claude-3-sonnet-20240229'),
        max_tokens: config.llm_providers?.[provider]?.max_tokens || 4000, // Increased for batch
        temperature: config.llm_providers?.[provider]?.temperature || 0.7
      };
      
      console.log('🔥 BATCH LLM call:', {
        provider,
        model: llmConfig.model,
        systemPromptLength: processedSystemPrompt.length,
        batchUserPromptLength: batchUserPrompt.length,
        scenesInBatch: scenes.length
      });
      
      options.onProgress?.(1, scenes.length, 'calling LLM');
      
      // 7. Single batch LLM call
      const llmResponse: LLMResponse = await llmProvider.generatePrompt(
        VariableInjection.processTemplate(processedSystemPrompt, batchContext),
        batchUserPrompt,
        llmConfig
      );
      
      if (!llmResponse.success) {
        throw new Error(llmResponse.error || 'Batch LLM call failed');
      }
      
      // 8. Parse batch JSON response
      let batchResponse;
      try {
        batchResponse = JSON.parse(llmResponse.content);
      } catch (parseError) {
        throw new Error(`Failed to parse batch response: ${parseError}`);
      }
      
      if (!batchResponse.scenes || !Array.isArray(batchResponse.scenes)) {
        throw new Error('Invalid batch response format - missing scenes array');
      }
      
      // 9. Convert to individual results
      const results: ScenePromptResult[] = batchResponse.scenes.map((sceneResult: any) => {
        const sceneId = `scene_${sceneResult.scene_id}`;
        return {
          success: true,
          sceneId,
          generatedPrompt: sceneResult.prompt,
          characterCount: sceneResult.character_count,
          provider: llmResponse.provider,
          usage: {
            promptTokens: Math.round((llmResponse.usage?.promptTokens || 0) / scenes.length),
            completionTokens: Math.round((llmResponse.usage?.completionTokens || 0) / scenes.length)
          }
        };
      });
      
      options.onProgress?.(scenes.length, scenes.length, 'complete');
      
      console.log(`✅ BATCH generation complete:`, {
        totalScenes: scenes.length,
        successfulScenes: results.length,
        failedScenes: 0,
        totalTokens: llmResponse.usage,
        approach: 'SINGLE BATCH CALL'
      });

      // Log all generated prompts for verification
      console.log('🎬 GENERATED PROMPTS PREVIEW:');
      results.forEach(result => {
        console.log(`📝 ${result.sceneId}: "${result.generatedPrompt?.substring(0, 100)}..." (${result.characterCount} chars)`);
      });
      
      
      return {
        success: true,
        totalScenes: scenes.length,
        successfulScenes: results.length,
        results,
        errors: []
      };
      
    } catch (error: any) {
      console.error('💥 Batch generation failed:', error);
      
      return {
        success: false,
        totalScenes: scenes.length,
        successfulScenes: 0,
        results: [],
        errors: [error.message]
      };
    }
  }
  
  /**
   * Store generated prompts in master JSON scenes
   * Updates masterJSON.scenes.scene_X.scene_frame_prompt for each result
   */
  static updateMasterJSONWithPrompts(
    masterJSON: any, 
    results: ScenePromptResult[]
  ): { updatedJSON: any; updatedScenes: string[] } {
    const updatedJSON = { ...masterJSON };
    const updatedScenes: string[] = [];
    
    // Ensure scenes object exists
    if (!updatedJSON.scenes) {
      updatedJSON.scenes = {};
    }
    
    // Update each successful result
    results.forEach(result => {
      if (result.success && result.generatedPrompt) {
        const sceneKey = result.sceneId.startsWith('scene_') ? result.sceneId : `scene_${result.sceneId}`;
        
        // Ensure scene object exists
        if (!updatedJSON.scenes[sceneKey]) {
          updatedJSON.scenes[sceneKey] = {};
        }
        
        // Store the generated prompt
        updatedJSON.scenes[sceneKey].scene_frame_prompt = result.generatedPrompt;
        
        // Store metadata for debugging/tracking
        updatedJSON.scenes[sceneKey].prompt_metadata = {
          generated_at: new Date().toISOString(),
          provider: result.provider,
          character_count: result.characterCount,
          usage: result.usage
        };
        
        updatedScenes.push(sceneKey);
      }
    });
    
    console.log(`📝 Updated master JSON with prompts for ${updatedScenes.length} scenes:`, updatedScenes);
    
    return { updatedJSON, updatedScenes };
  }
  
  /**
   * Test LLM provider connectivity
   */
  async testProvider(provider: LLMProviderType): Promise<boolean> {
    try {
      return await LLMProviderFactory.testProvider(provider);
    } catch (error) {
      console.error(`Provider ${provider} test failed:`, error);
      return false;
    }
  }
  
  /**
   * Get available LLM providers
   */
  getAvailableProviders(): LLMProviderType[] {
    return LLMProviderFactory.getAvailableProviders();
  }
  
  /**
   * Set default provider
   */
  setDefaultProvider(provider: LLMProviderType): void {
    this.defaultProvider = provider;
  }
}

// Singleton instance for app-wide use
export const llmService = new LLMService();