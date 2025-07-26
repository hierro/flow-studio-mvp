// Debug script to check storage and database state
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugStorage() {
  console.log('🔍 DEBUGGING STORAGE & DATABASE STATE');
  console.log('=====================================');

  try {
    // 1. Check all projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, created_at');
    
    console.log('\n📋 PROJECTS IN DATABASE:');
    projects?.forEach(p => {
      console.log(`  📂 ${p.name} (${p.id})`);
    });

    // 2. Check all project assets
    const { data: assets } = await supabase
      .from('project_assets')
      .select('project_id, scene_id, asset_filename, asset_url, created_at');
    
    console.log('\n🖼️ ASSETS IN DATABASE:');
    assets?.forEach(a => {
      console.log(`  📸 ${a.scene_id} → ${a.asset_filename}`);
      console.log(`      Project: ${a.project_id}`);
    });

    // 3. Check storage buckets
    const { data: buckets } = await supabase.storage.listBuckets();
    console.log('\n🪣 STORAGE BUCKETS:');
    buckets?.forEach(b => {
      console.log(`  📦 ${b.name} (${b.public ? 'public' : 'private'})`);
    });

    // 4. Check scene-images bucket contents
    const { data: folders } = await supabase.storage
      .from('scene-images')
      .list('projects');
    
    console.log('\n📁 FOLDERS IN scene-images/projects/:');
    if (folders && folders.length > 0) {
      for (const folder of folders) {
        console.log(`  📂 projects/${folder.name}/`);
        
        // Check each project folder
        const { data: scenes } = await supabase.storage
          .from('scene-images')
          .list(`projects/${folder.name}/scenes`);
        
        if (scenes && scenes.length > 0) {
          console.log(`    📁 scenes/ (${scenes.length} files):`);
          scenes.forEach(file => {
            console.log(`      📸 ${file.name}`);
          });
        }
      }
    } else {
      console.log('  (No project folders found)');
    }

    // 5. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`  Projects in DB: ${projects?.length || 0}`);
    console.log(`  Assets in DB: ${assets?.length || 0}`);
    console.log(`  Storage folders: ${folders?.length || 0}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugStorage();