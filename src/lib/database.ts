// Database utilities for FLOW.STUDIO MVP
// Schema v3.0 - Clean master JSON architecture

import type { 
  Project, 
  ProjectPhase, 
  ProjectVersion, 
  N8NJob, 
  PhaseName,
  ProjectCardData
} from '../types/project'
import { supabase } from './supabase'
import { PhaseCompletion } from '../utils/PhaseCompletion'

// Minimal default master JSON - n8n webhook will populate with real data
const DEFAULT_MASTER_JSON = {
  scenes: {},
  elements: {},
  project_metadata: {
    title: "New Project",
    client: "Client Name",
    schema_version: "3.0",
    production_workflow: "animatic_to_video_scalable"
  }
}

// Phase configuration (phases are auto-created by database trigger)
const PHASE_DISPLAY_NAMES: Record<PhaseName, string> = {
  'script_interpretation': 'Script Interpretation',
  'element_images': 'Element Images', 
  'scene_generation': 'Scene Generation',
  'scene_videos': 'Scene Videos',
  'final_assembly': 'Final Assembly'
}

// PROJECT OPERATIONS

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    // 1. Get all asset filenames before deletion for storage cleanup
    const { data: assets } = await supabase
      .from('project_assets')
      .select('asset_filename')
      .eq('project_id', projectId);

    // 2. Delete project (cascade will handle related records)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Error deleting project:', error)
      return false
    }

    // 3. Clean up storage files
    if (assets && assets.length > 0) {
      // First, remove all files in the project folder
      const { data: files, error: listError } = await supabase.storage
        .from('scene-images')
        .list(`projects/${projectId}/scenes`);
      
      if (!listError && files && files.length > 0) {
        const filePaths = files.map(file => `projects/${projectId}/scenes/${file.name}`);
        
        const { error: storageError } = await supabase.storage
          .from('scene-images')
          .remove(filePaths);
        
        if (storageError) {
          console.warn('Storage cleanup failed (non-critical):', storageError);
        } else {
          console.log(`✅ Cleaned up ${filePaths.length} storage files`);
        }
      }
      
      // Also try to remove the project folder structure if empty
      try {
        await supabase.storage
          .from('scene-images')
          .remove([`projects/${projectId}/scenes`, `projects/${projectId}`]);
      } catch (folderError) {
        // Folder cleanup is optional - may fail if not empty
        console.log('Folder cleanup completed (or folders non-empty)');
      }
    }

    return true
  } catch (error) {
    console.error('Error in deleteProject:', error)
    return false
  }
}

export async function createProject(name: string, userId: string): Promise<{ project: Project; phases: ProjectPhase[] } | null> {
  try {
    // Set initial master JSON with project name
    const initialMasterJSON = {
      ...DEFAULT_MASTER_JSON,
      project_metadata: {
        ...DEFAULT_MASTER_JSON.project_metadata,
        title: name
      }
    }

    // Create project with master JSON
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        user_id: userId,
        status: 'active',
        master_json: initialMasterJSON,
        current_version: 0
      })
      .select()
      .single()

    if (projectError || !project) {
      console.error('Error creating project:', projectError)
      return null
    }

    // Don't create initial version - let first user save create version 1

    // Phases are automatically created by database trigger
    // Get the created phases
    const { data: phases, error: phasesError } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', project.id)
      .order('phase_index')

    if (phasesError || !phases) {
      console.error('Error fetching phases:', phasesError)
      return { project, phases: [] }
    }

    return { project, phases }
  } catch (error) {
    console.error('Error in createProject:', error)
    return null
  }
}

// MASTER JSON OPERATIONS

export async function getMasterJSON(projectId: string): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('master_json')
      .eq('id', projectId)
      .single()

    if (error || !data) {
      console.error('Error fetching master JSON:', error)
      return null
    }

    return data.master_json
  } catch (error) {
    console.error('Error in getMasterJSON:', error)
    return null
  }
}

export async function saveMasterJSON(
  projectId: string, 
  jsonString: string, 
  description = 'Master JSON updated'
): Promise<boolean> {
  try {
    // Parse JSON
    const parsedJSON = JSON.parse(jsonString)
    
    // Just update the master JSON - fuck the versioning for now
    const { error } = await supabase
      .from('projects')
      .update({
        master_json: parsedJSON,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (error) {
      console.error('Error updating master JSON:', error)
      console.error('Full error details:', JSON.stringify(error, null, 2))
      return false
    }

    return true
  } catch (error) {
    console.error('Error in saveMasterJSON:', error)
    return false
  }
}

// Update master JSON without creating version (for editing/n8n webhook)
export async function updateMasterJSON(
  projectId: string, 
  masterJSON: any
): Promise<boolean> {
  try {
    // Update only master_json without incrementing current_version
    // This will NOT create a version since trigger only fires on version increment
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        master_json: masterJSON,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Error updating master JSON (no version):', updateError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateMasterJSON:', error)
    return false
  }
}

// Save master JSON from object and create new version (for explicit user saves)  
export async function saveMasterJSONFromObject(
  projectId: string, 
  masterJSON: any, 
  description = 'Master JSON updated'
): Promise<boolean> {
  try {
    // Get current version
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('current_version')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('Error fetching project for version:', projectError)
      return false
    }

    const newVersion = project.current_version + 1

    // Update master JSON and increment version (this will trigger version creation)
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        master_json: masterJSON,
        current_version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (updateError) {
      console.error('Error updating master JSON:', updateError)
      return false
    }

    // Version history is automatically created by database trigger
    return true
  } catch (error) {
    console.error('Error in saveMasterJSONFromObject:', error)
    return false
  }
}

// VERSION HISTORY OPERATIONS

export async function getProjectVersions(projectId: string): Promise<ProjectVersion[]> {
  try {
    const { data, error } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('version_number', { ascending: false })

    if (error || !data) {
      console.error('Error fetching project versions:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('Error in getProjectVersions:', error)
    return []
  }
}

export async function getProjectVersion(
  projectId: string, 
  versionNumber: number
): Promise<ProjectVersion | null> {
  try {
    const { data, error } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .eq('version_number', versionNumber)
      .single()

    if (error || !data) {
      console.error('Error fetching project version:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getProjectVersion:', error)
    return null
  }
}

export async function getUserProjects(userId: string): Promise<ProjectCardData[]> {
  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        name,
        status,
        created_at,
        master_json,
        project_phases(
          phase_index,
          status,
          phase_name,
          can_proceed,
          completed_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !projects) {
      console.error('Error fetching projects:', error)
      return []
    }

    return projects.map(project => {
      // Clean architecture: Phase progress based on content state, not database flags
      const phaseProgress = PhaseCompletion.getPhaseProgress(project.master_json);
      
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        created_at: project.created_at,
        phase_progress: phaseProgress
      }
    })
  } catch (error) {
    console.error('Error in getUserProjects:', error)
    return []
  }
}

export async function getProject(projectId: string): Promise<Project | null> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error || !data) {
      console.error('Error fetching project:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getProject:', error)
    return null
  }
}

// PHASE OPERATIONS

// N8N JOB OPERATIONS

export async function createN8NJob(
  projectId: string,
  phaseName: string,
  payload: any,
  workflowId: string = 'TESTA_ANIMATIC'
): Promise<string | null> {
  try {
    const jobId = crypto.randomUUID()
    
    const { error } = await supabase
      .from('n8n_jobs')
      .insert({
        id: jobId,
        project_id: projectId,
        phase_name: phaseName,
        workflow_id: workflowId,
        status: 'pending',
        input_data: payload
      })

    if (error) {
      console.error('Error creating n8n job:', error)
      return null
    }

    return jobId
  } catch (error) {
    console.error('Error in createN8NJob:', error)
    return null
  }
}

export async function updateN8NJob(
  jobId: string,
  status: string,
  resultData?: any,
  errorMessage?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      status
    }
    
    if (resultData) updateData.output_data = resultData
    if (errorMessage) updateData.error_message = errorMessage
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('n8n_jobs')
      .update(updateData)
      .eq('id', jobId)

    if (error) {
      console.error('Error updating n8n job:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateN8NJob:', error)
    return false
  }
}

export async function getN8NJob(jobId: string): Promise<N8NJob | null> {
  try {
    const { data, error } = await supabase
      .from('n8n_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !data) {
      console.error('Error fetching n8n job:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getN8NJob:', error)
    return null
  }
}

export async function getProjectPhases(projectId: string): Promise<ProjectPhase[]> {
  try {
    // Get phases and project data together
    const [phasesResult, projectResult] = await Promise.all([
      supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_index', { ascending: true }),
      supabase
        .from('projects')
        .select('master_json')
        .eq('id', projectId)
        .single()
    ])

    if (phasesResult.error || !phasesResult.data) {
      console.error('Error fetching phases:', phasesResult.error)
      return []
    }

    if (projectResult.error || !projectResult.data) {
      console.error('Error fetching project:', projectResult.error)
      // Return phases with default can_proceed values if master JSON unavailable
      return phasesResult.data.map(phase => ({
        ...phase,
        can_proceed: phase.phase_index === 1 // Only Phase 1 available without master JSON
      }))
    }

    const phases = phasesResult.data
    const masterJSON = projectResult.data.master_json

    // Calculate can_proceed based on actual data state (not triggers)
    const phasesWithLogic = phases.map(phase => {
      let canProceed = false

      if (phase.phase_index === 1) {
        // Phase 1 always available
        canProceed = true
      } else if (phase.phase_index === 2 || phase.phase_index === 3) {
        // Phase 2 & 3 available if master JSON has valid scene content
        canProceed = masterJSON && 
                    masterJSON.scenes && 
                    Object.keys(masterJSON.scenes).length > 0
      }
      // Phase 4 and 5 remain locked for now - will add rules later when needed

      return {
        ...phase,
        can_proceed: canProceed
      }
    })

    return phasesWithLogic
  } catch (error) {
    console.error('Error in getProjectPhases:', error)
    // Return empty array on critical error
    return []
  }
}

// MISSING FUNCTIONS - Add these to prevent runtime errors
export async function getPhase(phaseId: string): Promise<ProjectPhase | null> {
  try {
    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('id', phaseId)
      .single()

    if (error || !data) {
      console.error('Error fetching phase:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in getPhase:', error)
    return null
  }
}

// DEPRECATED: This function should not be used in master JSON architecture
// Use saveMasterJSON() instead for all content updates
export async function updatePhaseContent(
  phaseId: string, 
  content: any, 
  description: string
): Promise<boolean> {
  console.error('updatePhaseContent is deprecated - use saveMasterJSON instead')
  return false
}

export async function savePhaseAndUnlockNext(phaseId: string): Promise<boolean> {
  try {
    // Mark current phase as user saved and completed, unlock next phase
    const { error: updateError } = await supabase
      .from('project_phases')
      .update({ 
        status: 'completed',
        user_saved: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', phaseId)

    if (updateError) {
      console.error('Error updating phase status:', updateError)
      console.error('Update error details:', JSON.stringify(updateError, null, 2))
      return false
    }

    // Verify the update actually worked
    const { data: verifyPhase, error: verifyError } = await supabase
      .from('project_phases')
      .select('id, phase_name, status, user_saved, completed_at')
      .eq('id', phaseId)
      .single()

    if (verifyError || !verifyPhase) {
      console.error('Error verifying phase update:', verifyError)
      return false
    }

    console.log('Phase update verification:', {
      id: verifyPhase.id,
      phase_name: verifyPhase.phase_name,
      status: verifyPhase.status,
      user_saved: verifyPhase.user_saved,
      completed_at: verifyPhase.completed_at
    })

    if (verifyPhase.status !== 'completed') {
      console.error('Phase update failed - status is not completed:', verifyPhase.status)
      return false
    }

    // Get current phase to find next phase
    const currentPhase = await getPhase(phaseId)
    if (!currentPhase) return false

    // Unlock phases based on workflow logic
    let unlockPhases: number[] = []
    
    if (currentPhase.phase_index === 1) {
      // Phase 1 completion unlocks Phase 2 (optional reference images) and Phase 3 (scene generation)
      unlockPhases = [2, 3]
    } else if (currentPhase.phase_index === 2) {
      // Phase 2 completion doesn't unlock anything new (Phase 3 already unlocked by Phase 1)
      unlockPhases = []
    } else if (currentPhase.phase_index === 3) {
      // Phase 3 completion unlocks Phase 4 (scene videos)
      unlockPhases = [4]
    } else if (currentPhase.phase_index === 4) {
      // Phase 4 completion unlocks Phase 5 (final assembly)
      unlockPhases = [5]
    }

    // Update all phases that should be unlocked
    if (unlockPhases.length > 0) {
      const { error: unlockError } = await supabase
        .from('project_phases')
        .update({ can_proceed: true })
        .eq('project_id', currentPhase.project_id)
        .in('phase_index', unlockPhases)

      if (unlockError) {
        console.error('Error unlocking phases:', unlockError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in savePhaseAndUnlockNext:', error)
    return false
  }
}

// App Configuration Functions
export async function getAppConfiguration(): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('app_configuration')
      .select('config_data')
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (error) {
      console.error('Error loading app configuration:', error);
      return {};
    }
    
    if (!data || data.length === 0) {
      console.log('No app configuration found in database');
      return {};
    }
    
    return data[0]?.config_data || {};
  } catch (error) {
    console.error('Error loading app configuration:', error);
    return {};
  }
}

export async function saveAppConfiguration(configData: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('app_configuration')
      .upsert({
        config_data: configData,
        updated_at: new Date().toISOString()
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving app configuration:', error);
    return false;
  }
}
