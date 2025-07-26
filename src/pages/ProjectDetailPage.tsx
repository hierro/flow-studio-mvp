import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getProjectPhases, getMasterJSON, saveMasterJSON, saveMasterJSONFromObject, updateMasterJSON, getProjectVersions, getProjectVersion } from '../lib/database'
import type { Project, ProjectPhase, PhaseName, ProjectVersion } from '../types/project'
import ScriptInterpretationModule from '../components/phases/ScriptInterpretationModule'
import ScenesFrameGenerationModule from '../components/phases/ScenesFrameGenerationModule'
import Navigation from '../components/common/Navigation'
import DirectorsTimeline from '../components/timeline/DirectorsTimeline'
import StyleControl from '../components/global/StyleControl'
import ConfigurationTab from '../components/admin/ConfigurationTab'
import AppModal from '../components/AppModal'
import { useAppModal, setGlobalModalInstance } from '../hooks/useAppModal'
import { PhaseCompletion } from '../utils/PhaseCompletion'
import { BackupManager } from '../utils/BackupManager'

interface ProjectDetailPageProps {
  user: any
}

export default function ProjectDetailPage({ user }: ProjectDetailPageProps) {
  const { id: projectId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<ProjectPhase[]>([])
  const [selectedPhase, setSelectedPhase] = useState<PhaseName | null>(null)
  const [selectedView, setSelectedView] = useState<'json' | 'timeline' | 'elements' | 'style' | 'config'>('timeline')
  const [loading, setLoading] = useState(true)
  
  // Master JSON management state
  const [masterJSON, setMasterJSON] = useState<any>({})
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versionHistory, setVersionHistory] = useState<ProjectVersion[]>([])

  // App-level modal system
  const appModal = useAppModal()
  const [loadingVersions, setLoadingVersions] = useState(false)

  // Set global modal instance for other components to use
  useEffect(() => {
    setGlobalModalInstance(appModal)
  }, [appModal])

  // Webhook configuration state (moved from ScriptInterpretationModule)
  const [useProduction, setUseProduction] = useState(true)

  // JSON editing state
  const [jsonContent, setJsonContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Backup restoration state
  const [showBackupRestore, setShowBackupRestore] = useState(false)
  const [backupData, setBackupData] = useState<any>(null)
  const [databaseStatus, setDatabaseStatus] = useState<{
    loaded: boolean;
    version: number;
    lastSaved?: string;
    error?: string;
  }>({ loaded: false, version: 0 })

  useEffect(() => {
    if (!projectId) {
      navigate('/dashboard')
      return
    }
    
    // Clean up old backups when loading projects
    BackupManager.cleanupOldBackups()
    
    loadProject()
  }, [projectId, navigate])

  // Load master JSON for the project
  const loadMasterJSON = useCallback(async () => {
    if (!projectId) return
    
    setDatabaseStatus({ loaded: false, version: 0 })
    
    try {
      const masterJSONData = await getMasterJSON(projectId)
      if (masterJSONData) {
        setMasterJSON(masterJSONData)
        setJsonContent(JSON.stringify(masterJSONData, null, 2))
        
        // Get project info for version and timestamp
        const projectData = await getProject(projectId)
        if (projectData) {
          setDatabaseStatus({
            loaded: true,
            version: projectData.current_version,
            lastSaved: projectData.updated_at
          })
        }
        
        setHasUnsavedChanges(false)
        
        // Check for backup restoration after loading current state
        const backup = BackupManager.checkForRestoration(projectId, projectData.current_version)
        if (backup) {
          setBackupData(backup)
          setShowBackupRestore(true)
        }
      } else {
        setDatabaseStatus({ 
          loaded: false, 
          version: 0, 
          error: 'Master JSON not found' 
        })
      }
    } catch (error) {
      console.error('Error loading master JSON:', error)
      setDatabaseStatus({ 
        loaded: false, 
        version: 0, 
        error: 'Failed to load master JSON' 
      })
    }
  }, [projectId])

  const loadVersionHistory = useCallback(async () => {
    if (!projectId) return
    
    setLoadingVersions(true)
    const versions = await getProjectVersions(projectId)
    setVersionHistory(versions)
    setLoadingVersions(false)
  }, [projectId])

  const loadVersionContent = useCallback(async (versionNumber: number) => {
    if (!projectId) return
    
    const version = await getProjectVersion(projectId, versionNumber)
    if (version && version.master_json) {
      // Load version content into local state only (no database update)
      setMasterJSON(version.master_json)
      setJsonContent(JSON.stringify(version.master_json, null, 2))
      setHasUnsavedChanges(true) // Mark as modified since we loaded different content
      setShowVersionHistory(false)
    }
  }, [projectId])

  const handleSaveJSON = useCallback(async () => {
    if (!projectId || !jsonContent.trim()) {
      setError('No content to save')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      // Parse and validate JSON
      const parsedJSON = JSON.parse(jsonContent)

      // Save master JSON to database
      const success = await saveMasterJSONFromObject(
        projectId,
        parsedJSON,
        'Master JSON updated'
      )

      if (success) {
        setMasterJSON(parsedJSON)
        setHasUnsavedChanges(false)
        
        // Clear backup after successful save
        BackupManager.clearBackup(projectId)
        
        // If we're in Phase 1 and have valid scenes, mark Phase 1 as completed
        const selectedPhaseData = phases.find(p => p.phase_name === selectedPhase)
        const hasScenes = parsedJSON.scenes && 
                         typeof parsedJSON.scenes === 'object' &&
                         parsedJSON.scenes !== null &&
                         Object.keys(parsedJSON.scenes).length > 0
        
        // Phase completion is determined by content state, not database flags
        // Master JSON with scenes = Phase 1 completed (clean architecture)
        
        // Reload to get the updated data and version info (preserves exact formatting)
        await loadMasterJSON()
        // Reload phases - can_proceed will be calculated automatically based on data state
        const updatedPhasesData = await getProjectPhases(projectId)
        setPhases(updatedPhasesData)
        
        const phase2 = updatedPhasesData.find(p => p.phase_index === 2)
        const phase3 = updatedPhasesData.find(p => p.phase_index === 3)
        
        if (hasScenes && (!phase2?.can_proceed || !phase3?.can_proceed)) {
          console.warn('Phase unlock validation failed - phases not unlocked as expected')
          setError('Phases should have unlocked but didn\'t. Please refresh the page.')
        }
      } else {
        setError('Failed to save master JSON to database')
      }

    } catch (error) {
      console.error('Error saving master JSON:', error)
      
      // IMPROVED ERROR MESSAGES: Give users specific feedback
      if (error instanceof SyntaxError) {
        setError('Invalid JSON format. Please check your syntax.')
      } else if (error.message.includes('database') || error.message.includes('supabase')) {
        setError('Database connection failed. Please check your internet connection and try again.')
      } else if (error.message.includes('project not found')) {
        setError('Project not found. Please refresh the page and try again.')
      } else if (error.message.includes('reload data')) {
        setError('Save succeeded but failed to reload. Please refresh the page to see changes.')
      } else {
        setError(`Save failed: ${error.message || 'Unknown error occurred'}`)
      }
    } finally {
      setIsSaving(false)
    }
  }, [projectId, jsonContent])

  const loadProject = async () => {
    if (!projectId) return

    setLoading(true)
    const [projectData, phasesData] = await Promise.all([
      getProject(projectId),
      getProjectPhases(projectId)
    ])

    if (!projectData) {
      navigate('/dashboard')
      return
    }

    setProject(projectData)
    setPhases(phasesData)
    
    // Select first available phase and load master JSON
    const firstAvailablePhase = phasesData.find(p => p.can_proceed)
    if (firstAvailablePhase) {
      setSelectedPhase(firstAvailablePhase.phase_name)
    }
    
    // Load master JSON for the project (only once during loadProject)
    await loadMasterJSON()
    
    setLoading(false)
  }

  const getPhaseDisplayName = (phaseName: PhaseName): string => {
    const names: Record<PhaseName, string> = {
      script_interpretation: 'Script Rendering',
      element_images: 'Elements Creation',
      scene_generation: 'Scenes Frame Generation',
      scene_videos: 'Scene Video',
      final_assembly: 'Assembly'
    }
    return names[phaseName] || phaseName
  }

  const getPhaseIcon = (phaseName: PhaseName): string => {
    const icons: Record<PhaseName, string> = {
      script_interpretation: '📄',
      element_images: '🎨',
      scene_generation: '🎬',
      scene_videos: '🎥',
      final_assembly: '🎞️'
    }
    return icons[phaseName] || '📋'
  }

  const getPhaseStatusColor = (phase: ProjectPhase): string => {
    if (phase.status === 'completed') return '#00cc00' // Completed (green)
    if (phase.status === 'processing') return '#ff9900' // Processing (orange)  
    if (phase.can_proceed) return '#0066cc' // Available (blue)
    return '#666' // Locked (gray)
  }

  const getPhaseStatusText = (phase: ProjectPhase): string => {
    if (phase.status === 'completed') return 'Completed'
    if (phase.status === 'processing') return 'Processing'
    if (phase.can_proceed) return 'Available'
    return 'Locked'
  }

  const handlePhaseClick = (phase: ProjectPhase) => {
    if (!phase.can_proceed && phase.status !== 'completed') return
    setSelectedPhase(phase.phase_name)
    // Master JSON is already loaded, just switch phase view
  }

  // DEPRECATED: Phase content loading removed - using master JSON architecture
  // Master JSON is loaded once in loadMasterJSON() and used for all phases
  const loadPhaseContent = useCallback(async (phaseId: string) => {
    // Do nothing - master JSON already loaded
    console.log('loadPhaseContent called but deprecated - using master JSON')
  }, [])

  const handleJsonChange = useCallback((value: string) => {
    setJsonContent(value)
    setHasUnsavedChanges(true)
  }, [])

  const handleSavePhase = useCallback(async () => {
    // DEPRECATED: This function should not be used - handleSaveJSON is the correct one
    // Redirect to the master JSON save function
    console.warn('handleSavePhase called - redirecting to handleSaveJSON')
    await handleSaveJSON()
  }, [handleSaveJSON])

  const renderViewContent = () => {
    const selectedPhaseData = phases.find(p => p.phase_name === selectedPhase)
    if (!selectedPhaseData || !project) return null

    // Master JSON is already loaded, use it directly

    switch (selectedView) {
      case 'json':
        return (
          <div className="view-content-container">
            <div className="view-content-header">
              <span className="view-content-title">
                {selectedPhase === 'script_interpretation' 
                  ? `JSON Content (Phase ${selectedPhaseData.phase_index})`
                  : `Base Script Content (From Phase 1 → Phase ${selectedPhaseData.phase_index})`
                }
              </span>
              <span className="view-content-subtitle">
                {jsonContent || masterJSON ? 'Master JSON loaded' : 'No content - Complete Phase 1 first'}
              </span>
            </div>
            <div className="json-editor">
              <textarea
                value={jsonContent || (masterJSON ? JSON.stringify(masterJSON, null, 2) : '')}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="json-textarea"
                style={{
                  width: '100%',
                  minHeight: '500px',
                  fontFamily: 'Monaco, Menlo, Consolas, monospace',
                  fontSize: '0.875rem',
                  padding: '1rem',
                  border: '1px solid var(--color-border-default)',
                  borderRadius: '4px',
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  resize: 'vertical'
                }}
                placeholder="No script interpretation content available - Please complete Phase 1 first to proceed with subsequent phases."
                disabled={selectedPhase !== 'script_interpretation'}
              />
            </div>
          </div>
        )

      case 'timeline':
        if (masterJSON && Object.keys(masterJSON).length > 0) {
          // Use master JSON as foundation content
          const enhancedContent = masterJSON;
          
          return (
            <DirectorsTimeline 
              content={enhancedContent}
              projectId={project.id}
              projectName={project.name}
              phaseId={selectedPhaseData.id}
              onContentUpdate={(updatedContent) => {
                // Update local state only - NO database save, NO version creation
                setMasterJSON(updatedContent)
                setJsonContent(JSON.stringify(updatedContent, null, 2))
                setHasUnsavedChanges(true) // Mark as having unsaved changes
                
                // Save backup to localStorage for data loss prevention
                BackupManager.saveBackup(projectId, updatedContent, databaseStatus.version)
              }}
            />
          )
        }
        return (
          <div className="view-placeholder">
            <div className="view-placeholder-icon">📊</div>
            <h3 className="view-placeholder-title">Timeline View</h3>
            <p>Story foundation for {selectedPhaseData.phase_name.replace('_', ' ')}</p>
            <p><em>Complete Phase 1 first to see the timeline foundation</em></p>
          </div>
        )

      case 'elements':
        return (
          <div className="view-placeholder">
            <div className="view-placeholder-icon">🎭</div>
            <h3 className="view-placeholder-title">Elements View</h3>
            <p>Cross-scene element management (Phase 2+)</p>
          </div>
        )

      case 'style':
        if (masterJSON && Object.keys(masterJSON).length > 0) {
          return (
            <StyleControl 
              masterJson={masterJSON}
              onContentUpdate={(updatedContent) => {
                // Update local state only - NO database save, NO version creation
                setMasterJSON(updatedContent)
                setJsonContent(JSON.stringify(updatedContent, null, 2))
                setHasUnsavedChanges(true) // Mark as having unsaved changes
                
                // Save backup to localStorage for data loss prevention
                BackupManager.saveBackup(projectId, updatedContent, databaseStatus.version)
              }}
            />
          )
        }
        return (
          <div className="view-placeholder">
            <div className="view-placeholder-icon">🎨</div>
            <h3 className="view-placeholder-title">Style Control</h3>
            <p><em>Complete Phase 1 first to access style controls</em></p>
          </div>
        )

      case 'config':
        return <ConfigurationTab />

      default:
        return null
    }
  }

  const renderProjectStatusBar = () => {
    if (!project) return null

    // Clean architecture: Phase completion based on content state
    const completedPhases = PhaseCompletion.getCompletedPhases(masterJSON)
    const currentPhaseData = phases.find(p => p.phase_name === selectedPhase)

    return (
      <div className="project-header-sticky">
        <div className="flex justify-between items-center text-sm text-muted">
          <div>
            Project: <strong className="text-primary">{project.name}</strong>
          </div>
          <div className="project-status-center">
            Progress: <strong className="text-success">{completedPhases}/5 phases completed</strong>
            {hasUnsavedChanges && (
              <span className="unsaved-changes-indicator">• ⚠️ Unsaved Changes</span>
            )}
          </div>
          <div className="header-actions">
            {/* Save Button - Universal across all phases */}
            <button
              onClick={handleSaveJSON}
              disabled={isSaving || !hasUnsavedChanges || !jsonContent.trim()}
              className={`btn text-xs px-md py-xs ${
                (!hasUnsavedChanges || !jsonContent.trim()) ? 'btn-secondary' : 
                isSaving ? 'btn-secondary' : 'btn-success'
              }`}
            >
              {isSaving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save' : '✅ Saved'}
            </button>
            
            {/* History Button - Universal across all phases */}
            {databaseStatus.version > 0 && (
              <button
                onClick={() => {
                  loadVersionHistory();
                  setShowVersionHistory(true);
                }}
                className="btn text-xs px-md py-xs btn-secondary"
              >
                📋 History
              </button>
            )}
            
            {/* Current Phase Status */}
            {currentPhaseData && (
              <span className="current-phase-status">
                Phase {currentPhaseData.phase_index}: <strong className="text-accent">{getPhaseDisplayName(currentPhaseData.phase_name)}</strong>
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderPhaseContent = () => {
    const selectedPhaseData = phases.find(p => p.phase_name === selectedPhase)
    if (!selectedPhaseData || !project) return null

    return (
      <div className="phase-content-container">
        {/* Phase-specific module content */}
        {selectedPhase === 'script_interpretation' ? (
          <ScriptInterpretationModule
            phase={selectedPhaseData}
            projectId={project.id}
            projectName={project.name}
            onContentChange={loadProject}
            // Content management props
            jsonContent={jsonContent}
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            error={error}
            databaseStatus={databaseStatus}
            showVersionHistory={showVersionHistory}
            versionHistory={versionHistory}
            loadingVersions={loadingVersions}
            // Content management functions
            onJsonChange={handleJsonChange}
            onSavePhase={handleSaveJSON}
            onLoadPhaseContent={() => {}} // Already loaded during loadProject
            onLoadVersionHistory={() => loadVersionHistory()}
            onLoadVersionContent={(versionNumber: number) => loadVersionContent(versionNumber)}
            onShowVersionHistory={setShowVersionHistory}
            // Webhook configuration
            useProduction={useProduction}
            onUseProductionChange={setUseProduction}
          />
        ) : selectedPhase === 'scene_generation' ? (
          <ScenesFrameGenerationModule
            phase={selectedPhaseData}
            projectId={project.id}
            projectName={project.name}
            masterJSON={masterJSON}
            onContentUpdate={(updatedJSON) => {
              // Update local state only - NO database save, NO version creation
              setMasterJSON(updatedJSON)
              setJsonContent(JSON.stringify(updatedJSON, null, 2))
              setHasUnsavedChanges(true) // Mark as having unsaved changes
              
              // Save backup to localStorage for data loss prevention
              BackupManager.saveBackup(projectId, updatedJSON, databaseStatus.version)
            }}
            hasUnsavedChanges={hasUnsavedChanges}
            onJsonChange={handleJsonChange}
          />
        ) : (
          // Placeholder for other phases
          <div className="phase-content-container">
            <div className="phase-content-header">
              <div>
                <h2 className="phase-content-title">
                  {getPhaseIcon(selectedPhaseData.phase_name)} {getPhaseDisplayName(selectedPhaseData.phase_name)}
                </h2>
                <div className="phase-content-meta">
                  <span>Phase {selectedPhaseData.phase_index} of 5</span>
                  <span className="phase-status" style={{
                    background: getPhaseStatusColor(selectedPhaseData)
                  }}>
                    {getPhaseStatusText(selectedPhaseData)}
                  </span>
                </div>
              </div>
            </div>

            <div className="phase-placeholder">
              <div className="phase-placeholder-content">
                <div className="phase-placeholder-icon">
                  {getPhaseIcon(selectedPhaseData.phase_name)}
                </div>
                <h3 className="phase-placeholder-title">
                  {getPhaseDisplayName(selectedPhaseData.phase_name)} Module
                </h3>
                <p className="phase-placeholder-description">
                  This phase module will be implemented next. It will handle the {selectedPhaseData.phase_name.replace('_', ' ')} 
                  workflow including n8n integration, content generation, and user approval interface.
                </p>
                {selectedPhaseData.can_proceed && !selectedPhaseData.user_saved && (
                  <div>
                    <button className="phase-start-button">
                      Start {getPhaseDisplayName(selectedPhaseData.phase_name)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        Loading project...
      </div>
    )
  }

  if (!project || !projectId) {
    return (
      <div className="loading-container">
        Project not found
      </div>
    )
  }

  return (
    <div className="project-detail-container">
      {/* Sidebar with phase navigation */}
      <div className="project-detail-sidebar">
        <div className="phase-placeholder-section">
          <button
            onClick={() => navigate('/dashboard')}
            className="back-button"
          >
            ← Back to Projects
          </button>
          
          <h1 className="project-title">
            {project.name}
          </h1>
          <p className="project-client">
            {masterJSON?.project_metadata?.client || 'Unknown Client'}
          </p>
        </div>

        <div className="phase-placeholder-section">
          <h3 className="phases-section-title">
            Project Phases
          </h3>
          
          <div className="phases-list">
            {phases.map((phase) => (
              <button
                key={phase.id}
                onClick={() => handlePhaseClick(phase)}
                disabled={!phase.can_proceed && !phase.user_saved}
                className={`phase-button-container ${selectedPhase === phase.phase_name ? 'active' : ''}`}
              >
                <div className="phase-button-row">
                  <div className="phase-number-column">
                    <span className="phase-number">
                      {phase.phase_index}
                    </span>
                  </div>
                  
                  <div className="phase-info-column">
                    <div className="phase-name">
                      {getPhaseDisplayName(phase.phase_name)}
                    </div>
                    <div className="phase-status-text">
                      {getPhaseStatusText(phase)}
                    </div>
                  </div>
                  
                  <div 
                    className="phase-status-dot"
                    style={{
                      background: getPhaseStatusColor(phase)
                    }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="progress-summary">
          <strong>Progress:</strong>{' '}
          {PhaseCompletion.getCompletedPhases(masterJSON)} of 5 phases completed
        </div>
      </div>

      {/* Main content area */}
      <div className="project-main-content">
        
        {/* Project Status Bar - Horizontal span above all areas (Phase Agnostic) */}
        {renderProjectStatusBar()}
        
        {/* AREA 1: NAVIGATION BAR (First position - sticky below header) */}
        <div className="project-area project-area-1 project-nav-sticky">
          <div className="project-area-header area-header-1">
            🧭 AREA 1: NAVIGATION BAR (4 TABS)
          </div>
          <Navigation 
            activeView={selectedView} 
            onViewChange={setSelectedView}
            masterJSON={masterJSON}
          />
        </div>

        {/* AREA 2: PHASE-SPECIFIC CONTENT (Second position) */}
        {selectedView !== 'config' && (
          <div className="project-area project-area-2">
            <div className="project-area-header area-header-2">
              🔧 AREA 2: PHASE CONTENT
            </div>
            {renderPhaseContent()}
          </div>
        )}

        {/* AREA 3: CONTENT AREA (Third position) */}
        <div className="project-area project-area-3">
          <div className="project-area-header area-header-3">
            📄 AREA 3: CONTENT AREA (JSON | TIMELINE | ELEMENTS | STYLE)
          </div>
          {renderViewContent()}
        </div>

      </div>

      {/* Backup Restoration Modal */}
      {showBackupRestore && backupData && (
        <div className="modal-overlay">
          <div className="modal-content modal-width-500">
            <h2 className="text-primary text-2xl mb-xl flex items-center gap-md mb-0">
              💾 Restore Unsaved Changes?
            </h2>
            
            <div className="bg-warning border border-light p-xl rounded-md mb-2xl">
              <p className="text-secondary mb-md mb-0">
                We found unsaved changes from your previous session.
              </p>
              <p className="text-sm text-muted mb-0">
                Backup saved: {new Date(backupData.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="db-status db-status-info mb-2xl">
              <p className="text-sm mb-0">
                ✨ Your changes will be restored and you can continue editing where you left off.
              </p>
            </div>

            <div className="flex gap-xl justify-end">
              <button
                onClick={() => {
                  setShowBackupRestore(false)
                  setBackupData(null)
                  // Clear the backup since user chose not to restore
                  BackupManager.clearBackup(projectId)
                }}
                className="btn btn-secondary"
              >
                Discard Changes
              </button>
              <button
                onClick={() => {
                  // Restore the backup data
                  setMasterJSON(backupData.masterJSON)
                  setJsonContent(JSON.stringify(backupData.masterJSON, null, 2))
                  setHasUnsavedChanges(true) // Mark as having unsaved changes
                  setShowBackupRestore(false)
                  setBackupData(null)
                }}
                className="btn btn-primary"
              >
                🔄 Restore Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* App-Level Modal System */}
      <AppModal 
        modalState={appModal.modalState}
        onClose={appModal.hideModal}
      />
    </div>
  )
}