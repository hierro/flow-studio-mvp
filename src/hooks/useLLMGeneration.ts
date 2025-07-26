/**
 * React Hook for LLM Generation
 * 
 * Provides state management and UI integration for prompt generation
 * Handles single scene and bulk generation with proper loading states
 */

import { useState, useCallback, useMemo } from 'react';
import { llmService, LLMService, ScenePromptResult, BulkPromptResult } from '../services/LLMService';
import { LLMProviderType } from '../services/LLMProviders';
import { saveMasterJSONFromObject } from '../lib/database';

export interface LLMGenerationProgress {
  completed: number;
  total: number;
  currentScene: string;
  percentage: number;
}

export interface LLMGenerationState {
  // Loading states
  isGenerating: boolean;
  isInitializing: boolean;
  
  // Progress tracking
  progress: LLMGenerationProgress;
  
  // Results and errors
  lastResult: ScenePromptResult | BulkPromptResult | null;
  error: string | null;
  
  // Provider management
  availableProviders: LLMProviderType[];
  currentProvider: LLMProviderType;
}

export function useLLMGeneration() {
  const [state, setState] = useState<LLMGenerationState>({
    isGenerating: false,
    isInitializing: false,
    progress: { completed: 0, total: 0, currentScene: '', percentage: 0 },
    lastResult: null,
    error: null,
    availableProviders: ['openai', 'claude'],
    currentProvider: 'openai'
  });
  
  // Initialize LLM service
  const initializeService = useCallback(async () => {
    setState(prev => ({ ...prev, isInitializing: true, error: null }));
    
    try {
      await llmService.initialize();
      const availableProviders = llmService.getAvailableProviders();
      
      setState(prev => ({ 
        ...prev, 
        isInitializing: false,
        availableProviders
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isInitializing: false,
        error: `Initialization failed: ${error.message}`
      }));
      return false;
    }
  }, []);
  
  // Generate prompt for single scene
  const generateScenePrompt = useCallback(async (
    sceneId: string,
    masterJSON: any,
    options: {
      provider?: LLMProviderType;
      extractionMetadata?: any;
      saveToDatabase?: boolean;
    } = {}
  ): Promise<ScenePromptResult> => {
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null,
      progress: { completed: 0, total: 1, currentScene: sceneId, percentage: 0 }
    }));
    
    try {
      // Initialize if needed
      if (!llmService.getAvailableProviders) {
        await initializeService();
      }
      
      // Generate prompt
      const result = await llmService.generateSceneImagePrompt(sceneId, masterJSON, {
        provider: options.provider || state.currentProvider,
        extractionMetadata: options.extractionMetadata
      });
      
      // Update master JSON and save to database if requested
      if (result.success && options.saveToDatabase !== false) {
        const { updatedJSON } = LLMService.updateMasterJSONWithPrompts(masterJSON, [result]);
        
        try {
          await saveMasterJSONFromObject(
            masterJSON.project_metadata?.id || 'unknown',
            updatedJSON,
            `Generated image prompt for ${sceneId}`
          );
          console.log(`✅ Saved prompt for ${sceneId} to database`);
        } catch (saveError) {
          console.error(`❌ Failed to save prompt for ${sceneId}:`, saveError);
          // Don't fail the generation, just log the save error
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        lastResult: result,
        progress: { completed: 1, total: 1, currentScene: sceneId, percentage: 100 }
      }));
      
      return result;
      
    } catch (error: any) {
      const errorResult: ScenePromptResult = {
        success: false,
        sceneId,
        error: error.message
      };
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        lastResult: errorResult,
        error: error.message
      }));
      
      return errorResult;
    }
  }, [state.currentProvider, initializeService]);
  
  // Generate prompts for all scenes
  const generateAllPrompts = useCallback(async (
    masterJSON: any,
    options: {
      provider?: LLMProviderType;
      extractionMetadata?: any;
      saveToDatabase?: boolean;
      sceneIds?: string[]; // Optional: specific scenes to process
    } = {}
  ): Promise<BulkPromptResult> => {
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null,
      progress: { completed: 0, total: 0, currentScene: 'initializing', percentage: 0 }
    }));
    
    try {
      // Initialize if needed
      if (!llmService.getAvailableProviders) {
        await initializeService();
      }
      
      // Generate all prompts with progress tracking
      const result = await llmService.generateAllScenePrompts(masterJSON, {
        provider: options.provider || state.currentProvider,
        extractionMetadata: options.extractionMetadata,
        sceneIds: options.sceneIds, // Pass specific scene IDs if provided
        onProgress: (completed, total, currentScene) => {
          const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
          setState(prev => ({ 
            ...prev,
            progress: { completed, total, currentScene, percentage }
          }));
        }
      });
      
      // Update master JSON and save to database if requested
      if (result.successfulScenes > 0 && options.saveToDatabase !== false) {
        const { updatedJSON, updatedScenes } = LLMService.updateMasterJSONWithPrompts(
          masterJSON, 
          result.results
        );
        
        try {
          await saveMasterJSONFromObject(
            masterJSON.project_metadata?.id || 'unknown',
            updatedJSON,
            `Generated image prompts for ${result.successfulScenes} scenes`
          );
          console.log(`✅ Saved prompts for ${updatedScenes.length} scenes to database`);
        } catch (saveError) {
          console.error(`❌ Failed to save prompts to database:`, saveError);
          // Don't fail the generation, just log the save error
        }
      }
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        lastResult: result,
        error: result.errors.length > 0 ? `${result.errors.length} scenes failed` : null
      }));
      
      return result;
      
    } catch (error: any) {
      const errorResult: BulkPromptResult = {
        success: false,
        totalScenes: 0,
        successfulScenes: 0,
        results: [],
        errors: [error.message]
      };
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        lastResult: errorResult,
        error: error.message
      }));
      
      return errorResult;
    }
  }, [state.currentProvider, initializeService]);
  
  // Test provider connectivity
  const testProvider = useCallback(async (provider: LLMProviderType): Promise<boolean> => {
    try {
      return await llmService.testProvider(provider);
    } catch (error) {
      console.error(`Provider ${provider} test failed:`, error);
      return false;
    }
  }, []);
  
  // Change provider
  const setProvider = useCallback((provider: LLMProviderType) => {
    llmService.setDefaultProvider(provider);
    setState(prev => ({ ...prev, currentProvider: provider }));
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  // Clear last result
  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, lastResult: null }));
  }, []);
  
  // Computed values
  const isReady = useMemo(() => !state.isInitializing && !state.error, [state.isInitializing, state.error]);
  const hasResults = useMemo(() => state.lastResult !== null, [state.lastResult]);
  
  return {
    // State
    ...state,
    isReady,
    hasResults,
    
    // Actions
    initializeService,
    generateScenePrompt,
    generateAllPrompts,
    testProvider,
    setProvider,
    clearError,
    clearResult
  };
}