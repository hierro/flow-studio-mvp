# FLOW.STUDIO MVP

> **Revolutionary Timeline-Based Video Production Platform**  
> Transform script concepts into professional video content through intelligent timeline architecture and AI-powered scene generation.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/user/flow-studio-mvp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF)](https://vitejs.dev/)

## 🎯 **Overview**

FLOW.STUDIO revolutionizes video production by providing **Story Intelligence** - understanding narrative relationships across scenes instead of just perfecting individual frames. Built for directors, content creators, and production teams who need professional video content with narrative coherence.

### **Key Innovation: 3-Tab Timeline Architecture**
- **Scenes Tab**: Horizontal timeline with narrative flow visualization
- **Elements Tab**: Cross-scene character/location consistency tracking  
- **Style Tab**: Global style control affecting entire production

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ (LTS recommended)
- Supabase account with database setup
- n8n workflow endpoint (for AI generation)

### **Installation**
```bash
git clone https://github.com/user/flow-studio-mvp.git
cd flow-studio-mvp
npm install
cp .env.example .env.local
# Configure your Supabase and n8n credentials in .env.local
npm run dev
```

### **First Project**
1. **Register/Login** → Secure authentication via Supabase
2. **Create Project** → Italian Campaign template included
3. **Generate Script** → AI-powered script interpretation via n8n
4. **Timeline View** → Visual story intelligence interface
5. **JSON Editor** → Direct content editing and versioning

## 🏗️ **Technical Architecture**

### **Frontend Stack**
- **Framework**: Vite 5.4 + React 19 + TypeScript 5
- **Styling**: Global CSS system with design tokens (27.8KB optimized)
- **Routing**: React Router 6.28 with protected routes
- **Performance**: 4.46s build time, instant HMR, 486KB JS bundle

### **Backend Integration**
- **Database**: Supabase PostgreSQL with enhanced schema v2.0
- **Authentication**: Supabase Auth with RLS policies
- **AI Workflow**: n8n TESTA_ANIMATIC integration (95%+ success rate)
- **Character Consistency**: Proven Samantha Cristoforetti system

### **Database Schema v2.0**
```sql
-- Core production workflow
✅ projects          -- Project metadata + timeline features
✅ project_phases    -- 5-phase workflow progression  
✅ phase_versions    -- Complete version history
✅ n8n_jobs         -- AI workflow tracking

-- Story intelligence features  
✅ content_changes   -- Cross-phase change tracking
✅ project_assets    -- Asset approval workflows
✅ user_activities   -- Analytics and debugging
```

## 🎬 **Production Features**

### **5-Phase Workflow**
1. **Script Interpretation** ✅ Complete (JSON editing + n8n integration + timeline editing)
2. **Element Images** 🔄 Ready for implementation  
3. **Scene Generation** 🔄 TESTA_ANIMATIC integration ready
4. **Scene Videos** 📋 Planned (FAL.ai FLUX integration)
5. **Final Assembly** 📋 Planned (compilation workflows)

### **Story Intelligence System**
- **Narrative Understanding**: Scene relationships vs isolated frames
- **Character Consistency**: >95% recognition across multi-scene projects
- **Cross-Scene Editing**: Modify elements from any phase
- **Global Style Control**: Persistent styling across entire production

### **Proven Production Integration**
- **n8n Webhook**: Production endpoint validated and working
- **Italian Campaign**: Complete 13-scene animatic with Samantha Cristoforetti
- **Processing Time**: 12-18 minutes for complete animatic generation
- **Success Rate**: 95%+ with proven character consistency

## 🛠️ **Development**

### **Project Structure**
```
flow-studio-mvp/
├── src/
│   ├── components/           # React components
│   ├── pages/               # Route pages  
│   ├── lib/                 # Database & utilities
│   ├── types/               # TypeScript interfaces
│   └── contexts/            # React contexts
├── docs/                    # Technical documentation
├── public/                  # Static assets
└── database/               # Schema & migrations
```

### **Development Commands**
```bash
npm run dev          # Development server (instant startup)
npm run build        # Production build (4.46s)
npm run lint         # Code quality checks
npm run preview      # Preview production build
```

### **Code Quality Standards**
- **TypeScript Strict Mode**: Full type safety
- **ESLint Configuration**: Code consistency  
- **Responsive Design**: Mobile-first, no px values
- **Performance Optimized**: Separated CSS/JS bundles

## 📊 **Performance Metrics**

### **Build Performance**
- **Build Time**: 4.46s (optimized Vite configuration)
- **Bundle Size**: CSS 27.8KB, JS 486KB (separated and optimized)
- **Hot Reload**: Instant updates during development
- **TypeScript**: Clean compilation, zero type errors

### **Production Metrics**
- **Character Consistency**: >95% across 13-scene productions
- **AI Processing**: 12-18 minutes for complete animatic
- **Database Performance**: Optimized queries with strategic indexes
- **User Experience**: Instant page loads, responsive interface

## 🎯 **Competitive Advantages**

### **Story Intelligence vs Frame Generation**
```
Traditional Tools: "Perfect this individual scene"
FLOW.STUDIO:       "Understand how this scene strengthens your story"
```

**Our Differentiators:**
- **Visual Story DNA**: Scene-element relationship networks
- **Cross-Scene Intelligence**: Narrative-aware AI suggestions
- **Contextual Improvements**: Story understanding vs mechanical fixes  
- **Narrative Flow Visualization**: Directors see entire story structure

### **Technical Innovation**
- **Unified Timeline**: All phases accessible without navigation complexity
- **Cross-Phase Intelligence**: Changes tracked across entire project
- **Production Integration**: Direct n8n workflow with proven results
- **Character Consistency**: Automated narrative coherence

## 📚 **Documentation**

- **[Technical Guide](docs/)**: Complete development documentation
- **[Database Schema](docs/db/)**: Schema evolution and deployment
- **[API Reference](docs/api/)**: Database functions and integrations
- **[Design System](docs/design/)**: CSS architecture and components

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with Story Intelligence** • **Powered by AI Workflows** • **Optimized for Production**