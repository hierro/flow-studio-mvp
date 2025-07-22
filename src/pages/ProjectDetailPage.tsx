import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProject, getProjectPhases } from '../lib/database'
import type { Project, ProjectPhase, PhaseName } from '../types/project'
import ScriptInterpretationModule from '../components/ScriptInterpretationModule'

interface ProjectDetailPageProps {
  user: any
}

export default function ProjectDetailPage({ user }: ProjectDetailPageProps) {
  const { id: projectId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [phases, setPhases] = useState<ProjectPhase[]>([])
  const [selectedPhase, setSelectedPhase] = useState<PhaseName | null>(null)
  const [loading, setLoading] = useState(true)

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
    
    // Select first available phase
    const firstAvailablePhase = phasesData.find(p => p.can_proceed)
    if (firstAvailablePhase) {
      setSelectedPhase(firstAvailablePhase.phase_name)
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
        />
      )
    }

    // Placeholder for other phases
    return (
      <div style={{ flex: 1, padding: '2rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h2 style={{
              color: '#fff',
              fontSize: '1.75rem',
              margin: 0,
              marginBottom: '0.5rem'
            }}>
              {getPhaseIcon(selectedPhaseData.phase_name)} {getPhaseDisplayName(selectedPhaseData.phase_name)}
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              color: '#ccc'
            }}>
              <span>Phase {selectedPhaseData.phase_index} of 5</span>
              <span style={{
                background: getPhaseStatusColor(selectedPhaseData),
                color: '#fff',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 'bold'
              }}>
                {getPhaseStatusText(selectedPhaseData)}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          background: '#1a1a1a',
          borderRadius: '8px',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {getPhaseIcon(selectedPhaseData.phase_name)}
            </div>
            <h3 style={{ color: '#ccc', marginBottom: '1rem' }}>
              {getPhaseDisplayName(selectedPhaseData.phase_name)} Module
            </h3>
            <p style={{ maxWidth: '400px', lineHeight: '1.6' }}>
              This phase module will be implemented next. It will handle the {selectedPhaseData.phase_name.replace('_', ' ')} 
              workflow including n8n integration, content generation, and user approval interface.
            </p>
            {selectedPhaseData.can_proceed && !selectedPhaseData.user_saved && (
              <div style={{ marginTop: '2rem' }}>
                <button
                  style={{
                    background: '#0066cc',
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
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
      <div style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        Loading project...
      </div>
    )
  }

  if (!project || !projectId) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff'
      }}>
        Project not found
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex' }}>
      {/* Sidebar with phase navigation */}
      <div style={{
        width: '320px',
        background: '#1a1a1a',
        padding: '2rem',
        borderRight: '1px solid #333'
      }}>
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'none',
              border: 'none',
              color: '#ccc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1rem',
              padding: '0.5rem',
              borderRadius: '4px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#333'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            ← Back to Projects
          </button>
          
          <h1 style={{
            color: '#fff',
            fontSize: '1.25rem',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            {project.name}
          </h1>
          <p style={{
            color: '#ccc',
            fontSize: '0.9rem',
            margin: 0
          }}>
            {project.project_metadata.client}
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{
            color: '#fff',
            fontSize: '1rem',
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Project Phases
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {phases.map((phase) => (
              <button
                key={phase.id}
                onClick={() => handlePhaseClick(phase)}
                disabled={!phase.can_proceed && !phase.user_saved}
                style={{
                  background: selectedPhase === phase.phase_name ? '#333' : 'transparent',
                  border: `1px solid ${selectedPhase === phase.phase_name ? '#555' : '#333'}`,
                  borderRadius: '8px',
                  padding: '1rem',
                  textAlign: 'left',
                  cursor: (phase.can_proceed || phase.user_saved) ? 'pointer' : 'not-allowed',
                  opacity: (!phase.can_proceed && !phase.user_saved) ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  if (phase.can_proceed || phase.user_saved) {
                    e.currentTarget.style.background = selectedPhase === phase.phase_name ? '#444' : '#2a2a2a'
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = selectedPhase === phase.phase_name ? '#333' : 'transparent'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {getPhaseIcon(phase.phase_name)}
                    </span>
                    <span style={{
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}>
                      {phase.phase_index}
                    </span>
                  </div>
                  
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getPhaseStatusColor(phase)
                  }} />
                </div>
                
                <div style={{
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  marginBottom: '0.25rem'
                }}>
                  {getPhaseDisplayName(phase.phase_name)}
                </div>
                
                <div style={{
                  color: '#999',
                  fontSize: '0.75rem'
                }}>
                  {getPhaseStatusText(phase)}
                  {phase.current_version > 0 && ` (v${phase.current_version})`}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{
          padding: '1rem',
          background: '#333',
          borderRadius: '4px',
          fontSize: '0.85rem',
          color: '#ccc'
        }}>
          <strong style={{ color: '#fff' }}>Progress:</strong>{' '}
          {phases.filter(p => p.user_saved).length} of 5 phases completed
        </div>
      </div>

      {/* Main content area */}
      {renderPhaseContent()}
    </div>
  )
}