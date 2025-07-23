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
    <div className="min-h-screen bg-primary p-2xl">
      <div className="dashboard-container">
        <div className="flex justify-between items-center mb-2xl">
          <h1 className="text-3xl font-bold text-primary">Projects</h1>
          <div className="flex gap-xl items-center">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              New Project
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-logout"
            >
              Logout
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-secondary p-2xl">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-secondary p-4xl rounded-lg text-center">
            <h2 className="text-primary mb-xl">No projects yet</h2>
            <p className="text-secondary mb-2xl">
              Create your first FLOW.STUDIO project to get started with AI-powered animatic generation
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-auto-fit gap-2xl">
            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="project-card cursor-pointer"
              >
                <div className="flex justify-between items-start mb-xl">
                  <h3 className="text-primary text-xl flex-1 mb-0">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-md">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(project.id)
                      }}
                      className="btn-delete"
                    >
                      🗑️
                    </button>
                    <span className="status-badge" style={{
                      background: getStatusColor(project.status)
                    }}>
                      {project.status}
                    </span>
                  </div>
                </div>

                <div className="project-progress">
                  <div className="flex justify-between text-secondary text-sm mb-sm">
                    <span>Progress</span>
                    <span>{project.phase_progress.completed_phases}/5 phases</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{
                        width: `${(project.phase_progress.completed_phases / 5) * 100}%`
                      }}
                    />
                  </div>
                </div>

                <div className="project-info">
                  <span>Created {formatDate(project.created_at)}</span>
                  {project.phase_progress.current_phase && (
                    <span className="current-phase">
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
          <div className="modal-overlay">
            <div className="modal-content modal-width-400">
              <h2 className="modal-header">
                Create New Project
              </h2>
              
              <div className="mb-xl">
                <label className="form-label">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. UN CONSIGLIO STELLARE"
                  className="form-input"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                  autoFocus
                />
              </div>

              <div className="modal-info">
                <p>
                  This will create a new project with 5 phases: Script Interpretation, 
                  Element Images, Scene Generation, Scene Videos, and Final Assembly.
                  Based on the Italian campaign template.
                </p>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewProjectName('')
                  }}
                  disabled={createLoading}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || createLoading}
                  className="btn btn-primary"
                >
                  {createLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Project Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="modal-overlay">
            <div className="modal-content delete-modal modal-width-400">
              <h2 className="delete-header">
                ⚠️ Delete Project?
              </h2>
              
              <div className="delete-warning">
                <p>
                  This will permanently delete:
                </p>
                <ul>
                  <li>All project data and phases</li>
                  <li>All generated content and versions</li>
                  <li>All n8n job history</li>
                </ul>
                <p className="warning-final">
                  This action cannot be undone!
                </p>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={deleteLoading}
                  className="btn btn-secondary btn-padding-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteProject(showDeleteConfirm)}
                  disabled={deleteLoading}
                  className="btn btn-danger btn-padding-lg"
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