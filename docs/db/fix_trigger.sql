-- Fix for version creation trigger
-- Issue: auth.uid() returns NULL in trigger context, causing version creation to fail
-- Solution: Use NEW.user_id which is guaranteed to exist

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
      NEW.user_id  -- Fixed: Use project's user_id instead of auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;