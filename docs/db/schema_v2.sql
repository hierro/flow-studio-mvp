-- FLOW.STUDIO MVP Fresh Database Schema
-- Version: 2.0 - Complete Clean Deployment
-- For FRESH database deployment after reset
-- Includes: Cross-phase timeline architecture + Enhanced features

-- ============================================================================
-- 1. EXTENSIONS & SETUP
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CORE TABLES (FRESH DEPLOYMENT)
-- ============================================================================

-- Projects table (Enhanced from day one)
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  
  -- Project metadata (Italian campaign template)
  project_metadata JSONB NOT NULL DEFAULT '{
    "title": "New Project",
    "client": "Client Name",
    "extraction_date": "",
    "schema_version": "1.0",
    "production_workflow": "animatic_to_video_scalable"
  }'::jsonb,
  
  -- Global style configuration
  global_style JSONB NOT NULL DEFAULT '{
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
  }'::jsonb,

  -- Timeline features (built-in from day one)
  last_global_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{
    "auto_save": true,
    "version_retention": 10,
    "collaboration_enabled": false
  }'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project phases table (Enhanced 5-phase workflow)
CREATE TABLE project_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Phase identification
  phase_name TEXT NOT NULL CHECK (phase_name IN (
    'script_interpretation', 'element_images', 'scene_generation', 
    'scene_videos', 'final_assembly'
  )),
  phase_index INTEGER NOT NULL CHECK (phase_index BETWEEN 1 AND 5),
  
  -- Phase control
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'locked')),
  can_proceed BOOLEAN DEFAULT FALSE,
  user_saved BOOLEAN DEFAULT FALSE,
  
  -- Content and versioning (CRITICAL FIELDS)
  current_version INTEGER DEFAULT 0,
  content_data JSONB, -- This is where all phase content lives
  
  -- Timeline features (built-in)
  affects_other_phases BOOLEAN DEFAULT FALSE,
  last_cross_phase_update TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(project_id, phase_name),
  UNIQUE(project_id, phase_index)
);

-- Phase versions table (Enhanced version history)
CREATE TABLE phase_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES project_phases(id) ON DELETE CASCADE,
  
  -- Version identification
  version_number INTEGER NOT NULL,
  content_data JSONB NOT NULL, -- Version content snapshot
  change_description TEXT,
  
  -- Timeline features (built-in)
  related_changes UUID[] DEFAULT '{}',
  change_scope TEXT DEFAULT 'phase' CHECK (change_scope IN ('phase', 'cross_phase', 'global')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(phase_id, version_number)
);

-- N8N jobs table (Enhanced workflow tracking)
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
  
  -- Enhanced features (built-in)
  webhook_url TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  job_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 3. TIMELINE FEATURES (NEW TABLES)
-- ============================================================================

-- Cross-phase content changes tracking (Timeline consistency)
CREATE TABLE content_changes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Change identification
  change_type TEXT NOT NULL CHECK (change_type IN (
    'style_global', 'style_element', 'element_description', 'element_consistency',
    'scene_content', 'scene_elements', 'project_metadata', 'manual_edit'
  )),
  changed_in_phase TEXT NOT NULL, -- Which phase triggered the change
  affects_phases TEXT[] NOT NULL, -- Which phases are affected
  
  -- Change details
  change_data JSONB NOT NULL, -- What specifically changed
  change_description TEXT,
  before_value JSONB, -- Previous value (for rollback)
  after_value JSONB,  -- New value
  
  -- Timeline context
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  change_metadata JSONB DEFAULT '{}'::jsonb
);

-- Project assets (Phase 2+ image/video management)
CREATE TABLE project_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Asset identification
  asset_type TEXT NOT NULL CHECK (asset_type IN (
    'reference_image', 'scene_image', 'scene_video', 'final_video', 
    'element_image', 'style_reference', 'export_file'
  )),
  asset_name TEXT NOT NULL,
  file_path TEXT, -- Supabase Storage path
  asset_url TEXT, -- External URL (FAL.ai, etc.)
  
  -- Asset metadata
  asset_metadata JSONB DEFAULT '{}'::jsonb, -- width, height, duration, etc.
  file_size BIGINT,
  mime_type TEXT,
  
  -- Workflow context
  phase_name TEXT, -- Which phase generated this asset
  related_element TEXT, -- Which element this asset represents
  related_scene INTEGER, -- Which scene this asset represents
  
  -- Approval workflow
  approved BOOLEAN DEFAULT NULL, -- NULL = pending, TRUE = approved, FALSE = rejected
  approval_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity log (Analytics and debugging)
CREATE TABLE user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'project_created', 'project_opened', 'phase_started', 'phase_completed',
    'content_edited', 'n8n_triggered', 'asset_approved', 'asset_rejected',
    'version_created', 'version_restored', 'timeline_navigated'
  )),
  activity_description TEXT,
  activity_data JSONB DEFAULT '{}'::jsonb,
  
  -- Context
  phase_name TEXT,
  session_id TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. INDEXES (PERFORMANCE OPTIMIZATION)
-- ============================================================================

-- Core functionality indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_updated_at ON projects(updated_at);

CREATE INDEX idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX idx_project_phases_phase_name ON project_phases(phase_name);
CREATE INDEX idx_project_phases_status ON project_phases(status);
CREATE INDEX idx_project_phases_can_proceed ON project_phases(can_proceed);

CREATE INDEX idx_phase_versions_phase_id ON phase_versions(phase_id);
CREATE INDEX idx_phase_versions_version_number ON phase_versions(version_number);

CREATE INDEX idx_n8n_jobs_project_id ON n8n_jobs(project_id);
CREATE INDEX idx_n8n_jobs_status ON n8n_jobs(status);
CREATE INDEX idx_n8n_jobs_phase_name ON n8n_jobs(phase_name);

-- Timeline feature indexes
CREATE INDEX idx_content_changes_project_id ON content_changes(project_id);
CREATE INDEX idx_content_changes_change_type ON content_changes(change_type);
CREATE INDEX idx_content_changes_changed_in_phase ON content_changes(changed_in_phase);
CREATE INDEX idx_content_changes_created_at ON content_changes(created_at);

CREATE INDEX idx_project_assets_project_id ON project_assets(project_id);
CREATE INDEX idx_project_assets_asset_type ON project_assets(asset_type);
CREATE INDEX idx_project_assets_phase_name ON project_assets(phase_name);
CREATE INDEX idx_project_assets_approved ON project_assets(approved);

CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_project_id ON user_activities(project_id);
CREATE INDEX idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at);

-- ============================================================================
-- 5. ROW LEVEL SECURITY (COMPLETE SECURITY)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Project phases policies
CREATE POLICY "Users can view project phases" ON project_phases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_phases.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create project phases" ON project_phases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_phases.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update project phases" ON project_phases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_phases.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete project phases" ON project_phases
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_phases.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Phase versions policies
CREATE POLICY "Users can view phase versions" ON phase_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_phases 
      JOIN projects ON projects.id = project_phases.project_id
      WHERE project_phases.id = phase_versions.phase_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create phase versions" ON phase_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_phases 
      JOIN projects ON projects.id = project_phases.project_id
      WHERE project_phases.id = phase_versions.phase_id 
      AND projects.user_id = auth.uid()
    )
  );

-- N8N jobs policies
CREATE POLICY "Users can view n8n jobs" ON n8n_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = n8n_jobs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create n8n jobs" ON n8n_jobs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = n8n_jobs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update n8n jobs" ON n8n_jobs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = n8n_jobs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Content changes policies
CREATE POLICY "Users can view content changes" ON content_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = content_changes.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create content changes" ON content_changes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = content_changes.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Project assets policies
CREATE POLICY "Users can view project assets" ON project_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_assets.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create project assets" ON project_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_assets.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update project assets" ON project_assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_assets.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete project assets" ON project_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_assets.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- User activities policies
CREATE POLICY "Users can view own activities" ON user_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. TRIGGERS (AUTOMATED MAINTENANCE)
-- ============================================================================

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_phases_updated_at 
  BEFORE UPDATE ON project_phases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_assets_updated_at 
  BEFORE UPDATE ON project_assets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Track global changes
CREATE OR REPLACE FUNCTION track_global_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last_global_change when global_style changes
  IF OLD.global_style IS DISTINCT FROM NEW.global_style THEN
    NEW.last_global_change = NOW();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER track_projects_global_changes 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION track_global_changes();

-- ============================================================================
-- 7. UTILITY FUNCTIONS (HELPER FUNCTIONS)
-- ============================================================================

-- Get project progress summary
CREATE OR REPLACE FUNCTION get_project_progress(project_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'project_id', project_uuid,
    'total_phases', 5,
    'completed_phases', COUNT(*) FILTER (WHERE user_saved = TRUE),
    'current_phase', phase_name,
    'can_proceed_phases', COUNT(*) FILTER (WHERE can_proceed = TRUE),
    'processing_phases', COUNT(*) FILTER (WHERE status = 'processing')
  ) INTO result
  FROM project_phases 
  WHERE project_id = project_uuid
  GROUP BY phase_name;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get cross-phase change impact
CREATE OR REPLACE FUNCTION get_change_impact(change_uuid UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'change_id', change_uuid,
    'affects_phases', affects_phases,
    'change_type', change_type,
    'impact_summary', json_build_object(
      'phases_count', array_length(affects_phases, 1),
      'change_scope', change_type,
      'created_at', created_at
    )
  ) INTO result
  FROM content_changes 
  WHERE id = change_uuid;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. DEPLOYMENT VERIFICATION
-- ============================================================================

-- Verify all tables created
DO $$
BEGIN
  RAISE NOTICE 'Verifying fresh schema deployment...';
  
  -- Check core tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    RAISE EXCEPTION 'Projects table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_phases') THEN
    RAISE EXCEPTION 'Project phases table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phase_versions') THEN
    RAISE EXCEPTION 'Phase versions table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'n8n_jobs') THEN
    RAISE EXCEPTION 'N8N jobs table not created';
  END IF;
  
  -- Check timeline tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_changes') THEN
    RAISE EXCEPTION 'Content changes table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_assets') THEN
    RAISE EXCEPTION 'Project assets table not created';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activities') THEN
    RAISE EXCEPTION 'User activities table not created';
  END IF;
  
  RAISE NOTICE '✅ Fresh schema deployment successful!';
  RAISE NOTICE '🎯 Ready for timeline development';
  RAISE NOTICE '🚀 All 7 tables created with enhanced features';
END $$;