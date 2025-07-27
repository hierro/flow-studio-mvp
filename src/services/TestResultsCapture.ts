/**
 * Test Results Capture Service - Clean Modular Implementation
 * 
 * PURPOSE: Capture prompt + image generation results for web-brother collaboration
 * DESIGN: Works in all environments (dev/prod/browser/server)
 * APPROACH: Non-intrusive, always-enabled, graceful fallbacks
 */

export interface PromptCaptureData {
  scene_id: string;
  scene_title: string;
  prompt: string;
  model_used: string;
  parameters: {
    temperature?: number;
    max_tokens?: number;
    model?: string;
    [key: string]: any;
  };
  generation_time: string;
}

export interface ImageCaptureData {
  scene_id: string;
  scene_title: string;
  prompt: string;
  image_filename: string;
  image_local_path: string;
  original_fal_url?: string;
  database_url?: string;
  generation_metadata: {
    width?: number;
    height?: number;
    seed?: number;
    model?: string;
    content_type?: string;
    [key: string]: any;
  };
  generation_time: string;
}

export interface TestResultsStructure {
  generation_timestamp: string;
  project_id: string;
  project_name: string;
  project_metadata: {
    total_scenes: number;
    completed_scenes: number;
    generation_type: 'prompts' | 'images';
    environment: string;
  };
  scenes: {
    [scene_id: string]: PromptCaptureData | ImageCaptureData;
  };
}

class TestResultsCapture {
  private static isNodeEnv = typeof process !== 'undefined' && process.versions?.node;
  private static testDir = 'docs/test';
  
  /**
   * Always enabled - captures data when possible, fails gracefully when not
   */
  static isEnabled(): boolean {
    return true; // Always try to capture, fail gracefully
  }
  
  /**
   * Browser-compatible download mechanism
   */
  private static downloadJSON(filename: string, data: any): void {
    if (typeof window === 'undefined') return; // Not in browser
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`📥 Downloaded: ${filename}`);
  }
  
  /**
   * Get test directory path (works in all environments)
   */
  private static getTestDir(): string {
    if (this.isNodeEnv) {
      try {
        const path = require('path');
        return path.join(process.cwd(), this.testDir);
      } catch (error) {
        return this.testDir;
      }
    }
    return this.testDir;
  }
  
  /**
   * Get file paths
   */
  private static getFilePaths() {
    const testDir = this.getTestDir();
    return {
      promptsFile: this.isNodeEnv ? require('path').join(testDir, 'scene_frame_prompts.json') : `${testDir}/scene_frame_prompts.json`,
      imagesFile: this.isNodeEnv ? require('path').join(testDir, 'scene_frame_images.json') : `${testDir}/scene_frame_images.json`,
      testDir
    };
  }
  
  /**
   * Ensure test directory exists (Node.js only)
   */
  private static ensureTestDir(): boolean {
    if (!this.isNodeEnv) return false;
    
    try {
      const fs = require('fs');
      const testDir = this.getTestDir();
      
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
        console.log(`📁 Created test directory: ${testDir}`);
      }
      return true;
    } catch (error) {
      console.warn('⚠️ Could not create test directory:', error);
      return false;
    }
  }
  
  /**
   * CLEAN MODULAR CAPTURE: Prompt Generation Results
   */
  static async capturePromptGeneration(
    projectId: string,
    projectName: string,
    promptData: PromptCaptureData[]
  ): Promise<{ success: boolean; filePath?: string; data?: TestResultsStructure }> {
    try {
      const results: TestResultsStructure = {
        generation_timestamp: new Date().toISOString(),
        project_id: projectId,
        project_name: projectName,
        project_metadata: {
          total_scenes: promptData.length,
          completed_scenes: promptData.length,
          generation_type: 'prompts',
          environment: this.isNodeEnv ? 'node' : 'browser'
        },
        scenes: {}
      };
      
      // Organize by scene ID
      promptData.forEach(prompt => {
        results.scenes[prompt.scene_id] = prompt;
      });
      
      // Try to save to file system (Node.js only)
      const { promptsFile } = this.getFilePaths();
      let filePath: string | undefined;
      
      if (this.isNodeEnv && this.ensureTestDir()) {
        try {
          const fs = require('fs');
          fs.writeFileSync(promptsFile, JSON.stringify(results, null, 2));
          filePath = promptsFile;
          console.log(`✅ Test Results: Captured ${promptData.length} prompts to ${promptsFile}`);
        } catch (error) {
          console.warn('⚠️ File save failed, data captured in memory only:', error);
        }
      } else {
        console.log(`📝 Test Results: Captured ${promptData.length} prompts (browser mode - no file save)`);
      }
      
      return { success: true, filePath, data: results };
      
    } catch (error) {
      console.error('❌ Test capture failed:', error);
      return { success: false };
    }
  }
  
  /**
   * CLEAN MODULAR CAPTURE: Image Generation Results
   */
  static async captureImageGeneration(
    projectId: string,
    projectName: string,
    imageData: ImageCaptureData[]
  ): Promise<{ success: boolean; filePath?: string; data?: TestResultsStructure; savedImages?: string[] }> {
    try {
      const results: TestResultsStructure = {
        generation_timestamp: new Date().toISOString(),
        project_id: projectId,
        project_name: projectName,
        project_metadata: {
          total_scenes: imageData.length,
          completed_scenes: imageData.length,
          generation_type: 'images',
          environment: this.isNodeEnv ? 'node' : 'browser'
        },
        scenes: {}
      };
      
      // Organize by scene ID
      imageData.forEach(image => {
        results.scenes[image.scene_id] = image;
      });
      
      // Try to save to file system + download images (Node.js only)
      const { imagesFile } = this.getFilePaths();
      let filePath: string | undefined;
      const savedImages: string[] = [];
      
      if (this.isNodeEnv && this.ensureTestDir()) {
        try {
          const fs = require('fs');
          
          // Save JSON metadata
          fs.writeFileSync(imagesFile, JSON.stringify(results, null, 2));
          filePath = imagesFile;
          
          // Download actual images
          for (const image of imageData) {
            if (image.original_fal_url || image.database_url) {
              const savedFilename = await this.saveImageToTest(
                image.original_fal_url || image.database_url!,
                image.scene_id
              );
              if (savedFilename) {
                savedImages.push(savedFilename);
              }
            }
          }
          
          console.log(`✅ Test Results: Captured ${imageData.length} images + metadata to ${imagesFile}`);
          console.log(`🖼️ Downloaded ${savedImages.length} image files to disk`);
          
        } catch (error) {
          console.warn('⚠️ File save failed, data captured in memory only:', error);
        }
      } else {
        console.log(`🖼️ Test Results: Captured ${imageData.length} images (browser mode - no file save)`);
      }
      
      return { success: true, filePath, data: results, savedImages };
      
    } catch (error) {
      console.error('❌ Image capture failed:', error);
      return { success: false };
    }
  }
  
  /**
   * Download and save image to test folder
   */
  static async saveImageToTest(
    imageUrl: string,
    sceneId: string,
    format: string = 'jpg'
  ): Promise<string> {
    if (!this.isNodeEnv) return '';
    
    try {
      if (!this.ensureTestDir()) return '';
      
      const fs = require('fs');
      const path = require('path');
      
      const filename = `${sceneId}_image.${format}`;
      const localPath = path.join(this.getTestDir(), filename);
      
      // Download image
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const buffer = await response.arrayBuffer();
      fs.writeFileSync(localPath, Buffer.from(buffer));
      
      console.log(`📥 Downloaded: ${filename}`);
      return filename;
      
    } catch (error) {
      console.warn(`⚠️ Image download failed for ${sceneId}:`, error);
      return '';
    }
  }
  
  /**
   * Clear all test results
   */
  static clearTestResults(): { success: boolean; message: string } {
    if (!this.isNodeEnv) {
      return { success: false, message: 'Clear only available in Node.js environment' };
    }
    
    try {
      const fs = require('fs');
      const path = require('path');
      const { promptsFile, imagesFile, testDir } = this.getFilePaths();
      
      let filesRemoved = 0;
      
      // Remove JSON files
      if (fs.existsSync(promptsFile)) {
        fs.unlinkSync(promptsFile);
        filesRemoved++;
      }
      if (fs.existsSync(imagesFile)) {
        fs.unlinkSync(imagesFile);
        filesRemoved++;
      }
      
      // Remove image files
      if (fs.existsSync(testDir)) {
        const files = fs.readdirSync(testDir);
        files.forEach(file => {
          if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg')) {
            fs.unlinkSync(path.join(testDir, file));
            filesRemoved++;
          }
        });
      }
      
      const message = `Cleared ${filesRemoved} test files`;
      console.log(`🧹 ${message}`);
      return { success: true, message };
      
    } catch (error) {
      const message = `Clear failed: ${error}`;
      console.warn(`⚠️ ${message}`);
      return { success: false, message };
    }
  }
  
  /**
   * Get current test results summary
   */
  static getTestSummary(): { 
    prompts: boolean; 
    images: boolean; 
    imageCount: number;
    environment: string;
    testDir: string;
  } {
    const environment = this.isNodeEnv ? 'node' : 'browser';
    const testDir = this.getTestDir();
    
    if (!this.isNodeEnv) {
      return { 
        prompts: false, 
        images: false, 
        imageCount: 0, 
        environment,
        testDir
      };
    }
    
    try {
      const fs = require('fs');
      const { promptsFile, imagesFile } = this.getFilePaths();
      
      const promptsExist = fs.existsSync(promptsFile);
      const imagesExist = fs.existsSync(imagesFile);
      
      let imageCount = 0;
      if (fs.existsSync(testDir)) {
        const files = fs.readdirSync(testDir);
        imageCount = files.filter(f => 
          f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg')
        ).length;
      }
      
      return { prompts: promptsExist, images: imagesExist, imageCount, environment, testDir };
      
    } catch (error) {
      console.warn('⚠️ Summary check failed:', error);
      return { 
        prompts: false, 
        images: false, 
        imageCount: 0, 
        environment,
        testDir
      };
    }
  }
}

export default TestResultsCapture;