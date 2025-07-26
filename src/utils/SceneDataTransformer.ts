/**
 * Scene Data Transformer
 * 
 * Transforms master JSON scenes to match scenes_description.json format
 * Extracts elements, builds text blocks, applies global styles for LLM processing
 */

export interface ScenePromptData {
  // Technical specs (from config or extraction_metadata)
  image_engine: string;
  base_url: string;
  model_endpoint: string;
  project_dest_folder: string;
  max_prompt_length: number;
  aspect_ratio: string;
  scene_id: number;
  
  // Scene narrative content
  natural_description: string;
  action_summary: string;
  
  // Element text blocks (built from elements + scene variants)
  locations_text: string;
  characters_text: string;
  props_text: string;
  actions_text: string;
  interactions_text: string;
  
  // Style properties (from global_style + scene overrides)
  camera_type: string;
  composition_approach: string;
  color_primary: string;
  color_secondary: string;
  line_work: string;
  shading: string;
  framing: string;
  depth: string;
  overall_mood: string;
}

export class SceneDataTransformer {
  /**
   * Transform master JSON scene to scenes_description.json format
   */
  static transformSceneForPrompt(
    sceneId: string, 
    masterJSON: any,
    extractionMetadata?: any
  ): ScenePromptData {
    const sceneKey = sceneId.startsWith('scene_') ? sceneId : `scene_${sceneId}`;
    const scene = masterJSON.scenes?.[sceneKey];
    
    if (!scene) {
      throw new Error(`Scene ${sceneKey} not found in master JSON`);
    }
    
    const globalStyle = masterJSON.global_style || {};
    const elements = masterJSON.elements || {};
    const projectMetadata = masterJSON.project_metadata || {};
    
    // Get elements present in this scene
    const elementsInScene = scene.elements_present || [];
    
    // Extract technical specs
    const technicalSpecs = this.extractTechnicalSpecs(extractionMetadata, projectMetadata);
    
    return {
      // Technical specifications
      ...technicalSpecs,
      scene_id: parseInt(sceneId.replace('scene_', '')),
      
      // Scene narrative content
      natural_description: scene.natural_description || '',
      action_summary: scene.action_summary || '',
      
      // Element text blocks - built from elements + scene variants
      locations_text: this.buildLocationText(elementsInScene, elements, sceneKey),
      characters_text: this.buildCharacterText(elementsInScene, elements, sceneKey),
      props_text: this.buildPropsText(elementsInScene, elements, sceneKey),
      actions_text: this.buildActionsText(elementsInScene, elements, sceneKey),
      interactions_text: this.buildInteractionsText(scene.element_interactions || []),
      
      // Style properties - from global_style with scene overrides
      camera_type: scene.camera_type || '',
      composition_approach: scene.composition_approach || scene.lighting_approach || '',
      color_primary: globalStyle.color_palette?.primary || '',
      color_secondary: globalStyle.color_palette?.secondary || '',
      line_work: globalStyle.rendering_style?.line_work || '',
      shading: globalStyle.rendering_style?.shading || '',
      framing: globalStyle.composition?.framing || '',
      depth: globalStyle.composition?.depth || '',
      overall_mood: globalStyle.mood_style?.overall_mood || scene.mood || ''
    };
  }
  
  /**
   * Extract technical specifications from metadata
   */
  private static extractTechnicalSpecs(extractionMetadata: any, projectMetadata: any) {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:]/g, '_').replace('T', '_');
    
    return {
      image_engine: extractionMetadata?.image_engine || 'FLUX DEV',
      base_url: extractionMetadata?.base_url || 'https://queue.fal.run',
      model_endpoint: extractionMetadata?.model_endpoint || 'fal-ai/flux/dev',
      project_dest_folder: extractionMetadata?.project_dest_folder || 
        `${projectMetadata.title || 'PROJECT'}_${timestamp}`,
      max_prompt_length: extractionMetadata?.max_prompt_length || 800,
      aspect_ratio: extractionMetadata?.aspect_ratio || '16:9'
    };
  }
  
  /**
   * Build location text block from location elements
   */
  private static buildLocationText(elementsInScene: string[], elements: any, sceneKey: string): string {
    const locationElements = elementsInScene.filter(elementId => 
      elements[elementId]?.element_type === 'location'
    );
    
    return locationElements.map(elementId => {
      const element = elements[elementId];
      const baseDescription = element.base_description || '';
      const consistencyRules = element.consistency_rules || [];
      const sceneVariant = element.variants_by_scene?.[sceneKey];
      
      let text = baseDescription;
      if (consistencyRules.length > 0) {
        text += `\nConsistency Rules: ${consistencyRules.join('; ')}`;
      }
      
      // Add scene-specific variant details if available
      if (sceneVariant) {
        const variantDetails = [
          sceneVariant.view_angle,
          sceneVariant.focus_area,
          sceneVariant.lighting_state,
          sceneVariant.architectural_details
        ].filter(Boolean).join(', ');
        
        if (variantDetails) {
          text += `\nScene Context: ${variantDetails}`;
        }
      }
      
      return text;
    }).join('\n\n');
  }
  
  /**
   * Build character text block from character elements
   */
  private static buildCharacterText(elementsInScene: string[], elements: any, sceneKey: string): string {
    const characterElements = elementsInScene.filter(elementId => 
      elements[elementId]?.element_type === 'character'
    );
    
    return characterElements.map(elementId => {
      const element = elements[elementId];
      const baseDescription = element.base_description || '';
      const consistencyRules = element.consistency_rules || [];
      const sceneVariant = element.variants_by_scene?.[sceneKey];
      
      let text = baseDescription;
      if (consistencyRules.length > 0) {
        text += `\nConsistency Rules: ${consistencyRules.join('; ')}`;
      }
      
      // Add scene-specific actions and positioning
      if (sceneVariant) {
        const variantDetails = [
          sceneVariant.action,
          sceneVariant.position,
          sceneVariant.expression
        ].filter(Boolean).join(', ');
        
        if (variantDetails) {
          text += `\nScene Behavior: ${variantDetails}`;
        }
      }
      
      return text;
    }).join('\n\n');
  }
  
  /**
   * Build props text block from prop elements
   */
  private static buildPropsText(elementsInScene: string[], elements: any, sceneKey: string): string {
    const propElements = elementsInScene.filter(elementId => 
      elements[elementId]?.element_type === 'prop'
    );
    
    return propElements.map(elementId => {
      const element = elements[elementId];
      const baseDescription = element.base_description || '';
      const consistencyRules = element.consistency_rules || [];
      const sceneVariant = element.variants_by_scene?.[sceneKey];
      
      let text = baseDescription;
      if (consistencyRules.length > 0) {
        text += `\nConsistency Rules: ${consistencyRules.join('; ')}`;
      }
      
      // Add scene-specific state and interactions
      if (sceneVariant) {
        const variantDetails = [
          sceneVariant.state,
          sceneVariant.interaction_mode,
          sceneVariant.visibility
        ].filter(Boolean).join(', ');
        
        if (variantDetails) {
          text += `\nScene State: ${variantDetails}`;
        }
      }
      
      return text;
    }).join('\n\n');
  }
  
  /**
   * Build actions text block showing element positioning and interactions
   */
  private static buildActionsText(elementsInScene: string[], elements: any, sceneKey: string): string {
    return elementsInScene.map(elementId => {
      const element = elements[elementId];
      const sceneVariant = element.variants_by_scene?.[sceneKey];
      
      if (!sceneVariant) {
        return `${elementId}: positioned at in scene`;
      }
      
      // Build action description based on element type
      let actionText = `${elementId}:`;
      
      if (element.element_type === 'character') {
        actionText += ` ${sceneVariant.action || 'present'} at ${sceneVariant.position || 'in scene'}`;
        if (sceneVariant.props_interaction) {
          actionText += `\nInteracting with: ${sceneVariant.props_interaction}`;
        }
      } else if (element.element_type === 'location') {
        actionText += ` positioned at ${sceneVariant.camera_position || 'in scene'}`;
      } else if (element.element_type === 'prop') {
        actionText += ` positioned at ${sceneVariant.position_relative || 'in scene'}`;
      } else {
        actionText += ` positioned at in scene`;
      }
      
      return actionText;
    }).join('\n\n');
  }
  
  /**
   * Build element interactions text from scene interactions
   */
  private static buildInteractionsText(elementInteractions: any[]): string {
    return elementInteractions.map(interaction => {
      return interaction.description || 
        `${interaction.primary_element} ${interaction.interaction_type} ${interaction.secondary_element}`;
    }).join('\n');
  }
}