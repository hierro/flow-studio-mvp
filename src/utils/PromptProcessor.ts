/**
 * Prompt Processing Utilities
 * 
 * Handles formatting between human-readable editor format and LLM-ready format
 */

export class PromptProcessor {
  /**
   * Convert editor format (with escaped newlines) to LLM format (actual newlines)
   */
  static formatForLLM(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') return prompt;
    
    return prompt
      .replace(/\\n\\n/g, '\n\n')  // Convert \n\n to actual double line breaks
      .replace(/\\n/g, '\n')       // Convert \n to actual line breaks
      .replace(/\\"/g, '"')        // Convert \" to actual quotes
      .replace(/\\t/g, '\t')       // Convert \t to actual tabs
      .trim();
  }

  /**
   * Convert LLM format (actual newlines) to editor format (escaped newlines)
   */
  static formatForEditor(prompt: string): string {
    if (!prompt || typeof prompt !== 'string') return prompt;
    
    return prompt
      .replace(/\n\n/g, '\\n\\n')  // Convert double line breaks to \n\n
      .replace(/\n/g, '\\n')       // Convert line breaks to \n
      .replace(/"/g, '\\"')        // Convert quotes to \"
      .replace(/\t/g, '\\t');      // Convert tabs to \t
  }

  /**
   * Get processed configuration ready for LLM consumption
   */
  static getProcessedConfig(rawConfig: any): any {
    if (!rawConfig) return rawConfig;
    
    const processedConfig = { ...rawConfig };
    
    // Process prompt generation configs
    if (processedConfig.start_frame_prompt_generation) {
      const promptGen = processedConfig.start_frame_prompt_generation;
      
      if (promptGen.system_prompt) {
        promptGen.system_prompt = this.formatForLLM(promptGen.system_prompt);
      }
      
      if (promptGen.user_prompt) {
        promptGen.user_prompt = this.formatForLLM(promptGen.user_prompt);
      }
    }
    
    return processedConfig;
  }

  /**
   * Validate prompt formatting
   */
  static validatePromptFormat(prompt: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    if (!prompt || typeof prompt !== 'string') {
      issues.push('Prompt is empty or not a string');
      return { isValid: false, issues };
    }
    
    // Check for mixed formatting (both \n and actual newlines)
    const hasEscapedNewlines = prompt.includes('\\n');
    const hasActualNewlines = prompt.includes('\n') && !prompt.includes('\\n');
    
    if (hasEscapedNewlines && hasActualNewlines) {
      issues.push('Mixed newline formatting detected (both \\n and actual newlines)');
    }
    
    // Check for very long lines that might need formatting
    const lines = prompt.split(/\n|\\n/);
    const longLines = lines.filter(line => line.length > 200);
    if (longLines.length > 0) {
      issues.push(`${longLines.length} lines are very long (>200 chars) and might need formatting`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

/**
 * React hook for prompt processing
 */
export function usePromptProcessor() {
  const formatForLLM = (prompt: string) => PromptProcessor.formatForLLM(prompt);
  const formatForEditor = (prompt: string) => PromptProcessor.formatForEditor(prompt);
  const getProcessedConfig = (config: any) => PromptProcessor.getProcessedConfig(config);
  const validateFormat = (prompt: string) => PromptProcessor.validatePromptFormat(prompt);
  
  return {
    formatForLLM,
    formatForEditor,
    getProcessedConfig,
    validateFormat
  };
}