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
  } = useLLMGeneration(projectId);

  const {
    generateAllSceneImages,
    isGenerating: isGeneratingImages,
    isReady: isImageServiceReady,
    progress: imageProgress,
    error: imageError,
    currentService,
    initializeService: initializeImageService
  } = useImageGeneration(projectId);

  // Modal demo mode for design review
  const [showModalDemo, setShowModalDemo] = useState(false);
  
  // Modal state for real progress tracking
  const [modalState, setModalState] = useState<{
    isVisible: boolean;
    currentScene: number;
    totalScenes: number;
    sceneTitle: string;
    status: string;
    progress: number;
    currentImageUrl?: string;
  }>({
    isVisible: false,
    currentScene: 1,
    totalScenes: 3,
    sceneTitle: 'Introduction Of The Setting And Characters',
    status: 'Downloading from FAL.ai...',
    progress: 33,
    currentImageUrl: undefined
  });

  // Keyboard shortcut to show/hide modal demo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + M to toggle modal demo
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'M') {
        event.preventDefault();
        console.log('🎯 Keyboard shortcut triggered: Toggling Phase 3 modal demo');
        setShowModalDemo(prev => !prev);
      }
      // ESC to close modal demo
      else if (event.key === 'Escape' && showModalDemo) {
        event.preventDefault();
        console.log('🎯 ESC pressed: Closing Phase 3 modal demo');
        setShowModalDemo(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showModalDemo]);

  // Initialize both services when projectId is available
  useEffect(() => {
    if (!projectId) return;
    
    console.log('🚀 ScenesFrameGenerationModule: Initializing services...');
    
    // Initialize LLM service
    initializeLLMService().then((success) => {
      console.log(`✅ LLM service initialization: ${success ? 'SUCCESS' : 'FAILED'}`);
    });
    
    // Initialize Image service
    initializeImageService().then((success) => {
      console.log(`✅ Image service initialization: ${success ? 'SUCCESS' : 'FAILED'}`);
    });
  }, [projectId, initializeLLMService, initializeImageService]);

  // Get scenes from master JSON
  const scenes = masterJSON?.scenes ? Object.keys(masterJSON.scenes) : [];

  // Simple progress logging for debugging
  useEffect(() => {
    if (imageProgress) {
      console.log('🔄 Image Progress Update:', imageProgress);
    }
  }, [imageProgress]);

  // Handle completion - show custom success modal instead of auto-closing
  useEffect(() => {
    if (modalState.isVisible && !isGeneratingImages && imageProgress?.currentScene === 'complete') {
      // Show success state in modal but keep it open until user closes
      console.log('✅ Generation complete - showing success state in modal');
    }
  }, [modalState.isVisible, isGeneratingImages, imageProgress?.currentScene]);
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

    // Scene details for progress tracking
    const sceneDetails = processScenes.map(sceneId => {
      const sceneData = masterJSON.scenes[sceneId];
      const sceneNumber = sceneId.replace('scene_', '');
      const title = sceneData?.title || sceneData?.action_summary || `Scene ${sceneNumber}`;
      return { 
        id: sceneId, 
        number: parseInt(sceneNumber), 
        title: title.substring(0, 35),
        fullTitle: title
      };
    });

    // Show our new custom modal
    setModalState({
      isVisible: true,
      currentScene: 1,
      totalScenes: processScenes.length,
      sceneTitle: sceneDetails[0]?.fullTitle || 'Loading scene',
      status: 'Initializing...',
      progress: 0
    });

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

      // Generate images - the hook will handle progress updates
      const result = await generateAllSceneImages(scenePrompts);

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

        // Completion handled by new modal - no old modal popup
        console.log('✅ Image generation complete, modal will show success state');
        console.log(`📊 Final Results: ${result.successfulScenes}/${result.totalScenes} successful`);
        
        // Log completion for debugging
        const successfulScenes = result.results.filter(r => r.success);
        const failedScenes = result.results.filter(r => !r.success);
        console.log('✅ Successful scenes:', successfulScenes.map(s => s.sceneId));
        if (failedScenes.length > 0) {
          console.log('❌ Failed scenes:', failedScenes.map(s => `${s.sceneId}: ${s.error}`));
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
      {/* Main Heading - Top */}
      <div style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ 
          color: '#ffffff', 
          fontSize: '1.125rem', 
          fontWeight: 'bold',
          margin: 0
        }}>
          Generate scene frames prompts and images
        </h3>
      </div>
      
      {/* Phase Status Info */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        fontSize: '0.875rem', 
        color: '#999', 
        marginBottom: '0.75rem' 
      }}>
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
      
      {/* Status and Buttons Row */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '0.75rem'
      }}>
        
        {/* Service Status Section - Left */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          fontSize: '0.875rem'
        }}>
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
        
        {/* Action Buttons Section - Right */}
        <div style={{ 
          display: 'flex', 
          gap: '0.75rem',
          alignItems: 'center'
        }}>
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


      {/* Progress Modal - Demo or Real */}
      {(showModalDemo || modalState.isVisible) && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ 
            width: '80vw', 
            maxWidth: '1000px',
            aspectRatio: '16/9',  // Force modal to be 16:9
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Header - Clean */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #333',
              backgroundColor: imageProgress?.currentScene === 'complete' ? '#002200' : 'transparent'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: imageProgress?.currentScene === 'complete' ? '#00ff00' : '#66ccff', 
                fontSize: '1.125rem' 
              }}>
                {imageProgress?.currentScene === 'complete' ? '✅ Generation Complete!' : 'Generating Scene Frames'}
              </h2>
              {/* Only show close button when batch is finished or in demo mode */}
              {(showModalDemo || imageProgress?.currentScene === 'complete') && (
                <button
                  onClick={() => {
                    setShowModalDemo(false);
                    setModalState(prev => ({ ...prev, isVisible: false }));
                  }}
                  style={{
                    background: '#333',
                    border: '1px solid #666',
                    color: '#fff',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    minWidth: '80px'
                  }}
                >
                  Close
                </button>
              )}
            </div>

            {/* Modal Body - Equal Height Layout */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              gap: '0.75rem',
              padding: '0.75rem',
              overflow: 'hidden'  // Prevent scrolling
            }}>
              
              {/* LEFT SIDE - Progress + Current Scene (40%) */}
              <div style={{ 
                flex: '0 0 40%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                height: '100%'  // Match right side height
              }}>
                
                {/* Progress Summary - Top */}
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#0a1a2a',
                  borderRadius: '0.375rem',
                  border: '1px solid #0066cc'
                }}>
                  <div style={{ 
                    color: '#66ccff', 
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    marginBottom: '0.25rem'
                  }}>
                    Progress: {imageProgress?.completed || 0}/{imageProgress?.total || 3} completed
                  </div>
                  <div style={{ 
                    color: '#999', 
                    fontSize: '0.75rem' 
                  }}>
                    ⏱️ ~2 minutes per scene
                  </div>
                </div>

                {/* Current Scene Status - Bottom - SAME HEIGHT AS IMAGE */}
                <div style={{
                  flex: 1,  // Take remaining space to match right side
                  padding: '0.75rem',
                  backgroundColor: '#0a1a2a',
                  borderRadius: '0.375rem',
                  border: '1px solid #0066cc',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 0  // Allow flexbox to control height
                }}>
                  {/* Scene Header */}
                  <div>
                    <div style={{ 
                      color: '#66ccff', 
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      marginBottom: '0.5rem'
                    }}>
                      {imageProgress?.currentScene === 'complete' ? 'All Scenes Complete!' : `Processing: Scene ${imageProgress?.currentSceneIndex || 1}`}
                    </div>
                    
                    <div style={{ 
                      color: '#999', 
                      fontSize: '0.75rem',
                      lineHeight: 1.4
                    }}>
                      {imageProgress?.currentScene === 'complete' 
                        ? `Successfully generated ${imageProgress?.completedImages?.length || 0} images`
                        : `${imageProgress?.currentScene || 'Loading scene'}...`
                      }
                    </div>
                  </div>
                  
                  {/* Status Badge - Bottom */}
                  <div style={{ 
                    color: imageProgress?.currentScene === 'complete' ? '#00ff00' : '#ff9900',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    padding: '0.5rem',
                    backgroundColor: imageProgress?.currentScene === 'complete' ? '#002200' : '#332200',
                    borderRadius: '0.25rem',
                    textAlign: 'center'
                  }}>
                    {imageProgress?.currentScene === 'complete' 
                      ? '✅ Generation Complete'
                      : imageProgress?.currentScene === 'initializing' 
                        ? '🔄 Initializing...'
                        : `🔄 Generating ${imageProgress?.currentScene || 'scene'}...`
                    }
                  </div>
                </div>

              </div>

              {/* RIGHT SIDE - Image Preview (60%) */}
              <div style={{ 
                flex: '0 0 60%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                overflow: 'hidden',
                minHeight: 0,
                height: '100%'  // Ensure full height
              }}>
                
                {/* Image Preview Area - 16:9 ASPECT RATIO */}
                <div style={{
                  aspectRatio: '16/9',
                  width: '100%',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '0.375rem',
                  border: '2px dashed #444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Show actual generated image if available */}
                  {imageProgress?.latestImageUrl ? (
                    <img 
                      src={imageProgress.latestImageUrl} 
                      alt={`Generated scene ${imageProgress.currentSceneIndex}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',  // Keep aspect ratio, fit within 16:9 container
                        borderRadius: '0.25rem'
                      }}
                      onLoad={() => console.log(`✅ Image loaded: Scene ${imageProgress.currentSceneIndex}`)}
                      onError={() => console.log(`❌ Image failed to load: Scene ${imageProgress.currentSceneIndex}`)}
                    />
                  ) : (
                    /* Placeholder when no image yet */
                    <div style={{
                      textAlign: 'center',
                      color: '#666'
                    }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎬</div>
                      <div style={{ fontSize: '0.875rem' }}>Scene {imageProgress?.currentSceneIndex || 1} generating...</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        FAL.ai image will appear here first
                      </div>
                    </div>
                  )}
                  
                  {/* Loading animation overlay - only show when generating */}
                  {isGeneratingImages && (
                    <div style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      color: '#ff9900',
                      fontSize: '0.75rem',
                      backgroundColor: '#332200',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.25rem'
                    }}>
                      🔄 Loading...
                    </div>
                  )}
                </div>

                {/* Current Scene Prompt Info - Dynamic */}
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '0.375rem',
                  width: '100%',
                  flex: '0 0 auto'  // Don't grow, fixed size
                }}>
                  <div style={{ 
                    color: '#66ccff', 
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    marginBottom: '0.375rem'
                  }}>
                    Current Scene Prompt:
                  </div>
                  <div style={{ 
                    color: '#999', 
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    wordWrap: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxHeight: '2.6rem'  // ~2 lines at 1.3 line height
                  }}>
                    {(() => {
                      if (showModalDemo) return '"A stunning cinematic wide shot of a circular futuristic library with floating holographic books and ancient knowledge crystals..."';
                      if (!imageProgress?.currentScene || imageProgress?.currentScene === 'complete') {
                        return imageProgress?.currentScene === 'complete' 
                          ? 'All scene prompts processed successfully!' 
                          : 'Waiting for generation to start...';
                      }
                      const currentSceneData = masterJSON?.scenes?.[imageProgress.currentScene];
                      const prompt = currentSceneData?.scene_frame_prompt;
                      return prompt ? `"${prompt}"` : 'No prompt available for this scene';
                    })()} 
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}