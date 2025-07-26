/**
 * Dual LLM Provider System - OpenAI + Claude
 * 
 * Smart interface supporting both providers with OpenAI as default
 * Focused on prompt generation for scene image prompts
 */

interface LLMResponse {
  success: boolean;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  error?: string;
  provider: string;
}

interface LLMConfig {
  model: string;
  max_tokens: number;
  temperature: number;
}

export type LLMProviderType = 'openai' | 'claude';

// Base LLM Provider Interface
abstract class BaseLLMProvider {
  abstract name: LLMProviderType;
  abstract generatePrompt(systemPrompt: string, userPrompt: string, config?: LLMConfig): Promise<LLMResponse>;
}

// OpenAI Provider Implementation
class OpenAIProvider extends BaseLLMProvider {
  name: LLMProviderType = 'openai';
  
  async generatePrompt(systemPrompt: string, userPrompt: string, config?: LLMConfig): Promise<LLMResponse> {
    try {
      // Dynamic import to avoid bundling issues
      const { OpenAI } = await import('openai');
      
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true // For client-side usage
      });
      
      const response = await openai.chat.completions.create({
        model: config?.model || 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: config?.max_tokens || 1000,
        temperature: config?.temperature || 0.7
      });
      
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }
      
      return {
        success: true,
        content,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0
        },
        provider: 'openai'
      };
      
    } catch (error: any) {
      return {
        success: false,
        content: '',
        error: `OpenAI Error: ${error.message}`,
        provider: 'openai'
      };
    }
  }
}

// Claude Provider Implementation  
class ClaudeProvider extends BaseLLMProvider {
  name: LLMProviderType = 'claude';
  
  async generatePrompt(systemPrompt: string, userPrompt: string, config?: LLMConfig): Promise<LLMResponse> {
    try {
      // Dynamic import to avoid bundling issues
      const { Anthropic } = await import('@anthropic-ai/sdk');
      
      const anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true // For client-side usage
      });
      
      const response = await anthropic.messages.create({
        model: config?.model || 'claude-3-sonnet-20240229',
        max_tokens: config?.max_tokens || 1000,
        temperature: config?.temperature || 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });
      
      const content = response.content[0];
      if (!content || content.type !== 'text') {
        throw new Error('No text content received from Claude');
      }
      
      return {
        success: true,
        content: content.text,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens
        },
        provider: 'claude'
      };
      
    } catch (error: any) {
      return {
        success: false,
        content: '',
        error: `Claude Error: ${error.message}`,
        provider: 'claude'
      };
    }
  }
}

// Provider Factory
export class LLMProviderFactory {
  private static providers: Map<LLMProviderType, BaseLLMProvider> = new Map([
    ['openai', new OpenAIProvider()],
    ['claude', new ClaudeProvider()]
  ]);
  
  static getProvider(type: LLMProviderType = 'openai'): BaseLLMProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`Unknown LLM provider: ${type}`);
    }
    return provider;
  }
  
  static getAvailableProviders(): LLMProviderType[] {
    return Array.from(this.providers.keys());
  }
  
  static async testProvider(type: LLMProviderType): Promise<boolean> {
    try {
      const provider = this.getProvider(type);
      const result = await provider.generatePrompt(
        'You are a test assistant.',
        'Say "test successful" in JSON format: {"status": "success"}',
        { model: type === 'openai' ? 'gpt-3.5-turbo' : 'claude-3-haiku-20240307', max_tokens: 50, temperature: 0 }
      );
      return result.success;
    } catch (error) {
      console.error(`Provider ${type} test failed:`, error);
      return false;
    }
  }
}

// Export main interface
export { BaseLLMProvider, LLMResponse, LLMConfig };
export default LLMProviderFactory;