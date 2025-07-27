/**
 * Image Generation Service - Config-Driven Flexible Interface
 * 
 * Reads configuration to determine which image generation service to use
 * Currently supports FAL.ai FLUX (ported from n8n), extensible for future services
 */

import { getAppConfiguration } from '../lib/database';
import { ImageStorageService } from './ImageStorageService';

export interface SceneImageRequest {
  sceneId: string;
  prompt: string;
  projectId: string;  // Required for storage system
  sceneIndex?: number; // For progress tracking
}

export interface ImageGenerationResult {
  success: boolean;
  sceneId: string;
  imageUrl?: string;
  contentType?: string;
  width?: number;
  height?: number;
  seed?: number;
  error?: string;
  provider?: string;
  requestId?: string;
  timings?: any;
}

export interface BulkImageResult {
  success: boolean;
  totalScenes: number;
  successfulScenes: number;
  results: ImageGenerationResult[];
  errors: string[];
  provider: string;
}

export interface ImageGenerationProgress {
  completed: number;
  total: number;
  currentScene: string;
  currentSceneIndex: number;
  percentage: number;
  provider: string;
  completedImages: Array<{sceneId: string; imageUrl: string; sceneIndex: number}>;  // All completed images
  latestImageUrl?: string;  // Current displayed image URL
}

export class ImageGenerationService {
  private config: any = null;
  private serviceType: string | null = null;
  private serviceConfig: any = null;

  /**
   * Initialize service by loading and analyzing configuration
   */
  async initialize(): Promise<void> {
    try {
      this.config = await getAppConfiguration();
      
      if (!this.config?.image_generation) {
        throw new Error('Image generation configuration not found');
      }

      // Determine which service is configured
      const imageGenConfig = this.config.image_generation;
      
      if (imageGenConfig.fal_ai_flux) {
        this.serviceType = 'fal_ai_flux';
        this.serviceConfig = imageGenConfig.fal_ai_flux;
        console.log('✅ ImageGenerationService: Detected FAL.ai FLUX configuration');
      } else {
        throw new Error('No supported image generation service found in configuration');
      }

      console.log('🎨 ImageGenerationService initialized:', {
        serviceType: this.serviceType,
        endpoint: this.serviceConfig.endpoint,
        hasParameters: !!this.serviceConfig.parameters
      });
      
    } catch (error) {
      console.error('ImageGenerationService initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate image for a single scene
   */
  async generateSceneImage(request: SceneImageRequest): Promise<ImageGenerationResult> {
    try {
      // Ensure service is initialized
      if (!this.serviceType || !this.serviceConfig) {
        await this.initialize();
      }

      console.log(`🎨 Generating image for ${request.sceneId} using ${this.serviceType}...`);

      // Route to appropriate service implementation
      switch (this.serviceType) {
        case 'fal_ai_flux':
          return await this.generateWithFalAi(request);
        default:
          throw new Error(`Unsupported service type: ${this.serviceType}`);
      }
      
    } catch (error: any) {
      console.error(`❌ Failed to generate image for ${request.sceneId}:`, error);
      
      return {
        success: false,
        sceneId: request.sceneId,
        error: error.message || 'Unknown error occurred',
        provider: this.serviceType || 'unknown'
      };
    }
  }

  /**
   * Generate images for multiple scenes with progress tracking
   */
  async generateAllSceneImages(
    requests: SceneImageRequest[],
    options: {
      onProgress?: (progress: ImageGenerationProgress) => void;
    } = {}
  ): Promise<BulkImageResult> {
    const results: ImageGenerationResult[] = [];
    const errors: string[] = [];
    const completedImages: Array<{sceneId: string; imageUrl: string; sceneIndex: number}> = [];
    let latestImageUrl: string | undefined = undefined;
    
    console.log(`🚀 Starting bulk image generation for ${requests.length} scenes using ${this.serviceType}...`);
    
    // Process each scene sequentially to avoid rate limiting
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      // Progress callback - starting scene (keep last image visible)
      const progress: ImageGenerationProgress = {
        completed: i,
        total: requests.length,
        currentScene: request.sceneId,
        currentSceneIndex: i + 1,
        percentage: Math.round((i / requests.length) * 100),
        provider: this.serviceType || 'unknown',
        completedImages: [...completedImages],
        latestImageUrl: latestImageUrl  // Keep showing last image until new one arrives
      };
      options.onProgress?.(progress);
      
      try {
        const result = await this.generateSceneImage(request);
        results.push(result);
        
        if (!result.success && result.error) {
          errors.push(`${request.sceneId}: ${result.error}`);
        }
        
        // Update progress with completed scene image - ONLY if image was successful
        if (result.success && result.imageUrl) {
          completedImages.push({
            sceneId: request.sceneId,
            imageUrl: result.imageUrl,
            sceneIndex: i + 1
          });
          latestImageUrl = result.imageUrl;  // Update displayed image
        }
        
        const completedProgress: ImageGenerationProgress = {
          completed: i + 1,
          total: requests.length,
          currentScene: request.sceneId,
          currentSceneIndex: i + 1,
          percentage: Math.round(((i + 1) / requests.length) * 100),
          provider: this.serviceType || 'unknown',
          completedImages: [...completedImages],
          latestImageUrl: latestImageUrl  // Only changes when new image actually arrives
        };
        options.onProgress?.(completedProgress);
        
      } catch (error: any) {
        const errorResult: ImageGenerationResult = {
          success: false,
          sceneId: request.sceneId,
          error: error.message,
          provider: this.serviceType || 'unknown'
        };
        results.push(errorResult);
        errors.push(`${request.sceneId}: ${error.message}`);
      }
      
      // Small delay to avoid rate limiting
      if (i < requests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second between calls
      }
    }
    
    // Final progress update
    const finalProgress: ImageGenerationProgress = {
      completed: requests.length,
      total: requests.length,
      currentScene: 'complete',
      currentSceneIndex: requests.length,
      percentage: 100,
      provider: this.serviceType || 'unknown',
      completedImages: [...completedImages],
      latestImageUrl: latestImageUrl  // Keep last successful image
    };
    options.onProgress?.(finalProgress);
    
    const successfulScenes = results.filter(r => r.success).length;
    
    console.log(`✅ Bulk image generation complete:`, {
      totalScenes: requests.length,
      successfulScenes,
      failedScenes: requests.length - successfulScenes,
      errors: errors.length,
      provider: this.serviceType
    });
    
    
    return {
      success: successfulScenes === requests.length,
      totalScenes: requests.length,
      successfulScenes,
      results,
      errors,
      provider: this.serviceType || 'unknown'
    };
  }

  /**
   * FAL.ai FLUX implementation (ported from n8n)
   */
  private async generateWithFalAi(request: SceneImageRequest): Promise<ImageGenerationResult> {
    try {
      // Dynamic import to avoid bundling issues
      const { fal } = await import('@fal-ai/client');
      
      // Configure FAL.ai client with API key
      fal.config({
        credentials: import.meta.env.VITE_FAL_API_KEY
      });
      
      // Build request payload from config
      const payload = {
        input: {
          prompt: request.prompt,
          image_size: this.serviceConfig.parameters?.image_size || { width: 1024, height: 768 },
          num_inference_steps: this.serviceConfig.parameters?.num_inference_steps || 28,
          guidance_scale: this.serviceConfig.parameters?.guidance_scale || 3.5,
          num_images: 1,
          enable_safety_checker: true,
          output_format: "jpeg",
          acceleration: "none"
        },
        logs: true
      };
      
      console.log('🔥 FAL.ai call:', {
        endpoint: this.serviceConfig.endpoint,
        promptLength: request.prompt.length,
        imageSize: payload.input.image_size,
        sceneId: request.sceneId
      });
      
      // Call FAL.ai API
      const result = await fal.subscribe(this.serviceConfig.endpoint, payload);
      
      if (!result.data || !result.data.images || result.data.images.length === 0) {
        throw new Error('No images generated by FAL.ai');
      }
      
      const image = result.data.images[0];
      
      const logPrefix = `🖼️ [${request.sceneId}]`;
      
      console.log(`${logPrefix} ✅ FAL.ai GENERATION COMPLETE:`, {
        url: image.url,
        contentType: image.content_type,
        width: image.width,
        height: image.height,
        seed: result.data.seed,
        requestId: result.requestId,
        timings: result.data.timings
      });
      
      // Download and store image in our system
      console.log(`${logPrefix} 🔄 TRANSITIONING: FAL.ai → Our Database Storage...`);
      console.log(`${logPrefix} 🎯 NEXT PHASE: Download, Store, and Create Permanent URL...`);
      
      const storageStart = Date.now();
      const storageResult = await ImageStorageService.downloadAndStore(request.projectId, {
        sceneId: request.sceneId,
        falUrl: image.url,
        generationPrompt: request.prompt,
        falMetadata: {
          width: image.width,
          height: image.height,
          seed: result.data.seed,
          requestId: result.requestId,
          timings: result.data.timings,
          contentType: image.content_type
        }
      });
      const storageTime = Date.now() - storageStart;
      
      if (!storageResult.success) {
        console.error(`${logPrefix} 💥 STORAGE FAILED: Falling back to FAL.ai URL`);
        console.error(`${logPrefix} 🔍 Storage error: ${storageResult.error}`);
        console.error(`${logPrefix} ⚠️ FALLBACK ACTIVATED: Using temporary FAL.ai URL`);
        
        // Return FAL.ai URL as fallback, but log the storage failure
        return {
          success: true,
          sceneId: request.sceneId,
          imageUrl: image.url, // Fallback to FAL.ai URL
          contentType: image.content_type,
          width: image.width,
          height: image.height,
          seed: result.data.seed,
          provider: 'fal_ai_flux',
          requestId: result.requestId,
          timings: result.data.timings,
          storageError: storageResult.error
        };
      }
      
      console.log(`${logPrefix} 🎉 STORAGE SUCCESS: Complete pipeline finished in ${storageTime}ms`);
      console.log(`${logPrefix} 🏆 FINAL RESULT: Permanent database URL ready`);
      console.log(`${logPrefix} 📋 SUMMARY:`);
      console.log(`${logPrefix}   • FAL.ai generation: SUCCESS`);
      console.log(`${logPrefix}   • Download from FAL.ai: SUCCESS`);
      console.log(`${logPrefix}   • Upload to our storage: SUCCESS`);
      console.log(`${logPrefix}   • Database record: SUCCESS`);
      console.log(`${logPrefix}   • Final URL: ${storageResult.ourImageUrl}`);
      
      return {
        success: true,
        sceneId: request.sceneId,
        imageUrl: storageResult.ourImageUrl!, // Our permanent URL
        contentType: image.content_type,
        width: image.width,
        height: image.height,
        seed: result.data.seed,
        provider: 'fal_ai_flux',
        requestId: result.requestId,
        timings: result.data.timings,
        originalFalUrl: image.url, // Keep reference for debugging
        storageRecord: storageResult.storageRecord
      };
      
    } catch (error: any) {
      console.error(`💥 FAL.ai error for ${request.sceneId}:`, error);
      
      return {
        success: false,
        sceneId: request.sceneId,
        error: `FAL.ai Error: ${error.message}`,
        provider: 'fal_ai_flux'
      };
    }
  }

  /**
   * Get available image generation providers
   */
  getAvailableProviders(): string[] {
    if (!this.config?.image_generation) return [];
    
    const providers: string[] = [];
    if (this.config.image_generation.fal_ai_flux) providers.push('fal_ai_flux');
    // Future: if (this.config.image_generation.midjourney) providers.push('midjourney');
    
    return providers;
  }

  /**
   * Get current service type
   */
  getCurrentService(): string | null {
    return this.serviceType;
  }

  /**
   * Test service connectivity
   */
  async testService(): Promise<boolean> {
    try {
      if (!this.serviceType) {
        await this.initialize();
      }
      
      // Simple test with minimal prompt
      const testRequest: SceneImageRequest = {
        sceneId: 'test',
        prompt: 'A simple test image'
      };
      
      const result = await this.generateSceneImage(testRequest);
      return result.success;
      
    } catch (error) {
      console.error('Service test failed:', error);
      return false;
    }
  }
}

// Singleton instance for app-wide use
export const imageGenerationService = new ImageGenerationService();