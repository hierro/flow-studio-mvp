/**
 * ImageStorageService - Holistic image storage architecture
 * 
 * Downloads external images (FAL.ai) and stores in our Supabase Storage + Database
 * Provides permanent URLs for masterJSON and Phase 3+ workflows
 */

import { supabase } from '../lib/supabase';

export interface SceneImageRecord {
  id: string;
  project_id: string;
  scene_id: string;
  storage_path: string;
  storage_url: string;
  file_size?: number;
  content_type: string;
  generated_at: string;
  provider: string;
  generation_prompt?: string;
  original_fal_url: string;
  fal_metadata?: any;
  version: number;
  is_current: boolean;
}

export interface ImageStorageResult {
  success: boolean;
  sceneId: string;
  ourImageUrl?: string;
  storageRecord?: SceneImageRecord;
  error?: string;
}

export interface ImageDownloadRequest {
  sceneId: string;
  falUrl: string;
  generationPrompt?: string;
  falMetadata?: any;
}

export class ImageStorageService {
  private static readonly STORAGE_BUCKET = 'scene-images';
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
  
  /**
   * Download FAL.ai image and store in our system
   */
  static async downloadAndStore(
    projectId: string,
    request: ImageDownloadRequest
  ): Promise<ImageStorageResult> {
    const logPrefix = `🎨 [${request.sceneId}]`;
    
    console.log(`${logPrefix} 📥 STEP 1/4: Starting image download and storage process...`);
    console.log(`${logPrefix} 📋 Request details:`, {
      sceneId: request.sceneId,
      projectId: projectId,
      falUrl: request.falUrl,
      promptLength: request.generationPrompt?.length || 0
    });
    
    try {
      // 1. Download image from FAL.ai
      console.log(`${logPrefix} 📡 STEP 1/4: Downloading from FAL.ai...`);
      const downloadStart = Date.now();
      const imageBuffer = await this.downloadImage(request.falUrl);
      const downloadTime = Date.now() - downloadStart;
      console.log(`${logPrefix} ✅ STEP 1/4: Download complete - ${imageBuffer.byteLength} bytes in ${downloadTime}ms`);
      
      // 2. Generate storage path
      console.log(`${logPrefix} 📂 STEP 2/4: Generating storage path...`);
      const storagePath = this.generateStoragePath(projectId, request.sceneId);
      console.log(`${logPrefix} ✅ STEP 2/4: Storage path: ${storagePath}`);
      
      // 3. Upload to Supabase Storage
      console.log(`${logPrefix} ☁️ STEP 3/4: Uploading to Supabase Storage...`);
      const uploadStart = Date.now();
      const storageUrl = await this.uploadToStorage(storagePath, imageBuffer);
      const uploadTime = Date.now() - uploadStart;
      console.log(`${logPrefix} ✅ STEP 3/4: Upload complete in ${uploadTime}ms`);
      console.log(`${logPrefix} 🔗 Our permanent URL: ${storageUrl}`);
      
      // 4. Create database record
      console.log(`${logPrefix} 💾 STEP 4/4: Creating database record...`);
      const dbStart = Date.now();
      const storageRecord = await this.createDatabaseRecord(projectId, request, {
        storagePath,
        storageUrl,
        fileSize: imageBuffer.byteLength
      });
      const dbTime = Date.now() - dbStart;
      console.log(`${logPrefix} ✅ STEP 4/4: Database record created in ${dbTime}ms`);
      console.log(`${logPrefix} 📊 Database record ID: ${storageRecord.id}`);
      
      const totalTime = Date.now() - downloadStart;
      console.log(`${logPrefix} 🎉 COMPLETE: Full storage process finished in ${totalTime}ms`);
      console.log(`${logPrefix} 🏆 RESULT: FAL.ai URL → Our Database URL`);
      console.log(`${logPrefix} 📤 FROM: ${request.falUrl}`);
      console.log(`${logPrefix} 📥 TO:   ${storageUrl}`);
      
      return {
        success: true,
        sceneId: request.sceneId,
        ourImageUrl: storageUrl,
        storageRecord
      };
      
    } catch (error) {
      console.error(`${logPrefix} 💥 FAILED: Storage process error:`, error);
      console.error(`${logPrefix} 🔍 Error details:`, {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return {
        success: false,
        sceneId: request.sceneId,
        error: error instanceof Error ? error.message : 'Unknown storage error'
      };
    }
  }
  
  /**
   * Download image from external URL
   */
  private static async downloadImage(url: string): Promise<ArrayBuffer> {
    console.log(`📡 Downloading image from: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Invalid content type: ${contentType}. Expected image.`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    if (arrayBuffer.byteLength > this.MAX_FILE_SIZE) {
      throw new Error(`Image too large: ${arrayBuffer.byteLength} bytes. Max: ${this.MAX_FILE_SIZE}`);
    }
    
    console.log(`✅ Downloaded image: ${arrayBuffer.byteLength} bytes, type: ${contentType}`);
    return arrayBuffer;
  }
  
  /**
   * Generate organized storage path
   */
  private static generateStoragePath(projectId: string, sceneId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `projects/${projectId}/scenes/${sceneId}_${timestamp}.jpeg`;
  }
  
  /**
   * Upload to Supabase Storage
   */
  private static async uploadToStorage(storagePath: string, imageBuffer: ArrayBuffer): Promise<string> {
    console.log(`☁️ Uploading to storage: ${storagePath}`);
    
    // Skip bucket creation - bucket already exists in Supabase Dashboard
    // NOTE: User created 'scene-images' bucket manually in Supabase
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(this.STORAGE_BUCKET)
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      });
    
    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(this.STORAGE_BUCKET)
      .getPublicUrl(storagePath);
    
    console.log(`✅ Uploaded to storage: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  }
  
  /**
   * Create database record for stored image
   */
  private static async createDatabaseRecord(
    projectId: string,
    request: ImageDownloadRequest,
    storage: { storagePath: string; storageUrl: string; fileSize: number }
  ): Promise<SceneImageRecord> {
    console.log(`💾 Creating database record for ${request.sceneId}...`);
    
    // Mark any existing images for this scene as not current
    await supabase
      .from('project_assets')
      .update({ is_current: false })
      .eq('project_id', projectId)
      .eq('scene_id', request.sceneId)
      .eq('asset_type', 'scene_image')
      .eq('is_current', true);
    
    // Create new record using existing project_assets table
    const { data, error } = await supabase
      .from('project_assets')
      .insert({
        project_id: projectId,
        scene_id: request.sceneId,
        asset_type: 'scene_image',
        asset_url: storage.storageUrl,
        asset_filename: storage.storagePath.split('/').pop(),
        generation_prompt: request.generationPrompt,
        generation_model: 'fal_ai_flux',
        generation_parameters: {
          ...request.falMetadata,
          original_fal_url: request.falUrl,
          file_size: storage.fileSize,
          content_type: 'image/jpeg',
          storage_path: storage.storagePath
        },
        version_number: 1, // Schema v3 field name
        is_current: true
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Database record creation failed: ${error.message}`);
    }
    
    console.log(`✅ Created database record for ${request.sceneId}`);
    return data as SceneImageRecord;
  }
  
  /**
   * Ensure storage bucket exists
   */
  private static async ensureBucketExists(): Promise<void> {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    const bucketExists = buckets?.some(bucket => bucket.name === this.STORAGE_BUCKET);
    
    if (!bucketExists) {
      console.log(`🪣 Creating storage bucket: ${this.STORAGE_BUCKET}`);
      
      const { error } = await supabase.storage.createBucket(this.STORAGE_BUCKET, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: this.MAX_FILE_SIZE
      });
      
      if (error) {
        throw new Error(`Failed to create storage bucket: ${error.message}`);
      }
    }
  }
  
  /**
   * Get current image URL for a scene
   */
  static async getCurrentImageUrl(projectId: string, sceneId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('project_assets')
      .select('asset_url')
      .eq('project_id', projectId)
      .eq('scene_id', sceneId)
      .eq('asset_type', 'scene_image')
      .eq('is_current', true)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.asset_url;
  }
  
  /**
   * Bulk download and store multiple images
   */
  static async downloadAndStoreBulk(
    projectId: string,
    requests: ImageDownloadRequest[]
  ): Promise<ImageStorageResult[]> {
    console.log(`📥 Bulk downloading and storing ${requests.length} images...`);
    
    const results: ImageStorageResult[] = [];
    
    // Process sequentially to avoid overwhelming the storage system
    for (const request of requests) {
      const result = await this.downloadAndStore(projectId, request);
      results.push(result);
      
      // Small delay between uploads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Bulk storage complete: ${successCount}/${requests.length} successful`);
    
    return results;
  }
  
  /**
   * Clean up old versions (for future use)
   */
  static async cleanupOldVersions(projectId: string, sceneId: string, keepVersions = 3): Promise<void> {
    // Implementation for future versioning system
    console.log(`🧹 Cleanup for ${sceneId} - keeping ${keepVersions} versions (future feature)`);
  }
}