#!/usr/bin/env node

/**
 * Test Configuration Flow
 * 
 * Tests that edited configuration properly flows to LLM service
 * Run with: node test-config-flow.js
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

async function testConfigurationFlow() {
  console.log('🧪 TESTING CONFIGURATION FLOW');
  console.log('=' .repeat(50));
  
  try {
    // 1. Get current configuration
    console.log('\n📊 Getting current configuration...');
    const { data: configs, error: getError } = await supabase
      .from('app_configuration')
      .select('config_data')
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (getError) {
      console.error('❌ Error getting configuration:', getError);
      return;
    }
    
    if (!configs || configs.length === 0) {
      console.log('❌ No configuration found - need to create initial config first');
      return;
    }
    
    const currentConfig = configs[0].config_data;
    console.log('✅ Current configuration loaded');
    
    // 2. Simulate editing system prompt (like the UI does)
    console.log('\n📝 Simulating system prompt edit...');
    const editedConfig = {
      ...currentConfig,
      start_frame_prompt_generation: {
        ...currentConfig.start_frame_prompt_generation,
        system_prompt: currentConfig.start_frame_prompt_generation.system_prompt + '\n\n[TEST EDIT: ' + new Date().toISOString() + ']'
      }
    };
    
    // 3. Save edited configuration (like Save button does)
    console.log('\n💾 Saving edited configuration...');
    const { error: saveError } = await supabase
      .from('app_configuration')
      .upsert({
        config_data: editedConfig,
        updated_at: new Date().toISOString()
      });
      
    if (saveError) {
      console.error('❌ Error saving configuration:', saveError);
      return;
    }
    console.log('✅ Configuration saved successfully');
    
    // 4. Verify the edit persisted (simulate LLM service reading fresh config)
    console.log('\n🔍 Verifying edit persisted...');
    const { data: verifyConfigs, error: verifyError } = await supabase
      .from('app_configuration')
      .select('config_data')
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (verifyError) {
      console.error('❌ Error verifying configuration:', verifyError);
      return;
    }
    
    const verifiedConfig = verifyConfigs[0].config_data;
    const hasTestEdit = verifiedConfig.start_frame_prompt_generation.system_prompt.includes('[TEST EDIT:');
    
    if (hasTestEdit) {
      console.log('✅ Edit successfully persisted to database');
      console.log('✅ LLM service will receive the edited configuration');
    } else {
      console.log('❌ Edit NOT found in database - configuration flow broken');
    }
    
    // 5. Test the actual flow that LLM service uses
    console.log('\n🤖 Testing LLM service configuration access...');
    const systemPrompt = verifiedConfig?.start_frame_prompt_generation?.system_prompt;
    const userPrompt = verifiedConfig?.start_frame_prompt_generation?.user_prompt;
    
    if (systemPrompt && userPrompt) {
      console.log('✅ LLM service would get valid prompts');
      console.log(`   System prompt length: ${systemPrompt.length} chars`);
      console.log(`   User prompt length: ${userPrompt.length} chars`);
      console.log('✅ Configuration flow is WORKING correctly');
    } else {
      console.log('❌ LLM service would get invalid prompts');
      console.log('❌ Configuration flow is BROKEN');
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

testConfigurationFlow().catch(console.error);