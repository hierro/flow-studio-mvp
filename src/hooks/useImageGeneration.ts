/**
 * React Hook for Image Generation
 * 
 * Provides state management and UI integration for scene image generation
 * Works with the flexible ImageGenerationService
 */

import { useState, useCallback } from 'react';
import { 
  imageGenerationService, 
  ImageGenerationService,
  SceneImageRequest,
  ImageGenerationResult,
  BulkImageResult,
  ImageGenerationProgress
} from '../services/ImageGenerationService';

export interface ImageGenerationState {
  // Loading states
  isGenerating: boolean;
  isInitializing: boolean;
  
  // Progress tracking
  progress: ImageGenerationProgress | null;
  
  // Results and errors
  lastResult: ImageGenerationResult | BulkImageResult | null;
  error: string | null;
  
  // Service info
  currentService: string | null;
  availableServices: string[];
}

export function useImageGeneration() {
  const [state, setState] = useState<ImageGenerationState>({
    isGenerating: false,
    isInitializing: false,
    progress: null,
    lastResult: null,
    error: null,
    currentService: null,
    availableServices: []
  });
  
  // Initialize image generation service
  const initializeService = useCallback(async () => {
    setState(prev => ({ ...prev, isInitializing: true, error: null }));
    
    try {
      await imageGenerationService.initialize();
      const currentService = imageGenerationService.getCurrentService();
      const availableServices = imageGenerationService.getAvailableProviders();
      
      setState(prev => ({ 
        ...prev, 
        isInitializing: false,
        currentService,
        availableServices
      }));
      
      return true;
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        isInitializing: false,
        error: `Service initialization failed: ${error.message}`
      }));
      return false;
    }
  }, []);
  
  // Generate image for single scene
  const generateSceneImage = useCallback(async (
    sceneId: string,
    prompt: string
  ): Promise<ImageGenerationResult> => {
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null,
      progress: {
        completed: 0,
        total: 1,
        currentScene: sceneId,
        currentSceneIndex: 1,
        percentage: 0,
        provider: prev.currentService || 'unknown'
      }
    }));
    
    try {
      // Initialize if needed
      if (!state.currentService) {
        await initializeService();
      }
      
      // Generate image
      const request: SceneImageRequest = { sceneId, prompt };
      const result = await imageGenerationService.generateSceneImage(request);
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        lastResult: result,
        progress: {
          completed: 1,
          total: 1,
          currentScene: sceneId,
          currentSceneIndex: 1,
          percentage: 100,
          provider: result.provider || 'unknown'
        }
      }));
      
      return result;
      
    } catch (error: any) {
      const errorResult: ImageGenerationResult = {
        success: false,
        sceneId,
        error: error.message,
        provider: state.currentService || 'unknown'
      };
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        lastResult: errorResult,
        error: error.message
      }));
      
      return errorResult;
    }
  }, [state.currentService, initializeService]);
  
  // Generate images for multiple scenes
  const generateAllSceneImages = useCallback(async (
    scenePrompts: { sceneId: string; prompt: string }[]
  ): Promise<BulkImageResult> => {
    setState(prev => ({ 
      ...prev, 
      isGenerating: true, 
      error: null,
      progress: {
        completed: 0,
        total: scenePrompts.length,
        currentScene: 'initializing',
        currentSceneIndex: 0,
        percentage: 0,
        provider: prev.currentService || 'unknown'
      }
    }));
    
    try {
      // Initialize if needed
      if (!state.currentService) {
        await initializeService();
      }
      
      // Prepare requests
      const requests: SceneImageRequest[] = scenePrompts.map((sp, index) => ({
        sceneId: sp.sceneId,
        prompt: sp.prompt,
        projectId: sp.projectId, // Pass through projectId for storage
        sceneIndex: index
      }));
      
      // Generate all images with progress tracking
      const result = await imageGenerationService.generateAllSceneImages(requests, {
        onProgress: (progress) => {
          setState(prev => ({ 
            ...prev,
            progress
          }));
        }
      });
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        lastResult: result,
        error: result.errors.length > 0 ? `${result.errors.length} scenes failed` : null
      }));
      
      return result;
      
    } catch (error: any) {
      const errorResult: BulkImageResult = {
        success: false,
        totalScenes: scenePrompts.length,
        successfulScenes: 0,
        results: [],
        errors: [error.message],
        provider: state.currentService || 'unknown'
      };
      
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        lastResult: errorResult,
        error: error.message
      }));
      
      return errorResult;
    }
  }, [state.currentService, initializeService]);
  
  // Test service connectivity
  const testService = useCallback(async (): Promise<boolean> => {
    try {
      return await imageGenerationService.testService();
    } catch (error) {
      console.error('Service test failed:', error);
      return false;
    }
  }, []);
  
  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  // Clear last result
  const clearResult = useCallback(() => {
    setState(prev => ({ ...prev, lastResult: null }));
  }, []);
  
  // Computed values
  const isReady = !state.isInitializing && !state.error && !!state.currentService;
  const hasResults = state.lastResult !== null;
  
  return {
    // State
    ...state,
    isReady,
    hasResults,
    
    // Actions
    initializeService,
    generateSceneImage,
    generateAllSceneImages,
    testService,
    clearError,
    clearResult
  };
}