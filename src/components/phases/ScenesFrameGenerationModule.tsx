/**
 * Scenes Frame Generation Module - Phase 3
 * 
 * Handles LLM prompt generation for scene frames with comprehensive logging
 * Matches ScriptInterpretationModule UI layout exactly
 */

import { useState, useEffect } from 'react';
import type { ProjectPhase } from '../../types/project';
import { useLLMGeneration } from '../../hooks/useLLMGeneration';
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
    isGenerating,
    isReady,
    progress,
    error,
    currentProvider,
    setProvider,
    initializeService
  } = useLLMGeneration();

  // Initialize LLM service on mount
  useEffect(() => {
    console.log('🚀 ScenesFrameGenerationModule: Initializing LLM service...');
    initializeService().then((success) => {
      console.log(`✅ LLM service initialization: ${success ? 'SUCCESS' : 'FAILED'}`);
    });
  }, []);

  // Get scenes from master JSON
  const scenes = masterJSON?.scenes ? Object.keys(masterJSON.scenes) : [];
  const totalScenes = scenes.length;
  const scenesWithPrompts = scenes.filter(sceneId => 
    masterJSON.scenes[sceneId]?.scene_frame_prompt
  ).length;

  console.log('📊 Scenes Frame Generation State:', {
    totalScenes,
    scenesWithPrompts,
    hasUnsavedChanges,
    isGenerating,
    isReady,
    currentProvider
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

  // Handle single scene prompt (placeholder for future)
  const handleGenerateSinglePrompt = async () => {
    console.log('🎯 Single scene generation - placeholder for future implementation');
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
              Scenes: <strong className="script-db-connected">
                {scenesWithPrompts}/{totalScenes}
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
            <span className={!isReady ? 'text-error' : 'text-success'}>
              {!isReady ? (
                <>❌ LLM Error</>
              ) : isReady ? (
                <>✅ Ready</>
              ) : (
                <>⏳ Loading</>
              )}
            </span>
            
            {error && (
              <span className="text-error">❌ {error}</span>
            )}
            
            {hasUnsavedChanges && (
              <span className="text-warning">⚠️ Unsaved changes</span>
            )}
            
            <span className={currentProvider === 'openai' ? 'text-success' : 'text-accent'}>
              {currentProvider === 'openai' ? '🤖 OPENAI' : '🧠 CLAUDE'}
            </span>
            
            {isGenerating && progress.total > 0 && (
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                Progress: {progress.completed}/{progress.total} ({progress.percentage}%)
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
                disabled={isGenerating}
              />
              Use Claude (vs OpenAI)
            </label>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              onClick={handleGenerateAllPrompts}
              disabled={!isReady || isGenerating || totalScenes === 0}
              className={`btn text-xs px-md py-xs ${isGenerating ? 'btn-secondary' : 'btn-primary'}`}
            >
              {isGenerating ? '⏳ Generating...' : 'Generate Prompts'}
            </button>
            
            <button
              onClick={handleGenerateSinglePrompt}
              disabled={!isReady || isGenerating || totalScenes === 0}
              className="btn text-xs px-md py-xs btn-secondary"
            >
              Generate Frames
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}