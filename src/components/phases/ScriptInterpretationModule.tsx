import { useState, useEffect } from 'react'
import type { ProjectPhase, ProjectVersion } from '../types/project'
import { processReferenceScript, getProcessingStatusMessages } from '../../services/ReferenceDataService'
import { getGlobalModal } from '../../hooks/useAppModal'

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
  onShowVersionHistory
}: ScriptInterpretationModuleProps) {
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  
  // PDF Processing state
  const [isProcessingPDF, setIsProcessingPDF] = useState(false)
  const [processingStep, setProcessingStep] = useState(0)

  // Load existing content and database status on mount
  useEffect(() => {
    onLoadPhaseContent(phase.id)
  }, [phase.id, onLoadPhaseContent])



  const handleProcessPDF = async (forceRegenerate = false) => {
    // If content exists and this isn't a forced regeneration, show confirmation
    if (databaseStatus.version > 0 && !forceRegenerate) {
      setShowRegenerateConfirm(true)
      return
    }

    setIsProcessingPDF(true)
    setShowRegenerateConfirm(false)
    setProcessingStep(0)

    const modal = getGlobalModal()
    const statusMessages = getProcessingStatusMessages()

    try {
      // Show processing modal with step-by-step updates
      modal?.showModal({
        title: "🔄 Processing PDF",
        content: statusMessages[0],
        type: "loading"
      })

      // Update processing steps with delays
      for (let i = 0; i < statusMessages.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setProcessingStep(i + 1)
        modal?.showModal({
          title: "🔄 Processing PDF", 
          content: statusMessages[i + 1],
          type: "loading"
        })
      }

      // Process the reference script data
      const result = await processReferenceScript("Script_STELLARE+storyboard 0611_B.pdf", projectName)

      if (result.success) {
        // Check if this is the first time BEFORE changing anything
        const isFirstTime = databaseStatus.version === 0
        
        if (isFirstTime) {
          // Auto-save directly without triggering "unsaved changes" state
          const { saveMasterJSONFromObject } = await import('../../lib/database')
          const success = await saveMasterJSONFromObject(
            projectId,
            result.masterJSON,
            'First revision auto-created from PDF processing'
          )
          
          if (success) {
            // Reload all states from database (includes the new JSON and version)
            onContentChange()
            console.log('Auto-save successful - first revision created and UI updated')
          }
        } else {
          // Not first time - just update local state for editing
          const formattedJson = JSON.stringify(result.masterJSON, null, 2)
          onJsonChange(formattedJson)
        }
        
        // Show success modal
        modal?.showModal({
          title: "✅ PDF Processed Successfully",
          content: isFirstTime 
            ? "Script extracted and first revision created! Timeline is now ready." 
            : "Script has been extracted and is ready for editing in the timeline.",
          type: "success"
        })
      } else {
        throw new Error(result.error || 'PDF processing failed')
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      console.error('PDF processing error:', err)
      
      const modal = getGlobalModal()
      modal?.showModal({
        title: "❌ PDF Processing Failed",
        content: `Error: ${errorMessage}`,
        type: "error"
      })
    } finally {
      setIsProcessingPDF(false)
      setProcessingStep(0)
    }
  }



  return (
    <div>
      <p style={{ color: '#cccccc', fontSize: '0.875rem', margin: 0, marginBottom: '0.5rem' }}>
        Upload your document to generate script mapping
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Upload Button */}
        <button
          disabled={true}
          className="btn btn-secondary text-sm"
          style={{ opacity: 0.5 }}
        >
          Select File
        </button>
        
        {/* File Name */}
        <span style={{ color: '#cccccc', fontSize: '0.875rem' }}>
          Script_STELLARE+storyboard 0611_B.pdf
        </span>
        
        {/* Map Script Button */}
        <button
          onClick={() => handleProcessPDF()}
          disabled={isProcessingPDF}
          className={`btn text-sm ${isProcessingPDF ? 'btn-secondary' : 'btn-primary'}`}
        >
          {isProcessingPDF ? 'Processing...' : 'Map Script'}
        </button>
      </div>



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
                onClick={() => handleProcessPDF(true)}
                className="btn script-regenerate-button"
              >
                Regenerate Script
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