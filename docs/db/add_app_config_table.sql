-- Add app_configuration table for LLM configurations
-- Run this in Supabase SQL editor

CREATE TABLE app_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Insert default configuration from docs/ai_generation/flow_studio_config.json
INSERT INTO app_configuration (config_data) VALUES ('{
  "configuration_metadata": {
    "version": "2.0",
    "created": "2025-01-24",
    "purpose": "FLOW.STUDIO LLM configurations only"
  },
  "llm_providers": {
    "openai": {
      "model": "gpt-4.1",
      "max_tokens": 2000,
      "temperature": 0.2
    },
    "anthropic": {
      "model": "claude-3-sonnet-20240229",
      "max_tokens": 1500,
      "temperature": 0.3
    }
  },
  "start_frame_prompt_generation": {
    "system_prompt": "You are the Lead Storyboard Artist...",
    "user_prompt": "Scene {{$json.scene_id}} - {{$json.action_summary}}..."
  },
  "image_generation": {
    "fal_ai_flux": {
      "endpoint": "fal-ai/flux/dev",
      "base_url": "https://queue.fal.run",
      "parameters": {
        "image_size": { "width": 1024, "height": 768 },
        "num_inference_steps": 28,
        "guidance_scale": 3.5
      }
    }
  },
  "video_generation": {
    "fal_ai_kling": {
      "endpoint": "fal-ai/kling-video",
      "parameters": {
        "duration": "5 seconds",
        "fps": 24,
        "motion_intensity": "medium"
      }
    }
  }
}');

-- RLS policy (admin access only)
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage app configuration" 
ON app_configuration 
FOR ALL 
USING (auth.uid() IS NOT NULL);