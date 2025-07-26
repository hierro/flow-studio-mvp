# Database Setup Required for Image Storage
## Schema v3.0 - No Additional Database Changes Needed!

---

## ✅ **GREAT NEWS: Schema v3 Already Has Everything!**

The **`project_assets`** table in schema v3 already supports our image storage system. **No new database tables needed!**

---

## 🗄️ **Current Schema Status**

**✅ Active Schema**: v3.0 (Clean master JSON architecture)  
**✅ Table**: `project_assets` already exists  
**✅ Support**: Scene images fully supported with `asset_type = 'scene_image'`

### **What project_assets Table Provides:**
```sql
CREATE TABLE project_assets (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  scene_id TEXT,              -- "scene_1", "scene_2", etc.
  asset_type TEXT,            -- 'scene_image' for our use case
  asset_url TEXT,             -- Our permanent image URLs
  asset_filename TEXT,        -- Filename in storage
  generation_prompt TEXT,     -- Original prompt used
  generation_model TEXT,      -- 'fal_ai_flux'
  generation_parameters JSONB, -- All FAL.ai metadata
  version_number INTEGER,     -- For versioning support
  is_current BOOLEAN,         -- Current active version
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🚀 **Required Setup Steps**

### **1. Verify Schema v3 is Applied**
**Check in Supabase SQL Editor:**
```sql
-- Verify project_assets table exists
SELECT COUNT(*) FROM project_assets;
-- Should return: 0 (empty but no error)
```

### **2. Create Supabase Storage Bucket**
**In Supabase Dashboard:**
1. **Go to**: Storage section
2. **Create bucket**: `scene-images`
3. **Settings**:
   - ✅ **Public**: YES (required for image display)
   - **Size limit**: 10MB
   - **MIME types**: `image/jpeg,image/png,image/webp`

### **3. Verify Permissions**
**Check RLS is working:**
```sql
-- Test access to project_assets (should work)
SELECT * FROM project_assets WHERE project_id = 'your-project-id';
```

---

## 🎯 **What Our System Will Do**

### **Data Flow:**
1. **Generate**: FAL.ai creates image with temporary URL
2. **Download**: Our system downloads the image 
3. **Upload**: Store in `scene-images` Supabase Storage bucket
4. **Database**: Create record in `project_assets` with permanent URL
5. **masterJSON**: Update with our permanent URL

### **Example Database Record:**
```sql
INSERT INTO project_assets (
  project_id: 'f43783c7-3b81-44ba-a6a6-edab1d5cbf33',
  scene_id: 'scene_1',
  asset_type: 'scene_image',
  asset_url: 'https://supabase-storage.com/scene-images/projects/.../scene_1.jpeg',
  asset_filename: 'scene_1_2025-01-25T15-30-00.jpeg',
  generation_prompt: 'A futuristic library with children...',
  generation_model: 'fal_ai_flux',
  generation_parameters: {
    "width": 1024,
    "height": 576, 
    "seed": 12345,
    "original_fal_url": "https://v2.fal.ai/temp123.jpeg"
  },
  is_current: true
);
```

---

## 🔍 **Verification Commands**

### **After Setup, Run These:**

**1. Check table exists:**
```sql
\d project_assets
```

**2. Test storage bucket:**
- Go to Storage → `scene-images`
- Should show empty bucket

**3. Test image generation:**
- Click "🧪 Generate Frames (Test: 3 scenes)"
- Watch console logs for detailed process
- Check `project_assets` table has new records
- Verify images appear in scene cards

---

## 🎉 **Summary**

**✅ Database**: Schema v3 already has `project_assets` table  
**✅ Storage**: Just need to create `scene-images` bucket  
**✅ Code**: Already updated to use `project_assets` table  
**✅ Ready**: System ready for testing immediately!

**Next Step**: Create the storage bucket and test image generation! 🚀