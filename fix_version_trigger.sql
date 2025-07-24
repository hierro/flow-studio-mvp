-- Fix version creation trigger to only create versions when version is incremented
-- Not when master_json changes during editing

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS auto_create_project_version ON projects;
DROP FUNCTION IF EXISTS create_project_version();

-- New function that only creates versions when current_version is incremented
CREATE OR REPLACE FUNCTION create_project_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create version if current_version was incremented (explicit save)
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
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with new logic
CREATE TRIGGER auto_create_project_version
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION create_project_version();