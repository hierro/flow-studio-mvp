#!/usr/bin/env node

/**
 * Debug Configuration & LLM Service Test
 * 
 * Tests auto-save functionality and LLM service initialization
 * Run with: node debug-config.js
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

async function debugConfiguration() {
  console.log('🔍 DEBUGGING CONFIGURATION & LLM SERVICE');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check app configuration table
    console.log('\n📊 CHECKING APP CONFIGURATION:');
    const { data: configs, error: configError } = await supabase
      .from('app_configuration')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (configError) {
      console.error('❌ Error reading app_configuration:', configError);
      return;
    }
    
    console.log(`✅ Found ${configs.length} configuration records`);
    
    if (configs.length === 0) {
      console.log('⚠️ No configuration found - this would cause LLM service initialization to fail');
      return;
    }
    
    // 2. Check latest configuration structure
    const latestConfig = configs[0];
    console.log('\n📋 LATEST CONFIGURATION STRUCTURE:');
    console.log(`Updated: ${latestConfig.updated_at}`);
    console.log(`Has start_frame_prompt_generation: ${!!latestConfig.config_data?.start_frame_prompt_generation}`);
    
    if (latestConfig.config_data?.start_frame_prompt_generation) {
      const promptConfig = latestConfig.config_data.start_frame_prompt_generation;
      console.log(`System prompt length: ${promptConfig.system_prompt?.length || 0} characters`);
      console.log(`User prompt length: ${promptConfig.user_prompt?.length || 0} characters`);
      console.log(`Has system prompt: ${!!promptConfig.system_prompt}`);
      console.log(`Has user prompt: ${!!promptConfig.user_prompt}`);
      
      // Show first 100 chars of each prompt
      if (promptConfig.system_prompt) {
        console.log(`System prompt preview: "${promptConfig.system_prompt.substring(0, 100)}..."`);
      }
      if (promptConfig.user_prompt) {
        console.log(`User prompt preview: "${promptConfig.user_prompt.substring(0, 100)}..."`);
      }
    } else {
      console.log('❌ Missing start_frame_prompt_generation section - LLM service will fail');
    }
    
    // 3. Test LLM service validation logic
    console.log('\n🔧 LLM SERVICE VALIDATION TEST:');
    const config = latestConfig.config_data;
    
    if (!config?.start_frame_prompt_generation) {
      console.log('❌ FAIL: Missing start_frame_prompt_generation');
      console.log('   This is why the LLM service initialization fails');
      console.log('   Button will be greyed out because isLLMReady = false');
    } else {
      console.log('✅ PASS: start_frame_prompt_generation exists');
      
      const systemPrompt = config.start_frame_prompt_generation.system_prompt;
      const userPrompt = config.start_frame_prompt_generation.user_prompt;
      
      if (!systemPrompt) {
        console.log('❌ FAIL: Missing system_prompt');
      } else {
        console.log('✅ PASS: system_prompt exists');
      }
      
      if (!userPrompt) {
        console.log('❌ FAIL: Missing user_prompt');
      } else {
        console.log('✅ PASS: user_prompt exists');
      }
      
      if (systemPrompt && userPrompt) {
        console.log('🎉 LLM service should initialize successfully!');
        console.log('   If button is still greyed out, check for other issues like totalScenes === 0');
      }
    }
    
    // 4. Test auto-save functionality by making a small change
    console.log('\n💾 TESTING AUTO-SAVE FUNCTIONALITY:');
    
    if (latestConfig.config_data?.start_frame_prompt_generation) {
      const testConfig = {
        ...latestConfig.config_data,
        start_frame_prompt_generation: {
          ...latestConfig.config_data.start_frame_prompt_generation,
          test_timestamp: new Date().toISOString()
        }
      };
      
      console.log('📤 Saving test configuration...');
      const { error: saveError } = await supabase
        .from('app_configuration')
        .upsert({
          config_data: testConfig,
          updated_at: new Date().toISOString()
        });
        
      if (saveError) {
        console.error('❌ Auto-save test FAILED:', saveError);
      } else {
        console.log('✅ Auto-save test SUCCESS');
        
        // Verify the save worked
        const { data: verifyData } = await supabase
          .from('app_configuration')
          .select('config_data')
          .order('updated_at', { ascending: false })
          .limit(1);
          
        if (verifyData?.[0]?.config_data?.start_frame_prompt_generation?.test_timestamp) {
          console.log('✅ Verification SUCCESS: Change persisted to database');
        } else {
          console.log('❌ Verification FAILED: Change not found in database');
        }
      }
    }
    
  } catch (error) {
    console.error('💥 Debug script error:', error);
  }
}

debugConfiguration().catch(console.error);