-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.n8n_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  phase_name text NOT NULL,
  workflow_id text NOT NULL,
  n8n_execution_id text,
  input_data jsonb,
  output_data jsonb,
  status text DEFAULT 'pending'::text,
  progress_percentage integer DEFAULT 0,
  error_message text,
  created_at timestamp without time zone DEFAULT now(),
  started_at timestamp without time zone,
  completed_at timestamp without time zone,
  CONSTRAINT n8n_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT n8n_jobs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.phase_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  phase_id uuid,
  version_number integer NOT NULL,
  content_data jsonb,
  change_description text,
  created_at timestamp without time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT phase_versions_pkey PRIMARY KEY (id),
  CONSTRAINT phase_versions_phase_id_fkey FOREIGN KEY (phase_id) REFERENCES public.project_phases(id),
  CONSTRAINT phase_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.project_phases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  phase_name text NOT NULL,
  phase_index integer NOT NULL CHECK (phase_index >= 1 AND phase_index <= 5),
  status text DEFAULT 'pending'::text,
  can_proceed boolean DEFAULT false,
  current_version integer DEFAULT 0,
  content_data jsonb,
  user_saved boolean DEFAULT false,
  last_modified_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT project_phases_pkey PRIMARY KEY (id),
  CONSTRAINT project_phases_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  status text DEFAULT 'active'::text,
  project_metadata jsonb,
  global_style jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);