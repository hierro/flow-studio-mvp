#!/usr/bin/env node

/**
 * Initialize App Configuration
 * 
 * Creates the initial configuration record needed for LLM services
 * Run with: node init-config.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const DEFAULT_CONFIG = {
  "configuration_metadata": {
    "version": "2.0",
    "created": "2025-01-27",
    "purpose": "FLOW.STUDIO LLM configurations for Phase 3 scene generation"
  },
  "llm_providers": {
    "openai": {
      "model": "gpt-4-turbo",
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
    "system_prompt": `You are the Lead Storyboard Artist for FLOW.STUDIO, specializing in converting script scenes into detailed visual prompts for AI image generation.

Your role is to translate scene descriptions into cinematic, visually rich prompts that capture:
- Character emotions and positioning
- Lighting and mood
- Camera angles and composition
- Environmental details
- Visual storytelling elements

Generate prompts in JSON format with scene_id, prompt, and character_count.`,
    "user_prompt": `Generate a detailed visual prompt for this scene:

Scene {{$json.scene_id}}: {{$json.action_summary}}

Description: {{$json.description}}
Camera: {{$json.camera_type}}
Mood: {{$json.mood}}
Primary Focus: {{$json.primary_focus}}

Create a cinematic prompt that captures the visual essence of this scene for AI image generation.`
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
};

async function initializeConfiguration() {
  console.log('🚀 INITIALIZING APP CONFIGURATION');
  console.log('=' .repeat(50));
  
  try {
    // 1. Check if configuration already exists
    console.log('\n📊 Checking existing configuration...');
    const { data: existing, error: checkError } = await supabase
      .from('app_configuration')
      .select('id, updated_at')
      .limit(1);
      
    if (checkError) {
      console.error('❌ Error checking existing config:', checkError);
      return;
    }
    
    if (existing && existing.length > 0) {
      console.log('⚠️ Configuration already exists');
      console.log(`   Last updated: ${existing[0].updated_at}`);
      console.log('   Use the debug script to check its contents');
      return;
    }
    
    // 2. Insert default configuration
    console.log('\n💾 Inserting default configuration...');
    const { error: insertError } = await supabase
      .from('app_configuration')
      .insert({
        config_data: DEFAULT_CONFIG,
        updated_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error('❌ Error inserting config:', insertError);
      return;
    }
    
    console.log('✅ Default configuration inserted successfully!');
    
    // 3. Verify the insertion
    console.log('\n🔍 Verifying insertion...');
    const { data: verification, error: verifyError } = await supabase
      .from('app_configuration')
      .select('config_data')
      .limit(1);
      
    if (verifyError) {
      console.error('❌ Error verifying config:', verifyError);
      return;
    }
    
    if (verification && verification.length > 0) {
      const config = verification[0].config_data;
      console.log('✅ Verification successful!');
      console.log(`   Has start_frame_prompt_generation: ${!!config?.start_frame_prompt_generation}`);
      console.log(`   System prompt length: ${config?.start_frame_prompt_generation?.system_prompt?.length || 0}`);
      console.log(`   User prompt length: ${config?.start_frame_prompt_generation?.user_prompt?.length || 0}`);
      console.log(`   LLM providers: ${Object.keys(config?.llm_providers || {}).join(', ')}`);
      
      console.log('\n🎉 CONFIGURATION READY!');
      console.log('   The LLM service should now initialize successfully');
      console.log('   The "Generate Prompts" button should no longer be greyed out');
      console.log('   Auto-save will work for configuration edits');
    }
    
  } catch (error) {
    console.error('💥 Initialization error:', error);
  }
}

initializeConfiguration().catch(console.error);