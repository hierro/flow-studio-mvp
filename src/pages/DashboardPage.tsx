import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserProjects, createProject, deleteProject } from '../lib/database'
import { supabase } from '../lib/supabase'
import type { ProjectCardData } from '../types/project'

interface DashboardPageProps {
  user: any
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [user])

  const loadProjects = async () => {
    if (!user) return
    
    setLoading(true)
    const userProjects = await getUserProjects(user.id)
    setProjects(userProjects)
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user || createLoading) return

    setCreateLoading(true)
    const result = await createProject(newProjectName.trim(), user.id)
    
    if (result) {
      setShowCreateModal(false)
      setNewProjectName('')
      await loadProjects() // Reload projects
    } else {
      alert('Error creating project. Please try again.')
    }
    
    setCreateLoading(false)
  }

  const handleProjectClick = (projectId: string) => {
    navigate(`/project/${projectId}`)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!projectId || deleteLoading) return

    setDeleteLoading(true)
    const success = await deleteProject(projectId)
    
    if (success) {
      setShowDeleteConfirm(null)
      await loadProjects() // Reload projects
    } else {
      alert('Error deleting project. Please try again.')
    }
    
    setDeleteLoading(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#00cc00'
      case 'completed': return '#0066cc'
      case 'archived': return '#666'
      default: return '#ccc'
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>Projects</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: '#0066cc',
                color: '#fff',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              New Project
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: '#cc0000',
                color: '#fff',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#ccc', padding: '2rem' }}>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div style={{
            background: '#1a1a1a',
            padding: '3rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#fff', marginBottom: '1rem' }}>No projects yet</h2>
            <p style={{ color: '#ccc', marginBottom: '2rem' }}>
              Create your first FLOW.STUDIO project to get started with AI-powered animatic generation
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
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
              Create Your First Project
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                style={{
                  background: '#1a1a1a',
                  padding: '1.5rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '1px solid #333',
                  transition: 'border-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#555'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    color: '#fff',
                    fontSize: '1.25rem',
                    margin: 0,
                    flex: 1
                  }}>
                    {project.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(project.id)
                      }}
                      style={{
                        background: '#cc0000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.25rem 0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        opacity: 0.8
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                    >
                      🗑️
                    </button>
                    <span style={{
                      background: getStatusColor(project.status),
                      color: '#fff',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      {project.status}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    color: '#ccc',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                  }}>
                    <span>Progress</span>
                    <span>{project.phase_progress.completed_phases}/5 phases</span>
                  </div>
                  <div style={{
                    background: '#333',
                    height: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: '#0066cc',
                      height: '100%',
                      width: `${(project.phase_progress.completed_phases / 5) * 100}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#999',
                  fontSize: '0.85rem'
                }}>
                  <span>Created {formatDate(project.created_at)}</span>
                  {project.phase_progress.current_phase && (
                    <span style={{ color: '#00cc00' }}>
                      Active: {project.phase_progress.current_phase.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateModal && (
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
              width: '400px',
              maxWidth: '90vw'
            }}>
              <h2 style={{
                color: '#fff',
                marginBottom: '1.5rem',
                fontSize: '1.5rem'
              }}>
                Create New Project
              </h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  color: '#ccc',
                  marginBottom: '0.5rem'
                }}>
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. UN CONSIGLIO STELLARE"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#333',
                    color: '#fff',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                  autoFocus
                />
              </div>

              <div style={{
                background: '#333',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1.5rem'
              }}>
                <p style={{ color: '#ccc', fontSize: '0.9rem', margin: 0 }}>
                  This will create a new project with 5 phases: Script Interpretation, 
                  Element Images, Scene Generation, Scene Videos, and Final Assembly.
                  Based on the Italian campaign template.
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewProjectName('')
                  }}
                  disabled={createLoading}
                  style={{
                    background: '#666',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: createLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || createLoading}
                  style={{
                    background: !newProjectName.trim() || createLoading ? '#555' : '#0066cc',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !newProjectName.trim() || createLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {createLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Project Confirmation Modal */}
        {showDeleteConfirm && (
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
              width: '400px',
              maxWidth: '90vw',
              border: '1px solid #cc0000'
            }}>
              <h2 style={{
                color: '#ff9999',
                marginBottom: '1rem',
                fontSize: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ⚠️ Delete Project?
              </h2>
              
              <div style={{
                background: '#330000',
                border: '1px solid #cc0000',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1.5rem'
              }}>
                <p style={{ color: '#ff9999', margin: 0, marginBottom: '0.5rem' }}>
                  This will permanently delete:
                </p>
                <ul style={{ color: '#ffcccc', margin: 0, paddingLeft: '1.5rem' }}>
                  <li>All project data and phases</li>
                  <li>All generated content and versions</li>
                  <li>All n8n job history</li>
                </ul>
                <p style={{ color: '#ff6666', margin: 0, marginTop: '0.5rem', fontWeight: 'bold' }}>
                  This action cannot be undone!
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={deleteLoading}
                  style={{
                    background: '#666',
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deleteLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProject(showDeleteConfirm)}
                  disabled={deleteLoading}
                  style={{
                    background: deleteLoading ? '#880000' : '#cc0000',
                    color: '#fff',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {deleteLoading ? '🗑️ Deleting...' : '🗑️ Delete Forever'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}