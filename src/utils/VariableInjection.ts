/**
 * Variable Injection System
 * 
 * Replaces n8n-style variables {{$json.field}} with actual values from master JSON
 * Compatible with existing prompt templates from n8n workflows
 */

interface VariableContext {
  masterJSON: any;
  sceneId?: string;
  currentScene?: any;
}

export class VariableInjection {
  /**
   * Process template string and replace all {{$json.path}} variables
   */
  static processTemplate(template: string, context: VariableContext): string {
    if (!template || typeof template !== 'string') return template;

    // Find all {{$json.path}} patterns
    const variablePattern = /\{\{\$json\.([^}]+)\}\}/g;
    
    return template.replace(variablePattern, (match, path) => {
      const value = this.getValueFromPath(path, context);
      return value !== undefined ? String(value) : match; // Keep original if not found
    });
  }

  /**
   * Get value from nested object path (e.g., "scene_1.duration" or "project_metadata.title")
   */
  private static getValueFromPath(path: string, context: VariableContext): any {
    const { masterJSON, sceneId, currentScene } = context;
    
    // Special handling for scene_id
    if (path === 'scene_id' && sceneId) {
      return sceneId;
    }
    
    // Handle current scene data first (highest priority)
    if (currentScene && this.isSceneProperty(path)) {
      const value = this.getNestedValue(currentScene, path);
      if (value !== undefined) return value;
    }
    
    // Handle global style and technical specs from master JSON
    if (this.isGlobalProperty(path)) {
      return this.getNestedValue(masterJSON, path);
    }
    
    // Handle project metadata
    if (path.startsWith('project_metadata.')) {
      return this.getNestedValue(masterJSON, path);
    }
    
    // Handle extraction metadata (technical specs like image_engine, max_prompt_length, aspect_ratio)
    if (this.isTechnicalSpec(path)) {
      // First check current scene, then extraction_metadata, then global
      const sceneValue = currentScene ? this.getNestedValue(currentScene, path) : undefined;
      if (sceneValue !== undefined) return sceneValue;
      
      const extractionValue = this.getNestedValue(masterJSON, `extraction_metadata.${path}`);
      if (extractionValue !== undefined) return extractionValue;
      
      return this.getNestedValue(masterJSON, path);
    }
    
    // Handle master JSON paths
    return this.getNestedValue(masterJSON, path);
  }

  /**
   * Check if path refers to scene-specific property
   */
  private static isSceneProperty(path: string): boolean {
    const sceneProperties = [
      'action_summary', 'natural_description', 'locations_text', 'characters_text',
      'props_text', 'actions_text', 'interactions_text', 'camera_type',
      'composition_approach', 'overall_mood', 'color_primary', 'color_secondary', 
      'line_work', 'shading', 'framing', 'duration', 'mood', 'depth'
    ];
    
    return sceneProperties.some(prop => path === prop || path.includes(prop));
  }

  /**
   * Check if path refers to technical specification
   */
  private static isTechnicalSpec(path: string): boolean {
    const technicalSpecs = [
      'image_engine', 'max_prompt_length', 'aspect_ratio', 'base_url', 
      'model_endpoint', 'project_dest_folder'
    ];
    
    return technicalSpecs.includes(path);
  }

  /**
   * Check if path refers to global property
   */
  private static isGlobalProperty(path: string): boolean {
    const globalProperties = [
      'global_style', 'elements', 'scenes'
    ];
    
    return globalProperties.some(prop => path.startsWith(prop));
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Generate preview of variables available for current context
   */
  static getAvailableVariables(context: VariableContext): Record<string, any> {
    const { masterJSON, sceneId, currentScene } = context;
    const variables: Record<string, any> = {};

    // Project-level variables
    if (masterJSON?.project_metadata) {
      Object.keys(masterJSON.project_metadata).forEach(key => {
        variables[`project_metadata.${key}`] = masterJSON.project_metadata[key];
      });
    }

    // Scene-specific variables
    if (sceneId) {
      variables['scene_id'] = sceneId;
    }
    
    if (currentScene) {
      Object.keys(currentScene).forEach(key => {
        variables[key] = currentScene[key];
      });
    }

    // Global style variables
    if (masterJSON?.global_style) {
      // 🎨 STYLE DEBUG: Log style values being injected
      const primaryColor = masterJSON.global_style?.color_palette?.primary;
      const renderingLevel = masterJSON.global_style?.rendering_style?.level;
      console.log('🎨 STYLE INJECTION DEBUG:', {
        primaryColor,
        renderingLevel,
        fullGlobalStyle: masterJSON.global_style,
        availableStyleKeys: Object.keys(masterJSON.global_style)
      });
      
      Object.keys(masterJSON.global_style).forEach(key => {
        variables[`global_style.${key}`] = masterJSON.global_style[key];
      });
    } else {
      console.log('⚠️ STYLE INJECTION WARNING: No global_style found in masterJSON');
    }

    return variables;
  }

  /**
   * Validate template for missing variables
   */
  static validateTemplate(template: string, context: VariableContext): {
    isValid: boolean;
    missingVariables: string[];
  } {
    const variablePattern = /\{\{\$json\.([^}]+)\}\}/g;
    const missingVariables: string[] = [];
    let match;

    while ((match = variablePattern.exec(template)) !== null) {
      const path = match[1];
      const value = this.getValueFromPath(path, context);
      
      if (value === undefined) {
        missingVariables.push(path);
      }
    }

    return {
      isValid: missingVariables.length === 0,
      missingVariables
    };
  }
}

/**
 * Hook for React components to use variable injection
 */
export function useVariableInjection(masterJSON: any, sceneId?: string) {
  const processTemplate = (template: string) => {
    const currentScene = sceneId && masterJSON?.scenes?.[sceneId] 
      ? masterJSON.scenes[sceneId] 
      : null;

    const context: VariableContext = {
      masterJSON,
      sceneId,
      currentScene
    };

    return VariableInjection.processTemplate(template, context);
  };

  const getAvailableVariables = () => {
    const currentScene = sceneId && masterJSON?.scenes?.[sceneId] 
      ? masterJSON.scenes[sceneId] 
      : null;

    const context: VariableContext = {
      masterJSON,
      sceneId,
      currentScene
    };

    return VariableInjection.getAvailableVariables(context);
  };

  const validateTemplate = (template: string) => {
    const currentScene = sceneId && masterJSON?.scenes?.[sceneId] 
      ? masterJSON.scenes[sceneId] 
      : null;

    const context: VariableContext = {
      masterJSON,
      sceneId,
      currentScene
    };

    return VariableInjection.validateTemplate(template, context);
  };

  return {
    processTemplate,
    getAvailableVariables,
    validateTemplate
  };
}