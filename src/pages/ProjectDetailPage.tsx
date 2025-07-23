import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getProjectPhases, updatePhaseContent, savePhaseAndUnlockNext, getPhase, getPhaseVersions, getPhaseVersion } from '../lib/database'
import type { Project, ProjectPhase, PhaseName, ScriptInterpretationContent, PhaseVersion } from '../types/project'
import ScriptInterpretationModule from '../components/ScriptInterpretationModule'
import ProjectViewNavigation from '../components/ProjectViewNavigation'
import DirectorsTimeline from '../components/timeline/DirectorsTimeline'

interface ProjectDetailPageProps {
  user: any
}

export default function ProjectDetailPage({ user }: ProjectDetailPageProps) {
  const { id: projectId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<ProjectPhase[]>([])
  const [selectedPhase, setSelectedPhase] = useState<PhaseName | null>(null)
  const [selectedView, setSelectedView] = useState<'json' | 'timeline' | 'elements' | 'style'>('timeline')
  const [loading, setLoading] = useState(true)
  
  // Additional content management state
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versionHistory, setVersionHistory] = useState<PhaseVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(false)

  // Content management state (moved from ScriptInterpretationModule)
  const [jsonContent, setJsonContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
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
    loadProject()
  }, [projectId, navigate])

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
    
    // Select first available phase and load its content
    const firstAvailablePhase = phasesData.find(p => p.can_proceed)
    if (firstAvailablePhase) {
      setSelectedPhase(firstAvailablePhase.phase_name)
      // Load content after state is set, use setTimeout to ensure state is updated
      setTimeout(() => loadPhaseContent(firstAvailablePhase.id), 0)
    }
    
    setLoading(false)
  }

  const getPhaseDisplayName = (phaseName: PhaseName): string => {
    const names: Record<PhaseName, string> = {
      script_interpretation: 'Script Interpretation',
      element_images: 'Element Images',
      scene_generation: 'Scene Generation',
      scene_videos: 'Scene Videos',
      final_assembly: 'Final Assembly'
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
    if (phase.user_saved) return '#00cc00' // Completed (green)
    if (phase.status === 'processing') return '#ff9900' // Processing (orange)  
    if (phase.can_proceed) return '#0066cc' // Available (blue)
    return '#666' // Locked (gray)
  }

  const getPhaseStatusText = (phase: ProjectPhase): string => {
    if (phase.user_saved) return 'Completed'
    if (phase.status === 'processing') return 'Processing'
    if (phase.can_proceed) return 'Available'
    return 'Locked'
  }

  const handlePhaseClick = (phase: ProjectPhase) => {
    if (!phase.can_proceed && !phase.user_saved) return
    setSelectedPhase(phase.phase_name)
    // Reset content management state when switching phases
    setJsonContent('')
    setHasUnsavedChanges(false)
    setError('')
    setDatabaseStatus({ loaded: false, version: 0 })
    // Load content for the new phase
    loadPhaseContent(phase.id)
  }

  // Load existing content and database status for a phase
  const loadPhaseContent = useCallback(async (phaseId: string) => {
    setDatabaseStatus({ loaded: false, version: 0 })
    
    try {
      // Refresh phase data from database to get latest version
      const currentPhase = await getPhase(phaseId)
      if (currentPhase) {
        setDatabaseStatus({
          loaded: true,
          version: currentPhase.current_version,
          lastSaved: currentPhase.last_modified_at || currentPhase.created_at
        })
        
        // Linear workflow: All phases need script_interpretation as base content
        let scriptContent = null;
        
        if (currentPhase.phase_name === 'script_interpretation') {
          // Phase 1: Load its own script interpretation content
          scriptContent = currentPhase.content_data?.script_interpretation;
        } else {
          // Phase 2+: Find Phase 1 and load its script interpretation content
          const phase1 = phases.find(p => p.phase_name === 'script_interpretation');
          if (phase1?.content_data?.script_interpretation) {
            scriptContent = phase1.content_data.script_interpretation;
          }
        }
        
        if (scriptContent) {
          setJsonContent(JSON.stringify(scriptContent, null, 2))
          setHasUnsavedChanges(false)
        } else {
          // No script interpretation content available - Phase 1 not completed yet
          setJsonContent('')
          setHasUnsavedChanges(false)
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
  }, [phases])

  const loadVersionHistory = useCallback(async (phaseId: string) => {
    setLoadingVersions(true)
    const versions = await getPhaseVersions(phaseId)
    setVersionHistory(versions)
    setLoadingVersions(false)
  }, [])

  const loadVersionContent = useCallback(async (phaseId: string, versionNumber: number) => {
    const version = await getPhaseVersion(phaseId, versionNumber)
    if (version && version.content_data) {
      // Find the current phase to determine which content type to load
      const currentPhase = phases.find(p => p.id === phaseId)
      if (currentPhase) {
        let content = null;
        
        switch (currentPhase.phase_name) {
          case 'script_interpretation':
            content = version.content_data.script_interpretation;
            break;
          case 'element_images':
            content = version.content_data.element_images;
            break;
          case 'scene_generation':
            content = version.content_data.scene_generation;
            break;
          case 'scene_videos':
            content = version.content_data.scene_videos;
            break;
          case 'final_assembly':
            content = version.content_data.final_assembly;
            break;
        }
        
        if (content) {
          setJsonContent(JSON.stringify(content, null, 2))
          setHasUnsavedChanges(true) // Mark as modified since we loaded different content
          setShowVersionHistory(false)
        }
      }
    }
  }, [phases])

  const handleJsonChange = useCallback((value: string) => {
    setJsonContent(value)
    setHasUnsavedChanges(true)
  }, [])

  const handleSavePhase = useCallback(async () => {
    const selectedPhaseData = phases.find(p => p.phase_name === selectedPhase)
    if (!selectedPhaseData || !jsonContent.trim()) {
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
          project_dest_folder: parsedContent.project_dest_folder || `${project?.name}_${Date.now()}`
        }
      }

      // Save content to database
      const success = await updatePhaseContent(
        selectedPhaseData.id,
        { script_interpretation: scriptContent },
        'Script interpretation generated and saved'
      )

      if (success) {
        // Save and unlock next phase
        await savePhaseAndUnlockNext(selectedPhaseData.id)
        setHasUnsavedChanges(false)
        
        // Refresh database status to show updated version
        await loadPhaseContent(selectedPhaseData.id)
        await loadProject() // Refresh parent component
      } else {
        setError('Failed to save content to database')
      }

    } catch (parseError) {
      setError('Invalid JSON format. Please check the content.')
      console.error('JSON parse error:', parseError)
    } finally {
      setIsSaving(false)
    }
  }, [selectedPhase, phases, jsonContent, project])

  const renderViewContent = () => {
    const selectedPhaseData = phases.find(p => p.phase_name === selectedPhase)
    if (!selectedPhaseData || !project) return null

    // BASIC FOUNDATION: ALL phases show Phase 1 script content for JSON and Timeline
    const getFoundationContent = () => {
      const phase1 = phases.find(p => p.phase_name === 'script_interpretation');
      return phase1?.content_data?.script_interpretation || null;
    };
    
    const foundationContent = getFoundationContent();

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
                {jsonContent || foundationContent ? 'Foundation content loaded' : 'No content - Complete Phase 1 first'}
              </span>
            </div>
            <div className="json-editor">
              {jsonContent || (foundationContent ? JSON.stringify(foundationContent, null, 2) : 'No script interpretation content available - Please complete Phase 1 first to proceed with subsequent phases.')}
            </div>
          </div>
        )

      case 'timeline':
        if (foundationContent) {
          return (
            <DirectorsTimeline 
              content={foundationContent}
              projectId={project.id}
              projectName={project.name}
              onContentUpdate={() => {
                // Reload project data when timeline content updates
                loadProject()
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
        return (
          <div className="view-placeholder">
            <div className="view-placeholder-icon">🎨</div>
            <h3 className="view-placeholder-title">Style Control</h3>
            <p>Global style configuration coming soon</p>
          </div>
        )

      default:
        return null
    }
  }

  const renderPhaseContent = () => {
    const selectedPhaseData = phases.find(p => p.phase_name === selectedPhase)
    if (!selectedPhaseData || !project) return null

    // Render specific phase modules
    if (selectedPhase === 'script_interpretation') {
      return (
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
          onSavePhase={handleSavePhase}
          onLoadPhaseContent={loadPhaseContent}
          onLoadVersionHistory={loadVersionHistory}
          onLoadVersionContent={loadVersionContent}
          onShowVersionHistory={setShowVersionHistory}
        />
      )
    }

    // Placeholder for other phases
    return (
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
            {project.project_metadata.client}
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
                <div className="phase-button-header">
                  <div className="phase-button-left">
                    <span className="phase-icon">
                      {getPhaseIcon(phase.phase_name)}
                    </span>
                    <span className="phase-number">
                      {phase.phase_index}
                    </span>
                  </div>
                  
                  <div 
                    className="phase-status-dot"
                    style={{
                      background: getPhaseStatusColor(phase)
                    }}
                  />
                </div>
                
                <div className="phase-name">
                  {getPhaseDisplayName(phase.phase_name)}
                </div>
                
                <div className="phase-status-text">
                  {getPhaseStatusText(phase)}
                  {phase.current_version > 0 && ` (v${phase.current_version})`}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="progress-summary">
          <strong>Progress:</strong>{' '}
          {phases.filter(p => p.user_saved).length} of 5 phases completed
        </div>
      </div>

      {/* Main content area */}
      <div className="project-main-content">
        
        {/* AREA 1: GLOBAL PROJECT NAVIGATION */}
        <div className="project-area project-area-1">
          <div className="project-area-header area-header-1">
            🧭 AREA 1: GLOBAL NAVIGATION (4 TABS)
          </div>
          <ProjectViewNavigation 
            activeView={selectedView} 
            onViewChange={setSelectedView} 
          />
        </div>

        {/* AREA 2: PHASE-SPECIFIC CONTENT */}
        <div className="project-area project-area-2">
          <div className="project-area-header area-header-2">
            🔧 AREA 2: PHASE-SPECIFIC CONTROLS & STATUS
          </div>
          {renderPhaseContent()}
        </div>

        {/* AREA 3: VIEW CONTENT */}
        <div className="project-area project-area-3">
          <div className="project-area-header area-header-3">
            📄 AREA 3: VIEW CONTENT (JSON | TIMELINE | ELEMENTS | STYLE)
          </div>
          {renderViewContent()}
        </div>

      </div>
    </div>
  )
}