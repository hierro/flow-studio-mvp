// Database utilities for FLOW.STUDIO MVP
// Supabase integration with enhanced 5-phase workflow schema

import { createClient } from '@supabase/supabase-js'
import type { 
  Project, 
  ProjectPhase, 
  PhaseVersion, 
  N8NJob, 
  PhaseName, 
  PhaseContent,
  ProjectCardData,
  ItalianCampaignMetadata,
  GlobalStyle
} from '../types/project'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

// Italian campaign template data
const ITALIAN_CAMPAIGN_TEMPLATE: ItalianCampaignMetadata = {
  title: "UN CONSIGLIO STELLARE",
  client: "Ministero della Salute",
  extraction_date: new Date().toISOString().split('T')[0],
  schema_version: "1.0",
  production_workflow: "animatic_to_video_scalable"
}

const DEFAULT_GLOBAL_STYLE: GlobalStyle = {
  color_palette: {
    primary: "Deep blue backgrounds (library, tech elements)",
    secondary: "Warm amber/golden lighting",
    character_tones: "Natural skin tones, blue uniforms"
  },
  rendering_style: {
    level: "simplified illustration transitioning to cinematic realism",
    line_work: "clean vector-style outlines",
    detail_level: "stylized but scalable to photorealistic"
  }
}

// Phase configuration
const PHASE_CONFIG: Array<{
  phase_name: PhaseName;
  phase_index: number;
  display_name: string;
}> = [
  { phase_name: 'script_interpretation', phase_index: 1, display_name: 'Script Interpretation' },
  { phase_name: 'element_images', phase_index: 2, display_name: 'Element Images' },
  { phase_name: 'scene_generation', phase_index: 3, display_name: 'Scene Generation' },
  { phase_name: 'scene_videos', phase_index: 4, display_name: 'Scene Videos' },
  { phase_name: 'final_assembly', phase_index: 5, display_name: 'Final Assembly' }
]

// PROJECT OPERATIONS

export async function createProject(name: string, userId: string): Promise<{ project: Project; phases: ProjectPhase[] } | null> {
  try {
    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        user_id: userId,
        status: 'active',
        project_metadata: ITALIAN_CAMPAIGN_TEMPLATE,
        global_style: DEFAULT_GLOBAL_STYLE
      })
      .select()
      .single()

    if (projectError || !project) {
      console.error('Error creating project:', projectError)
      return null
    }

    // Create all 5 phases
    const phasesToInsert = PHASE_CONFIG.map((config, index) => ({
      project_id: project.id,
      phase_name: config.phase_name,
      phase_index: config.phase_index,
      status: 'pending' as const,
      can_proceed: index === 0, // Only first phase can proceed initially
      current_version: 0,
      user_saved: false
    }))

    const { data: phases, error: phasesError } = await supabase
      .from('project_phases')
      .insert(phasesToInsert)
      .select()

    if (phasesError || !phases) {
      console.error('Error creating phases:', phasesError)
      // Cleanup project if phases failed
      await supabase.from('projects').delete().eq('id', project.id)
      return null
    }

    return { project, phases }
  } catch (error) {
    console.error('Error in createProject:', error)
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
        project_phases!inner(
          phase_index,
          status,
          user_saved,
          phase_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !projects) {
      console.error('Error fetching projects:', error)
      return []
    }

    return projects.map(project => {
      const phases = project.project_phases as ProjectPhase[]
      const completedPhases = phases.filter(p => p.user_saved).length
      const currentPhase = phases.find(p => p.status === 'processing')?.phase_name || 
                          phases.find(p => p.can_proceed && !p.user_saved)?.phase_name ||
                          null

      return {
        id: project.id,
        name: project.name,
        status: project.status,
        created_at: project.created_at,
        phase_progress: {
          completed_phases: completedPhases,
          total_phases: 5,
          current_phase: currentPhase
        }
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

export async function getProjectPhases(projectId: string): Promise<ProjectPhase[]> {
  try {
    const { data, error } = await supabase
      .from('project_phases')
      .select('*')
      .eq('project_id', projectId)
      .order('phase_index', { ascending: true })

    if (error || !data) {
      console.error('Error fetching phases:', error)
      return []
    }

    return data
  } catch (error) {
    console.error('Error in getProjectPhases:', error)
    return []
  }
}

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

export async function updatePhaseContent(
  phaseId: string, 
  content: PhaseContent, 
  description?: string
): Promise<boolean> {
  try {
    // Get current phase to check version
    const currentPhase = await getPhase(phaseId)
    if (!currentPhase) return false

    const newVersion = currentPhase.current_version + 1

    // Start transaction
    const { error: updateError } = await supabase
      .from('project_phases')
      .update({
        content_data: content,
        current_version: newVersion,
        last_modified_at: new Date().toISOString()
      })
      .eq('id', phaseId)

    if (updateError) {
      console.error('Error updating phase:', updateError)
      return false
    }

    // Create version record
    const { error: versionError } = await supabase
      .from('phase_versions')
      .insert({
        phase_id: phaseId,
        version_number: newVersion,
        content_data: content,
        change_description: description || 'Content updated'
      })

    if (versionError) {
      console.error('Error creating version:', versionError)
      // Don't return false here - the main update succeeded
    }

    return true
  } catch (error) {
    console.error('Error in updatePhaseContent:', error)
    return false
  }
}

export async function savePhaseAndUnlockNext(phaseId: string): Promise<boolean> {
  try {
    // Get current phase
    const phase = await getPhase(phaseId)
    if (!phase) return false

    // Mark current phase as saved
    const { error: saveError } = await supabase
      .from('project_phases')
      .update({
        user_saved: true,
        status: 'completed'
      })
      .eq('id', phaseId)

    if (saveError) {
      console.error('Error saving phase:', saveError)
      return false
    }

    // Unlock next phase if it exists
    const nextPhaseIndex = phase.phase_index + 1
    if (nextPhaseIndex <= 5) {
      const { error: unlockError } = await supabase
        .from('project_phases')
        .update({ can_proceed: true })
        .eq('project_id', phase.project_id)
        .eq('phase_index', nextPhaseIndex)

      if (unlockError) {
        console.error('Error unlocking next phase:', unlockError)
      }
    }

    return true
  } catch (error) {
    console.error('Error in savePhaseAndUnlockNext:', error)
    return false
  }
}

// N8N JOB OPERATIONS

export async function createN8NJob(
  projectId: string,
  phaseName: PhaseName,
  workflowId: string,
  inputData: any
): Promise<N8NJob | null> {
  try {
    const { data, error } = await supabase
      .from('n8n_jobs')
      .insert({
        project_id: projectId,
        phase_name: phaseName,
        workflow_id: workflowId,
        input_data: inputData,
        status: 'pending'
      })
      .select()
      .single()

    if (error || !data) {
      console.error('Error creating N8N job:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error in createN8NJob:', error)
    return null
  }
}

export async function updateN8NJobStatus(
  jobId: string,
  status: N8NJob['status'],
  outputData?: any,
  errorMessage?: string
): Promise<boolean> {
  try {
    const updateData: any = { status }
    
    if (status === 'running') {
      updateData.started_at = new Date().toISOString()
    } else if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString()
    }

    if (outputData) updateData.output_data = outputData
    if (errorMessage) updateData.error_message = errorMessage

    const { error } = await supabase
      .from('n8n_jobs')
      .update(updateData)
      .eq('id', jobId)

    if (error) {
      console.error('Error updating N8N job:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateN8NJobStatus:', error)
    return false
  }
}

// UTILITY FUNCTIONS

export function getPhaseDisplayName(phaseName: PhaseName): string {
  const config = PHASE_CONFIG.find(p => p.phase_name === phaseName)
  return config?.display_name || phaseName
}

export function getNextPhaseName(currentPhase: PhaseName): PhaseName | null {
  const currentIndex = PHASE_CONFIG.findIndex(p => p.phase_name === currentPhase)
  const nextPhase = PHASE_CONFIG[currentIndex + 1]
  return nextPhase?.phase_name || null
}

export { supabase }