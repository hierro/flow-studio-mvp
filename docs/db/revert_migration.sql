-- Revert the master_json_string migration
-- Run this in your Supabase SQL editor

-- Drop the columns we added
ALTER TABLE projects DROP COLUMN IF EXISTS master_json_string;
ALTER TABLE project_versions DROP COLUMN IF EXISTS master_json_string;

-- Revert the trigger function to original
CREATE OR REPLACE FUNCTION create_project_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if master_json actually changed
  IF OLD.master_json IS DISTINCT FROM NEW.master_json THEN
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
      'Auto-generated version on master_json change',
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;