FLOW STUDIO MVP - COMPLETE WORKING PATTERNS FOR CLAUDE WEB
=========================================================
Generated: 2025-07-22T19:07:05.773Z
Purpose: Show actual working code for proper development planning and suggestions

## CURRENT STATUS & CRITICAL INSIGHT
Foundation Complete ✅ | Next Priority: Structured Phase 1 Editor

EVOLUTION: Next.js (3.3s startup) → Vite (423ms) for 10x faster development
ARCHITECTURE: Vite + React 19 + React Router + Supabase + TypeScript strict
WORKING: Auth, Project Management, Raw JSON Integration, Complete Versioning
CRITICAL GAP: Phase 1 needs structured editor (not raw JSON textarea)
GOAL: Clean data entry prevents garbage cascade through Phase 2-5

## TECH STACK & PERFORMANCE
Framework: Vite 5.4.19 + React 19.1.0 + TypeScript 5 (strict mode)
Routing: React Router 6.28.0 (client-side, auth-based redirects)
Styling: Inline styles (performance-first, no CSS framework)
Database: Supabase PostgreSQL + Auth (RLS, version management)
Build: 2.56s production build, 121 modules, instant HMR

## PROJECT STRUCTURE WITH KEY CODE PATTERNS

### 1. APP ENTRY & ROUTING (src/App.tsx) - WORKING ✅
```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import { supabase } from './lib/supabase'

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

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
        Loading...
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={user ? <DashboardPage user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/project/:id"
        element={user ? <ProjectDetailPage user={user} /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  )
}
```

### 2. AUTHENTICATION IMPLEMENTATION (src/pages/LoginPage.tsx) - WORKING ✅
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setError(error.message)
    } else if (data.user) {
      navigate('/dashboard')
    }
    
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) {
      setError(error.message)
    } else {
      setError('Check your email for confirmation link')
    }
    
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000'
    }}>
      <div style={{
        background: '#1a1a1a',
        padding: '2rem',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90vw'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>Login</h1>
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            required
          />
          
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#555' : '#0066cc',
              color: '#fff',
              padding: '0.75rem',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>
        </form>
        
        <button
          onClick={handleSignUp}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: '1rem',
            background: '#555',
            color: '#fff',
            padding: '0.75rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Create Account
        </button>
        
        {error && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#330000',
            color: '#ff9999',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
```

### 3. DATABASE OPERATIONS (src/lib/database.ts) - KEY FUNCTIONS ✅
```typescript
import type { 
  Project, 
  ProjectPhase, 
  PhaseVersion, 
  PhaseName, 
  PhaseContent,
  ProjectCardData,
  ItalianCampaignMetadata,
  GlobalStyle
} from '../types/project'
import { supabase } from './supabase'

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

    // Update phase content and increment version
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
    }

    return true
  } catch (error) {
    console.error('Error in updatePhaseContent:', error)
    return false
  }
}

export async function savePhaseAndUnlockNext(phaseId: string): Promise<boolean> {
  try {
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
```

### 4. TYPESCRIPT INTERFACES (src/types/project.ts) - COMPLETE SYSTEM ✅
```typescript
// Phase-specific content types (flexible polymorphism)
export type PhaseName = 'script_interpretation' | 'element_images' | 'scene_generation' | 'scene_videos' | 'final_assembly';

export interface PhaseContent {
  script_interpretation?: ScriptInterpretationContent;
  element_images?: ElementImagesContent;
  scene_generation?: SceneGenerationContent;
  scene_videos?: SceneVideosContent;
  final_assembly?: FinalAssemblyContent;
}

// Phase 1: Script Interpretation (from Italian JSON)
export interface ScriptInterpretationContent {
  elements: ItalianCampaignElements;
  scenes: ItalianCampaignScenes;
  extraction_metadata: {
    timestamp: string;
    image_engine: string;
    model_endpoint: string;
    project_dest_folder: string;
  };
}

// Core project types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: string;
  project_metadata: ItalianCampaignMetadata;
  global_style: GlobalStyle;
  created_at: string;
  updated_at: string;
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  phase_name: PhaseName;
  phase_index: number;
  status: 'pending' | 'processing' | 'completed' | 'locked';
  can_proceed: boolean;
  current_version: number;
  content_data: PhaseContent | null;
  user_saved: boolean;
  last_modified_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PhaseVersion {
  id: string;
  phase_id: string;
  version_number: number;
  content_data: PhaseContent;
  change_description: string;
  created_at: string;
  created_by?: string;
}

// Italian campaign structure
export interface ItalianCampaignMetadata {
  title: string;
  client: string;
  extraction_date: string;
  schema_version: string;
  production_workflow: string;
}

export interface GlobalStyle {
  color_palette: {
    primary: string;
    secondary: string;
    character_tones: string;
  };
  rendering_style: {
    level: string;
    line_work: string;
    detail_level: string;
  };
}

// Elements and scenes from Italian campaign
export interface ItalianCampaignElements {
  [elementId: string]: {
    element_type: 'character' | 'location' | 'prop';
    frequency: number;
    scenes_present?: number[];
    base_description: string;
    consistency_rules: string[];
    variants_by_scene?: {
      [sceneId: string]: {
        action: string;
        expression?: string;
        position?: string;
      };
    };
  };
}

export interface ItalianCampaignScenes {
  [sceneId: string]: {
    duration: string;
    camera_type: string;
    mood: string;
    natural_description: string;
    dialogue?: string;
    elements_present: string[];
  };
}
```

### 5. PHASE 1 IMPLEMENTATION (src/components/ScriptInterpretationModule.tsx) - FOUNDATION ✅
```typescript
import { useState, useEffect } from 'react'
import { updatePhaseContent, savePhaseAndUnlockNext, getPhase, getPhaseVersions, getPhaseVersion } from '../lib/database'
import type { ProjectPhase, ScriptInterpretationContent, PhaseVersion } from '../types/project'

// Webhook configuration
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

  // ... rest of component implementation with version management, history viewer, etc.
  
  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '2rem',
      background: '#000',
      overflow: 'hidden'
    }}>
      {/* Full implementation with loading modals, version history, etc. */}
    </div>
  )
}
```

## DATABASE SCHEMA (DEPLOYED & WORKING)
```sql
-- Projects with automatic 5-phase initialization
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  project_metadata JSONB,  -- Italian campaign template
  global_style JSONB,      -- Color palette, rendering style
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5-phase linear workflow with progression logic
CREATE TABLE project_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL, -- 'script_interpretation', etc.
  phase_index INTEGER NOT NULL, -- 1, 2, 3, 4, 5
  status TEXT DEFAULT 'pending',
  can_proceed BOOLEAN DEFAULT false,
  current_version INTEGER DEFAULT 0,
  content_data JSONB, -- Phase output from n8n workflows
  user_saved BOOLEAN DEFAULT false,
  last_modified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, phase_name)
);

-- Complete version history
CREATE TABLE phase_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES project_phases(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_data JSONB,
  change_description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(phase_id, version_number)
);

-- n8n job tracking
CREATE TABLE n8n_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  workflow_id TEXT,
  input_data JSONB,
  output_data JSONB,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## n8n INTEGRATION (PRODUCTION READY)
Webhook: https://azoriusdrake.app.n8n.cloud/webhook/4b4638e1-47de-406f-8ef7-136d49bc9bc1
Request Format:
```json
{
  "phase": "script_interpretation",
  "operation": "generate_all", 
  "jobId": "uuid",
  "projectId": "uuid",
  "projectName": "Project Name",
  "data": {
    "projectId": "uuid",
    "projectName": "Project Name", 
    "phase": "script_interpretation",
    "timestamp": "2025-01-22T..."
  }
}
```

Response: Raw JSON matching Italian campaign structure
Integration: Professional loading modal, error handling, status tracking

## CRITICAL NEXT STEP: PROPER PHASE 1 ARCHITECTURE

### Current Problem:
ScriptInterpretationModule.tsx uses raw JSON textarea - not suitable for clean data entry

### Required Solution:
Structured JSON Editor with:
- **Categories**: Elements | Scenes | Metadata | Global Style tabs
- **Tree View**: Hierarchical scene navigation with expand/collapse
- **Form Inputs**: Clean data entry fields vs raw JSON textarea
- **Validation**: Ensure clean structure before Phase 2 progression

### Implementation Strategy:
1. Keep existing ScriptInterpretationModule.tsx foundation (versioning, n8n, database)
2. Parse n8n raw JSON response into structured categories
3. Build tabbed interface for different data sections
4. Create form components for each element/scene type
5. Implement validation before allowing Phase 2 progression
6. Use established inline styling patterns for consistency

### Data Flow Architecture:
n8n generates raw JSON → structured parser → category-based editor → 
user edits via forms → validation → clean JSON output → Phase 2 cascade

## STYLING PATTERNS (PERFORMANCE-OPTIMIZED)
```typescript
// Inline styling pattern used throughout
const cardStyle = {
  background: '#1a1a1a',
  padding: '1.5rem',
  borderRadius: '8px',
  cursor: 'pointer',
  border: '1px solid #333',
  transition: 'border-color 0.2s'
}

// Loading state pattern
const loadingStyle = {
  background: loading ? '#555' : '#0066cc',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.5 : 1
}

// Modal pattern
const modalOverlay = {
  position: 'fixed' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}
```

## SUCCESS METRICS ACHIEVED
✅ 2.56s production build (121 modules optimized)
✅ Authentication system with protected routes working
✅ Complete project management with CRUD operations
✅ Raw n8n webhook integration tested and validated
✅ Complete versioning system with history viewer
✅ Database integration with real-time status tracking
✅ Professional UX patterns (loading, confirmations, error handling)
✅ Project deletion with scary confirmation modal
✅ Phase progression system (linear unlock after save)

## ANTI-PATTERNS (DON'T REPEAT)
❌ Next.js (performance issues: 3.3s startup → solved with Vite 423ms)
❌ CSS frameworks (inline styles perform better for our specific needs)
❌ Raw JSON editing for production Phase 1 (structured editor required)
❌ Server-side complexity (client-side auth patterns work perfectly)
❌ Multiple Supabase clients (centralized client in lib/supabase.ts)

## ITALIAN CAMPAIGN INTEGRATION (PROVEN)
Template: "UN CONSIGLIO STELLARE" (Ministero della Salute)
Character: >95% Samantha consistency validated across 13 scenes
Processing: 12-18 minutes for complete animatic generation
Structure: project_metadata, global_style, elements, scenes with hierarchical data

Ready for holistic development planning with complete working code context.
