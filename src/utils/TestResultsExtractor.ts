/**
 * Test Results Extractor - Clean Non-Intrusive Approach
 * 
 * PURPOSE: Extract test data from existing masterJSON after generation completes
 * DESIGN: Zero changes to existing services, just reads final results
 * APPROACH: Post-processing extraction, no service modifications needed
 */

import TestResultsCapture, { PromptCaptureData, ImageCaptureData } from '../services/TestResultsCapture';

export class TestResultsExtractor {
  /**
   * Extract and save prompt generation results from masterJSON
   * Call this AFTER LLM generation completes
   */
  static async extractPromptResults(
    projectId: string,
    masterJSON: any
  ): Promise<{ success: boolean; promptCount: number; filePath?: string }> {
    try {
      const projectName = masterJSON?.project_metadata?.title || 'Unknown Project';
      const scenes = masterJSON?.scenes || {};
      
      // Extract all scenes that have generated prompts
      const promptData: PromptCaptureData[] = [];
      
      Object.entries(scenes).forEach(([sceneId, sceneData]: [string, any]) => {
        if (sceneData?.scene_frame_prompt) {
          promptData.push({
            scene_id: sceneId,
            scene_title: sceneData?.natural_description?.substring(0, 50) || 
                        sceneData?.description?.substring(0, 50) || 
                        `Scene ${sceneId.replace('scene_', '')}`,
            prompt: sceneData.scene_frame_prompt,
            model_used: sceneData?.prompt_metadata?.provider || 'unknown',
            parameters: {
              temperature: sceneData?.prompt_metadata?.usage?.temperature,
              max_tokens: sceneData?.prompt_metadata?.usage?.max_tokens,
              model: sceneData?.prompt_metadata?.provider
            },
            generation_time: sceneData?.prompt_metadata?.generated_at || new Date().toISOString()
          });
        }
      });
      
      if (promptData.length === 0) {
        console.log('⚠️ No prompt results found in masterJSON');
        return { success: false, promptCount: 0 };
      }
      
      console.log(`🧪 Extracting ${promptData.length} prompts from masterJSON...`);
      const result = await TestResultsCapture.capturePromptGeneration(
        projectId,
        projectName,
        promptData
      );
      
      return {
        success: result.success,
        promptCount: promptData.length,
        filePath: result.filePath
      };
      
    } catch (error) {
      console.error('❌ Prompt extraction failed:', error);
      return { success: false, promptCount: 0 };
    }
  }
  
  /**
   * Extract and save image generation results from masterJSON
   * Call this AFTER image generation completes
   */
  static async extractImageResults(
    projectId: string,
    masterJSON: any
  ): Promise<{ success: boolean; imageCount: number; filePath?: string; savedImages?: string[] }> {
    try {
      const projectName = masterJSON?.project_metadata?.title || 'Unknown Project';
      const scenes = masterJSON?.scenes || {};
      
      // Extract all scenes that have generated images
      const imageData: ImageCaptureData[] = [];
      
      Object.entries(scenes).forEach(([sceneId, sceneData]: [string, any]) => {
        if (sceneData?.scene_start_frame) {
          imageData.push({
            scene_id: sceneId,
            scene_title: sceneData?.natural_description?.substring(0, 50) || 
                        sceneData?.description?.substring(0, 50) || 
                        `Scene ${sceneId.replace('scene_', '')}`,
            prompt: sceneData?.scene_frame_prompt || 'No prompt available',
            image_filename: `${sceneId}_image.jpg`,
            image_local_path: `docs/test/${sceneId}_image.jpg`,
            original_fal_url: sceneData?.scene_start_frame, // Our permanent URL
            database_url: sceneData?.scene_start_frame, // Our permanent URL
            generation_metadata: {
              width: sceneData?.frame_metadata?.width,
              height: sceneData?.frame_metadata?.height,
              seed: sceneData?.frame_metadata?.seed,
              model: sceneData?.frame_metadata?.provider || 'fal_ai_flux',
              content_type: sceneData?.frame_metadata?.content_type || 'image/jpeg'
            },
            generation_time: sceneData?.frame_metadata?.generated_at || new Date().toISOString()
          });
        }
      });
      
      if (imageData.length === 0) {
        console.log('⚠️ No image results found in masterJSON');
        return { success: false, imageCount: 0 };
      }
      
      console.log(`🧪 Extracting ${imageData.length} images from masterJSON...`);
      const result = await TestResultsCapture.captureImageGeneration(
        projectId,
        projectName,
        imageData
      );
      
      return {
        success: result.success,
        imageCount: imageData.length,
        filePath: result.filePath,
        savedImages: result.savedImages
      };
      
    } catch (error) {
      console.error('❌ Image extraction failed:', error);
      return { success: false, imageCount: 0 };
    }
  }
  
  /**
   * Extract complete test results (prompts + images) from masterJSON
   * Call this AFTER any generation workflow completes
   */
  static async extractAllResults(
    projectId: string,
    masterJSON: any
  ): Promise<{
    success: boolean;
    prompts: { count: number; filePath?: string };
    images: { count: number; filePath?: string; savedImages?: string[] };
  }> {
    console.log('🧪 Starting complete test results extraction...');
    
    const promptResults = await this.extractPromptResults(projectId, masterJSON);
    const imageResults = await this.extractImageResults(projectId, masterJSON);
    
    const success = promptResults.success || imageResults.success;
    
    console.log('✅ Test extraction complete:', {
      prompts: promptResults.promptCount,
      images: imageResults.imageCount,
      success
    });
    
    return {
      success,
      prompts: {
        count: promptResults.promptCount,
        filePath: promptResults.filePath
      },
      images: {
        count: imageResults.imageCount,
        filePath: imageResults.filePath,
        savedImages: imageResults.savedImages
      }
    };
  }
}

export default TestResultsExtractor;