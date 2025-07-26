# Phase 3 Image Storage Architecture
## Holistic Database-Centric Image Management System

---

## 🎯 **Architecture Overview**

**BEFORE (External Dependency):**
```
FAL.ai → External URL → masterJSON → Database
❌ Temporary URLs, no control, Phase 4+ problems
```

**AFTER (Database-Centric):**
```
FAL.ai → Download → Our Storage → Database → masterJSON → Phase 4+
✅ Permanent URLs, full control, reliable workflow
```

---

## 🗄️ **Database Schema Extension**

### **New Table: `scene_images`**
```sql
CREATE TABLE scene_images (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  scene_id TEXT NOT NULL,              -- "scene_1", "scene_2", etc.
  
  -- Our Storage System
  storage_path TEXT NOT NULL,          -- "projects/{uuid}/scenes/scene_1_timestamp.jpeg"
  storage_url TEXT NOT NULL,           -- "https://supabase-storage.com/..."
  file_size BIGINT,
  content_type TEXT DEFAULT 'image/jpeg',
  
  -- Generation Metadata
  generated_at TIMESTAMP DEFAULT NOW(),
  provider TEXT DEFAULT 'fal_ai_flux',
  generation_prompt TEXT,
  
  -- FAL.ai Original (for debugging)
  original_fal_url TEXT,
  fal_metadata JSONB,
  
  -- Versioning (extensible)
  version INTEGER DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  
  UNIQUE(project_id, scene_id, version)
);
```

### **Helper View & Function**
```sql
-- Easy querying of current images
CREATE VIEW current_scene_images AS
SELECT project_id, scene_id, storage_url, generated_at
FROM scene_images WHERE is_current = true;

-- Direct URL lookup
CREATE FUNCTION get_scene_image_url(project_id UUID, scene_id TEXT)
RETURNS TEXT AS $$
  SELECT storage_url FROM scene_images 
  WHERE project_id = $1 AND scene_id = $2 AND is_current = true;
$$;
```

---

## 🔧 **Service Architecture**

### **ImageStorageService.ts**
**Responsibilities:**
- Download images from external URLs (FAL.ai)
- Upload to Supabase Storage with organized paths
- Create database records with metadata
- Generate permanent public URLs
- Handle versioning and cleanup

**Key Methods:**
```typescript
// Primary method
static async downloadAndStore(projectId: string, request: ImageDownloadRequest): Promise<ImageStorageResult>

// Bulk processing
static async downloadAndStoreBulk(projectId: string, requests: ImageDownloadRequest[]): Promise<ImageStorageResult[]>

// URL retrieval
static async getCurrentImageUrl(projectId: string, sceneId: string): Promise<string | null>
```

### **Updated ImageGenerationService.ts**
**Enhanced Flow:**
1. Generate image with FAL.ai (as before)
2. **NEW:** Download and store using ImageStorageService
3. **NEW:** Return our permanent URL instead of FAL.ai URL
4. **NEW:** Include storage metadata in result

**Interface Changes:**
```typescript
interface SceneImageRequest {
  sceneId: string;
  prompt: string;
  projectId: string;  // ← NEW: Required for storage
}

interface ImageGenerationResult {
  // ... existing fields
  imageUrl: string;           // ← NOW: Our permanent URL
  originalFalUrl?: string;    // ← NEW: FAL.ai URL for debugging
  storageRecord?: SceneImageRecord;  // ← NEW: Database record
}
```

---

## 📊 **Complete Data Flow**

### **Step 1: Image Generation Request**
```typescript
// ScenesFrameGenerationModule.tsx
const scenePrompts = processScenes.map(sceneId => ({
  sceneId,
  prompt: masterJSON.scenes[sceneId].scene_frame_prompt,
  projectId: projectId  // ← NEW: Required for storage
}));
```

### **Step 2: FAL.ai Generation + Storage**
```typescript
// ImageGenerationService.ts
const falResult = await fal.subscribe(endpoint, payload);
const falUrl = falResult.data.images[0].url;

// ← NEW: Download and store in our system
const storageResult = await ImageStorageService.downloadAndStore(projectId, {
  sceneId,
  falUrl,
  generationPrompt: prompt,
  falMetadata: { width, height, seed, ... }
});

return {
  imageUrl: storageResult.ourImageUrl,  // ← Our permanent URL
  originalFalUrl: falUrl                // ← Keep for debugging
};
```

### **Step 3: Database Storage**
```sql
-- ImageStorageService creates record
INSERT INTO scene_images (
  project_id, scene_id, storage_path, storage_url,
  generation_prompt, original_fal_url, fal_metadata
) VALUES (
  'uuid', 'scene_1', 'projects/uuid/scenes/scene_1_timestamp.jpeg',
  'https://supabase-storage.com/scene-images/projects/uuid/scenes/scene_1_timestamp.jpeg',
  'A futuristic library...', 'https://v2.fal.ai/temp123.jpeg', {...}
);
```

### **Step 4: masterJSON Update**
```json
{
  "scenes": {
    "scene_1": {
      "scene_frame_prompt": "A futuristic library...",
      "scene_start_frame": "https://supabase-storage.com/scene-images/projects/uuid/scenes/scene_1_timestamp.jpeg"
    }
  }
}
```

### **Step 5: Display & Future Phases**
```typescript
// SceneCard.tsx - displays our permanent URL
<img src={scene.scene_start_frame} />

// Phase 4+ - uses reliable URLs for video generation
const sceneImage = masterJSON.scenes.scene_1.scene_start_frame;
// Always available, never expires, under our control
```

---

## 🎯 **Benefits Achieved**

### **✅ Reliability**
- **Permanent URLs**: Never expire, always accessible
- **Database Control**: Full lifecycle management
- **Version History**: Track all generations and changes

### **✅ Phase 4+ Ready**
- **Video Generation**: Reliable image inputs
- **Editing Workflows**: Images always available
- **Cross-Phase Consistency**: Stable references

### **✅ Production Quality**
- **Error Handling**: Fallback to FAL.ai if storage fails
- **Storage Organization**: Structured paths and naming
- **Metadata Tracking**: Complete audit trail

### **✅ Extensible Architecture**
- **Versioning Ready**: Support for regeneration
- **Multi-Provider**: Extensible to other image services
- **Asset Management**: Foundation for broader media handling

---

## 🔮 **Future Enhancements**

### **Image Versioning (When Users Regenerate)**
```sql
-- Keep old versions, mark new as current
UPDATE scene_images SET is_current = false WHERE project_id = $1 AND scene_id = $2;
INSERT INTO scene_images (version = 2, is_current = true, ...);
```

### **Storage Optimization**
- **Image Compression**: Optimize file sizes
- **CDN Integration**: Faster global delivery
- **Cleanup Jobs**: Remove old versions automatically

### **Cross-Phase Asset Management**
- **Element Images**: Phase 2 character/location assets
- **Video Files**: Phase 4 scene videos
- **Final Renders**: Phase 5 complete videos

---

## 🛠️ **Implementation Status**

- ✅ **Database Schema**: Complete with versioning support
- ✅ **ImageStorageService**: Full download/upload/metadata system
- ✅ **ImageGenerationService**: Integrated with storage
- ✅ **ScenesFrameGenerationModule**: Updated to use new flow
- ✅ **Build System**: All TypeScript compilation passing
- 🔄 **Database Migration**: Schema needs to be applied to Supabase
- 🔄 **Storage Bucket**: Needs to be created in Supabase
- 🔄 **Testing**: End-to-end workflow validation needed

---

This architecture provides a **production-ready, scalable foundation** for Phase 3 image management with **full database control** and **extensibility for future phases**.