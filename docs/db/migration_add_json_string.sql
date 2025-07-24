-- Migration: Add master_json_string field to preserve formatting
-- Run this in your Supabase SQL editor

ALTER TABLE projects ADD COLUMN master_json_string TEXT;

-- Update existing projects to have the string version
UPDATE projects SET master_json_string = master_json::TEXT WHERE master_json_string IS NULL;

-- Also add to project_versions table for version history
ALTER TABLE project_versions ADD COLUMN master_json_string TEXT;
UPDATE project_versions SET master_json_string = master_json::TEXT WHERE master_json_string IS NULL;

-- Update the trigger function to also save the string version
CREATE OR REPLACE FUNCTION create_project_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if master_json actually changed
  IF OLD.master_json IS DISTINCT FROM NEW.master_json THEN
    INSERT INTO project_versions (
      project_id,
      version_number,
      master_json,
      master_json_string,
      change_description,
      created_by
    ) VALUES (
      NEW.id,
      NEW.current_version,
      NEW.master_json,
      NEW.master_json_string,
      'Auto-generated version on master_json change',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;