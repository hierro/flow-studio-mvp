/**
 * TimelineParser - Convert n8n script_description.json to timeline visualization data
 * 
 * This utility transforms the rich JSON structure from n8n TESTA_ANIMATIC workflow
 * into clean timeline data optimized for DirectorsTimeline component.
 */

// Timeline data structures
export interface TimelineData {
  project_info: ProjectMetadata;
  global_style: GlobalStyle;
  scenes: TimelineScene[];
  elements: TimelineElement[];
  style_evolution: StyleProgression;
}

export interface ProjectMetadata {
  title: string;
  client: string;
  schema_version: string;
  production_workflow: string;
  extraction_date?: string;
}

export interface GlobalStyle {
  color_palette: {
    primary: string;
    secondary: string;
    accent?: string;
    character_tones: string;
  };
  rendering_style: {
    level: string;
    line_work: string;
    shading: string;
    detail_level: string;
  };
  composition: {
    framing: string;
    depth: string;
    camera_style: string;
    aspect_ratio: string;
  };
  mood_style: {
    overall_mood: string;
    lighting_description: string;
    atmosphere: string;
    tone: string;
  };
}

export interface TimelineScene {
  scene_id: number;
  title: string; // Generated from action_summary
  duration: string;
  camera_type: string;
  mood: string;
  natural_description: string;
  dialogue?: string;
  action_summary: string;
  elements_present: string[];
  element_interactions: ElementInteraction[];
  primary_focus: string;
  lighting_approach: string;
  composition_approach: string;
  
  // Rich content for expandable view (equivalent to scenes_description.json)
  expandable_content: {
    locations_text: string;
    characters_text: string;
    props_text: string;
    actions_text: string;
    interactions_text: string;
    color_primary: string;
    color_secondary: string;
    line_work: string;
    shading: string;
    framing: string;
    depth: string;
    overall_mood: string;
  };
}

export interface TimelineElement {
  id: string;
  name: string;
  type: 'character' | 'location' | 'prop' | 'atmosphere';
  subtype: 'primary' | 'group' | 'secondary' | 'technological' | 'physical' | 'lighting';
  frequency: number;
  scenes_present: number[];
  base_description: string;
  consistency_rules: string[];
  consistency_score: 'excellent' | 'good' | 'review';
  icon: string; // Emoji for UI
  color: string; // CSS color for chips
}

export interface ElementInteraction {
  primary_element: string;
  secondary_element: string;
  interaction_type: string;
  description: string;
}

export interface StyleProgression {
  color_evolution: { scene_id: number; primary: string; secondary: string; }[];
  mood_evolution: { scene_id: number; mood: string; lighting: string; }[];
  camera_progression: { scene_id: number; camera_type: string; composition: string; }[];
}

/**
 * TimelineParser - Main parsing class
 */
export class TimelineParser {
  /**
   * Parse Phase 1 content from n8n JSON structure
   */
  static parsePhase1Content(content: any): TimelineData {
    const rawData = Array.isArray(content) ? content[0] : content;
    
    return {
      project_info: this.extractProjectMetadata(rawData),
      global_style: this.extractGlobalStyle(rawData),
      scenes: this.extractTimelineScenes(rawData),
      elements: this.extractTimelineElements(rawData),
      style_evolution: this.extractStyleProgression(rawData)
    };
  }

  /**
   * Extract project metadata
   */
  private static extractProjectMetadata(data: any): ProjectMetadata {
    return {
      title: data.project_metadata?.title || 'Untitled Project',
      client: data.project_metadata?.client || 'Unknown Client',
      schema_version: data.project_metadata?.schema_version || '1.0',
      production_workflow: data.project_metadata?.production_workflow || 'animatic_to_video',
      extraction_date: data.project_metadata?.extraction_date
    };
  }

  /**
   * Extract global style configuration
   */
  private static extractGlobalStyle(data: any): GlobalStyle {
    return {
      color_palette: {
        primary: data.global_style?.color_palette?.primary || 'Deep blue backgrounds',
        secondary: data.global_style?.color_palette?.secondary || 'Warm amber lighting',
        accent: data.global_style?.color_palette?.accent,
        character_tones: data.global_style?.color_palette?.character_tones || 'Natural skin tones'
      },
      rendering_style: {
        level: data.global_style?.rendering_style?.level || 'cinematic realism',
        line_work: data.global_style?.rendering_style?.line_work || 'clean vector-style',
        shading: data.global_style?.rendering_style?.shading || 'minimal, flat color zones',
        detail_level: data.global_style?.rendering_style?.detail_level || 'photorealistic'
      },
      composition: {
        framing: data.global_style?.composition?.framing || 'cinematic storyboard frames',
        depth: data.global_style?.composition?.depth || 'clear foreground/background separation',
        camera_style: data.global_style?.composition?.camera_style || 'traditional film language',
        aspect_ratio: data.global_style?.composition?.aspect_ratio || '16:9'
      },
      mood_style: {
        overall_mood: data.global_style?.mood_style?.overall_mood || 'educational, inspiring',
        lighting_description: data.global_style?.mood_style?.lighting_description || 'natural library lighting',
        atmosphere: data.global_style?.mood_style?.atmosphere || 'technological wonder',
        tone: data.global_style?.mood_style?.tone || 'professional, accessible'
      }
    };
  }

  /**
   * Extract timeline scenes with rich expandable content
   */
  private static extractTimelineScenes(data: any): TimelineScene[] {
    const scenes = data.scenes || {};
    
    return Object.entries(scenes).map(([sceneKey, sceneData]: [string, any]) => ({
      scene_id: sceneData.scene_id,
      title: this.generateSceneTitle(sceneData.action_summary, sceneData.scene_id),
      duration: sceneData.duration || '3 seconds',
      camera_type: sceneData.camera_type || 'medium shot',
      mood: sceneData.mood || 'neutral',
      natural_description: sceneData.natural_description || '',
      dialogue: sceneData.dialogue,
      action_summary: sceneData.action_summary || 'Scene action',
      elements_present: sceneData.elements_present || [],
      element_interactions: sceneData.element_interactions || [],
      primary_focus: sceneData.primary_focus || '',
      lighting_approach: sceneData.lighting_approach || '',
      composition_approach: sceneData.composition_approach || '',
      
      // Rich expandable content (from scenes_description.json equivalent)
      expandable_content: {
        locations_text: this.extractLocationText(data.elements, sceneData.elements_present),
        characters_text: this.extractCharacterText(data.elements, sceneData.elements_present),
        props_text: this.extractPropsText(data.elements, sceneData.elements_present),
        actions_text: this.generateActionsText(data.elements, sceneData),
        interactions_text: this.generateInteractionsText(sceneData.element_interactions),
        color_primary: data.global_style?.color_palette?.primary || 'Deep blue backgrounds',
        color_secondary: data.global_style?.color_palette?.secondary || 'Warm amber lighting',
        line_work: data.global_style?.rendering_style?.line_work || 'clean vector-style',
        shading: data.global_style?.rendering_style?.shading || 'minimal, flat color zones',
        framing: data.global_style?.composition?.framing || 'cinematic storyboard frames',
        depth: data.global_style?.composition?.depth || 'clear foreground/background separation',
        overall_mood: data.global_style?.mood_style?.overall_mood || 'educational, inspiring'
      }
    })).sort((a, b) => a.scene_id - b.scene_id);
  }

  /**
   * Extract timeline elements with consistency scoring
   */
  private static extractTimelineElements(data: any): TimelineElement[] {
    const elements = data.elements || {};
    
    return Object.entries(elements).map(([elementKey, elementData]: [string, any]) => ({
      id: elementKey,
      name: this.formatElementName(elementKey),
      type: this.mapElementType(elementData.element_type),
      subtype: elementData.element_subtype || 'secondary',
      frequency: elementData.frequency || 0,
      scenes_present: elementData.scenes_present || [],
      base_description: elementData.base_description || '',
      consistency_rules: elementData.consistency_rules || [],
      consistency_score: this.calculateConsistencyScore(elementData.frequency, elementData.consistency_rules?.length),
      icon: this.getElementIcon(elementData.element_type, elementKey),
      color: this.getElementColor(elementData.element_type)
    }));
  }

  /**
   * Extract style progression across scenes
   */
  private static extractStyleProgression(data: any): StyleProgression {
    const scenes = data.scenes || {};
    const sceneEntries = Object.entries(scenes).sort(([,a]: [string, any], [,b]: [string, any]) => a.scene_id - b.scene_id);
    
    return {
      color_evolution: sceneEntries.map(([, scene]: [string, any]) => ({
        scene_id: scene.scene_id,
        primary: data.global_style?.color_palette?.primary || 'Deep blue',
        secondary: data.global_style?.color_palette?.secondary || 'Warm amber'
      })),
      mood_evolution: sceneEntries.map(([, scene]: [string, any]) => ({
        scene_id: scene.scene_id,
        mood: scene.mood || 'neutral',
        lighting: scene.lighting_approach || 'natural'
      })),
      camera_progression: sceneEntries.map(([, scene]: [string, any]) => ({
        scene_id: scene.scene_id,
        camera_type: scene.camera_type || 'medium shot',
        composition: scene.composition_approach || 'standard framing'
      }))
    };
  }

  // Helper methods
  private static generateSceneTitle(actionSummary: string, sceneId: number): string {
    if (!actionSummary) return `Scene ${sceneId}`;
    
    // Convert action summary to title case
    return actionSummary.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private static extractLocationText(elements: any, elementsPresent: string[]): string {
    const locationElements = elementsPresent.filter(el => elements[el]?.element_type === 'location');
    return locationElements.map(el => {
      const element = elements[el];
      return `${element.base_description}\nConsistency Rules: ${element.consistency_rules?.join('; ')}`;
    }).join('\n\n');
  }

  private static extractCharacterText(elements: any, elementsPresent: string[]): string {
    const characterElements = elementsPresent.filter(el => elements[el]?.element_type === 'character');
    return characterElements.map(el => {
      const element = elements[el];
      return `${element.base_description}\nConsistency Rules: ${element.consistency_rules?.join('; ')}`;
    }).join('\n\n');
  }

  private static extractPropsText(elements: any, elementsPresent: string[]): string {
    const propElements = elementsPresent.filter(el => elements[el]?.element_type === 'prop');
    return propElements.map(el => {
      const element = elements[el];
      return `${element.base_description}\nConsistency Rules: ${element.consistency_rules?.join('; ')}`;
    }).join('\n\n');
  }

  private static generateActionsText(elements: any, sceneData: any): string {
    return sceneData.elements_present?.map((el: string) => {
      const element = elements[el];
      const variant = element?.variants_by_scene?.[`scene_${sceneData.scene_id}`];
      if (variant) {
        return `${el}: ${variant.action} at ${variant.position}`;
      }
      return `${el}: positioned in scene`;
    }).join('\n\n') || '';
  }

  private static generateInteractionsText(interactions: ElementInteraction[]): string {
    return interactions.map(interaction => interaction.description).join('\n') || '';
  }

  private static formatElementName(elementKey: string): string {
    return elementKey.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private static mapElementType(type: string): TimelineElement['type'] {
    switch (type) {
      case 'character': return 'character';
      case 'location': return 'location';
      case 'prop': return 'prop';
      case 'atmosphere': return 'atmosphere';
      default: return 'prop';
    }
  }

  private static calculateConsistencyScore(frequency: number, rulesCount: number): TimelineElement['consistency_score'] {
    if (frequency >= 8 && rulesCount >= 3) return 'excellent';
    if (frequency >= 4 && rulesCount >= 2) return 'good';
    return 'review';
  }

  private static getElementIcon(type: string, elementKey: string): string {
    if (elementKey.includes('samantha') || elementKey.includes('character')) return '👤';
    if (elementKey.includes('children') || elementKey.includes('group')) return '👶';
    if (elementKey.includes('library') || elementKey.includes('entrance')) return '🏛️';
    if (elementKey.includes('hologram') || elementKey.includes('display')) return '🔮';
    if (elementKey.includes('backpack') || elementKey.includes('book')) return '🎒';
    if (elementKey.includes('lighting') || elementKey.includes('atmosphere')) return '💡';
    
    switch (type) {
      case 'character': return '👤';
      case 'location': return '🏛️';
      case 'prop': return '📦';
      case 'atmosphere': return '💡';
      default: return '📦';
    }
  }

  private static getElementColor(type: string): string {
    switch (type) {
      case 'character': return '#3b82f6'; // Blue
      case 'location': return '#10b981'; // Green
      case 'prop': return '#f59e0b'; // Orange
      case 'atmosphere': return '#8b5cf6'; // Purple
      default: return '#6b7280'; // Gray
    }
  }
}