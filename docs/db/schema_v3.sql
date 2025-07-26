-- FLOW.STUDIO MVP Schema v3.0
-- CLEAN MASTER JSON ARCHITECTURE
-- Purpose: Single source of truth with master JSON, no scattered references
-- Deployment: Clean slate - replaces all previous schemas

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
-- 3. CORE TABLES (CLEAN ARCHITECTURE)
-- ============================================================================

-- Projects with master JSON (single source of truth)
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
      "schema_version": "3.0",
      "production_workflow": "animatic_to_video_scalable"
    }
  }',
  
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

-- ============================================================================
-- 4. INDEXES (PERFORMANCE OPTIMIZATION)
-- ============================================================================

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

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_jobs ENABLE ROW LEVEL SECURITY;

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

-- ============================================================================
-- 6. FUNCTIONS AND TRIGGERS
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

-- ============================================================================
-- 7. INITIAL DATA SETUP
-- ============================================================================

-- Function to initialize project phases when project is created
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to initialize phases on project creation
CREATE TRIGGER initialize_phases_on_project_creation
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION initialize_project_phases();

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================

-- Schema v3.0 deployment complete
-- Key improvements:
-- 1. Single master_json source of truth in projects table
-- 2. Clean separation of content (master_json) and assets (project_assets)
-- 3. Phase tracking without content duplication
-- 4. Automatic version creation on JSON changes
-- 5. Proper RLS policies for security
-- 6. Performance optimized with strategic indexes