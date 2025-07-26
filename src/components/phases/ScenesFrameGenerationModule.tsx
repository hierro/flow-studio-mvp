/**
 * Scenes Frame Generation Module - Phase 3
 * 
 * Handles LLM prompt generation for scene frames with comprehensive logging
 * Matches ScriptInterpretationModule UI layout exactly
 */

import { useState, useEffect } from 'react';
import type { ProjectPhase } from '../../types/project';
import { useLLMGeneration } from '../../hooks/useLLMGeneration';
import { useImageGeneration } from '../../hooks/useImageGeneration';
import { getGlobalModal } from '../../hooks/useAppModal';

interface ScenesFrameGenerationModuleProps {
  phase: ProjectPhase;
  projectId: string;
  projectName: string;
  masterJSON: any;
  onContentUpdate: (updatedJSON: any) => void;
  hasUnsavedChanges: boolean;
  onJsonChange: (value: string) => void;
}

export default function ScenesFrameGenerationModule({
  phase,
  projectId,
  projectName,
  masterJSON,
  onContentUpdate,
  hasUnsavedChanges,
  onJsonChange
}: ScenesFrameGenerationModuleProps) {
  const {
    generateAllPrompts,
    isGenerating: isGeneratingPrompts,
    isReady: isLLMReady,
    progress: llmProgress,
    error: llmError,
    currentProvider,
    setProvider,
    initializeService: initializeLLMService
  } = useLLMGeneration();

  const {
    generateAllSceneImages,
    isGenerating: isGeneratingImages,
    isReady: isImageServiceReady,
    progress: imageProgress,
    error: imageError,
    currentService,
    initializeService: initializeImageService
  } = useImageGeneration();

  // Initialize both services on mount
  useEffect(() => {
    console.log('🚀 ScenesFrameGenerationModule: Initializing services...');
    
    // Initialize LLM service
    initializeLLMService().then((success) => {
      console.log(`✅ LLM service initialization: ${success ? 'SUCCESS' : 'FAILED'}`);
    });
    
    // Initialize Image service
    initializeImageService().then((success) => {
      console.log(`✅ Image service initialization: ${success ? 'SUCCESS' : 'FAILED'}`);
    });
  }, []);

  // Get scenes from master JSON
  const scenes = masterJSON?.scenes ? Object.keys(masterJSON.scenes) : [];
  const totalScenes = scenes.length;
  const scenesWithPrompts = scenes.filter(sceneId => 
    masterJSON.scenes[sceneId]?.scene_frame_prompt
  ).length;
  const scenesWithImages = scenes.filter(sceneId => 
    masterJSON.scenes[sceneId]?.scene_start_frame
  ).length;

  console.log('📊 Scenes Frame Generation State:', {
    totalScenes,
    scenesWithPrompts,
    scenesWithImages,
    hasUnsavedChanges,
    isGeneratingPrompts,
    isGeneratingImages,
    isLLMReady,
    isImageServiceReady,
    currentProvider,
    currentService
  });

  // Handle bulk prompt generation
  const handleGenerateAllPrompts = async () => {
    console.log('🚀 Starting bulk prompt generation for all scenes...');
    console.log('📊 Bulk generation context:', {
      totalScenes,
      scenes: scenes,
      masterJSONKeys: Object.keys(masterJSON || {}),
      provider: currentProvider
    });

    // Show loading modal with specific call details
    const modal = getGlobalModal();
    if (modal) {
      const sceneList = scenes.length <= 5 
        ? scenes.join(', ') 
        : `${scenes.slice(0, 3).join(', ')} ... +${scenes.length - 3} more`;
      
      modal.showModal({
        title: '🤖 Generating Scene Prompts',
        message: `Single batch call processing ${scenes.length} scenes with ${currentProvider.toUpperCase()}`,
        details: [
          `Processing scenes: ${sceneList}`,
          `LLM Provider: ${currentProvider.toUpperCase()}`,
          `Call type: Single batch request`,
          `Expected output: ${scenes.length} image generation prompts`,
          'Variable injection & cross-scene consistency optimization'
        ],
        type: 'loading'
      });
    }

    try {
      const result = await generateAllPrompts(masterJSON, {
        provider: currentProvider,
        saveToDatabase: false, // We'll handle saving through existing workflow
        sceneIds: scenes // Explicitly pass all scene IDs for clarity
      });

      console.log('📋 Bulk generation complete:', {
        success: result.success,
        totalScenes: result.totalScenes,
        successfulScenes: result.successfulScenes,
        failedScenes: result.totalScenes - result.successfulScenes,
        errors: result.errors
      });

      if (result.successfulScenes > 0) {
        // Update master JSON with all successful prompts
        const updatedJSON = { ...masterJSON };
        
        result.results.forEach(sceneResult => {
          if (sceneResult.success && sceneResult.generatedPrompt) {
            const sceneKey = sceneResult.sceneId.startsWith('scene_') 
              ? sceneResult.sceneId 
              : `scene_${sceneResult.sceneId}`;
            
            if (!updatedJSON.scenes[sceneKey]) {
              updatedJSON.scenes[sceneKey] = {};
            }
            
            updatedJSON.scenes[sceneKey].scene_frame_prompt = sceneResult.generatedPrompt;
            updatedJSON.scenes[sceneKey].prompt_metadata = {
              generated_at: new Date().toISOString(),
              provider: sceneResult.provider,
              character_count: sceneResult.characterCount,
              usage: sceneResult.usage
            };

            console.log(`✅ Updated scene ${sceneKey} with generated prompt (${sceneResult.generatedPrompt?.length} chars)`);
          }
        });

        console.log('🎉 Master JSON updated with all successful prompts');

        // Trigger content update and mark as changed
        onContentUpdate(updatedJSON);
        onJsonChange(JSON.stringify(updatedJSON, null, 2));

        // Show success modal
        if (modal) {
          modal.showModal({
            title: '✅ Prompts Generated Successfully',
            message: `Generated ${result.successfulScenes} prompts for ${totalScenes} scenes`,
            type: 'success'
          });
          
          // Auto-hide success modal after 3 seconds
          setTimeout(() => {
            modal.hideModal();
          }, 3000);
        }
      } else {
        // Show error if no prompts generated
        if (modal) {
          modal.showModal({
            title: '❌ Generation Failed',
            message: 'No prompts were generated successfully',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('💥 Exception during bulk generation:', error);
      
      // Show error modal
      const modal = getGlobalModal();
      if (modal) {
        modal.showModal({
          title: '❌ Generation Error',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          type: 'error'
        });
      }
    }
  };

  // Handle bulk frame generation
  const handleGenerateAllFrames = async () => {
    console.log('🎨 Starting bulk frame generation for all scenes...');
    
    // Check if we have prompts to work with
    const scenesWithPromptsData = scenes.filter(sceneId => 
      masterJSON.scenes[sceneId]?.scene_frame_prompt
    );
    
    if (scenesWithPromptsData.length === 0) {
      const modal = getGlobalModal();
      if (modal) {
        modal.showModal({
          title: '⚠️ No Prompts Available',
          message: 'Generate prompts first before creating frames',
          details: [
            'Click "Generate Prompts" to create image prompts',
            'Then use "Generate Frames" to create the actual images'
          ],
          type: 'error'
        });
      }
      return;
    }

    // TESTING MODE: Limit to first 3 scenes for development
    const TESTING_MODE = true;
    const maxScenes = TESTING_MODE ? 3 : scenesWithPromptsData.length;
    const processScenes = scenesWithPromptsData.slice(0, maxScenes);
    
    console.log(`🧪 Testing mode: Processing ${processScenes.length} of ${scenesWithPromptsData.length} scenes`);
    
    console.log('📊 Bulk frame generation context:', {
      totalScenes: scenesWithPromptsData.length,
      processScenes: processScenes.length,
      testingMode: TESTING_MODE,
      currentService,
      hasPrompts: true
    });

    // Enhanced modal with detailed process tracking
    const modal = getGlobalModal();
    let completedScenes = 0;
    
    // Scene details with process status tracking
    const sceneDetails = processScenes.map(sceneId => {
      const sceneData = masterJSON.scenes[sceneId];
      const sceneNumber = sceneId.replace('scene_', '');
      const title = sceneData?.title || sceneData?.action_summary || `Scene ${sceneNumber}`;
      return { 
        id: sceneId, 
        number: sceneNumber, 
        title: title.substring(0, 35),
        status: 'pending',
        step: 'queued',
        details: ''
      };
    });

    // Show detailed process modal
    if (modal) {
      const testingNote = TESTING_MODE ? ` (Testing: First ${maxScenes} scenes only)` : '';
      modal.showModal({
        title: '🎨 Generating Scene Frames with Database Storage',
        message: `Processing ${processScenes.length} scene images${testingNote}`,
        details: [
          `🔧 Service Pipeline: FAL.ai FLUX → Download → Supabase Storage → Database`,
          `📊 Progress: 0/${processScenes.length} completed`,
          `⏱️ Process: Each scene goes through 5 steps (Generate → Download → Upload → Database → Complete)`,
          '',
          '📋 Scene Processing List:',
          ...sceneDetails.map(scene => `⚪ Scene ${scene.number}: ${scene.title} - Queued`),
          '',
          '🔄 Process Steps for Each Scene:',
          '  1️⃣ Generate with FAL.ai FLUX API',
          '  2️⃣ Download image from FAL.ai servers', 
          '  3️⃣ Upload to our Supabase Storage',
          '  4️⃣ Create database record with metadata',
          '  5️⃣ Update masterJSON with permanent URL',
          '',
          '💾 Storage: Images stored permanently in our database',
          '🔗 URLs: Permanent URLs replace temporary FAL.ai links',
          '✅ Phase 3: Completes when all scenes have permanent stored images'
        ],
        type: 'loading'
      });
    }

    try {
      console.log(`🚀 STARTING BULK FRAME GENERATION PROCESS`);
      console.log(`📊 Session Context:`, {
        testingMode: TESTING_MODE,
        totalAvailableScenes: scenesWithPromptsData.length,
        processingScenes: processScenes.length,
        projectId: projectId,
        currentService: currentService
      });
      
      // Prepare scene prompts for image generation (limited to testing scenes)
      const scenePrompts = processScenes.map(sceneId => ({
        sceneId,
        prompt: masterJSON.scenes[sceneId].scene_frame_prompt,
        projectId: projectId // Required for our storage system
      }));
      
      console.log(`🎬 SCENE PROCESSING QUEUE:`, scenePrompts.map(s => ({
        sceneId: s.sceneId,
        promptLength: s.prompt?.length || 0,
        hasPrompt: !!s.prompt
      })));

      // Generate images with detailed real-time progress updates
      const result = await generateAllSceneImages(scenePrompts, {
        onProgress: (progress) => {
          completedScenes = progress.completed;
          if (modal) {
            // Update scene status with detailed process tracking
            const updatedDetails = sceneDetails.map((scene, index) => {
              if (index < completedScenes) {
                return `✅ Scene ${scene.number}: ${scene.title} - ✅ COMPLETE (Database Stored)`;
              } else if (index === completedScenes) {
                // Current scene - show detailed step
                const currentStep = progress.currentScene === scene.id ? 
                  '⏳ Generating → Download → Upload → Database → Complete' : 
                  '⏳ Processing...';
                return `🔄 Scene ${scene.number}: ${scene.title} - ${currentStep}`;
              } else {
                return `⚪ Scene ${scene.number}: ${scene.title} - Queued`;
              }
            });

            modal.showModal({
              title: '🎨 Frame Generation Progress',
              message: `${completedScenes}/${processScenes.length} scenes completed${testingNote}`,
              details: [
                '📋 Scene Status:',
                ...updatedDetails,
                '',
                `🔄 Current Step: ${progress.currentScene ? `Processing ${progress.currentScene}` : 'Starting...'}`,
                `📊 Overall: ${progress.percentage}% complete`
              ],
              type: 'loading'
            });
          }
        }
      });

      console.log(`🎊 BULK FRAME GENERATION PROCESS COMPLETE`);
      console.log(`📋 Final Results Summary:`, {
        success: result.success,
        totalScenes: result.totalScenes,
        successfulScenes: result.successfulScenes,
        failedScenes: result.totalScenes - result.successfulScenes,
        errors: result.errors,
        testingMode: TESTING_MODE,
        processingTime: 'Logged individually per scene'
      });
      
      // Log detailed per-scene results
      result.results.forEach((sceneResult, index) => {
        const logPrefix = `📊 [${sceneResult.sceneId}]`;
        if (sceneResult.success) {
          console.log(`${logPrefix} ✅ COMPLETE SUCCESS:`);
          console.log(`${logPrefix}   • FAL.ai generation: SUCCESS`);
          console.log(`${logPrefix}   • Database storage: SUCCESS`);
          console.log(`${logPrefix}   • Final URL: ${sceneResult.imageUrl}`);
          console.log(`${logPrefix}   • Original FAL.ai: ${sceneResult.originalFalUrl || 'N/A'}`);
        } else {
          console.log(`${logPrefix} ❌ FAILED:`);
          console.log(`${logPrefix}   • Error: ${sceneResult.error}`);
        }
      });

      if (result.successfulScenes > 0) {
        // Update master JSON with all successful images
        const updatedJSON = { ...masterJSON };
        
        result.results.forEach(imageResult => {
          if (imageResult.success && imageResult.imageUrl) {
            const sceneKey = imageResult.sceneId.startsWith('scene_') 
              ? imageResult.sceneId 
              : `scene_${imageResult.sceneId}`;
            
            if (!updatedJSON.scenes[sceneKey]) {
              updatedJSON.scenes[sceneKey] = {};
            }
            
            updatedJSON.scenes[sceneKey].scene_start_frame = imageResult.imageUrl;
            updatedJSON.scenes[sceneKey].frame_metadata = {
              generated_at: new Date().toISOString(),
              provider: imageResult.provider,
              width: imageResult.width,
              height: imageResult.height,
              content_type: imageResult.contentType,
              seed: imageResult.seed,
              request_id: imageResult.requestId
            };

            console.log(`✅ Updated scene ${sceneKey} with generated frame image`);
          }
        });

        console.log('🎉 Master JSON updated with all successful frame images');

        // Trigger content update and mark as changed
        onContentUpdate(updatedJSON);
        onJsonChange(JSON.stringify(updatedJSON, null, 2));

        // Check Phase 3 completion status
        const allScenesHavePrompts = scenes.every(sceneId => 
          masterJSON.scenes[sceneId]?.scene_frame_prompt
        );
        const allProcessedScenesHaveImages = processScenes.every(sceneId => 
          updatedJSON.scenes[sceneId]?.scene_start_frame
        );
        
        const phase3Complete = allScenesHavePrompts && allProcessedScenesHaveImages;
        const testingProgress = TESTING_MODE ? ` (${processScenes.length}/${scenesWithPromptsData.length} in testing mode)` : '';

        // Show detailed success modal with complete process summary
        if (modal) {
          const successfulScenes = result.results.filter(r => r.success);
          const failedScenes = result.results.filter(r => !r.success);
          
          modal.showModal({
            title: '✅ Generation Complete',
            message: `${result.successfulScenes}/${result.totalScenes} scenes processed successfully${testingProgress}`,
            details: [
              '✅ Completed Scenes:',
              ...successfulScenes.map(scene => 
                `  ✅ ${scene.sceneId}: Stored in database`
              ),
              ...(failedScenes.length > 0 ? [
                '',
                '❌ Failed Scenes:',
                ...failedScenes.map(scene => 
                  `  ❌ ${scene.sceneId}: ${scene.error}`
                )
              ] : []),
              '',
              `📊 Project: ${scenesWithImages + result.successfulScenes}/${totalScenes} scenes have images`,
              phase3Complete ? '🎉 Phase 3 Complete!' : '⏳ Generate remaining scenes to complete Phase 3'
            ],
            type: 'success'
          });
          
          // Auto-hide success modal after 7 seconds (more details to read)
          setTimeout(() => {
            modal.hideModal();
          }, 7000);
        }
      } else {
        // Show error if no frames generated
        if (modal) {
          modal.showModal({
            title: '❌ Frame Generation Failed',
            message: 'No frame images were generated successfully',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('💥 Exception during bulk frame generation:', error);
      
      // Show error modal
      const modal = getGlobalModal();
      if (modal) {
        modal.showModal({
          title: '❌ Frame Generation Error',
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          type: 'error'
        });
      }
    }
  };

  return (
    <div style={{ padding: '0.5rem' }}>
      {/* 2-Column Layout - EXACT match to ScriptInterpretationModule */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        
        {/* LEFT COLUMN - Information */}
        <div style={{ flex: 1 }}>
          {/* Phase Status Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#999', marginBottom: '0.375rem' }}>
            <span>
              Phase 3: <strong style={{ color: '#66ccff' }}>Scenes Frame Generation</strong>
            </span>
            <span>•</span>
            <span>
              Status: <strong className={phase.status === 'completed' ? 'script-status-completed' : 'script-status-progress'}>
                {phase.status === 'completed' ? 'Completed' : 'Available'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Prompts: <strong className="script-db-connected">
                {scenesWithPrompts}/{totalScenes}
              </strong>
            </span>
            <span>•</span>
            <span>
              Frames: <strong className="script-db-connected">
                {scenesWithImages}/{totalScenes}
              </strong>
            </span>
          </div>
          
          {/* Description */}
          <div style={{ marginBottom: '0.25rem' }}>
            <p style={{ color: '#cccccc', fontSize: '0.875rem', margin: 0 }}>
              Generate image prompts for scene frames using LLM analysis of script elements
            </p>
          </div>
          
          {/* Status Messages */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
            <span className={!isLLMReady ? 'text-error' : 'text-success'}>
              {!isLLMReady ? (
                <>❌ LLM Error</>
              ) : isLLMReady ? (
                <>✅ LLM Ready</>
              ) : (
                <>⏳ LLM Loading</>
              )}
            </span>
            
            <span className={!isImageServiceReady ? 'text-error' : 'text-success'}>
              {!isImageServiceReady ? (
                <>❌ Image Error</>
              ) : isImageServiceReady ? (
                <>✅ Image Ready</>
              ) : (
                <>⏳ Image Loading</>
              )}
            </span>
            
            {(llmError || imageError) && (
              <span className="text-error">❌ {llmError || imageError}</span>
            )}
            
            {hasUnsavedChanges && (
              <span className="text-warning">⚠️ Unsaved changes</span>
            )}
            
            <span className={currentProvider === 'openai' ? 'text-success' : 'text-accent'}>
              {currentProvider === 'openai' ? '🤖 OPENAI' : '🧠 CLAUDE'}
            </span>
            
            {currentService && (
              <span className="text-accent">
                🎨 {currentService.toUpperCase().replace('_', ' ')}
              </span>
            )}
            
            {(isGeneratingPrompts || isGeneratingImages) && (
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                {isGeneratingPrompts ? 'Generating prompts...' : 'Generating frames...'}
              </span>
            )}
          </div>
        </div>
        
        {/* RIGHT COLUMN - Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
          {/* Provider Toggle */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#cccccc' }}>
              <input
                type="checkbox"
                checked={currentProvider === 'claude'}
                onChange={(e) => setProvider(e.target.checked ? 'claude' : 'openai')}
                style={{ marginRight: '0.375rem' }}
                disabled={isGeneratingPrompts || isGeneratingImages}
              />
              Use Claude (vs OpenAI)
            </label>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              onClick={handleGenerateAllPrompts}
              disabled={!isLLMReady || isGeneratingPrompts || isGeneratingImages || totalScenes === 0}
              className={`btn text-xs px-md py-xs ${isGeneratingPrompts ? 'btn-secondary' : 'btn-primary'}`}
            >
              {isGeneratingPrompts ? '⏳ Generating...' : 'Generate Prompts'}
            </button>
            
            <button
              onClick={handleGenerateAllFrames}
              disabled={!isImageServiceReady || isGeneratingPrompts || isGeneratingImages || scenesWithPrompts === 0}
              className={`btn text-xs px-md py-xs ${isGeneratingImages ? 'btn-secondary' : 'btn-primary'}`}
              title="Testing mode: Generates first 3 scenes only"
            >
              {isGeneratingImages ? '⏳ Generating...' : '🧪 Generate Frames (Test: 3 scenes)'}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}