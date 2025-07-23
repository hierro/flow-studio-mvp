# FLOW.STUDIO MVP: Step-by-Step Setup Guide
## Vercel + Supabase + Next.js - From Zero to Working Login

### 📋 PHASE 1 GOAL: WORKING AUTHENTICATION

**Immediate Target**: Get a working web application with:
1. ✅ User registration and login page
2. ✅ Supabase authentication working
3. ✅ Basic dashboard after login
4. ✅ Deployed to Vercel with proper environment variables

**Later Phases**: n8n integration, Italian campaign data, advanced workflows

**Architecture**: Start simple, build incrementally with enterprise patterns

---

## 🛠️ DEVELOPMENT ENVIRONMENT SETUP (Windows + VS Code)

### Prerequisites Installation

```powershell
# Install Node.js (LTS version 18.x)
# Download from: https://nodejs.org/en/download/
# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x

# Install Git for Windows
# Download from: https://git-scm.com/download/win
git --version

# Install VS Code
# Download from: https://code.visualstudio.com/
```

### Essential VS Code Extensions

Create `.vscode/extensions.json` in your project root:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-thunder-client"
  ]
}
```

### VS Code Settings for Optimal Development

Create `.vscode/settings.json`:

```json
{
  "typescript.preferences.quoteStyle": "single",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

---

## 🏗️ ENHANCED DATABASE SCHEMA

### PostgreSQL Schema for Production-Ready Workflow Management

```sql
-- Core project tracking with versioning
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  
  -- Original uploaded storyboard (Italian campaign data)
  original_json JSONB NOT NULL,
  
  -- AI-processed extended structure (from your n8n workflow)
  extended_json JSONB,
  
  -- Metadata tracking
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Phase tracking with linear dependencies (like your enterprise layers)
CREATE TABLE project_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Phase identification
  phase_name TEXT NOT NULL, -- 'reference_table', 'reference_images', 'scenes', 'final_video'
  phase_index INTEGER NOT NULL, -- 1, 2, 3, 4... for dependency ordering
  
  -- Status and dependency management
  status TEXT DEFAULT 'pending', -- pending, processing, completed, locked, invalidated
  depends_on_phase INTEGER, -- References phase_index of prerequisite phase
  
  -- Content storage (flexible for different content types)
  content_data JSONB,
  
  -- User interaction tracking (like your business layer)
  user_modified BOOLEAN DEFAULT false,
  user_approved BOOLEAN DEFAULT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(project_id, phase_name),
  CONSTRAINT valid_phase_index CHECK (phase_index > 0)
);

-- Content elements with type flexibility (polymorphic like your enterprise patterns)
CREATE TABLE project_elements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  
  -- Element identification
  element_type TEXT NOT NULL, -- 'text', 'image', 'video', 'json', 'mixed'
  element_key TEXT NOT NULL, -- 'character_description', 'scene_1_image', etc.
  
  -- Flexible content storage (like your data layer interfaces)
  text_content TEXT,
  file_url TEXT,
  json_content JSONB,
  metadata JSONB,
  
  -- User interaction
  user_modified BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT NULL,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  hash TEXT, -- For change detection
  
  UNIQUE(project_id, phase_name, element_key)
);

-- History tracking for undo functionality (enterprise audit trail)
CREATE TABLE project_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- What changed
  action_type TEXT NOT NULL, -- 'phase_completed', 'user_modified', 'regenerated'
  phase_name TEXT,
  element_key TEXT,
  
  -- Change details
  old_data JSONB,
  new_data JSONB,
  user_action BOOLEAN DEFAULT false, -- true if user-initiated
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- n8n job tracking with granular control (integrates with your TESTA_ANIMATIC)
CREATE TABLE n8n_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Job identification
  phase_name TEXT NOT NULL,
  job_type TEXT NOT NULL, -- 'full_generation', 'selective_regeneration'
  
  -- n8n integration (connects to your existing workflow)
  n8n_execution_id TEXT,
  webhook_url TEXT,
  
  -- Job configuration
  input_data JSONB, -- What to process
  selective_elements TEXT[], -- Which specific elements to regenerate
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed
  progress_data JSONB, -- For future progress tracking
  result_data JSONB,
  error_details TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Enable Row Level Security (enterprise-grade security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own project phases" ON project_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_phases.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own project elements" ON project_elements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_elements.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own project history" ON project_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_history.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own n8n jobs" ON n8n_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = n8n_jobs.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Indexes for performance (enterprise-grade optimization)
CREATE INDEX idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX idx_project_phases_status ON project_phases(status);
CREATE INDEX idx_project_elements_project_phase ON project_elements(project_id, phase_name);
CREATE INDEX idx_n8n_jobs_status ON n8n_jobs(status);
CREATE INDEX idx_project_history_project_id ON project_history(project_id, created_at);
```

---

## 🚀 WINDOWS SETUP GUIDE

## 🚀 PHASE 1: GET TO WORKING LOGIN PAGE

### Step 1: Create Supabase Project (DETAILED WALKTHROUGH)

```powershell
# 1. Open browser and go to: https://supabase.com
# 2. Click "Start your project" 
# 3. Sign up with GitHub (recommended) or email
# 4. Once logged in, click "New Project"
# 5. Choose your organization (probably your personal account)
# 6. Fill in project details:
#    - Name: flow-studio-mvp
#    - Database Password: [Generate strong password and SAVE IT]
#    - Region: Europe (West) - closest to Italy
#    - Pricing Plan: Free tier is fine for development
# 7. Click "Create new project"
# 8. Wait ~2 minutes for project creation

# 9. Once project is ready, go to Settings > API
# 10. COPY these values (you'll need them for .env.local):
#     - Project URL (starts with https://...)
#     - anon public key (starts with eyJ...)
#     - service_role key (starts with eyJ... - keep this SECRET!)
```

**🔥 CRITICAL**: Write down these three values - you'll need them for your .env.local file!

### Step 2: Create Next.js Project (CORRECTED - Windows Commands)

```powershell
# Create project directory
mkdir flow-studio-mvp
cd flow-studio-mvp

# Initialize Git repository
git init

# Create Next.js project with all our requirements
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install CORRECTED Supabase dependencies (updated packages)
npm install @supabase/supabase-js @supabase/ssr @supabase/auth-ui-react @supabase/auth-ui-shared

# Install additional helpful packages
npm install lucide-react clsx tailwind-merge uuid date-fns
npm install -D @types/uuid

# Install development tools
npm install -D prettier eslint-config-prettier
```

### Step 3: Environment Configuration (SIMPLIFIED FOR PHASE 1)

```powershell
# Create environment file (Windows)
New-Item -Path ".env.local" -ItemType File
```

```env
# .env.local (PHASE 1 - Authentication Only)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NOTE: n8n and other integrations will be added in later phases
# N8N_WEBHOOK_SECRET=will_add_later
# N8N_WEBHOOK_URL=will_add_later
# FAL_AI_API_KEY=will_add_later
```

**🔥 STOP HERE** - We need to get these values from Supabase first!

---

## 🎨 PHASE 1: BASIC AUTHENTICATION COMPONENTS

### Step 4: Supabase Client Configuration (UPDATED FOR NEW PACKAGES)

Create these files exactly as shown:

```typescript
// src/lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Step 5: Create Basic Authentication Pages

```typescript
// src/app/login/page.tsx
'use client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      }
      setLoading(false)
    }
    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to FLOW.STUDIO
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          AI-Powered Creative Framework
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: {
                  background: '#2563eb',
                  color: 'white',
                },
              },
            }}
            providers={['github', 'google']}
            redirectTo={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`}
            showLinks={false}
          />
        </div>
      </div>
    </div>
  )
}
```

### Step 6: Create Dashboard Page

```typescript
// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = createClient()
  
  // This will be executed on the server
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">FLOW.STUDIO</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                🎬 Your Creative Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                FLOW.STUDIO MVP is running successfully!
              </p>
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                <strong>✅ Phase 1 Complete:</strong> Authentication working!
                <br />
                <small>Next: Add project management and n8n integration</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Step 7: Create Logout Component

```typescript
// src/components/LogoutButton.tsx
'use client'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
    >
      Logout
    </button>
  )
}
```

### Step 8: Update Root Layout

```typescript
// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FLOW.STUDIO MVP',
  description: 'AI-Powered Creative Framework',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### Step 9: Create Home Page Redirect

```typescript
// src/app/page.tsx
import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
```

```typescript
// src/types/project.ts
// Enterprise-grade type definitions

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  original_json: any; // Italian campaign storyboard data
  extended_json?: any; // n8n processed data
  created_at: string;
  updated_at: string;
  version: number;
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  phase_name: string;
  phase_index: number;
  status: 'pending' | 'processing' | 'completed' | 'locked' | 'invalidated';
  depends_on_phase?: number;
  content_data?: any;
  user_modified: boolean;
  user_approved?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectElement {
  id: string;
  project_id: string;
  phase_name: string;
  element_type: 'text' | 'image' | 'video' | 'json' | 'mixed';
  element_key: string;
  text_content?: string;
  file_url?: string;
  json_content?: any;
  metadata?: any;
  user_modified: boolean;
  approved?: boolean;
  created_at: string;
  hash?: string;
}

export interface N8nJob {
  id: string;
  project_id: string;
  phase_name: string;
  job_type: 'full_generation' | 'selective_regeneration';
  n8n_execution_id?: string;
  webhook_url?: string;
  input_data?: any;
  selective_elements?: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress_data?: any;
  result_data?: any;
  error_details?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// Content type definitions (polymorphic like enterprise interfaces)
export interface TextContent {
  type: 'text';
  value: string;
  editable: boolean;
}

export interface ImageContent {
  type: 'image';
  url: string;
  thumbnail_url?: string;
  metadata: {
    width: number;
    height: number;
    size: number;
    alt_text: string;
  };
}

export interface MixedContent {
  type: 'mixed';
  sections: Array<TextContent | ImageContent>;
}
```

### Supabase Client Configuration (Data Access Layer)

```typescript
// src/lib/supabase.ts
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const createClient = () => createClientComponentClient()

export const createServerClient = () => createServerComponentClient({ cookies })

// Database types for enterprise-grade type safety
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          status: string
          original_json: any
          extended_json: any
          created_at: string
          updated_at: string
          version: number
        }
        Insert: {
          user_id: string
          name: string
          original_json: any
          status?: string
          extended_json?: any
        }
        Update: {
          name?: string
          status?: string
          original_json?: any
          extended_json?: any
          updated_at?: string
        }
      }
      project_phases: {
        Row: {
          id: string
          project_id: string
          phase_name: string
          phase_index: number
          status: string
          depends_on_phase?: number
          content_data?: any
          user_modified: boolean
          user_approved?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          project_id: string
          phase_name: string
          phase_index: number
          status?: string
          depends_on_phase?: number
          content_data?: any
          user_modified?: boolean
          user_approved?: boolean
        }
        Update: {
          status?: string
          content_data?: any
          user_modified?: boolean
          user_approved?: boolean
          updated_at?: string
        }
      }
      // Add other table types as needed...
    }
  }
}
```

### Base Phase Component (Reusable Enterprise Pattern)

```typescript
// src/components/PhaseContainer.tsx
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { ProjectPhase, ProjectElement } from '@/types/project';
import PhaseHeader from './PhaseHeader';
import ContentRenderer from './ContentRenderer';
import PhaseActions from './PhaseActions';

interface PhaseContainerProps {
  projectId: string;
  phaseName: string;
  phaseIndex: number;
  title: string;
  description: string;
}

const PhaseContainer: React.FC<PhaseContainerProps> = ({
  projectId,
  phaseName,
  phaseIndex,
  title,
  description
}) => {
  const [phase, setPhase] = useState<ProjectPhase | null>(null);
  const [elements, setElements] = useState<ProjectElement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const supabase = createClient();

  // Load phase data (like your data access layer)
  useEffect(() => {
    loadPhaseData();
  }, [projectId, phaseName]);

  const loadPhaseData = async () => {
    try {
      // Load phase information
      const { data: phaseData } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .eq('phase_name', phaseName)
        .single();

      setPhase(phaseData);

      // Load phase elements
      const { data: elementsData } = await supabase
        .from('project_elements')
        .select('*')
        .eq('project_id', projectId)
        .eq('phase_name', phaseName)
        .order('element_key');

      setElements(elementsData || []);
    } catch (error) {
      console.error('Error loading phase data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if prerequisites are met (dependency injection pattern)
  const canProceed = async () => {
    if (!phase?.depends_on_phase) return true;
    
    // Check if dependent phase is completed
    const { data: dependentPhase } = await supabase
      .from('project_phases')
      .select('status')
      .eq('project_id', projectId)
      .eq('phase_index', phase.depends_on_phase)
      .single();
    
    return dependentPhase?.status === 'completed' || dependentPhase?.status === 'locked';
  };

  // Trigger your n8n TESTA_ANIMATIC workflow
  const handleGenerate = async () => {
    const canStart = await canProceed();
    if (!canStart) {
      alert('Previous phase must be completed first');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/webhooks/n8n-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          phaseName,
          phaseIndex,
          jobType: 'full_generation'
        })
      });

      if (response.ok) {
        // Update phase status to processing
        await supabase
          .from('project_phases')
          .upsert({
            project_id: projectId,
            phase_name: phaseName,
            phase_index: phaseIndex,
            status: 'processing'
          });
        
        setPhase(prev => prev ? { ...prev, status: 'processing' } : null);
      }
    } catch (error) {
      console.error('Error triggering generation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle user approval (business logic layer)
  const handleApprove = async () => {
    await supabase
      .from('project_phases')
      .update({ 
        user_approved: true,
        status: 'locked',
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('phase_name', phaseName);

    setPhase(prev => prev ? { ...prev, user_approved: true, status: 'locked' } : null);
  };

  // Handle selective regeneration (advanced feature)
  const handleRegenerateElements = async (elementKeys: string[]) => {
    setIsProcessing(true);
    try {
      await fetch('/api/webhooks/n8n-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          phaseName,
          phaseIndex,
          jobType: 'selective_regeneration',
          selectiveElements: elementKeys
        })
      });
    } catch (error) {
      console.error('Error in selective regeneration:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      <PhaseHeader 
        title={title}
        description={description}
        status={phase?.status || 'pending'}
        canProceed={true} // Will be determined by canProceed() call
      />
      
      <div className="p-6">
        <ContentRenderer 
          elements={elements}
          onElementChange={(elementKey, newContent) => {
            // Handle individual element changes
            // Update database and mark as user_modified
          }}
          onRegenerateElement={(elementKey) => {
            handleRegenerateElements([elementKey]);
          }}
        />
        
        <PhaseActions
          phase={phase}
          isProcessing={isProcessing}
          onGenerate={handleGenerate}
          onApprove={handleApprove}
          onRegenerate={() => handleRegenerateElements(elements.map(e => e.element_key))}
          canProceed={true} // Will be determined by canProceed() call
        />
      </div>
    </div>
  );
};

export default PhaseContainer;
```

---

## 🔗 N8N INTEGRATION WITH YOUR TESTA_ANIMATIC WORKFLOW

### Enhanced n8n Trigger (Connects to Your Existing Workflow)

```typescript
// src/app/api/webhooks/n8n-trigger/route.ts
import { createClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { 
      projectId, 
      phaseName, 
      phaseIndex, 
      jobType = 'full_generation',
      selectiveElements = []
    } = await request.json();
    
    const supabase = createClient();
    
    // Get project data for your n8n workflow
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get previous phase data if this phase depends on it
    let previousPhaseData = null;
    if (phaseIndex > 1) {
      const { data: prevPhase } = await supabase
        .from('project_phases')
        .select('content_data')
        .eq('project_id', projectId)
        .eq('phase_index', phaseIndex - 1)
        .single();
      
      previousPhaseData = prevPhase?.content_data;
    }
    
    // Create job tracking record
    const { data: job } = await supabase
      .from('n8n_jobs')
      .insert({
        project_id: projectId,
        phase_name: phaseName,
        job_type: jobType,
        input_data: {
          original_json: project.original_json,
          extended_json: project.extended_json,
          previous_phase_data: previousPhaseData
        },
        selective_elements: selectiveElements,
        status: 'pending',
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n-complete`
      })
      .select()
      .single();
    
    // Prepare payload for your TESTA_ANIMATIC workflow
    const n8nPayload = {
      // Job identification
      job_id: job.id,
      project_id: projectId,
      phase_name: phaseName,
      phase_index: phaseIndex,
      
      // Content to process (based on your Italian campaign structure)
      job_type: jobType,
      selective_elements: selectiveElements,
      
      // Input data (your storyboard JSON structure)
      project_data: {
        original_json: project.original_json, // Italian campaign data
        extended_json: project.extended_json,
        previous_phase_data: previousPhaseData
      },
      
      // Callback configuration
      webhook_url: job.webhook_url,
      progress_webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n-progress`
    };
    
    // Trigger your existing TESTA_ANIMATIC n8n workflow
    const n8nResponse = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.N8N_WEBHOOK_SECRET}`
      },
      body: JSON.stringify(n8nPayload)
    });
    
    if (!n8nResponse.ok) {
      throw new Error(`n8n trigger failed: ${n8nResponse.statusText}`);
    }
    
    const n8nResult = await n8nResponse.json();
    
    // Update job with n8n execution ID
    if (n8nResult.execution_id) {
      await supabase
        .from('n8n_jobs')
        .update({ 
          n8n_execution_id: n8nResult.execution_id,
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', job.id);
    }
    
    return NextResponse.json({ 
      success: true, 
      jobId: job.id,
      executionId: n8nResult.execution_id
    });
    
  } catch (error) {
    console.error('n8n trigger error:', error);
    return NextResponse.json({ 
      error: 'Failed to trigger n8n workflow',
      details: error.message 
    }, { status: 500 });
  }
}
```

### Italian Campaign Test Data Integration

```typescript
// src/lib/test-data.ts
// Italian campaign storyboard as default test data

export const ITALIAN_CAMPAIGN_STORYBOARD = {
  "project_metadata": {
    "title": "UN CONSIGLIO STELLARE",
    "client": "Ministero della Salute",
    "extraction_date": "2025-01-28",
    "schema_version": "1.0",
    "production_workflow": "animatic_to_video_scalable"
  },
  "global_style": {
    "color_palette": {
      "primary": "Deep blue backgrounds (library, tech elements)",
      "secondary": "Warm amber/golden lighting",
      "accent": "Bright cyan/blue (holograms, tech effects)",
      "character_tones": "Natural skin tones, blue uniforms"
    },
    "rendering_style": {
      "level": "simplified illustration transitioning to cinematic realism",
      "line_work": "clean vector-style outlines",
      "shading": "minimal, flat color zones with depth",
      "detail_level": "stylized but scalable to photorealistic"
    }
  },
  "elements": {
    "samantha": {
      "element_type": "character",
      "element_subtype": "primary",
      "base_description": "Samantha Cristoforetti, 47 years old, short brown hair, confident expression, blue ESA astronaut uniform with patches",
      "consistency_rules": [
        "Identical facial features and hair across all scenes",
        "Blue ESA uniform must be consistent in color and design",
        "Confident, authoritative expression maintained",
        "Professional astronaut posture and demeanor"
      ]
    },
    "children_group": {
      "element_type": "character",
      "element_subtype": "group",
      "base_description": "5 diverse children aged 6-7, small stature, mixed gender, curious expressions, casual school clothes",
      "consistency_rules": [
        "Same 5 children throughout (consistent faces and diversity)",
        "Age range 6-7 maintained across all scenes",
        "Casual school clothing consistent per child",
        "Curious, engaged expressions as baseline"
      ]
    },
    "circular_library": {
      "element_type": "location",
      "element_subtype": "primary",
      "base_description": "magnificent circular library with multiple levels, warm ambient lighting, wood and modern architectural elements, balcony overlooks"
    }
  },
  "scenes": {
    "scene_1": {
      "scene_id": 1,
      "duration": "3 seconds",
      "camera_type": "wide establishing shot",
      "natural_description": "The spot opens in a magnificent circular environment: it's the hall of the great library of the Monte Porzio Catone Astronomical Observatory...",
      "dialogue": "LO SPAZIO È UN LUOGO INOSPITALE E PERICOLOSO..."
    }
    // ... additional scenes from your Italian campaign
  }
};

// Helper function to create a new project with Italian campaign data
export const createTestProject = async (supabase: any, userId: string, projectName: string) => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name: projectName,
      original_json: ITALIAN_CAMPAIGN_STORYBOARD,
      status: 'active'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
};
```

---

## 🎯 IMPLEMENTATION ROADMAP

### Week 1: Foundation & Basic Flow
**Days 1-2: Environment Setup**
- [ ] Install Windows development tools (Node.js, Git, VS Code)
- [ ] Create and configure Supabase project with database schema
- [ ] Set up Next.js project with TypeScript and Tailwind CSS
- [ ] Deploy basic app to Vercel with environment variables
- [ ] Test authentication flow with Supabase Auth

**Days 3-4: Database & Auth**
- [ ] Implement enhanced database schema with all tables
- [ ] Create authentication pages (login/signup) with social providers
- [ ] Build project creation and listing with Italian campaign test data
- [ ] Test Row Level Security policies and user permissions

**Days 5-7: First Phase Integration**
- [ ] Build PhaseContainer base component with TypeScript interfaces
- [ ] Implement reference table phase with text content editing
- [ ] Create n8n trigger webhook that connects to your TESTA_ANIMATIC
- [ ] Test basic generation flow with Italian campaign data

### Week 2: Content System & Dependencies
**Days 1-3: Content Type System**
- [ ] Build ContentRenderer with polymorphic type switching
- [ ] Implement TextEditor component for reference table editing
- [ ] Create ImageGallery component for reference images
- [ ] Add JsonViewer component for structured data

**Days 4-5: Phase Dependencies**
- [ ] Implement linear dependency checking between phases
- [ ] Add phase invalidation system (cascade updates)
- [ ] Create history tracking with full audit trail
- [ ] Test dependency flow with multiple phases

**Days 6-7: Your n8n Integration**
- [ ] Modify your TESTA_ANIMATIC workflow to accept webhooks
- [ ] Implement bidirectional communication (trigger + completion)
- [ ] Add progress tracking and status updates
- [ ] Test complete workflow with Samantha character generation

### Week 3: Advanced Features & Polish
**Days 1-3: Character Consistency (Samantha LoRA)**
- [ ] Implement reference image upload and management
- [ ] Add LoRA training integration with FAL.ai
- [ ] Create character approval workflow
- [ ] Test Samantha character consistency across scenes

**Days 4-5: Scene Generation**
- [ ] Implement scene-by-scene generation with your proven prompts
- [ ] Add selective regeneration for individual scenes
- [ ] Create approval workflow for generated scenes
- [ ] Test complete 13-scene Italian campaign generation

**Days 6-7: Production Ready**
- [ ] Add error handling and retry mechanisms
- [ ] Implement loading states and progress indicators
- [ ] Create responsive design for mobile/desktop
- [ ] User acceptance testing and bug fixes

---

---

## 🚀 PHASE 1: TEST YOUR SETUP

### Step 10: Test Local Development

```powershell
# In your project directory, start the development server
npm run dev

# Open browser and go to: http://localhost:3000
# You should see:
# 1. Automatic redirect to /login
# 2. Login page with email/password and social login options
# 3. After login: redirect to /dashboard
# 4. Dashboard showing welcome message and logout button
```

### Step 11: Deploy to Vercel

```powershell
# Install Vercel CLI
npm i -g vercel

# Deploy your app
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (choose your account)
# - Link to existing project? No
# - Project name: flow-studio-mvp
# - In which directory is your code located? ./
# - Want to override settings? No

# The CLI will give you a URL like: https://flow-studio-mvp-xxx.vercel.app
```

### Step 12: Configure Production Environment Variables

```powershell
# After deployment, go to: https://vercel.com/dashboard
# Find your project: flow-studio-mvp
# Go to Settings > Environment Variables
# Add these variables:

# NEXT_PUBLIC_SUPABASE_URL = your_supabase_project_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key  
# SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
# NEXT_PUBLIC_APP_URL = https://your-vercel-app-url.vercel.app

# Redeploy to apply environment variables
vercel --prod
```

### Step 13: Configure Supabase for Production

```powershell
# In Supabase Dashboard:
# 1. Go to Authentication > URL Configuration
# 2. Add your Vercel URL to Site URL: https://your-vercel-app-url.vercel.app
# 3. Add to Redirect URLs: https://your-vercel-app-url.vercel.app/dashboard
# 4. Save configuration
```

---

## 🎯 PHASE 1 SUCCESS CRITERIA

**✅ YOU'RE READY FOR PHASE 2 WHEN:**

1. **Local Development Works**: 
   - `npm run dev` starts without errors
   - Login page loads at http://localhost:3000
   - You can register/login with email or social providers
   - Dashboard shows after successful login
   - Logout button works correctly

2. **Production Deployment Works**:
   - Vercel app loads without errors
   - Authentication works on production URL
   - Environment variables are properly configured
   - No console errors in browser developer tools

3. **Database Connection Verified**:
   - User registration creates entries in Supabase Auth
   - You can see users in Supabase Dashboard > Authentication > Users

**🔥 STOP HERE AND CONFIRM PHASE 1 WORKS BEFORE PROCEEDING**

---

## 📖 PHASE 2 PREVIEW: WHAT'S NEXT

Once Phase 1 is working, we'll add:

1. **Project Management**: Create/list projects with Italian campaign test data
2. **Basic Database Schema**: Add tables for projects and phases
3. **n8n Integration**: Connect to your TESTA_ANIMATIC workflow
4. **Claude CLI Integration**: Rapid prototyping with AI assistance
5. **Character Consistency**: Samantha LoRA training framework

**Claude CLI Integration Points:**
- Generate component code based on database schema
- Create API route handlers for n8n webhooks
- Build UI components for Italian campaign data visualization
- Implement phase-based workflow management

---

## 🆘 TROUBLESHOOTING PHASE 1

### Common Issues and Solutions

```powershell
# Issue: "Module not found" errors
# Solution: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Issue: Supabase connection fails
# Solution: Check environment variables
# - Verify .env.local file exists and has correct values
# - Ensure no extra spaces or quotes around values
# - Restart development server after changing .env.local

# Issue: Login redirect doesn't work
# Solution: Check URL configuration
# - Verify NEXT_PUBLIC_APP_URL matches your actual URL
# - Check Supabase Auth URL settings match your domain

# Issue: TypeScript errors
# Solution: Restart TypeScript server in VS Code
# - Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### VS Code Setup Validation

```json
// Verify these files exist in your project:
// .vscode/settings.json
// .vscode/extensions.json  
// src/lib/supabase.ts
// src/app/login/page.tsx
// src/app/dashboard/page.tsx
// src/components/LogoutButton.tsx
// .env.local (with your actual Supabase credentials)
```

**Ready to start Phase 1? Let's get your Supabase credentials first!** 🚀

### n8n TESTA_ANIMATIC Workflow Modifications

To integrate with this MVP, you'll need to modify your existing n8n workflow to:

1. **Accept webhook triggers** instead of manual triggers
2. **Send completion webhooks** back to the web app
3. **Handle selective regeneration** for individual elements
4. **Preserve your proven prompt methodology** (5-step sequential system)

### Suggested n8n Workflow Changes:

```javascript
// Add these nodes to your existing TESTA_ANIMATIC workflow:

1. Webhook Trigger Node (replace Manual Trigger):
   - URL: Auto-generated by n8n
   - Method: POST
   - Response: Return execution ID

2. Your Existing Processing Logic:
   - Keep all your proven prompt generation nodes
   - Keep FAL.ai FLUX integration
   - Keep file management and Google Drive nodes

3. Completion Webhook Node (at end):
   - URL: {{$json.webhook_url}} (from trigger payload)
   - Method: POST
   - Body: {
       "job_id": "{{$json.job_id}}",
       "project_id": "{{$json.project_id}}",
       "phase_name": "{{$json.phase_name}}",
       "status": "completed",
       "result_data": {{$json.generated_content}},
       "generated_elements": {{$json.generated_assets}}
     }
```

### Character Consistency (Samantha) Integration

Your LoRA training for Samantha character consistency will be managed through:

1. **Reference Images Phase**: Users upload/approve Samantha reference images
2. **LoRA Training Trigger**: Automated training via FAL.ai API
3. **Character Validation**: Test generations to verify >95% recognition
4. **Scene Generation**: Use trained LoRA for all Samantha appearances

---

## 🔐 SECURITY & DEPLOYMENT

### Environment Variables for Production

```env
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
N8N_WEBHOOK_SECRET=secure_random_secret_key
N8N_WEBHOOK_URL=your_testa_animatic_webhook_url
N8N_API_KEY=your_n8n_api_key

# FAL.ai for your proven image generation
FAL_AI_API_KEY=your_fal_ai_key

# Optional: Analytics and monitoring
VERCEL_ANALYTICS_ID=your_analytics_id
```

### Vercel Deployment Configuration

```json
// vercel.json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 🚀 GETTING STARTED

### Quick Start Commands

```powershell
# 1. Create the project
git clone https://github.com/your-username/flow-studio-mvp.git
cd flow-studio-mvp
npm install

# 2. Configure environment
copy .env.example .env.local
# Edit .env.local with your Supabase and n8n credentials

# 3. Run development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000
```

### First Steps After Setup

1. **Test Authentication**: Create account and login
2. **Create Test Project**: Use Italian campaign data as default
3. **Configure n8n Integration**: Update your TESTA_ANIMATIC webhook URL
4. **Test First Phase**: Try reference table generation
5. **Verify Database**: Check that data is properly stored

---

## 📖 NEXT PHASE: INTEGRATION WITH YOUR PROVEN SYSTEM

Once the MVP foundation is working, we'll:

1. **Integrate Your 5-Step Prompt System**: Connect your proven methodology
2. **Add Samantha LoRA Training**: Character consistency system
3. **Connect FAL.ai FLUX**: Your validated image generation
4. **Test Italian Campaign**: Complete 13-scene generation
5. **Optimize Performance**: Ensure <15 minute processing time

**This MVP provides the professional web interface around your proven n8n automation, enabling human-in-the-loop workflows while preserving the speed and quality of your existing system.**

Ready to start building? Let's begin with Step 1: Supabase project creation! 🚀