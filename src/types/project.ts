// Core project types for FLOW.STUDIO MVP
// Based on enhanced database schema and Italian campaign structure

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  project_metadata: ItalianCampaignMetadata;
  global_style: GlobalStyle;
  created_at: string;
  updated_at: string;
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  phase_name: PhaseName;
  phase_index: number;
  status: 'pending' | 'processing' | 'completed' | 'locked';
  can_proceed: boolean;
  current_version: number;
  content_data: PhaseContent | null;
  user_saved: boolean;
  last_modified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PhaseVersion {
  id: string;
  phase_id: string;
  version_number: number;
  content_data: PhaseContent;
  change_description: string;
  created_at: string;
  created_by: string;
}

export interface N8NJob {
  id: string;
  project_id: string;
  phase_name: PhaseName;
  workflow_id: string;
  n8n_execution_id?: string;
  input_data: any;
  output_data: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress_percentage: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// Phase-specific types
export type PhaseName = 'script_interpretation' | 'element_images' | 'scene_generation' | 'scene_videos' | 'final_assembly';

export interface PhaseContent {
  script_interpretation?: ScriptInterpretationContent;
  element_images?: ElementImagesContent;
  scene_generation?: SceneGenerationContent;
  scene_videos?: SceneVideosContent;
  final_assembly?: FinalAssemblyContent;
}

// Phase 1: Script Interpretation (Italian campaign format)
export interface ScriptInterpretationContent {
  elements: ItalianCampaignElements;
  scenes: ItalianCampaignScenes;
  extraction_metadata: {
    timestamp: string;
    image_engine: string;
    model_endpoint: string;
    project_dest_folder: string;
  };
}

// Phase 2: Element Images
export interface ElementImagesContent {
  generated_images: Array<{
    element_key: string;
    element_name: string;
    image_url: string;
    prompt_used: string;
    approved: boolean;
    metadata: {
      width: number;
      height: number;
      generation_time: string;
      model_used: string;
    };
  }>;
}

// Phase 3: Scene Generation
export interface SceneGenerationContent {
  generated_scenes: Array<{
    scene_id: number;
    scene_name: string;
    image_url: string;
    prompt_used: string;
    approved: boolean;
    character_consistency_score: number;
    metadata: {
      width: number;
      height: number;
      generation_time: string;
      elements_present: string[];
    };
  }>;
}

// Phase 4: Scene Videos (placeholder)
export interface SceneVideosContent {
  generated_videos: Array<{
    scene_id: number;
    video_url: string;
    duration: number;
    approved: boolean;
    metadata: any;
  }>;
}

// Phase 5: Final Assembly (placeholder)
export interface FinalAssemblyContent {
  final_video_url: string;
  total_duration: number;
  scenes_included: number[];
  export_formats: string[];
  metadata: any;
}

// Italian campaign metadata structure
export interface ItalianCampaignMetadata {
  title: string;
  client: string;
  extraction_date: string;
  schema_version: string;
  production_workflow: string;
}

export interface GlobalStyle {
  color_palette: {
    primary: string;
    secondary: string;
    character_tones: string;
  };
  rendering_style: {
    level: string;
    line_work: string;
    detail_level: string;
  };
}

export interface ItalianCampaignElements {
  [key: string]: {
    element_type: 'character' | 'location' | 'prop';
    frequency: number;
    scenes_present?: number[];
    base_description: string;
    consistency_rules: string[];
    variants_by_scene?: {
      [sceneKey: string]: {
        action: string;
        position?: string;
        expression: string;
      };
    };
  };
}

export interface ItalianCampaignScenes {
  [key: string]: {
    duration: string;
    camera_type: string;
    mood: string;
    natural_description: string;
    dialogue?: string;
    elements_present: string[];
  };
}

// Utility types for UI components
export interface ProjectCardData {
  id: string;
  name: string;
  status: Project['status'];
  created_at: string;
  phase_progress: {
    completed_phases: number;
    total_phases: number;
    current_phase: PhaseName | null;
  };
}

export interface PhaseNavigationItem {
  phase_name: PhaseName;
  phase_index: number;
  display_name: string;
  status: ProjectPhase['status'];
  can_proceed: boolean;
  user_saved: boolean;
}