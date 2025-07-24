FLOW STUDIO MVP - COMPLETE WORKING PATTERNS FOR CLAUDE WEB
=========================================================
Generated: 2025-07-24T08:20:13.301Z
Purpose: Show actual working code for proper development planning and suggestions

## CURRENT STATUS & CRITICAL INSIGHT
Foundation Complete ✅ | Next Priority: 3-Tab Timeline Architecture

## TECH STACK & PERFORMANCE
Framework: Vite 5.4.19 + React 19.1.0 + TypeScript ^5
Routing: React Router ^6.28.0
Styling: Global CSS system with design tokens (responsive, performance-optimized)
Database: Supabase PostgreSQL + Auth (RLS, version management)
Build: Optimized production build with instant HMR

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
      <div className="app-loading">
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
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Login</h1>
        
        <form onSubmit={handleLogin} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
          />
          
          <button
            type="submit"
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Loading...' : 'Sign In'}
```

### 3. DATABASE OPERATIONS (src/lib/database.ts) - KEY FUNCTIONS ✅
```typescript
// Database utilities for FLOW.STUDIO MVP
// Supabase integration with enhanced 5-phase workflow schema

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

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    // Delete project (cascade will handle phases, versions, etc.)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
 
```

### 4. TYPESCRIPT INTERFACES (src/types/project.ts) - COMPLETE SYSTEM ✅
```typescript
// Core project types for FLOW.STUDIO MVP
// Based on enhanced database schema and Italian campaign structure

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
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
  created_by: string;
}

export interface N8NJob {
  id: string;
  project_id: string;
  phase_name: PhaseName;
  workflow_id: string;
  n8n_execution_id?: string;
  input_data: any;
  output_data: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress_percentage: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// Phase-specific types
export type PhaseName = 'script_interpretation' | 'element_images' | 'scene_generation' | 'scene_videos' | 'final_assembly';

export interface PhaseContent {
  script_interpretation?: ScriptInterpretationContent;
  element_images?: ElementImagesContent;
  scene_generation?: SceneGenerationContent;
  scene_videos?: SceneVideosContent;
  final_assembly?: FinalAssemblyContent;
}

// Phase 1: Script Interpretation (Italian campaign format)
export interface ScriptInterpretationContent {
  elements: ItalianCampaignElements;
  scenes: ItalianCampaignScenes;
  extraction_metadata: {
    timestamp: string;
    image_engin
```

### 5. PHASE 1 IMPLEMENTATION (src/components/ScriptInterpretationModule.tsx) - FOUNDATION ✅
```typescript
import { useState, useEffect } from 'react'
import type { ProjectPhase, PhaseVersion } from '../types/project'

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
  versionHistory: PhaseVersion[]
  loadingVersions: boolean
  // Content management functions
  onJsonChange: (value: string) => void
  onSavePhase: () => void
  onLoadPhaseContent: (phaseId: string) => void
  onLoadVersionHistory: (phaseId: string) => void
  onLoadVersionContent: (phaseId: string, versionNumber: number) => void
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [useProduction, setUseProduction] = useState(true)
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false)

  // Load existing content and database status on mount
  useEffect(() => {
    onLoadPhaseContent(phase.id)
  },
```

## DATABASE SCHEMA (DEPLOYED & WORKING)
```sql
-- FLOW.STUDIO MVP Fresh Database Schema
-- Version: 2.0 - Complete Clean Deployment
-- For FRESH database deployment after reset
-- Includes: Cross-phase timeline architecture + Enhanced features

-- ============================================================================
-- 1. EXTENSIONS & SETUP
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. CORE TABLES (FRESH DEPLOYMENT)
-- ============================================================================

-- Projects table (Enhanced from day one)
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  
  -- Project metadata (Italian campaign template)
  project_metadata JSONB NOT NULL DEFAULT '{
    "title": "New Project",
    "client": "Client Name",
    "extraction_date": "",
    "schema_version": "1.0",
    "production_workflow": "animatic_to_video_scalable"
  }'::jsonb,
  
  -- Global style configuration
  global_style JSONB NOT NULL DEFAULT '{
    "color_palette": {
      "primary": "Deep blue backgrounds",
      "secondary": "Warm amber lighting", 
      "character_tones": "Natural skin tones"
    },
    "rendering_style": {
      "level": "simplified illustration transitioning to cinematic realism",
      "line_work": "clean vector-style outlines",
      "detail_level": "stylized but scalable to photorealistic"
    }
  }'::jsonb,

  -- Timeline features (built-in from day one)
  last_global_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{
    "auto_save": true,
    "version_retention": 10,
    "collaboration_enabled": false
  }'::jsonb,

  -- Timestamps
  cr
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

## CRITICAL DEVELOPMENT INSIGHTS

### Current Architecture Status:
- **Foundation Complete**: Authentication, project management, Phase 1 n8n integration
- **CSS System**: Global responsive design with 88% inline style reduction (96→11)
- **Database**: Enhanced schema v2.0 with timeline architecture ready
- **Next Priority**: 3-Tab Timeline Interface (Scenes/Elements/Style)

### Revolutionary Timeline Vision:
Transform traditional frame-by-frame tools into story intelligence system:
- **Scenes Tab**: Horizontal timeline with scene cards and phase evolution
- **Elements Tab**: Cross-scene element tracking (Samantha across 10 scenes)
- **Style Tab**: Global style control with cross-phase impact tracking

### Technical Foundation Ready:
- Timeline Parser utility exists (`src/utils/TimelineParser.ts`)
- Timeline components started (`src/components/timeline/`)
- Database supports cross-phase change tracking
- Italian campaign data fully integrated for visualization

## STYLING ARCHITECTURE (GLOBAL CSS SYSTEM)
```css
/* 
 * Flow Studio MVP - Global CSS System
 * Responsive, scalable design system with CSS variables
 */

/* ============================================
   CSS VARIABLES - DESIGN TOKENS
   ============================================ */

:root {
  /* Colors - Dark Theme */
  --color-bg-primary: #000000;
  --color-bg-secondary: #1a1a1a;
  --color-bg-tertiary: #0f0f0f;
  --color-bg-accent: #333333;
  
  --color-border-default: #333333;
  --color-border-focus: #0066cc;
  --color-border-light: #555555;
  
  --color-text-primary: #ffffff;
  --color-text-secondary: #cccccc;
  --color-text-muted: #999999;
  --color-text-accent: #66ccff;
  
  --color-element-character: #3b82f6;
  --color-element-location: #10b981;
  --color-element-prop: #f59e0b;
  --color-element-atmosphere: #8b5cf6;
  
  --color-success: #00cc00;
  --color-warning: #cc6600;
  --color-error: #cc0000;

  /* Spacing Scale - rem based for scalability */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.375rem;  /* 6px */
  --space-md: 0.5rem;    /* 8px */
  --space-lg: 0.75rem;   /* 12px */
  --space-xl: 1rem;      /* 16px */
  --space-2xl: 1.25rem;  /* 20px */
  --space-3xl: 1.5rem;   /* 24px */
  --space-4xl: 2rem;     /* 32px */

  /* Typography Scale */
  --text-xs: 0.6875rem;  /* 11px */
  --text-sm: 0.75rem;    /* 12px */
  --text-base: 0.875rem; /* 14px */
  --text-lg: 1rem;       /* 16px */
  --text-xl: 1.125rem;   /* 18px */
  --text-2xl: 1.25rem;   /* 20px */
  --text-3xl: 1.5rem;    /* 24px */

  /* Border Radius */
  --radius-sm: 0.25rem;  /* 4px */
  --radius-md: 0.375rem; /* 6px */
  --radius-lg: 0.5rem;   /* 8px */
  --radius-xl: 0.75rem;  /* 12px */
  --radius-pill: 1rem;   /* 16px */

  /* Transitions */
  --transition-fast: all 0.2s ease;
  --transition-medium: all 0.3s ease;
  --transition-slow: all 0.5s ease;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
  --shadow-focus: 0 0 0 2px 
```

### CSS Architecture Achievements:
- **88% Reduction**: 96 → 11 inline styles across all components
- **Responsive Design**: Mobile-first with rem-based scaling
- **Design Tokens**: CSS variables for colors, spacing, typography
- **3-Area UX**: Clean separation of navigation, controls, and content
- **Performance**: 27.89kB CSS bundle, separated from 486.17kB JS

## SUCCESS METRICS ACHIEVED
✅ CSS Globalization Complete: 88% inline style reduction (96→11)
✅ Authentication system with protected routes working
✅ Complete project management with CRUD operations
✅ n8n webhook integration validated (production-ready)
✅ Complete versioning system with history viewer
✅ Enhanced database schema v2.0 with timeline architecture
✅ 3-Area UX architecture implemented
✅ Timeline components foundation established
✅ Italian campaign fully integrated (UN CONSIGLIO STELLARE)
✅ Build optimization: Clean 3.19s builds, instant HMR

## EVOLUTION & LESSONS LEARNED
✅ Vite vs Next.js: 10x faster development (423ms vs 3.3s startup)
✅ Global CSS vs Inline: Better maintainability, 88% reduction achieved
✅ Schema v2.0: Timeline architecture built-in from deployment
✅ Component Architecture: Logical separation with 3-area UX design
✅ Timeline Ready: Foundation complete for revolutionary interface

## ITALIAN CAMPAIGN INTEGRATION (PROVEN)
Template: "UN CONSIGLIO STELLARE" (Ministero della Salute)
Character: >95% Samantha Cristoforetti consistency across 13 scenes
Processing: 12-18 minutes for complete animatic generation via n8n
Webhook: Production endpoint validated and working
Data Structure: Complete elements/scenes ready for timeline visualization

## WEB-BROTHER ALIGNMENT
This webapp-project-context.md syncs with Claude Web project for:
- Consistent development approach across CLI and Web interfaces
- Shared understanding of working patterns and architecture
- Aligned strategy for timeline interface development
- Common knowledge of Italian campaign integration success

Ready for holistic development planning with complete working code context.
