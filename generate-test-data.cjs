#!/usr/bin/env node

/**
 * Generate Test Data Script for Web-Brother Collaboration
 * 
 * Usage: node generate-test-data.js PROJECT_ID
 * 
 * This script:
 * 1. Connects to your Supabase database
 * 2. Fetches the project masterJSON
 * 3. Extracts prompts and image URLs
 * 4. Downloads all images
 * 5. Saves everything to docs/test/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Configuration - reads from your .env.local file
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role to bypass RLS
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get project ID from command line
const projectId = process.argv[2];
if (!projectId) {
  console.error('❌ Usage: node generate-test-data.js PROJECT_ID');
  process.exit(1);
}

const testDir = path.join(__dirname, 'docs', 'test');

// Ensure test directory exists
function ensureTestDir() {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log(`📁 Created directory: ${testDir}`);
  }
}

// Test the connection and get project data
async function fetchProject(projectId) {
  console.log('🔍 Testing database connection...');
  
  // First, let's see if we can connect and what projects exist
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, user_id, created_at')
    .limit(10);
    
  if (projectsError) {
    console.error('❌ Database connection failed:', projectsError);
    throw new Error('Database connection failed');
  }
  
  console.log(`✅ Database connected. Found ${projects.length} projects total.`);
  if (projects.length > 0) {
    console.log('Available projects:');
    projects.forEach(p => {
      console.log(`  - ${p.id} | ${p.name} | Created: ${p.created_at}`);
    });
  }
  
  // Now try to get the specific project
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name, user_id, master_json')
    .eq('id', projectId)
    .single();
    
  if (error) {
    console.error('❌ Error fetching project:', error);
    console.log('Make sure the project ID is correct:', projectId);
    throw new Error(`Project ${projectId} not found`);
  }
  
  if (!project) {
    console.error('❌ Project not found with ID:', projectId);
    throw new Error(`Project ${projectId} not found`);
  }
  
  return project;
}

// Download image from URL
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(testDir, filename));
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`📥 Downloaded: ${filename}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(path.join(testDir, filename), () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

// Main function
async function generateTestData() {
  try {
    console.log(`🚀 Generating test data for project: ${projectId}`);
    
    // Ensure test directory exists
    ensureTestDir();
    
    // Fetch project data
    console.log('📡 Fetching project from database...');
    const project = await fetchProject(projectId);
    const masterJSON = project.master_json;
    
    if (!masterJSON || !masterJSON.scenes) {
      throw new Error('Project has no scenes data');
    }
    
    console.log(`✅ Found project: ${masterJSON.project_metadata?.title || 'Unknown'}`);
    
    // Create unified test data structure
    const testData = {
      generation_timestamp: new Date().toISOString(),
      project_id: projectId,
      project_name: masterJSON.project_metadata?.title || 'Unknown Project',
      total_scenes: Object.keys(masterJSON.scenes).length,
      scenes: {}
    };
    
    // Extract images to download
    const imagesToDownload = [];
    
    Object.entries(masterJSON.scenes).forEach(([sceneId, sceneData]) => {
      // Build scene data with prompts
      const sceneInfo = {
        scene_title: sceneData.natural_description?.substring(0, 50) || 
                    sceneData.description?.substring(0, 50) || 
                    `Scene ${sceneId.replace('scene_', '')}`,
        prompt: sceneData.scene_frame_prompt || null,
        model_used: sceneData.prompt_metadata?.provider || 'unknown',
        parameters: sceneData.prompt_metadata || {},
        generation_time: sceneData.prompt_metadata?.generated_at || new Date().toISOString(),
        // Image fields (will be populated if images exist)
        has_image: false,
        image_filename: null,
        image_local_path: null,
        original_url: null,
        image_metadata: {}
      };
      
      // Check for images (multiple possible field names)
      let imageUrl = sceneData.scene_start_frame || 
                    sceneData.scene_frame_image || 
                    sceneData.generated_image || 
                    sceneData.image_url;
                    
      if (imageUrl) {
        // Determine file extension from URL
        const urlPath = new URL(imageUrl).pathname;
        const extension = path.extname(urlPath) || '.jpg';
        const filename = `${sceneId}_image${extension}`;
        
        // Update scene info with image data
        sceneInfo.has_image = true;
        sceneInfo.image_filename = filename;
        sceneInfo.image_local_path = `docs/test/${filename}`;
        sceneInfo.original_url = imageUrl;
        sceneInfo.image_metadata = sceneData.frame_metadata || {};
        
        imagesToDownload.push({
          sceneId,
          url: imageUrl,
          filename: filename
        });
      }
      
      testData.scenes[sceneId] = sceneInfo;
    });
    
    // Download all images
    console.log(`📥 Downloading ${imagesToDownload.length} images...`);
    for (const image of imagesToDownload) {
      try {
        await downloadImage(image.url, image.filename);
      } catch (error) {
        console.warn(`⚠️ Failed to download ${image.filename}: ${error.message}`);
        // Mark as failed in the data
        testData.scenes[image.sceneId].has_image = false;
        testData.scenes[image.sceneId].image_filename = null;
        testData.scenes[image.sceneId].image_local_path = null;
      }
    }
    
    // Save unified test data JSON
    const testDataFile = path.join(testDir, 'scene_frame_data.json');
    fs.writeFileSync(testDataFile, JSON.stringify(testData, null, 2));
    console.log(`💾 Saved test data: ${testDataFile}`);
    
    console.log('🎉 Test data generation complete!');
    console.log(`📁 Files saved to: ${testDir}`);
    console.log(`📝 Prompts: ${Object.keys(testData.scenes).length} scenes`);
    console.log(`🖼️ Images: ${imagesToDownload.length} downloaded`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
generateTestData();