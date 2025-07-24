import { useState, useEffect } from 'react'
import type { ProjectPhase, ProjectVersion } from '../types/project'

// Webhook configuration (test vs production)
const WEBHOOK_CONFIG = {
  test: 'https://azoriusdrake.app.n8n.cloud/webhook-test/4b4638e1-47de-406f-8ef7-136d49bc9bc1',
  production: 'https://azoriusdrake.app.n8n.cloud/webhook/4b4638e1-47de-406f-8ef7-136d49bc9bc1'
}

interface ScriptInterpretationModuleProps {
  phase: ProjectPhase
  projectId: string
  projectName: string
  onContentChange: () => void
  // Content management props
  jsonContent: string
  hasUnsavedChanges: boolean
  isSaving: boolean
  error: string
  databaseStatus: {
    loaded: boolean;
    version: number;
    lastSaved?: string;
    error?: string;
  }
  showVersionHistory: boolean
  versionHistory: ProjectVersion[]
  loadingVersions: boolean
  // Content management functions
  onJsonChange: (value: string) => void
  onSavePhase: () => void
  onLoadPhaseContent: (phaseId: string) => void
  onLoadVersionHistory: () => void
  onLoadVersionContent: (versionNumber: number) => void
  onShowVersionHistory: (show: boolean) => void
  // Webhook configuration
  useProduction: boolean
  onUseProductionChange: (value: boolean) => void
}

export default function ScriptInterpretationModule({ 
  phase, 
  projectId, 
  projectName,
  onContentChange,
  // Content management props
  jsonContent,
  hasUnsavedChanges,
  isSaving,
  error,
  databaseStatus,
  showVersionHistory,
  versionHistory,
  loadingVersions,
  // Content management functions
  onJsonChange,
  onSavePhase,
  onLoadPhaseContent,
  onLoadVersionHistory,
  onLoadVersionContent,
  onShowVersionHistory,
  // Webhook configuration
  useProduction,
  onUseProductionChange
}: ScriptInterpretationModuleProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  // Load existing content and database status on mount
  useEffect(() => {
    onLoadPhaseContent(phase.id)
  }, [phase.id, onLoadPhaseContent])


  const callWebhookHub = async () => {
    const webhookUrl = useProduction ? WEBHOOK_CONFIG.production : WEBHOOK_CONFIG.test
    
    const payload = {
      phase: 'script_interpretation',
      operation: 'generate_all',
      jobId: crypto.randomUUID(),
      projectId: projectId,
      projectName: projectName,
      data: {
        projectId: projectId,
        projectName: projectName,
        phase: 'script_interpretation',
        timestamp: new Date().toISOString()
      }
    }

    console.log('Calling webhook:', webhookUrl)
    console.log('Payload:', payload)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  const handleGenerateScript = async (forceRegenerate = false) => {
    // If content exists and this isn't a forced regeneration, show confirmation
    if (databaseStatus.version > 0 && !forceRegenerate) {
      setShowRegenerateConfirm(true)
      return
    }

    setIsGenerating(true)
    setShowRegenerateConfirm(false)

    try {
      const result = await callWebhookHub()
      console.log('Webhook result:', result)
      
      // Format the JSON for display
      const formattedJson = JSON.stringify(result, null, 2)
      onJsonChange(formattedJson)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('Webhook error:', err)
      // Error will be displayed through parent component's error state
    } finally {
      setIsGenerating(false)
    }
  }


  return (
    <div style={{ padding: '0.5rem' }}>
      {/* 2-Column Layout */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        
        {/* LEFT COLUMN - Information */}
        <div style={{ flex: 1 }}>
          {/* Phase Status Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#999', marginBottom: '0.375rem' }}>
            <span>
              Phase 1: <strong style={{ color: '#66ccff' }}>Script Interpretation</strong>
            </span>
            <span>•</span>
            <span>
              Status: <strong className={phase.user_saved ? 'script-status-completed' : 'script-status-progress'}>
                {phase.user_saved ? 'Completed' : 'In Progress'}
              </strong>
            </span>
            <span>•</span>
            <span>
              DB v<strong className={databaseStatus.loaded ? 'script-db-connected' : 'script-db-error'}>
                {databaseStatus.loaded ? databaseStatus.version : '?'}
              </strong>
            </span>
          </div>
          
          {/* Description */}
          <div style={{ marginBottom: '0.25rem' }}>
            <p style={{ color: '#cccccc', fontSize: '0.875rem', margin: 0 }}>
              Generate structured JSON from your storyboard using n8n workflow
            </p>
          </div>
          
          {/* Status Messages */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem' }}>
            <span className={databaseStatus.error ? 'text-error' : 'text-success'}>
              {databaseStatus.error ? (
                <>❌ DB Error</>
              ) : databaseStatus.loaded ? (
                <>✅ Connected</>
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
            
            <span className={useProduction ? 'text-success' : 'text-accent'}>
              {useProduction ? '🟢 PROD' : '🟣 TEST'}
            </span>
            
            {databaseStatus.loaded && databaseStatus.lastSaved && (
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                Saved: {new Date(databaseStatus.lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        {/* RIGHT COLUMN - Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.375rem' }}>
          {/* Production Webhook Toggle */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: '#cccccc' }}>
              <input
                type="checkbox"
                checked={useProduction}
                onChange={(e) => onUseProductionChange(e.target.checked)}
                style={{ marginRight: '0.375rem' }}
              />
              Production Webhook
            </label>
          </div>
          
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              onClick={() => handleGenerateScript()}
              disabled={isGenerating}
              className={`btn text-xs px-md py-xs ${isGenerating ? 'btn-secondary' : 'btn-primary'}`}
            >
              {isGenerating ? '⏳ Generating...' : '🚀 Generate'}
            </button>

            <button
              onClick={onSavePhase}
              disabled={isSaving || !hasUnsavedChanges || !jsonContent.trim()}
              className={`btn text-xs px-md py-xs ${(!hasUnsavedChanges || !jsonContent.trim()) ? 'btn-secondary' : 
                           isSaving ? 'btn-secondary' : 'btn-success'}`}
            >
              {isSaving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save & Unlock' : '✅ Saved'}
            </button>

            {databaseStatus.version > 0 && (
              <button
                onClick={() => {
                  onLoadVersionHistory();
                  onShowVersionHistory(true);
                }}
                className="btn text-xs px-md py-xs btn-secondary"
              >
                📋 History
              </button>
            )}
          </div>
        </div>
        
      </div>

      {/* n8n Loading Modal */}
      {isGenerating && (
        <div className="modal-overlay script-modal-loading">
          <div className="modal-content script-modal-narrow">
            <div className="loading-spinner script-loading-icon">
              ⚙️
            </div>
            <h2 className="text-primary text-3xl mb-xl mb-0">
              Calling n8n Workflow
            </h2>
            <p className="text-secondary text-lg mb-2xl mb-0">
              Processing your script interpretation request...
            </p>
            
            <div className="bg-tertiary border border-focus p-xl rounded-md mb-xl">
              <div className="text-accent text-base mb-md">
                🔗 Endpoint: {useProduction ? 'Production' : 'Test'} Webhook
              </div>
              <div className="text-secondary text-sm">
                📊 Phase: Script Interpretation • 🎬 Project: {projectName}
              </div>
            </div>

            <div className="text-muted text-xs text-italic">
              This may take a few moments...
            </div>
          </div>
        </div>
      )}


      {/* Regenerate Confirmation Modal */}
      {showRegenerateConfirm && (
        <div className="modal-overlay">
          <div className="modal-content modal-width-500">
            <h2 className="text-primary text-2xl mb-xl flex items-center gap-md mb-0">
              ⚠️ Regenerate Content?
            </h2>
            
            <div className="bg-accent border border-light p-xl rounded-md mb-2xl">
              <p className="text-secondary mb-md mb-0">
                You already have content saved (Version {databaseStatus.version}).
                Regenerating will create new content that you'll need to save as a new version.
              </p>
              <p className="text-sm version-warning-text mb-0">
                Current content will be preserved until you save the new version.
              </p>
            </div>

            <div className="db-status db-status-success mb-2xl">
              <p className="text-sm mb-0">
                ✨ This will preserve version history and allow you to compare results.
              </p>
            </div>

            <div className="flex gap-xl justify-end">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerateScript(true)}
                className="btn script-regenerate-button"
              >
                🔄 Regenerate New Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="modal-overlay">
          <div className="modal-content flex flex-col modal-version-history">
            <div className="flex justify-between items-center mb-2xl">
              <h2 className="text-primary text-2xl mb-0">
                📋 Version History
              </h2>
              <button
                onClick={() => onShowVersionHistory(false)}
                className="bg-transparent text-secondary border-none text-2xl cursor-pointer"
              >
                ×
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loadingVersions ? (
                <div className="text-center text-secondary p-2xl">
                  Loading versions...
                </div>
              ) : versionHistory.length === 0 ? (
                <div className="text-center text-secondary p-2xl">
                  No version history available
                </div>
              ) : (
                <div className="flex flex-col gap-md">
                  {versionHistory.map(version => (
                    <div
                      key={version.id}
                      className={`version-item ${version.version_number === databaseStatus.version ? 'current' : ''}`}
                      onClick={() => onLoadVersionContent(version.version_number)}
                    >
                      <div className="version-header">
                        <span className="version-title">
                          Version {version.version_number}
                          {version.version_number === databaseStatus.version && (
                            <span className="version-current-badge">(Current)</span>
                          )}
                        </span>
                        <span className="version-date">
                          {new Date(version.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="version-description">
                        {version.change_description || 'No description'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="version-tip">
              💡 Click any version to load it into the editor. Remember to save after loading different content.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}