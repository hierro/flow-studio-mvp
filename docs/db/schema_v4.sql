-- FLOW.STUDIO MVP Schema v4.0
-- CLEAN ARCHITECTURE WITH PROJECT-SPECIFIC CONFIGURATION
-- Purpose: Complete schema with integrated project configuration system
-- Deployment: Fresh database - replaces all previous schemas

-- ============================================================================
-- 1. EXTENSIONS & SETUP
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================ 
-- 2. AUTHENTICATION (PRESERVE SUPABASE AUTH)
-- ============================================================================

-- Note: auth.users table is managed by Supabase Auth
-- We only reference it, never modify it

-- ============================================================================
-- 3. CONFIGURATION TEMPLATES (SYSTEM-LEVEL)
-- ============================================================================

-- Configuration templates for reusable project configurations
CREATE TABLE project_configuration_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  template_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default configuration template (with proper JSON formatting)
INSERT INTO project_configuration_templates (name, description, template_data) VALUES (
  'default',
  'Default FLOW.STUDIO configuration with LLM providers, prompts, and generation settings',
  jsonb_build_object(
    'configuration_metadata', jsonb_build_object(
      'version', '2.0',
      'created', '2025-01-28',
      'purpose', 'FLOW.STUDIO LLM configurations only'
    ),
    'llm_providers', jsonb_build_object(
      'openai', jsonb_build_object(
        'model', 'gpt-4.1',
        'max_tokens', 2000,
        'temperature', 0.2
      ),
      'anthropic', jsonb_build_object(
        'model', 'claude-3-sonnet-20240229',
        'max_tokens', 1500,
        'temperature', 0.3
      )
    ),
    'start_frame_prompt_generation', jsonb_build_object(
      'system_prompt', 'You are the Lead Storyboard Artist at a premium animation production house. Your role is to compose natural, flowing {{$json.image_engine}} prompts that bring storyboard scenes to life while maintaining absolute visual consistency across all scenes in the project.

CORE METHODOLOGY:
You receive scene data in SEQUENTIAL TEXT BLOCKS plus DETAILED COMPOSITION METHODOLOGY. Your job is to systematically apply the 5-step methodology to create natural, flowing prompts that maintain absolute visual consistency while serving specific narrative needs.

SYSTEMATIC COMPOSITION PROTOCOL:
1. FOUNDATION ESTABLISHMENT: Always begin with camera type as technical frame, use natural_description as narrative backbone
2. ELEMENT HIERARCHY ENFORCEMENT: base_description (visual DNA) > consistency_rules (absolute constraints) > scene_variants (behavioral adaptations)
3. SEQUENTIAL INTEGRATION: Process each element type using the specified methodology - locations establish stage, characters placed with identity, props included with appearance, actions layered as behaviors
4. CONFLICT RESOLUTION: When base_description conflicts with scene_variants, consistency_rules always override - preserve visual identity, adapt only behaviors
5. TECHNICAL PRECISION: Start with camera specification, maintain aspect ratio awareness, end within exact character limits

CONSISTENCY ENFORCEMENT (ABSOLUTE HIERARCHY):
1. BASE_DESCRIPTION = Visual DNA that never changes (character faces, location architecture, prop appearance)
2. CONSISTENCY_RULES = Mandatory visual constraints that override all scene adaptations
3. SCENE_VARIANTS = Behavioral adaptations layered ON TOP of unchanging base identity
4. CONFLICT RESOLUTION: Consistency rules always win over scene variants - preserve visual identity, adapt only actions/states
5. CROSS-SCENE CONTINUITY: Same elements must be visually recognizable across all scenes through base_description preservation

COMPOSITION STRATEGY:
- FOLLOW the detailed methodology exactly as provided in the user prompt
- START every prompt with camera type as technical frame specification
- USE base_description as unchanging foundation for each element
- LAYER scene_variants as behavioral adaptations without altering core identity
- MAINTAIN narrative flow guided by natural_description while systematically including all elements
- ENFORCE character limits through optimization - every word must maximize visual information
- RESOLVE conflicts using hierarchy: base_description > consistency_rules > scene_variants

PROMPT QUALITY STANDARDS:
- TECHNICAL OPENING: Always start with "{{$json.camera_type}} of..." for consistent framing
- SYSTEMATIC INCLUSION: Every element from all 5 sequential steps must appear using base_description + variants
- HIERARCHY COMPLIANCE: base_description preserved, consistency_rules enforced, scene_variants layered appropriately
- NATURAL FLOW: Reads like professional scene description while following systematic methodology
- CHARACTER PRECISION: End within exactly {{$json.max_prompt_length}} characters - no exceptions
- ENGINE OPTIMIZATION: Composed specifically for {{$json.image_engine}} technical requirements and {{$json.aspect_ratio}} framing

OUTPUT REQUIREMENT:
JSON format only: {"scene_id": number, "prompt": "natural_flowing_prompt", "character_count": exact_number}

PROFESSIONAL STANDARD: You understand that visual consistency across scenes determines client approval. Every prompt must feel like part of a cohesive visual story while incorporating all provided elements through intelligent narrative composition.',
      'user_prompt', 'Scene {{$json.scene_id}} - {{$json.action_summary}}

NARRATIVE FOUNDATION:
"{{$json.natural_description}}"

STEP 1 - SET THE STAGE (LOCATIONS):
{{$json.locations_text}}

STEP 2 - PLACE THE ACTORS (CHARACTERS):
{{$json.characters_text}}

STEP 3 - ESTABLISH AVAILABLE OBJECTS (PROPS):
{{$json.props_text}}

STEP 4 - DIRECT THE PERFORMANCE (ACTIONS):
{{$json.actions_text}}

ELEMENT INTERACTIONS:
{{$json.interactions_text}}

STEP 5 - CAMERA & STYLE:
Camera: {{$json.camera_type}} - {{$json.composition_approach}}
Style: {{$json.overall_mood}} with {{$json.color_primary}} backgrounds, {{$json.line_work}} lines, {{$json.shading}} shading, {{$json.framing}} framing

TECHNICAL SPECS:
- Engine: {{$json.image_engine}}
- Max Characters: {{$json.max_prompt_length}}
- Aspect Ratio: {{$json.aspect_ratio}}

COMPOSITION METHODOLOGY:

1. FOUNDATION ESTABLISHMENT:
   - BEGIN with camera type as opening technical frame: "{{$json.camera_type}} of..."
   - USE natural_description as narrative backbone and mood guide
   - ESTABLISH aspect ratio and framing: "{{$json.aspect_ratio}} composition showing..."

2. ELEMENT INTEGRATION PROTOCOL:
   For each element type, follow this hierarchy:
   - PRIMARY: Use base_description as unchanging visual foundation
   - CONSTRAINTS: Apply consistency_rules as absolute visual requirements
   - ADAPTATION: Layer scene-specific actions/states from variants
   - NEVER modify base_description core identity, only add scene behaviors

3. SEQUENTIAL COMPOSITION:
   - LOCATIONS: Establish architectural foundation first, then apply lighting/view variants
   - CHARACTERS: Place using base_description identity, then add scene actions/positions
   - PROPS: Include using base_description appearance, then add scene states/interactions
   - ACTIONS: Show character behaviors from variants while maintaining base identity
   - STYLE: Apply as overall aesthetic wrapper, not individual element modifications

4. INTEGRATION RULES:
   - CONSISTENCY RULES override scene variants when conflicts arise
   - Base_description provides visual identity, variants provide scene behavior
   - Natural_description guides narrative flow and mood interpretation
   - All elements must appear, variants add specificity to base elements

5. TECHNICAL REQUIREMENTS:
   - START with camera type specification
   - MAINTAIN {{$json.aspect_ratio}} composition awareness
   - END within {{$json.max_prompt_length}} characters exactly
   - OPTIMIZE for {{$json.image_engine}} technical specifications

OUTPUT: JSON format {"scene_id": number, "prompt": "composed_prompt", "character_count": exact_number}'
    ),
    'image_generation', jsonb_build_object(
      'fal_ai_flux', jsonb_build_object(
        'endpoint', 'fal-ai/flux/dev',
        'base_url', 'https://queue.fal.run',
        'parameters', jsonb_build_object(
          'image_size', jsonb_build_object('width', 1024, 'height', 768),
          'num_inference_steps', 28,
          'guidance_scale', 3.5
        )
      )
    ),
    'video_generation', jsonb_build_object(
      'fal_ai_kling', jsonb_build_object(
        'endpoint', 'fal-ai/kling-video',
        'parameters', jsonb_build_object(
          'duration', '5 seconds',
          'fps', 24,
          'motion_intensity', 'medium'
        )
      )
    )
  )
);

-- ============================================================================
-- 4. CORE TABLES (CLEAN ARCHITECTURE WITH PROJECT-SPECIFIC CONFIG)
-- ============================================================================

-- Projects with master JSON AND project-specific configuration
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  
  -- THE MASTER JSON (single source of truth for all content)
  master_json JSONB NOT NULL DEFAULT '{
    "scenes": {},
    "elements": {},
    "global_style": {
      "color_palette": {
        "primary": "Deep blue backgrounds",
        "secondary": "Warm amber lighting",
        "character_tones": "Natural skin tones"
      },
      "rendering_style": {
        "level": "simplified illustration transitioning to cinematic realism",
        "line_work": "clean vector-style outlines",
        "detail_level": "stylized but scalable to photorealistic"
      }
    },
    "project_metadata": {
      "title": "New Project",
      "client": "Client Name",
      "schema_version": "4.0",
      "production_workflow": "animatic_to_video_scalable"
    }
  }',
  
  -- PROJECT-SPECIFIC CONFIGURATION (copied from template on creation)
  configuration_data JSONB DEFAULT NULL,
  
  -- Version control
  current_version INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master JSON version history (complete snapshots)
CREATE TABLE project_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Version identification
  version_number INTEGER NOT NULL,
  master_json JSONB NOT NULL,
  change_description TEXT,
  changed_sections TEXT[], -- e.g. ['scenes.scene_1', 'global_style.color_palette']
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(project_id, version_number)
);

-- Generated assets (separate from master JSON)
CREATE TABLE project_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Links to master JSON entities
  scene_id TEXT,      -- References master_json.scenes.{scene_id}
  element_id TEXT,    -- References master_json.elements.{element_id}
  
  -- Asset information
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'scene_image', 'element_image', 'scene_video', 'final_video'
  )),
  asset_url TEXT NOT NULL,
  asset_filename TEXT,
  
  -- Generation metadata
  generation_prompt TEXT,
  generation_model TEXT,
  generation_parameters JSONB DEFAULT '{}',
  
  -- Asset versions (for undo functionality)
  version_number INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phase execution tracking (metadata only, no content)
CREATE TABLE project_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Phase identification
  phase_name TEXT NOT NULL CHECK (phase_name IN (
    'script_interpretation', 'element_images', 'scene_generation', 
    'scene_videos', 'final_assembly'
  )),
  phase_index INTEGER NOT NULL CHECK (phase_index BETWEEN 1 AND 5),
  
  -- Phase status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  can_proceed BOOLEAN DEFAULT FALSE,
  user_saved BOOLEAN DEFAULT FALSE,
  
  -- Execution metadata (no content - that's in master_json)
  execution_settings JSONB DEFAULT '{}',
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(project_id, phase_name),
  UNIQUE(project_id, phase_index)
);

-- N8N job tracking (for webhook integrations)
CREATE TABLE n8n_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Job identification
  phase_name TEXT NOT NULL,
  workflow_id TEXT NOT NULL,
  n8n_execution_id TEXT,
  
  -- Job data
  input_data JSONB,
  output_data JSONB,
  
  -- Job status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Cross-phase change tracking (for timeline intelligence)
CREATE TABLE content_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Change tracking
  change_type TEXT NOT NULL CHECK (change_type IN ('scene_added', 'scene_modified', 'scene_deleted', 'element_added', 'element_modified', 'element_deleted', 'style_updated')),
  affected_entity_id TEXT, -- scene_1, element_samantha, etc.
  change_data JSONB,
  
  -- Source tracking
  source_phase TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity tracking (analytics and debugging)
CREATE TABLE user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Activity tracking
  activity_type TEXT NOT NULL,
  activity_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. INDEXES (PERFORMANCE OPTIMIZATION)
-- ============================================================================

-- Configuration templates indexes
CREATE INDEX idx_project_configuration_templates_name ON project_configuration_templates(name);

-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_updated_at ON projects(updated_at DESC);

-- Version history indexes
CREATE INDEX idx_project_versions_project_id ON project_versions(project_id);
CREATE INDEX idx_project_versions_version_number ON project_versions(project_id, version_number DESC);

-- Assets indexes
CREATE INDEX idx_project_assets_project_id ON project_assets(project_id);
CREATE INDEX idx_project_assets_scene_id ON project_assets(project_id, scene_id);
CREATE INDEX idx_project_assets_element_id ON project_assets(project_id, element_id);
CREATE INDEX idx_project_assets_current ON project_assets(project_id, is_current) WHERE is_current = TRUE;

-- Phases indexes
CREATE INDEX idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX idx_project_phases_status ON project_phases(project_id, status);

-- N8N jobs indexes
CREATE INDEX idx_n8n_jobs_project_id ON n8n_jobs(project_id);
CREATE INDEX idx_n8n_jobs_status ON n8n_jobs(status);
CREATE INDEX idx_n8n_jobs_created_at ON n8n_jobs(created_at DESC);

-- Content changes indexes
CREATE INDEX idx_content_changes_project_id ON content_changes(project_id);
CREATE INDEX idx_content_changes_entity ON content_changes(project_id, affected_entity_id);

-- User activities indexes
CREATE INDEX idx_user_activities_user_project ON user_activities(user_id, project_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE project_configuration_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Configuration templates policies (public read, authenticated manage)
CREATE POLICY "Anyone can view configuration templates"
  ON project_configuration_templates FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage templates"
  ON project_configuration_templates FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- Project versions policies
CREATE POLICY "Users can view versions of their projects"
  ON project_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_versions.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create versions for their projects"
  ON project_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_versions.project_id AND p.user_id = auth.uid()
  ));

-- Project assets policies
CREATE POLICY "Users can view assets of their projects"
  ON project_assets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_assets.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create assets for their projects"
  ON project_assets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_assets.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update assets of their projects"
  ON project_assets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_assets.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete assets of their projects"
  ON project_assets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_assets.project_id AND p.user_id = auth.uid()
  ));

-- Project phases policies
CREATE POLICY "Users can view phases of their projects"
  ON project_phases FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create phases for their projects"
  ON project_phases FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update phases of their projects"
  ON project_phases FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_phases.project_id AND p.user_id = auth.uid()
  ));

-- N8N jobs policies
CREATE POLICY "Users can view n8n jobs for their projects"
  ON n8n_jobs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = n8n_jobs.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create n8n jobs for their projects"
  ON n8n_jobs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = n8n_jobs.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can update n8n jobs for their projects"
  ON n8n_jobs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = n8n_jobs.project_id AND p.user_id = auth.uid()
  ));

-- Content changes policies
CREATE POLICY "Users can view content changes for their projects"
  ON content_changes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = content_changes.project_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Users can create content changes for their projects"
  ON content_changes FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = content_changes.project_id AND p.user_id = auth.uid()
  ));

-- User activities policies
CREATE POLICY "Users can view their own activities"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
  ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for projects updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create version when current_version is incremented (explicit save)
CREATE OR REPLACE FUNCTION create_project_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if current_version was incremented (explicit user save)
  IF OLD.current_version IS DISTINCT FROM NEW.current_version THEN
    INSERT INTO project_versions (
      project_id,
      version_number,
      master_json,
      change_description,
      created_by
    ) VALUES (
      NEW.id,
      NEW.current_version,
      NEW.master_json,
      'Version ' || NEW.current_version || ' created',
      NEW.user_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create versions
CREATE TRIGGER auto_create_project_version
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_project_version();

-- Function to initialize project phases AND configuration on project creation
CREATE OR REPLACE FUNCTION initialize_project_phases()
RETURNS TRIGGER AS $$
BEGIN
  -- Create all 5 phases for the new project
  INSERT INTO project_phases (project_id, phase_name, phase_index, can_proceed) VALUES
    (NEW.id, 'script_interpretation', 1, TRUE),   -- First phase can proceed
    (NEW.id, 'element_images', 2, FALSE),
    (NEW.id, 'scene_generation', 3, FALSE),
    (NEW.id, 'scene_videos', 4, FALSE),
    (NEW.id, 'final_assembly', 5, FALSE);
  
  -- AUTOMATIC CONFIG INJECTION: Copy default template if no config provided
  IF NEW.configuration_data IS NULL THEN
    UPDATE projects 
    SET configuration_data = (
      SELECT template_data 
      FROM project_configuration_templates 
      WHERE name = 'default'
      LIMIT 1
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize phases AND configuration on project creation
CREATE TRIGGER initialize_phases_on_project_creation
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION initialize_project_phases();

-- ============================================================================
-- DEPLOYMENT COMPLETE - SCHEMA v4.0
-- ============================================================================

-- Schema v4.0 deployment complete with integrated project-specific configuration
-- Key features:
-- 1. Project-specific configuration in projects.configuration_data
-- 2. Default template system with automatic injection
-- 3. Clean master JSON architecture (single source of truth)
-- 4. Complete asset storage with permanent URLs
-- 5. Cross-phase change tracking for timeline intelligence
-- 6. Enhanced security with comprehensive RLS policies
-- 7. Automatic configuration setup for new projects
-- 8. Performance optimized with strategic indexes