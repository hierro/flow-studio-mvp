# FLOW.STUDIO MVP: Complete Claude CLI Development Guide
## Knowledge Transfer for Web Application Development

---

## 🛡️ SENIOR ENGINEERING PRINCIPLES (CRITICAL ENFORCEMENT)

### 🎯 Holistic Solution Design (NEVER QUICK PATCHES)
**MANDATORY APPROACH**: Every change must be analyzed through the entire system architecture lens:

1. **System Impact Analysis** (REQUIRED BEFORE ANY CHANGE):
   - Database schema implications
   - API contract changes
   - Component tree dependencies
   - Authentication flow integrity
   - Real-time data flow effects
   - n8n workflow integration impacts

2. **Connected Flow Validation** (ENFORCE ON EVERY MODIFICATION):
   ```javascript
   // Before ANY change, validate these flows:
   const systemFlows = {
     authentication: "login → middleware → protected routes → logout",
     projectLifecycle: "create → phases → n8n integration → completion",
     dataFlow: "UI → API → Database → n8n → UI updates",
     errorHandling: "try/catch → user feedback → recovery paths"
   }
   ```

3. **Anti-Pattern Enforcement** (STRICT RULES):
   - ❌ **NO isolated file changes** without system impact analysis
   - ❌ **NO quick fixes** that bypass architectural patterns
   - ❌ **NO breaking changes** to working authentication system
   - ❌ **NO component creation** without reviewing existing patterns
   - ❌ **NO database changes** without migration and rollback strategy
   - ❌ **NO API modifications** without contract versioning consideration

4. **Solution Integrity Checklist** (RUN BEFORE EVERY COMMIT):
   ```bash
   # MANDATORY validation sequence:
   npm run build     # TypeScript compilation check
   npm run lint      # Code quality validation
   # Test authentication flow still works
   # Verify no regression in existing functionality
   # Check all imports and dependencies are intact
   ```

### 🏗️ Architecture-First Development
**PRINCIPLE**: Design the complete solution before writing any code.

1. **Change Impact Matrix** (REQUIRED):
   ```
   CHANGE TYPE → AFFECTED SYSTEMS
   UI Component → State Management + API + Database + n8n
   API Route → Authentication + Database + Error Handling + UI
   Database Schema → API Contracts + UI Components + n8n Integration
   ```

2. **Dependency Flow Understanding**:
   ```
   User Action → UI Component → API Route → Database → n8n Workflow
        ↓           ↓            ↓           ↓           ↓
   Real-time UI ← WebSocket ← Webhook ← n8n Response ← Processing
   ```

3. **Integration Points Validation**:
   - Supabase Auth → React Router → Protected Routes (client-side)
   - Project CRUD → Database RLS → User Context
   - n8n Webhooks → Job Tracking → Real-time Updates  
   - File Storage → Asset Management → UI Display

### 🔧 Development Server Management (VITE OPTIMIZED)

**PRINCIPLE**: Never start dev server instances without user control.

1. **Server Instance Control**:
   ```bash
   # ❌ NEVER auto-start: npm run dev
   # ✅ ALWAYS let user control: "Please run npm run dev when ready"
   # ✅ USER MANAGES: Start/stop/restart cycles for easier debugging
   ```

2. **Vite HMR Performance** (VALIDATED WORKING):
   ```bash
   # ✅ ACHIEVED: Lightning fast development
   # Vite startup: ~400-500ms
   # File changes: Instant updates (<100ms)
   # TypeScript: Sub-second compilation
   # React components: Hot reload without state loss
   ```

3. **Development Flow Integrity**:
   ```javascript
   // VALIDATED performance metrics:
   const viteFlowMetrics = {
     startup: "423ms server ready",
     hmr: "Instant file save → browser update",
     compilation: "ESBuild TypeScript → <100ms",
     errorFeedback: "Immediate overlay in browser",
     routeChanges: "React Router → instant navigation"
   }
   ```

4. **Server Management Best Practices**:
   - Always inform user before suggesting `npm run dev`
   - Never assume server is running
   - Provide clear instructions for stopping server (Ctrl+C)
   - Vite HMR works out-of-the-box (no config needed)
   - Port auto-increment if 3000 occupied

---

## 🎯 PROJECT VISION & CONTEXT

### Core Mission
Build a **web-based animatic generation MVP** that preserves our proven n8n automation while adding professional human-in-the-loop workflows. This prototype validates the complete FLOW.STUDIO framework before team implementation.

### Proven Foundation (WORKING)
- ✅ **n8n TESTA_ANIMATIC workflow**: 95% success rate, <$30 cost, 15-minute processing
- ✅ **Advanced prompt engineering**: 5-step sequential composition with element hierarchy
- ✅ **FAL.ai FLUX integration**: Professional-quality image generation with status polling
- ✅ **Character consistency system**: Samantha Cristoforetti LoRA training methodology
- ✅ **Italian Campaign validation**: 13-scene storyboard successfully processed

### MVP Objective
Create a **Vercel + Supabase + n8n web application** that enables users to upload storyboard data, trigger our proven workflows, and manage multi-step content generation with professional approval interfaces.

---

## 🏗️ TECHNICAL ARCHITECTURE (EVOLVED - PERFORMANCE OPTIMIZED)

### Technology Stack (CURRENT IMPLEMENTATION - VALIDATED 2025-01-22)
```
Frontend: Vite 5.4.19 + React 19.1.0 + React Router 6.28.0 + TypeScript 5
Styling: Inline styles (performance-first approach) ✅ PROVEN WORKING
Authentication: Supabase Auth (@supabase/supabase-js 2.52.0) ✅ WORKING
Backend: Supabase PostgreSQL + Row Level Security ✅ ENHANCED SCHEMA READY  
File Storage: Supabase Storage (ready for integration)
Automation: n8n workflows (TESTA_ANIMATIC a1dbfc3a) ✅ INTEGRATION READY
AI Services: FAL.ai FLUX (proven integration) ✅ INTEGRATION READY
Deployment: Vite build → Static hosting ready (3.48s production build)

Development Tools:
- Vite ESBuild (3.48s production build, instant HMR)
- TypeScript strict mode (compilation clean ✅)
- ESLint 9 (config needs minor fix)
- Node.js + npm (package management)
```

### 🚨 ARCHITECTURE EVOLUTION (CRITICAL LEARNING)
**MIGRATED FROM**: Next.js 15.4.2 + SSR + Tailwind CSS v4  
**MIGRATED TO**: Vite + React Router + Direct Supabase client  
**REASON**: Next.js on-demand compilation caused 3.5s page loads (unacceptable for development)  
**RESULT**: 10x faster development experience, identical authentication functionality

### Database Schema (ENHANCED - READY TO DEPLOY)
```sql
-- Core project tracking
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  static_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Step tracking (linear progression)
CREATE TABLE project_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL, -- 'reference_table', 'reference_images', 'scenes', etc.
  status TEXT DEFAULT 'pending', -- pending, processing, completed, locked
  data JSONB, -- Step-specific data and user modifications
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(project_id, step_name)
);

-- Generated assets (images, videos, JSON)
CREATE TABLE project_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- 'image', 'video', 'json', 'text'
  asset_url TEXT,
  asset_data JSONB, -- For non-file assets
  metadata JSONB,
  approved BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- n8n job tracking
CREATE TABLE n8n_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  n8n_execution_id TEXT,
  status TEXT DEFAULT 'running', -- running, completed, failed
  webhook_url TEXT,
  result_data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Row Level Security enabled on ALL tables
-- Users can only access their own data
```

---

## 📋 MVP WORKFLOW (DETAILED)

### User Journey Flow
```
1. User Authentication
   ↓
2. Project Creation → Upload/Store Italian Storyboard JSON
   ↓
3. Reference Table Generation → n8n triggers → User reviews/modifies → Lock
   ↓
4. Reference Images Generation → n8n triggers → Gallery display → User approves → Lock
   ↓
5. Scene Generation → n8n triggers → Frame-by-frame review → User approves → Lock
   ↓
6. Final Assembly → Video compilation → Client-ready output
```

### Step Pattern (REUSABLE)
```javascript
// Every step follows this pattern:
const stepFlow = {
  trigger: "User clicks Generate",
  process: "n8n webhook called with project data",
  store: "Results saved to database",
  display: "UI shows generated content",
  interact: "User can modify/approve/reject",
  lock: "User confirms and locks step",
  cascade: "Next step becomes available"
}
```

---

## 🎬 PROVEN N8N TESTA_ANIMATIC WORKFLOW (PRODUCTION-READY)

### 🏆 Current Working System Analysis
**File**: `docs/TESTA_ANIMATIC.json` - Sophisticated 5-phase production pipeline

#### **Phase Structure** (Directly Adaptable to Web Interface)
```
1. DATA LOADING
   ├── Italian Campaign Storyboard (UN CONSIGLIO STELLARE)
   ├── Universal Schema for any project
   └── FAL.ai FLUX DEV configuration

2. IO SETUP  
   ├── Google Drive folder creation
   ├── Google Sheets reporting
   └── Timestamp and organization

3. PROMPTS GENERATION
   ├── GPT-4.1 with Lead Storyboard Artist persona
   ├── 5-step composition methodology
   └── Character consistency enforcement

4. FRAMES GENERATION
   ├── FAL.ai FLUX DEV (1024x768, 16:9)
   ├── Status polling (IN_PROGRESS → COMPLETED)
   └── Async processing with error handling

5. CONTENT COLLECTION
   ├── Asset organization in Google Drive
   └── Metadata compilation
```

#### **🧬 Samantha Character Consistency System** (Proven at Scale)
```javascript
// 3-Layer Consistency Architecture
const characterSystem = {
  layer1_base_description: "Samantha Cristoforetti, 47 years old, short brown hair, confident expression, blue ESA astronaut uniform with patches",
  
  layer2_consistency_rules: [
    "Identical facial features and hair across all scenes",
    "Blue ESA uniform must be consistent in color and design", 
    "Confident, authoritative expression maintained",
    "Professional astronaut posture and demeanor"
  ],
  
  layer3_scene_variants: {
    "scene_1": {
      "action": "standing confidently at entrance, welcoming gesture",
      "position": "foreground center, facing children group",
      "expression": "warm, welcoming, confident"
    }
    // Behavioral adaptations per scene while preserving identity
  }
};
```

#### **🎯 GPT-4 Prompt Generation Methodology** (800-char optimized)
```javascript
// System prompt methodology (proven successful)
const promptSystem = {
  persona: "Lead Storyboard Artist at premium animation production house",
  
  methodology: {
    step1: "LOCATIONS - Set architectural stage",
    step2: "CHARACTERS - Place with identity preservation", 
    step3: "PROPS - Include with consistent appearance",
    step4: "ACTIONS - Layer behaviors on identity",
    step5: "STYLE - Apply aesthetic wrapper"
  },
  
  hierarchy: "base_description > consistency_rules > scene_variants",
  output: "natural, flowing prompts maintaining absolute visual consistency"
};
```

#### **⚡ FAL.ai FLUX Integration** (Production-tested)
```javascript
const falConfig = {
  endpoint: "fal-ai/flux/dev",
  resolution: "1024x768", 
  aspectRatio: "16:9",
  inferenceSteps: 28,
  guidanceScale: 3.5,
  statusPolling: "IN_PROGRESS → IN_QUEUE → COMPLETED",
  errorHandling: "Robust retry mechanisms"
};
```

---

## 🔌 N8N INTEGRATION (CRITICAL)

### Existing Working Workflow (✅ Production-Ready)
- **File**: `docs/TESTA_ANIMATIC.json` (comprehensive 5-phase pipeline)
- **Webhook**: `a1dbfc3a-b5fa-41be-9720-13960051b88d` (ready for integration)
- **Input**: Italian "UN CONSIGLIO STELLARE" campaign + universal schema
- **Output**: FAL.ai FLUX images + Google Drive organization + metadata
- **Processing**: 12-18 minutes for complete animatic (proven at scale)
- **Character Consistency**: Samantha Cristoforetti with 3-layer system
- **Quality**: >95% success rate with professional output

### Integration Pattern (Based on Working TESTA_ANIMATIC)
```javascript
// Webhook trigger adapted from working n8n workflow
POST /api/webhooks/n8n-trigger
{
  projectId: "uuid",
  phaseName: "reference_images", // Aligned with 5-phase structure
  jobType: "full_generation" | "selective_regeneration",
  
  // Italian campaign structure (proven format)
  projectData: {
    project_metadata: {
      title: "UN CONSIGLIO STELLARE",
      client: "Ministero della Salute"
    },
    elements: {
      samantha: { /* 3-layer consistency data */ },
      children_group: { /* consistency data */ },
      circular_library: { /* location data */ }
    },
    scenes: {
      scene_1: {
        natural_description: "Original script text",
        elements_present: ["samantha", "children_group"],
        duration: "3 seconds",
        camera_type: "wide establishing shot"
      }
    }
  },
  
  webhookUrl: "/api/webhooks/n8n-complete"
}

// n8n completion webhook (proven return structure)
POST /api/webhooks/n8n-complete
{
  job_id: "uuid",
  project_id: "uuid", 
  phase_name: "reference_images",
  status: "completed",
  
  // Proven output structure from working workflow
  result_data: {
    generated_images: [
      {
        scene_id: 1,
        image_url: "https://fal.media/files/...", 
        prompt_used: "wide establishing shot of...",
        character_count: 784,
        metadata: { width: 1024, height: 768 }
      }
    ],
    google_drive_folder: "project_folder_url",
    processing_time: "12 minutes"
  }
}
```

### n8n Workflow Modifications Needed (Minimal Changes)
1. **✅ Webhook infrastructure exists** - Current webhook ID: `a1dbfc3a-b5fa-41be-9720-13960051b88d`
2. **Add completion webhook node** - POST results to our web app
3. **✅ Preserve proven logic** - 5-step prompts, FAL.ai FLUX, character consistency
4. **✅ Error handling exists** - Robust status polling and retry mechanisms
5. **Adapt input structure** - Accept web app project format (maintain Italian campaign schema)
6. **✅ Google Drive integration working** - Asset storage and organization ready

---

## 🎨 UI/UX ARCHITECTURE (MODULAR)

### Component Structure
```
PhaseContainer (reusable for all steps)
├── PhaseHeader (title, status, progress)
├── ContentRenderer (dynamic based on content type)
│   ├── TextEditor (for text content)
│   ├── ImageGallery (for image content)  
│   ├── JsonViewer (for structured data)
│   └── MixedContentEditor (for complex content)
└── PhaseActions (Generate, Approve, Regenerate buttons)
```

### Navigation System
```
StepNavigation
├── Step 1: Reference Table [STATUS]
├── Step 2: Reference Images [STATUS]  
├── Step 3: Scene Generation [STATUS]
└── Step 4: Final Assembly [STATUS]

STATUS: pending | processing | completed | locked
```

### Real-Time Updates
- **WebSocket integration** for live n8n job status
- **Loading states** during processing
- **Progress indicators** for long-running operations
- **Error handling** with retry mechanisms

---

## 🇮🇹 ITALIAN CAMPAIGN "UN CONSIGLIO STELLARE" (PRODUCTION REFERENCE)

### 🏆 Validated Production Data
**Project**: Ministero della Salute vaccination campaign
**Location**: `docs/TESTA_ANIMATIC.json` - Complete storyboard with proven results
**Status**: Successfully processed through n8n workflow with >95% success rate

### 👩‍🚀 Samantha Cristoforetti Character System (Proven)

### 🎨 Reference Storyboard Structure (Production-Tested)
```json
{
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
      "character_tones": "Natural skin tones, blue uniforms"
    },
    "rendering_style": {
      "level": "simplified illustration transitioning to cinematic realism",
      "line_work": "clean vector-style outlines",
      "detail_level": "stylized but scalable to photorealistic"
    }
  },
  
  "elements": {
    "samantha": {
      "element_type": "character",
      "frequency": 10,
      "scenes_present": [1, 2, 3, 5, 6, 7, 9, 10, 11, 12],
      "base_description": "Samantha Cristoforetti, 47 years old, short brown hair, confident expression, blue ESA astronaut uniform with patches",
      "consistency_rules": [
        "Identical facial features and hair across all scenes",
        "Blue ESA uniform must be consistent in color and design",
        "Confident, authoritative expression maintained"
      ],
      "variants_by_scene": {
        "scene_1": {
          "action": "standing confidently at entrance, welcoming gesture",
          "expression": "warm, welcoming, confident"
        }
      }
    },
    "children_group": {
      "frequency": 7,
      "base_description": "5 diverse children aged 6-7, mixed gender, curious expressions, casual school clothes",
      "consistency_rules": [
        "Same 5 children throughout (consistent faces and diversity)",
        "Casual school clothing consistent per child"
      ]
    },
    "circular_library": {
      "element_type": "location",
      "frequency": 10,
      "base_description": "magnificent circular library with multiple levels, warm ambient lighting, wood and modern architectural elements"
    }
  },
  
  "scenes": {
    "scene_1": {
      "duration": "3 seconds",
      "camera_type": "wide establishing shot",
      "mood": "wonder and anticipation",
      "natural_description": "The spot opens in a magnificent circular environment: it's the hall of the great library of the Monte Porzio Catone Astronomical Observatory...",
      "dialogue": "LO SPAZIO È UN LUOGO INOSPITALE E PERICOLOSO...",
      "elements_present": ["samantha", "children_group", "circular_library"]
    }
  }
}
```

### 🎥 Scene Processing Results (Validated)
- **Scene 1**: Wide establishing shot - Library introduction with wonder/anticipation
- **Scene 2**: Medium shot - Educational space dangers explanation
- **Scene 3**: Close-up - Holographic astronaut suit demonstration
- **Processing Time**: 12-18 minutes for complete 13-scene animatic
- **Image Quality**: 1024x768, 16:9 aspect ratio, FLUX DEV model
- **Character Recognition**: >95% Samantha consistency across all scenes

### Character Consistency System (VALIDATED)
- **✅ Current Method**: GPT-4 3-layer consistency with proven prompts
- **✅ Success Rate**: >95% recognition achieved across all 13 scenes
- **🚧 Future Enhancement**: FAL.ai LoRA training for even higher consistency
- **Validation**: Automated consistency checking via prompt engineering
- **Scalability**: Universal schema works for any character in any project

---

## 💻 DEVELOPMENT ENVIRONMENT

### Current Setup
```
OS: Windows + VS Code
Node.js: Latest LTS
Package Manager: npm
Git: Initialized repository
Supabase: Account created, authentication working ✅
Vercel: Ready for deployment
Next.js: 15.4.2 with App Router
TypeScript: Strict mode enabled
Tailwind CSS: v4 with custom properties
```

### Project Structure (CURRENT - PRODUCTION READY)
```
flow-studio-mvp/
├── docs/
│   ├── mvp_original_doc.md                    # Original setup guide
│   ├── flow_studio_wireframe_prompts.md      # Enhanced schema design
│   └── TESTA_ANIMATIC.json                   # Proven n8n workflow
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx                     ✅ WORKING - Authentication system
│   │   ├── DashboardPage.tsx                 ✅ WORKING - Project cards & creation
│   │   └── ProjectDetailPage.tsx             ✅ WORKING - 5-phase navigation
│   ├── lib/
│   │   └── database.ts                       ✅ WORKING - Complete CRUD operations
│   ├── types/
│   │   └── project.ts                        ✅ WORKING - Full TypeScript system
│   ├── App.tsx                               ✅ WORKING - React Router with auth
│   ├── main.tsx                              ✅ WORKING - React 19 root
│   ├── globals.css                           ✅ WORKING - Base styles
│   └── vite-env.d.ts                         ✅ WORKING - Vite types
├── Configuration Files:
│   ├── vite.config.ts                        ✅ Vite + React config
│   ├── tsconfig.json                         ✅ TypeScript strict mode (cleaned)
│   ├── eslint.config.mjs                     ✅ ESLint 9 config
│   └── .gitignore                            ✅ Standard Vite
├── .env.local                                ✅ Vite environment variables
└── package.json                              ✅ Minimal dependencies
```

---

## 🔐 CURRENT STATUS & IMMEDIATE TASKS

### ✅ Phase 1 COMPLETED: Authentication System (VALIDATED 2025-01-22)
```
STATUS: FULLY WORKING ✅ PERFORMANCE OPTIMIZED
✅ Full authentication flow implemented (src/pages/LoginPage.tsx)
✅ Supabase integration functional (@supabase/supabase-js direct)
✅ Sign up/Sign in with email/password + validation
✅ Client-side session management (React Router)
✅ Protected dashboard with user info (src/pages/DashboardPage.tsx)
✅ Smart routing (authenticated → dashboard, guest → login)
✅ Error handling and loading states
✅ Inline CSS styling pattern established
✅ TypeScript strict mode compilation clean
✅ Production build working (3.48s Vite build)
```

### ✅ Phase 2 COMPLETED: Project Management System (WORKING)
```
STATUS: FULLY IMPLEMENTED ✅ PROFESSIONAL GRADE
✅ Enhanced database schema deployed and integrated
✅ Complete database utility functions (src/lib/database.ts)
✅ Project CRUD operations with automatic 5-phase initialization
✅ Italian campaign template integration working
✅ Linear phase progression logic implemented
✅ Project dashboard with cards and creation modal (src/pages/DashboardPage.tsx)
✅ Project detail page with 5-phase sidebar navigation (src/pages/ProjectDetailPage.tsx)
✅ Complete TypeScript interfaces (src/types/project.ts)
✅ React Router navigation: /dashboard → /project/:id working
✅ Production build clean: 3.43s compilation time
```

### Implementation Roadmap (UPDATED)
```
✅ WEEK 1: Foundation (COMPLETED)
- [x] Environment setup (Supabase + Vercel)
- [x] Database schema design and deployment
- [x] Authentication flow ✅ WORKING
- [x] Enhanced database schema deployed ✅ WORKING
- [x] Complete project management system ✅ WORKING

✅ WEEK 2: Project Management System (COMPLETED)
- [x] Database utility functions (src/lib/database.ts) ✅ WORKING
- [x] Project dashboard with cards and creation ✅ WORKING
- [x] 5-phase sidebar navigation ✅ WORKING
- [x] Italian campaign template integration ✅ WORKING
- [x] Linear phase progression logic ✅ WORKING

🎯 WEEK 3: Phase Implementations (CURRENT FOCUS)
- [ ] Phase 1: Script Interpretation with n8n integration
- [ ] Phase 2: Element Images gallery and approval
- [ ] Phase 3: Scene Generation (TESTA_ANIMATIC integration)
- [ ] N8N webhook system for async processing
- [ ] Real-time job status updates

🚀 WEEK 4: Complete Pipeline
- [ ] All 5 phases implemented and tested
- [ ] End-to-end Italian campaign processing
- [ ] Character consistency validation (>95% Samantha)
- [ ] Production deployment optimization
```

---

## ✅ CURRENT IMPLEMENTATION STATUS (UPDATED 2025-01-22)

### Phase 1: Authentication & Foundation (COMPLETED - VITE MIGRATION)

#### 🚀 Fully Working Components (MIGRATED & VALIDATED)
- **Authentication System** (`src/pages/LoginPage.tsx`): ✅
  - Email/password sign up and sign in with form validation
  - Loading states and comprehensive error handling  
  - React Router based navigation (client-side)
  - Clean inline styling (performance optimized)
  - Direct @supabase/supabase-js integration

- **Dashboard** (`src/pages/DashboardPage.tsx`): ✅
  - Client-side authentication validation
  - User welcome message with email display
  - Protected route with React Router Navigate
  - Logout functionality working

- **Navigation & Routing** (`src/App.tsx`): ✅
  - React Router with automatic auth-based redirects
  - Authentication context and state management
  - Clean component architecture (no layout complexity)

- **Supabase Integration**: ✅
  - Direct @supabase/supabase-js client (lightweight)
  - Environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
  - Authentication working end-to-end

#### 🛠️ Development Environment (VITE OPTIMIZED)
- **Vite 5.1.0** with React 19 and TypeScript strict mode ✅
- **ESBuild compilation** - 423ms startup, instant HMR ✅
- **Minimal dependencies** - Only essential packages ✅
- **Production build** - TypeScript compilation clean ✅

### Phase 2: Database & Project Management (NEXT PRIORITY)

#### 🎯 Immediate Next Steps
1. **Database Schema Deployment** - Deploy the comprehensive schema to Supabase
2. **Project CRUD Operations** - Build API routes for project management
3. **Project Dashboard** - Create project listing and creation UI
4. **Italian Campaign Integration** - Add test data and project templates
5. **Step Navigation Framework** - Build the PhaseContainer architecture

#### 📋 Enhanced Database Schema (DESIGNED, READY FOR DEPLOYMENT)
```sql
-- COMPREHENSIVE 5-PHASE WORKFLOW SCHEMA (docs/flow_studio_wireframe_prompts.md)
-- Tables: projects, project_phases, phase_versions, n8n_jobs
-- Row Level Security policies designed for user isolation
-- Linear phase dependencies with version management
-- Italian campaign metadata structure integrated
-- Performance indexes optimized for workflow queries
-- All tables compatible with existing Supabase Auth setup
```

#### 🔌 n8n Integration (PLANNED)
- API webhooks for TESTA_ANIMATIC workflow integration
- Bidirectional communication system
- Job tracking and progress monitoring
- Character consistency with Samantha LoRA training

---

## 🎨 DESIGN PHILOSOPHY

### Human-in-the-Loop Approach
- **AI generates**, humans **review and approve**
- **Strategic intervention points** for quality control
- **Non-linear workflow** - users can revisit any step
- **Professional UX** suitable for client-facing work

### Modular Architecture
- **Reusable components** for all workflow steps
- **Database-driven state** management
- **Scalable patterns** for infinite step expansion
- **Enterprise-grade** error handling and logging

---

## 🔧 PROMPT ENGINEERING SYSTEM (PROVEN)

### 5-Step Sequential Composition
```javascript
const promptMethodology = {
  step1: "LOCATIONS - Set architectural stage",
  step2: "CHARACTERS - Place with identity preservation", 
  step3: "PROPS - Include with consistent appearance",
  step4: "ACTIONS - Layer behaviors on identity",
  step5: "STYLE - Apply aesthetic wrapper"
}

const elementHierarchy = {
  baseDescription: "Visual DNA (never changes)",
  consistencyRules: "Absolute constraints", 
  sceneVariants: "Behavioral adaptations only"
}
```

### Integration Points
- **System prompt**: Defines LLM as Lead Storyboard Artist
- **User prompt**: Provides structured element data
- **Validation**: Character limits, element inclusion, success rate tracking
- **Output**: Ready-to-use FLUX prompts with >95% success rate

---

## 💡 CLAUDE CLI DEVELOPMENT APPROACH

### Architecture-First Implementation
- **Understand enterprise patterns** - map to web equivalents
- **Component-based thinking** - reusable across workflow steps  
- **Database-centric design** - UI reflects data state
- **Integration-focused** - n8n communication priority

### Code Generation Priorities
1. **Authentication completion** (immediate)
2. **Project management system** (foundation)
3. **First step integration** (validation) 
4. **Reusable component patterns** (scalability)
5. **Real-time webhook handling** (production-ready)

### Quality Standards
- **TypeScript strict mode** - no `any` types
- **Error boundaries** - graceful failure handling
- **Loading states** - professional user experience
- **Responsive design** - mobile-friendly interfaces
- **Performance optimization** - fast page loads

---

## 🎯 SUCCESS METRICS

### Technical Validation
- [x] ✅ User authentication working perfectly (Supabase + Vite)
- [ ] n8n integration triggers successfully  
- [ ] Generated content displays correctly
- [ ] Step approval workflow functions
- [ ] Real-time updates work reliably

### Business Validation  
- [ ] Italian storyboard processes end-to-end
- [ ] Samantha character consistency >95%
- [ ] Total processing time <20 minutes
- [ ] Professional output quality maintained
- [ ] Human approval points function correctly

---

## 🚀 DEPLOYMENT CONFIGURATION

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
N8N_WEBHOOK_SECRET=your-webhook-secret

# n8n Integration (TO BE CONFIGURED)
N8N_WEBHOOK_URL=your-n8n-webhook-endpoint
N8N_API_KEY=your-n8n-api-key
```

### Vercel Deployment
- **Build Command**: `npm run build`
- **Output Directory**: `.next` 
- **Node.js Version**: 18.x
- **Environment Variables**: All above configured in dashboard

---

## 📚 CRITICAL INTEGRATION KNOWLEDGE

### FAL.ai FLUX Configuration (PROVEN)
```javascript
const falAiConfig = {
  endpoint: "fal-ai/flux/dev",
  cost: "$0.025/megapixel", 
  imageSize: { width: 1024, height: 768 },
  inferenceSteps: 28,
  guidanceScale: 3.5,
  characterLora: "samantha_character_lora" // TO BE TRAINED
}
```

### Character Consistency System
```javascript
const characterSystem = {
  training: {
    method: "LoRA training on FAL.ai",
    referenceImages: 20, // curated Samantha images
    trainingTime: "~5 minutes",
    cost: "$2 per character"
  },
  validation: {
    targetRecognition: ">95%",
    testScenes: "All 13 Italian campaign scenes", 
    qualityCheck: "Human approval before final generation"
  }
}
```

---

## 🎪 DEVELOPMENT PRIORITIES

### Phase 2 - Database & Project System (CURRENT PRIORITY)
1. **Deploy database schema** - Implement the comprehensive PostgreSQL schema
2. **Build project CRUD APIs** - Create REST endpoints for project management
3. **Project dashboard UI** - Create, list, and manage projects interface
4. **Italian campaign data** - Integrate test storyboard as default project

### Phase 3 - Workflow Integration  
1. **PhaseContainer system** - Build reusable step management components
2. **n8n webhook integration** - Connect TESTA_ANIMATIC workflow
3. **Real-time updates** - Job status and progress monitoring
4. **Content rendering system** - Dynamic UI for different content types

### Phase 4 - Production Ready
1. **End-to-end testing** - Complete Italian storyboard processing
2. **Character consistency** - Samantha LoRA training integration
3. **Performance optimization** - Sub-20 minute processing target
4. **Production deployment** - Vercel deployment with monitoring

---

## 🔄 FEEDBACK LOOPS & ITERATION

### User Testing Protocol
1. **Technical validation** - each step functions correctly
2. **UX validation** - intuitive navigation and controls
3. **Integration validation** - n8n communication reliable  
4. **Quality validation** - professional output standards
5. **Performance validation** - acceptable processing times

### Architecture Evolution
- **Start simple** - basic functionality first
- **Add complexity gradually** - build on proven foundation
- **Maintain modularity** - easy to extend and modify
- **Document decisions** - clear handoff to team implementation

---

## 💼 BUSINESS CONTEXT

### Strategic Importance
This MVP validates the complete FLOW.STUDIO framework concept, proving that AI-enhanced creative workflows can deliver professional results while preserving human creative control.

### Technology Validation
Success demonstrates that our enterprise architectural thinking translates effectively to modern web development, validating both the technical approach and business model.

### Team Handoff Preparation
The completed MVP serves as a comprehensive specification for development team implementation, with proven integration patterns and validated user experience design.

---

## 📚 CRITICAL SESSION LEARNINGS (2025-01-22)

### 🚨 MAJOR DISCOVERY: Next.js 15 Performance Issues
**Problem**: Next.js 15 with on-demand compilation caused unacceptable dev experience:
- **3.3s startup time**
- **2.3s per page compilation** (697-735 modules per page)
- **No pre-compilation** - every page visit triggered compilation
- **@supabase/ssr + Tailwind CSS v4** = massive dependency bloat

**Solution**: **Complete migration to Vite + React Router**
- **Result**: 423ms startup, instant page loads, smooth HMR
- **Auth preserved**: Identical Supabase authentication flow
- **Clean structure**: Minimal dependencies, no framework bloat

### 🎯 Architecture Lessons
1. **Framework Choice Critical**: Next.js 15's "lazy compilation" philosophy wrong for small apps
2. **Dependency Audit Essential**: @supabase/ssr (735 modules) vs @supabase/supabase-js (minimal)
3. **Vite Superior for Auth**: Client-only auth simpler and faster than SSR complexity
4. **Holistic Thinking Works**: Analyzed entire system instead of quick patches

### ✅ Current Working State
- **✅ Vite + React Router**: Lightning fast development
- **✅ Supabase Authentication**: Login/dashboard flow working
- **✅ Clean Architecture**: Only essential files remain
- **✅ TypeScript Compilation**: No errors in build process
- **✅ Knowledge Base**: Generated for next session handoff

### 🔄 Next Session Priority
**Phase 2: Database & Project Management**
1. Deploy Supabase database schema
2. Build project CRUD operations  
3. Add Italian campaign test data
4. Integrate n8n TESTA_ANIMATIC workflow

---

**🏁 PHASE 2 COMPLETE - PROJECT MANAGEMENT SYSTEM SUCCESS**

### 🚀 What's Working Now (VALIDATED 2025-01-22)
- ✅ **Complete authentication system** - Vite + React Router + Supabase Auth
- ✅ **Project management system** - Dashboard, creation, navigation working
- ✅ **5-phase linear workflow** - Sidebar navigation with progression logic
- ✅ **Database integration** - Complete CRUD operations with RLS
- ✅ **TypeScript system** - Full type safety across all components
- ✅ **Italian campaign template** - UN CONSIGLIO STELLARE integration ready
- ✅ **Production build** - 3.43s compilation, 119 modules optimized
- ✅ **Proven n8n TESTA_ANIMATIC workflow** - Ready for Phase 3 integration

### 🎯 Current Priority: Phase 1 Implementation (Script Interpretation)

**IMMEDIATE NEXT STEPS:**
1. **Script Interpretation Module** - Build Phase 1 UI with JSON display and editing
2. **N8N Integration** - Connect to script_workflow_id for storyboard analysis
3. **Content Management** - Save/edit phase content with version management
4. **Phase Progression** - Save & unlock Phase 2 workflow
5. **Italian Campaign Testing** - Process UN CONSIGLIO STELLARE end-to-end

**Claude CLI Integration Points:**
- Generate React components with Supabase integration
- Build client-side data fetching patterns
- Implement real-time subscriptions for n8n job status
- Create TypeScript interfaces from database tables 
- Build UI components for Italian campaign project management
- Implement PhaseContainer system with Samantha character consistency
- Adapt TESTA_ANIMATIC webhook integration for web interface

---

## 🤖 SMART SESSION CLOSURE WORKFLOW

### 📊 Project Scanner Usage
**File**: `project-scanner.js` - Comprehensive codebase analysis and knowledge generation

```bash
# Generate complete project knowledge base
node project-scanner.js

# Outputs:
# 1. knowledge-base-[timestamp].json    - Complete technical analysis
# 2. handoff-summary-[timestamp].md     - Quick reference for next session
```

### 🔄 Session Evolution Process
When closing a development session:

1. **🔍 Validation** (if changes made):
   - Test authentication system still works
   - Verify no regressions in working components
   - Check TypeScript compilation: `npm run build`
   - Validate with linter: `npm run lint`

2. **🧬 CLAUDE.md Evolution** (intelligent updates):
   - **Merge & streamline** - consolidate similar patterns
   - **Learn from errors** - update anti-patterns from session mistakes  
   - **Incorporate insights** - add discoveries from n8n workflow analysis
   - **Refine instructions** - improve based on implementation experience
   - **Remove outdated** - clean up superseded approaches
   - **Strengthen core** - reinforce successful patterns (like auth system)

3. **📋 DOCUMENTATION CONSISTENCY AUDIT** (NEW REQUIREMENT):
   - **Cross-check codebase vs docs**: Verify file paths, versions, dependencies match reality
   - **Eliminate redundancy**: Remove duplicated content between CLAUDE.md and README.md
   - **Fix inconsistencies**: Resolve conflicting claims (e.g., processing times, versions)
   - **Clean unused files**: Remove artifacts from architecture changes (next.svg, etc.)
   - **Purpose separation**: CLAUDE.md = development guide, README.md = user-facing overview
   - **Version accuracy**: Ensure all version claims match package.json exactly

4. **📊 Knowledge Base Generation**:
   ```bash
   # Create optimized handoff context
   node project-scanner.js && echo "✅ Knowledge base ready for Claude web interface"
   ```

5. **✅ Handoff Preparation**:
   - **Current State**: Phase 1 complete (Vite authentication working)
   - **Next Priority**: Database implementation and project management  
   - **Critical Context**: TESTA_ANIMATIC workflow integration ready
   - **Success Patterns**: Vite + React Router auth, TypeScript strict mode, client-side architecture
   - **Anti-patterns**: Avoid server-side complexity, keep development fast
   - **Documentation Status**: All docs aligned with actual codebase

### 📝 Documentation Sync Strategy
- **CLAUDE.md**: Comprehensive development guide (this file) - Technical details
- **README.md**: User-facing project overview - Installation & usage focused  
- **docs/**: Reference materials (mvp_original_doc.md, TESTA_ANIMATIC.json)
- **project-scanner.js**: Automated knowledge extraction and session handoffs

### 🔍 Documentation Quality Checklist (NEW)
Before each commit, validate:
- [ ] File paths in docs match actual codebase structure
- [ ] Version numbers match package.json exactly  
- [ ] No contradictory claims between CLAUDE.md and README.md
- [ ] No duplicated content (each doc serves its purpose)
- [ ] No outdated artifacts from architecture changes
- [ ] Environment variables match actual .env requirements

### 💡 Knowledge Evolution Principles
- **Preserve working systems** - Authentication is stable, don't disrupt
- **Build incrementally** - Database → Projects → n8n integration → Workflows
- **Maintain holistic view** - All components must work together seamlessly
- **Document decisions** - Every architectural choice should be explained
- **Validate continuously** - Use project scanner to ensure consistency