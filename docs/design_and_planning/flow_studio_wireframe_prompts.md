# FLOW.STUDIO MVP: Complete Wireframe & Claude CLI Task Prompts
## 5-Phase Linear Workflow with Version Management

---

## 🎯 **SYSTEM OVERVIEW**

### **Project Flow Architecture**
```
User Dashboard → Project Creation → 5 Linear Phases → Version Management
```

### **Phase Dependencies (Linear & Mandatory)**
```
Phase 1: script_interpretation (JSON output) 
    ↓ (must save to unlock)
Phase 2: element_images (Images + prompts)
    ↓ (must save to unlock)  
Phase 3: scene_generation (Scene images)
    ↓ (must save to unlock)
Phase 4: scene_videos (placeholder)
    ↓ (must save to unlock)
Phase 5: final_assembly (placeholder)
```

### **Core Business Rules**
- **All 5 phases created** when project is created (status: 'pending')
- **Linear progression**: Can't access Phase N+1 until Phase N is saved
- **Version management**: Each edit creates new version with history tracking
- **User can edit any completed phase** (creates new version, doesn't break chain)
- **Async n8n workflows** with status tracking and callbacks

---

## 🗄️ **REFINED DATABASE SCHEMA**

### **Enhanced Schema Based on Italian Campaign JSON**
```sql
-- Projects with 5-phase initialization
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'archived'
  
  -- Project configuration (from Italian campaign template)
  project_metadata JSONB, -- title, client, extraction_date, etc.
  global_style JSONB, -- color_palette, rendering_style, composition, mood_style
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5 phases with linear dependencies and versioning
CREATE TABLE project_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Phase definition
  phase_name TEXT NOT NULL, -- 'script_interpretation', 'element_images', 'scene_generation', 'scene_videos', 'final_assembly'
  phase_index INTEGER NOT NULL, -- 1, 2, 3, 4, 5
  
  -- Linear flow control
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'locked'
  can_proceed BOOLEAN DEFAULT false, -- true only when previous phase is saved
  
  -- Version management
  current_version INTEGER DEFAULT 0,
  content_data JSONB, -- Phase output from n8n workflows
  
  -- User interaction
  user_saved BOOLEAN DEFAULT false,
  last_modified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(project_id, phase_name),
  CONSTRAINT valid_phase_index CHECK (phase_index BETWEEN 1 AND 5)
);

-- Version history for each phase edit
CREATE TABLE phase_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES project_phases(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  
  -- Version content
  content_data JSONB,
  change_description TEXT,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(phase_id, version_number)
);

-- n8n job tracking for async workflows
CREATE TABLE n8n_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  phase_name TEXT NOT NULL,
  
  -- n8n workflow configuration
  workflow_id TEXT NOT NULL, -- 'script_workflow_id', 'element_workflow_id', 'a1dbfc3a-b5fa-41be-9720-13960051b88d'
  n8n_execution_id TEXT,
  
  -- Job data
  input_data JSONB,
  output_data JSONB,
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  progress_percentage INTEGER DEFAULT 0,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Enable RLS and create policies (user isolation)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own phases" ON project_phases FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = project_phases.project_id AND projects.user_id = auth.uid())
);
CREATE POLICY "Users manage own versions" ON phase_versions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM project_phases 
    JOIN projects ON projects.id = project_phases.project_id 
    WHERE project_phases.id = phase_versions.phase_id AND projects.user_id = auth.uid()
  )
);
CREATE POLICY "Users manage own jobs" ON n8n_jobs FOR ALL USING (
  EXISTS (SELECT 1 FROM projects WHERE projects.id = n8n_jobs.project_id AND projects.user_id = auth.uid())
);

-- Performance indexes
CREATE INDEX idx_project_phases_project_status ON project_phases(project_id, status);
CREATE INDEX idx_phase_versions_phase_version ON phase_versions(phase_id, version_number);
CREATE INDEX idx_n8n_jobs_status ON n8n_jobs(status, created_at);
```

---

## 🧩 **COMPONENT ARCHITECTURE**

### **TypeScript Interfaces (Modular & Flexible)**
```typescript
// Core project types
interface Project {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'completed' | 'archived';
  project_metadata: ItalianCampaignMetadata;
  global_style: GlobalStyle;
  created_at: string;
  updated_at: string;
}

interface ProjectPhase {
  id: string;
  project_id: string;
  phase_name: PhaseName;
  phase_index: number;
  status: 'pending' | 'processing' | 'completed' | 'locked';
  can_proceed: boolean;
  current_version: number;
  content_data: PhaseContent;
  user_saved: boolean;
  last_modified_at?: string;
}

// Phase-specific content types (flexible polymorphism)
type PhaseName = 'script_interpretation' | 'element_images' | 'scene_generation' | 'scene_videos' | 'final_assembly';

interface PhaseContent {
  script_interpretation?: ScriptInterpretationContent;
  element_images?: ElementImagesContent;
  scene_generation?: SceneGenerationContent;
  scene_videos?: SceneVideosContent;
  final_assembly?: FinalAssemblyContent;
}

// Phase 1: Script Interpretation (from your JSON)
interface ScriptInterpretationContent {
  elements: ItalianCampaignElements;
  scenes: ItalianCampaignScenes;
  extraction_metadata: {
    timestamp: string;
    image_engine: string;
    model_endpoint: string;
    project_dest_folder: string;
  };
}

// Phase 2: Element Images (to be defined)
interface ElementImagesContent {
  generated_images: Array<{
    element_key: string;
    image_url: string;
    prompt_used: string;
    metadata: any;
  }>;
}

// N8N integration
interface N8NJob {
  id: string;
  project_id: string;
  phase_name: PhaseName;
  workflow_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input_data: any;
  output_data: any;
  progress_percentage: number;
}
```

### **Component Hierarchy**
```jsx
<App>
  └── <DashboardPage> // Project cards list
      └── <ProjectDetailPage projectId="123">
          ├── <PhaseSidebar phases={phases} currentPhase={1} />
          └── <PhaseContent>
              ├── <ScriptInterpretationModule /> // Phase 1
              ├── <ElementImagesModule />        // Phase 2  
              ├── <SceneGenerationModule />      // Phase 3
              ├── <SceneVideosModule />          // Phase 4 (placeholder)
              └── <FinalAssemblyModule />        // Phase 5 (placeholder)
```

---

## 🚀 **CLAUDE CLI TASK PROMPTS**

### **TASK 1: Database Schema & Functions**
```bash
# Claude CLI Prompt
I need you to implement the enhanced database schema and utility functions for FLOW.STUDIO MVP.

CONTEXT: Building 5-phase linear animatic generation workflow with version management.

REQUIREMENTS:
1. Deploy the enhanced schema with projects, project_phases, phase_versions, n8n_jobs tables
2. Create TypeScript utility functions for database operations
3. Implement project creation with automatic 5-phase initialization
4. Add phase progression logic (can_proceed based on previous phase completion)
5. Version management functions (create new version when user edits saved phase)

CURRENT TECH STACK: Vite + React 19 + TypeScript + Supabase

DELIVERABLES:
- SQL schema file ready for Supabase
- TypeScript database utility functions (src/lib/database.ts)
- Project CRUD operations with phase initialization
- Phase progression validation functions
- Version management utilities

TEST DATA: Use Italian "UN CONSIGLIO STELLARE" campaign as default project template.

INTEGRATION POINTS: Must work with existing Supabase auth and RLS policies.
```

### **TASK 2: Project Dashboard & Navigation**
```bash
# Claude CLI Prompt
I need you to create the Project Dashboard and core navigation system for FLOW.STUDIO MVP.

CONTEXT: Users need to see all their projects as cards and navigate to project detail pages.

REQUIREMENTS:
1. Dashboard page showing user's projects as cards (name, timestamp, status)
2. Create new project modal with name input and Italian campaign template
3. Project detail page with 5-phase sidebar navigation
4. Phase sidebar with linear progression (grayed out until previous phase is saved)
5. Responsive design matching current Vite app styling

CURRENT TECH STACK: Vite + React 19 + TypeScript + React Router + Supabase Auth

EXISTING FOUNDATION:
- Authentication working (login/register pages)
- User session management functional
- Inline CSS styling pattern established

DELIVERABLES:
- ProjectDashboard component with project cards
- CreateProjectModal component
- ProjectDetailPage with URL routing (/project/:id)
- PhaseSidebar component with linear progression logic
- Navigation integration with React Router

BUSINESS LOGIC: 
- Phase buttons grayed out until previous phase is user_saved
- Each project automatically gets 5 phases created on project creation
- Italian campaign data as default template
```

### **TASK 3: Phase 1 - Script Interpretation Module**
```bash
# Claude CLI Prompt
I need you to create Phase 1 (Script Interpretation) module for FLOW.STUDIO MVP.

CONTEXT: This is the first phase where users trigger n8n workflow to get structured JSON from storyboard analysis.

REQUIREMENTS:
1. ScriptInterpretationModule component with full-screen textarea for JSON display
2. "Generate" button to trigger n8n workflow (async)
3. Loading state with progress indicator during n8n processing
4. JSON syntax highlighting and formatting for readability
5. "Save Phase" button to mark phase as complete and unlock Phase 2
6. Edit functionality that creates new version when user modifies saved content

N8N INTEGRATION:
- Workflow ID: 'script_workflow_id' (placeholder for now)
- Input: Project metadata and Italian campaign reference
- Output: Structured JSON matching your provided Italian campaign format
- Async processing with status updates

CURRENT TECH STACK: Vite + React 19 + TypeScript + Supabase

TEST DATA: Use the Italian campaign JSON you provided as expected output format.

DELIVERABLES:
- ScriptInterpretationModule component
- N8N webhook integration utilities
- JSON editor with syntax highlighting
- Version management when user edits content
- Phase completion and progression logic

UI/UX:
- Full-screen textarea for JSON content
- Clear "Generate", "Save", "Edit" action buttons
- Loading states during async operations
- Success/error feedback to user
```

### **TASK 4: N8N Webhook System**
```bash
# Claude CLI Prompt
I need you to implement the N8N webhook integration system for FLOW.STUDIO MVP.

CONTEXT: Each phase triggers different n8n workflows asynchronously and needs status tracking with callbacks.

REQUIREMENTS:
1. Webhook trigger system for initiating n8n workflows
2. Callback endpoints to receive n8n completion results
3. Job status tracking with real-time updates
4. Error handling and retry mechanisms
5. Progress indicators during async processing

N8N WORKFLOWS TO INTEGRATE:
- Phase 1: 'script_workflow_id' → Returns structured JSON
- Phase 2: 'element_workflow_id' → Returns images + prompts  
- Phase 3: 'a1dbfc3a-b5fa-41be-9720-13960051b88d' → TESTA_ANIMATIC (proven working)
- Phase 4/5: Placeholder workflow IDs

CURRENT TECH STACK: Vite + React 19 + TypeScript + Supabase

API ARCHITECTURE:
- POST /api/webhooks/n8n-trigger (initiate workflow)
- POST /api/webhooks/n8n-callback (receive results)
- GET /api/jobs/:jobId/status (polling for updates)

DELIVERABLES:
- N8N webhook trigger utilities
- Callback handling system  
- Job status tracking in database
- Real-time status updates in UI
- Error handling and user feedback

INTEGRATION: Must work with project_phases table and update phase status/content.
```

### **TASK 5: Phase 2 - Element Images Module**
```bash
# Claude CLI Prompt
I need you to create Phase 2 (Element Images) module for FLOW.STUDIO MVP.

CONTEXT: This phase generates reference images for story elements using Phase 1 JSON output as input.

REQUIREMENTS:
1. ElementImagesModule component with image gallery display
2. Integration with Phase 1 output (elements from script_interpretation)
3. "Generate Elements" button triggering n8n workflow
4. Image gallery showing generated images with prompts used
5. Individual image approval/regeneration functionality
6. Save phase functionality with version management

EXPECTED OUTPUT FORMAT:
- Array of generated images for each element (characters, locations, props)
- Each image with: URL, prompt used, element reference, metadata
- User can approve/reject individual images
- User can trigger regeneration of specific elements

CURRENT TECH STACK: Vite + React 19 + TypeScript + Supabase

UI/UX DESIGN:
- Grid layout for image gallery
- Image cards with prompt text overlay
- Approve/regenerate buttons per image
- Loading states during generation
- Progress indicator for batch operations

DELIVERABLES:
- ElementImagesModule component
- Image gallery with approval workflow
- Individual element regeneration
- Integration with Phase 1 output data
- Version management for phase content

DEPENDENCIES: Requires Phase 1 to be completed (script_interpretation content available).
```

### **TASK 6: Phase 3 - Scene Generation Module**
```bash
# Claude CLI Prompt
I need you to create Phase 3 (Scene Generation) module for FLOW.STUDIO MVP.

CONTEXT: This phase generates actual scene images using TESTA_ANIMATIC workflow with proven >95% character consistency.

REQUIREMENTS:
1. SceneGenerationModule component for scene-by-scene image generation
2. Integration with validated TESTA_ANIMATIC n8n workflow (a1dbfc3a-b5fa-41be-9720-13960051b88d)
3. Scene gallery showing generated animatic frames
4. Individual scene regeneration capabilities
5. Character consistency validation display
6. Phase completion with Italian campaign validation

PROVEN INTEGRATION:
- N8N Workflow: a1dbfc3a-b5fa-41be-9720-13960051b88d (working)
- Input: Phase 1 + Phase 2 content (elements + reference images)
- Output: Scene images with >95% Samantha character consistency
- Processing Time: 12-18 minutes for complete sequence

CURRENT TECH STACK: Vite + React 19 + TypeScript + Supabase

UI/UX DESIGN:
- Scene-by-scene display with navigation
- Character consistency indicators
- Scene regeneration controls
- Progress tracking during 12-18 minute workflow
- Quality validation interface

DELIVERABLES:
- SceneGenerationModule component
- TESTA_ANIMATIC workflow integration
- Scene gallery with navigation
- Character consistency validation
- Individual scene regeneration system

VALIDATION: Use Italian "UN CONSIGLIO STELLARE" 13-scene sequence as test case.
```

### **TASK 7: UI Polish & Integration Testing**
```bash
# Claude CLI Prompt
I need you to polish the UI and conduct integration testing for FLOW.STUDIO MVP.

CONTEXT: Complete the application with responsive design, error handling, and end-to-end testing.

REQUIREMENTS:
1. Responsive design optimization for all components
2. Comprehensive error handling and user feedback
3. Loading states and progress indicators
4. Integration testing across all 5 phases
5. Performance optimization for large JSON/image handling

TESTING SCENARIOS:
1. Create project → Complete Phase 1 → Complete Phase 2 → Complete Phase 3
2. Edit saved phase → Version creation → History tracking
3. N8N workflow failures → Error recovery → User guidance
4. Phase dependencies → Linear progression validation
5. Italian campaign data → End-to-end animatic generation

CURRENT TECH STACK: Vite + React 19 + TypeScript + Supabase + Inline CSS

DELIVERABLES:
- Responsive design across all screen sizes
- Comprehensive error handling system
- Loading states and progress feedback
- Integration test suite
- Performance optimizations
- User experience refinements

QUALITY STANDARDS:
- <3 second page loads
- Smooth phase transitions
- Clear user feedback
- Robust error recovery
- Professional visual polish
```

---

## 📋 **IMPLEMENTATION TIMELINE**

### **Week 1: Foundation**
- **Days 1-2**: Task 1 (Database Schema & Functions)
- **Days 3-4**: Task 2 (Project Dashboard & Navigation)  
- **Days 5-7**: Task 3 (Phase 1 Module)

### **Week 2: Core Workflow**
- **Days 1-3**: Task 4 (N8N Webhook System)
- **Days 4-5**: Task 5 (Phase 2 Module)
- **Days 6-7**: Task 6 (Phase 3 Module)

### **Week 3: Polish & Testing**
- **Days 1-3**: Task 7 (UI Polish & Integration)
- **Days 4-5**: End-to-end testing with Italian campaign
- **Days 6-7**: Performance optimization and deployment

---

## 🎯 **SUCCESS CRITERIA**

### **MVP Completion Metrics**
- **✅ Linear Flow**: All 5 phases created, dependencies enforced
- **✅ Version Management**: Edit any phase, creates new version with history
- **✅ N8N Integration**: Async workflows with status tracking and callbacks
- **✅ Italian Campaign**: Complete end-to-end test with UN CONSIGLIO STELLARE data
- **✅ Character Consistency**: >95% Samantha recognition in Phase 3 output

### **Technical Validation**
- **Database**: All CRUD operations with proper RLS
- **Authentication**: Project isolation per user
- **Performance**: <3 second page loads, <15 minute n8n workflows
- **Error Handling**: Robust recovery from n8n failures
- **UI/UX**: Professional interface matching enterprise standards

---

**DEVELOPMENT READY**: Complete wireframe established, database schema refined, and task-specific Claude CLI prompts prepared. Each task builds incrementally on previous work with clear deliverables and integration points.