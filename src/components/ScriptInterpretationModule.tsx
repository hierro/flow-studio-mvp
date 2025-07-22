import { useState, useEffect } from 'react'
import { updatePhaseContent, savePhaseAndUnlockNext, getPhase, getPhaseVersions, getPhaseVersion } from '../lib/database'
import type { ProjectPhase, ScriptInterpretationContent, PhaseVersion } from '../types/project'

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
}

export default function ScriptInterpretationModule({ 
  phase, 
  projectId, 
  projectName,
  onContentChange 
}: ScriptInterpretationModuleProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [jsonContent, setJsonContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [error, setError] = useState('')
  const [useProduction, setUseProduction] = useState(true)
  const [databaseStatus, setDatabaseStatus] = useState<{
    loaded: boolean;
    version: number;
    lastSaved?: string;
    error?: string;
  }>({ loaded: false, version: 0 })
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versionHistory, setVersionHistory] = useState<PhaseVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  // Load existing content and database status on mount
  useEffect(() => {
    loadExistingContentAndStatus()
  }, [phase.id])

  const loadExistingContentAndStatus = async () => {
    setDatabaseStatus({ loaded: false, version: 0 })
    
    try {
      // Refresh phase data from database to get latest version
      const currentPhase = await getPhase(phase.id)
      if (currentPhase) {
        setDatabaseStatus({
          loaded: true,
          version: currentPhase.current_version,
          lastSaved: currentPhase.last_modified_at || currentPhase.created_at
        })
        
        // Load content if exists
        if (currentPhase.content_data?.script_interpretation) {
          const content = currentPhase.content_data.script_interpretation
          setJsonContent(JSON.stringify(content, null, 2))
          setHasUnsavedChanges(false) // Reset unsaved changes flag
        }
      } else {
        setDatabaseStatus({ 
          loaded: false, 
          version: 0, 
          error: 'Could not load phase from database' 
        })
      }
    } catch (error) {
      console.error('Error loading phase status:', error)
      setDatabaseStatus({ 
        loaded: false, 
        version: 0, 
        error: 'Database connection error' 
      })
    }
  }

  const loadVersionHistory = async () => {
    setLoadingVersions(true)
    const versions = await getPhaseVersions(phase.id)
    setVersionHistory(versions)
    setLoadingVersions(false)
  }

  const loadVersionContent = async (versionNumber: number) => {
    const version = await getPhaseVersion(phase.id, versionNumber)
    if (version && version.content_data?.script_interpretation) {
      const content = version.content_data.script_interpretation
      setJsonContent(JSON.stringify(content, null, 2))
      setHasUnsavedChanges(true) // Mark as modified since we loaded different content
      setShowVersionHistory(false)
    }
  }

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
    setError('')
    setShowRegenerateConfirm(false)

    try {
      const result = await callWebhookHub()
      console.log('Webhook result:', result)
      
      // Format the JSON for display
      const formattedJson = JSON.stringify(result, null, 2)
      setJsonContent(formattedJson)
      setHasUnsavedChanges(true)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Webhook error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleJsonChange = (value: string) => {
    setJsonContent(value)
    setHasUnsavedChanges(true)
  }

  const handleSavePhase = async () => {
    if (!jsonContent.trim()) {
      setError('No content to save')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      // Parse JSON to validate it
      const parsedContent = JSON.parse(jsonContent)
      
      // Create script interpretation content structure
      const scriptContent: ScriptInterpretationContent = {
        elements: parsedContent.elements || {},
        scenes: parsedContent.scenes || {},
        extraction_metadata: {
          timestamp: new Date().toISOString(),
          image_engine: parsedContent.image_engine || 'FLUX DEV',
          model_endpoint: parsedContent.model_endpoint || 'fal-ai/flux/dev',
          project_dest_folder: parsedContent.project_dest_folder || `${projectName}_${Date.now()}`
        }
      }

      // Save content to database
      const success = await updatePhaseContent(
        phase.id,
        { script_interpretation: scriptContent },
        'Script interpretation generated and saved'
      )

      if (success) {
        // Save and unlock next phase
        await savePhaseAndUnlockNext(phase.id)
        setHasUnsavedChanges(false)
        
        // Refresh database status to show updated version
        await loadExistingContentAndStatus()
        onContentChange() // Refresh parent component
      } else {
        setError('Failed to save content to database')
      }

    } catch (parseError) {
      setError('Invalid JSON format. Please check the content.')
      console.error('JSON parse error:', parseError)
    } finally {
      setIsSaving(false)
    }
  }

  const formatJsonDisplay = () => {
    if (!jsonContent) return ''
    try {
      const parsed = JSON.parse(jsonContent)
      return JSON.stringify(parsed, null, 2)
    } catch {
      return jsonContent
    }
  }

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '2rem',
      background: '#000',
      overflow: 'hidden'
    }}>
      {/* Header with controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        flexShrink: 0
      }}>
        <div>
          <h2 style={{
            color: '#fff',
            fontSize: '1.75rem',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            📄 Script Interpretation
          </h2>
          <p style={{ color: '#ccc', margin: 0 }}>
            Generate structured JSON from your storyboard using n8n workflow
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Webhook environment toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ color: '#ccc', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={useProduction}
                onChange={(e) => setUseProduction(e.target.checked)}
                style={{ marginRight: '0.5rem' }}
              />
              Use Production Webhook
            </label>
          </div>

          <button
            onClick={() => handleGenerateScript()}
            disabled={isGenerating}
            style={{
              background: isGenerating ? '#555' : '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '0.75rem 1.5rem',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {isGenerating ? '⏳ Generating...' : '🚀 Generate Script'}
          </button>

          <button
            onClick={handleSavePhase}
            disabled={isSaving || !hasUnsavedChanges || !jsonContent.trim()}
            style={{
              background: (!hasUnsavedChanges || !jsonContent.trim()) ? '#333' : 
                         isSaving ? '#555' : '#00cc00',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '0.75rem 1.5rem',
              cursor: (!hasUnsavedChanges || !jsonContent.trim() || isSaving) ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {isSaving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save & Unlock Phase 2' : '✅ Saved'}
          </button>
        </div>
      </div>

      {/* Database Status */}
      <div style={{
        background: databaseStatus.error ? '#330000' : '#003300',
        border: `1px solid ${databaseStatus.error ? '#cc0000' : '#006600'}`,
        borderRadius: '4px',
        padding: '0.75rem',
        marginBottom: '1rem',
        color: databaseStatus.error ? '#ff9999' : '#99ff99',
        fontSize: '0.85rem',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          {databaseStatus.error ? (
            <>❌ Database Error: {databaseStatus.error}</>
          ) : databaseStatus.loaded ? (
            <>✅ Database Connected • Version {databaseStatus.version}</>
          ) : (
            <>⏳ Loading database status...</>
          )}
        </div>
        {databaseStatus.loaded && databaseStatus.lastSaved && (
          <div style={{ fontSize: '0.75rem', color: '#ccffcc' }}>
            Last saved: {new Date(databaseStatus.lastSaved).toLocaleString()}
          </div>
        )}
      </div>

      {/* Error messages */}
      {error && (
        <div style={{
          background: '#330000',
          border: '1px solid #cc0000',
          borderRadius: '4px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#ff9999',
          fontSize: '0.9rem',
          flexShrink: 0
        }}>
          ❌ {error}
        </div>
      )}

      {hasUnsavedChanges && (
        <div style={{
          background: '#332200',
          border: '1px solid #cc9900',
          borderRadius: '4px',
          padding: '0.75rem',
          marginBottom: '1rem',
          color: '#ffcc00',
          fontSize: '0.9rem',
          flexShrink: 0
        }}>
          ⚠️ You have unsaved changes
        </div>
      )}

      {/* Environment indicator */}
      <div style={{
        background: useProduction ? '#003300' : '#330033',
        border: `1px solid ${useProduction ? '#00cc00' : '#cc00cc'}`,
        borderRadius: '4px',
        padding: '0.5rem',
        marginBottom: '1rem',
        color: useProduction ? '#99ff99' : '#ff99ff',
        fontSize: '0.85rem',
        textAlign: 'center',
        flexShrink: 0
      }}>
        {useProduction ? '🟢 PRODUCTION' : '🟣 TEST'} webhook environment
      </div>

      {/* n8n Loading Modal */}
      {isGenerating && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '3rem',
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90vw',
            border: '2px solid #0066cc',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '1rem',
              animation: 'spin 2s linear infinite'
            }}>
              ⚙️
            </div>
            <h2 style={{
              color: '#fff',
              margin: 0,
              marginBottom: '1rem',
              fontSize: '1.75rem'
            }}>
              Calling n8n Workflow
            </h2>
            <p style={{
              color: '#ccc',
              margin: 0,
              marginBottom: '1.5rem',
              fontSize: '1.1rem'
            }}>
              Processing your script interpretation request...
            </p>
            
            <div style={{
              background: '#003366',
              border: '1px solid #0066cc',
              padding: '1rem',
              borderRadius: '6px',
              marginBottom: '1rem'
            }}>
              <div style={{ color: '#66ccff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                🔗 Endpoint: {useProduction ? 'Production' : 'Test'} Webhook
              </div>
              <div style={{ color: '#99ddff', fontSize: '0.85rem' }}>
                📊 Phase: Script Interpretation • 🎬 Project: {projectName}
              </div>
            </div>

            <div style={{
              color: '#999',
              fontSize: '0.8rem',
              fontStyle: 'italic'
            }}>
              This may take a few moments...
            </div>
          </div>
        </div>
      )}

      {/* Full-screen JSON editor */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        background: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333',
        overflow: 'hidden',
        minHeight: 0  // Important for flex child to shrink
      }}>
        <div style={{
          background: '#333',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #444',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>
              JSON Content {databaseStatus.version > 0 && `(Database Version ${databaseStatus.version})`}
              {hasUnsavedChanges && <span style={{ color: '#ffcc00' }}> • Modified</span>}
            </span>
            {databaseStatus.version > 0 && (
              <button
                onClick={() => {
                  setShowVersionHistory(true)
                  loadVersionHistory()
                }}
                style={{
                  background: 'transparent',
                  color: '#66ccff',
                  border: '1px solid #66ccff',
                  borderRadius: '3px',
                  padding: '0.25rem 0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                📋 History
              </button>
            )}
          </div>
          <div style={{ color: '#ccc', fontSize: '0.85rem' }}>
            {jsonContent ? `${jsonContent.split('\n').length} lines` : 'No content'}
          </div>
        </div>

        <textarea
          value={jsonContent}
          onChange={(e) => handleJsonChange(e.target.value)}
          placeholder={isGenerating ? 'Generating content...' : 'JSON content will appear here after generation. You can edit it before saving.'}
          disabled={isGenerating}
          style={{
            flex: 1,
            background: '#000',
            color: '#fff',
            border: 'none',
            padding: '1.5rem',
            fontSize: '0.9rem',
            fontFamily: 'Monaco, "Lucida Console", monospace',
            lineHeight: '1.5',
            resize: 'none',
            outline: 'none',
            whiteSpace: 'pre',
            minHeight: 0,  // Important for flex child
            height: '100%'
          }}
        />
      </div>

      {/* Footer info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '1rem',
        padding: '1rem',
        background: '#1a1a1a',
        borderRadius: '4px',
        color: '#999',
        fontSize: '0.85rem',
        flexShrink: 0
      }}>
        <div>
          Project: <strong style={{ color: '#fff' }}>{projectName}</strong>
        </div>
        <div>
          Phase: <strong style={{ color: '#0066cc' }}>1/5</strong> • 
          Status: <strong style={{ color: phase.user_saved ? '#00cc00' : '#cccc00' }}>
            {phase.user_saved ? 'Completed' : 'In Progress'}
          </strong> •
          DB Version: <strong style={{ color: databaseStatus.loaded ? '#00cc00' : '#cc0000' }}>
            {databaseStatus.loaded ? databaseStatus.version : 'Error'}
          </strong>
        </div>
        <div>
          Webhook: <strong style={{ color: useProduction ? '#00cc00' : '#cc00cc' }}>
            {useProduction ? 'Production' : 'Test'}
          </strong>
        </div>
      </div>

      {/* Regenerate Confirmation Modal */}
      {showRegenerateConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '2rem',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90vw',
            border: '1px solid #333'
          }}>
            <h2 style={{
              color: '#fff',
              marginBottom: '1rem',
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              ⚠️ Regenerate Content?
            </h2>
            
            <div style={{
              background: '#333',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1.5rem',
              border: '1px solid #555'
            }}>
              <p style={{ color: '#ccc', margin: 0, marginBottom: '0.5rem' }}>
                You already have content saved (Version {databaseStatus.version}).
                Regenerating will create new content that you'll need to save as a new version.
              </p>
              <p style={{ color: '#ffcc00', margin: 0, fontSize: '0.9rem' }}>
                Current content will be preserved until you save the new version.
              </p>
            </div>

            <div style={{
              background: '#003300',
              border: '1px solid #006600',
              padding: '1rem',
              borderRadius: '4px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ color: '#99ff99', margin: 0, fontSize: '0.9rem' }}>
                ✨ This will preserve version history and allow you to compare results.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                style={{
                  background: '#666',
                  color: '#fff',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerateScript(true)}
                style={{
                  background: '#cc6600',
                  color: '#fff',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                🔄 Regenerate New Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '2rem',
            borderRadius: '8px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{
                color: '#fff',
                margin: 0,
                fontSize: '1.5rem'
              }}>
                📋 Version History
              </h2>
              <button
                onClick={() => setShowVersionHistory(false)}
                style={{
                  background: 'transparent',
                  color: '#ccc',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto' }}>
              {loadingVersions ? (
                <div style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>
                  Loading versions...
                </div>
              ) : versionHistory.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>
                  No version history available
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {versionHistory.map(version => (
                    <div
                      key={version.id}
                      style={{
                        background: version.version_number === databaseStatus.version ? '#003300' : '#333',
                        padding: '1rem',
                        borderRadius: '4px',
                        border: `1px solid ${version.version_number === databaseStatus.version ? '#006600' : '#555'}`,
                        cursor: 'pointer'
                      }}
                      onClick={() => loadVersionContent(version.version_number)}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          color: '#fff',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          Version {version.version_number}
                          {version.version_number === databaseStatus.version && (
                            <span style={{ color: '#99ff99', fontSize: '0.8rem' }}>(Current)</span>
                          )}
                        </span>
                        <span style={{ color: '#ccc', fontSize: '0.85rem' }}>
                          {new Date(version.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                        {version.change_description || 'No description'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#333',
              borderRadius: '4px',
              color: '#ccc',
              fontSize: '0.9rem'
            }}>
              💡 Click any version to load it into the editor. Remember to save after loading different content.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}