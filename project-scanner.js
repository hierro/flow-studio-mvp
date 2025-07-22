#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLAUDE WEB INTERFACE STRATEGY: COMPLETE CODEBASE TRANSFER
// ==========================================================
// SOLUTION: Structure + complete code for most relevant files
// PURPOSE: Enable web project to understand what we're building

// COMPREHENSIVE FILES FOR COMPLETE UNDERSTANDING
const CORE_UNDERSTANDING_FILES = [
  // Core configuration
  'package.json',                    // Dependencies and scripts
  'tsconfig.json',                  // TypeScript config
  'next.config.ts',                 // Next.js configuration
  'tailwind.config.ts',             // Tailwind setup
  'eslint.config.mjs',              // ESLint configuration
  'postcss.config.mjs',             // PostCSS configuration
  
  // Application structure
  'src/app/layout.tsx',             // Root layout and providers
  'src/app/page.tsx',               // Smart routing logic
  'src/app/globals.css',            // Styling system and variables
  
  // Authentication system (working examples)
  'src/lib/supabase.ts',            // Database client setup
  'src/app/login/page.tsx',         // Complete auth implementation
  'src/app/dashboard/page.tsx',     // Protected route pattern
  'src/components/LogoutButton.tsx', // Client component pattern
  
];

function generateSimpleKnowledgeBase() {
  console.log('🎯 Generating Complete Codebase Knowledge Base');
  console.log('Strategy: Full project structure + essential code files');
  console.log('');
  
  let content = '';
  
  // HEADER with project context
  content += `FLOW STUDIO MVP - Complete Development Context
================================================

Generated: ${new Date().toISOString()}
Purpose: Transfer complete understanding to Claude web interface

PROJECT STATUS: Phase 1 Authentication COMPLETE - Ready for Phase 2 Database

MISSION: Build web interface for proven n8n TESTA_ANIMATIC workflow
- Enables animatic production with Samantha character consistency
- Uses Italian "UN CONSIGLIO STELLARE" campaign as validated template
- 5-phase pipeline with >95% character recognition success rate

CURRENT STATE (What Works)
---------------------------
✅ Supabase authentication with SSR (email/password, protected routes)
✅ Next.js 15.4.2 with App Router and TypeScript strict mode
✅ Smart routing based on authentication state
✅ Professional UI with Tailwind CSS v4
✅ Modular component architecture established

IMMEDIATE PRIORITY (Phase 2)
-----------------------------
1. Deploy database schema to Supabase (designed, ready)
2. Build project CRUD APIs with Italian campaign structure
3. Create project management dashboard  
4. Integrate "UN CONSIGLIO STELLARE" as default template
5. Build PhaseContainer system for 5-phase n8n workflow

PROVEN INTEGRATIONS READY
--------------------------
- n8n TESTA_ANIMATIC: 5-phase pipeline (12-18 min processing)
- FAL.ai FLUX: 1024x768, 16:9, FLUX DEV model
- Character Consistency: Samantha >95% recognition across 13 scenes
- Italian Campaign: "UN CONSIGLIO STELLARE" (Ministero della Salute)
- Webhook: a1dbfc3a-b5fa-41be-9720-13960051b88d

TECHNOLOGY STACK
-----------------
Framework: Next.js 15.4.2 with App Router
Language: TypeScript 5 with strict mode
Styling: Tailwind CSS v4 with custom properties
Database: Supabase PostgreSQL with Row Level Security
Authentication: Supabase Auth with SSR
Deployment: Vercel

COMPLETE PROJECT STRUCTURE
===========================

flow-studio-mvp/
├── .gitignore                      # Git ignore patterns
├── package.json                    # Dependencies, scripts, ES module config
├── package-lock.json               # Dependency lock file
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript strict mode config
├── tailwind.config.ts              # Tailwind CSS v4 configuration  
├── eslint.config.mjs               # ESLint validation rules
├── postcss.config.mjs              # PostCSS configuration
├── project-scanner.js              # Knowledge base generator
├── flow-studio-knowledge-base.txt  # Generated codebase export
├── public/                         # Static assets
│   ├── next.svg                   # Next.js logo
│   ├── vercel.svg                 # Vercel logo  
│   └── file.svg                   # File icon
├── src/                           # Source code
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout with Geist fonts
│   │   ├── page.tsx               # Smart routing (auth-based redirects)
│   │   ├── globals.css            # Tailwind CSS v4 + custom variables
│   │   ├── login/                 # Authentication pages
│   │   │   └── page.tsx           # Complete auth implementation
│   │   └── dashboard/             # Protected application area
│   │       └── page.tsx           # Protected route with server auth
│   ├── components/                # Reusable UI components
│   │   └── LogoutButton.tsx       # Client component pattern
│   └── lib/                       # Utility functions
│       └── supabase.ts            # SSR-compatible database client
└── docs/                          # Reference documentation  
    └── TESTA_ANIMATIC.json         # n8n workflow (69KB, 5-phase pipeline)

KEY PATTERNS
============
✅ Authentication: Server-side validation in dashboard, client handling in login
✅ Components: Client components use 'use client', server components default
✅ Database: SSR-compatible Supabase client with environment variables
✅ Styling: Tailwind CSS v4 with custom properties and Geist fonts
✅ TypeScript: Strict mode, proper interfaces, path mapping with @/*
✅ Error Handling: Comprehensive loading states and user feedback

ARCHITECTURE NOTES
===================
- App Router structure with server-first approach
- Authentication state drives routing logic
- Modular component architecture ready for expansion
- Complete configuration for development and production
- Smart session handoff system for Claude development continuity

ESSENTIAL CODE FILES
====================

`;

  // Add essential files with ultra-simple formatting
  CORE_UNDERSTANDING_FILES.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative('.', filePath);
        
        content += `FILE: ${relativePath}\n`;
        content += `PURPOSE: ${getSimplePurpose(relativePath)}\n`;
        content += `${''.padEnd(60, '-')}\n\n`;
        
        // Clean content - remove all complex formatting
        const cleanContent = cleanForSimplicity(fileContent, relativePath);
        content += cleanContent;
        content += '\n\n';
        content += `${''.padEnd(60, '=')}\n\n`;
        
      } catch (error) {
        console.log(`Warning: Could not read ${filePath}`);
      }
    }
  });
  
  // Add final guidance
  content += `DEVELOPMENT GUIDANCE
====================

Pattern Recognition:
- Authentication: Follow complete pattern in login/page.tsx
- Components: Use LogoutButton.tsx as template for client components
- Server Auth: Use server-side validation pattern
- Database: Use supabase.ts client pattern consistently

Quality Standards:
- TypeScript strict mode (zero any types)
- Server-side rendering where possible  
- Comprehensive error handling and loading states
- Modular reusable component architecture

Next Steps Priority:
1. Database: Deploy schema and create project CRUD APIs
2. Templates: Use Italian UN CONSIGLIO STELLARE as default
3. Workflow: Build PhaseContainer system for 5-phase pipeline  
4. Integration: Connect n8n TESTA_ANIMATIC webhook

Ready for Phase 2: Authentication foundation solid. Focus on database implementation using proven patterns.

END OF KNOWLEDGE BASE
=====================
`;

  // Write ultra-simple output
  const outputFile = 'flow-studio-knowledge-base.txt';
  fs.writeFileSync(outputFile, content);
  
  const finalSize = fs.statSync(outputFile).size;
  
  console.log('');
  console.log('✅ Ultra-simple knowledge base created!');
  console.log(`📄 File: ${outputFile}`);
  console.log(`📊 Size: ${(finalSize / 1024).toFixed(1)}KB`);
  console.log('🎯 Format: Plain text, minimal formatting');
  console.log('✅ Optimized for Claude web interface ingestion');
  
  console.log('');
  console.log('📋 Content includes:');
  console.log('   ✅ Project status and mission');
  console.log('   ✅ Working systems summary');  
  console.log('   ✅ Next priorities clear');
  console.log('   ✅ Essential code patterns');
  console.log('   ✅ Development guidance');
  console.log('   ✅ No complex markdown formatting');
  
  return outputFile;
}

function getSimplePurpose(filePath) {
  const purposes = {
    // Core configuration
    'package.json': 'Project dependencies, scripts, and module configuration',
    'tsconfig.json': 'TypeScript strict mode configuration with path mapping',
    'next.config.ts': 'Next.js configuration and build settings',
    'tailwind.config.ts': 'Tailwind CSS v4 configuration with custom properties',
    'eslint.config.mjs': 'ESLint rules for Next.js and TypeScript validation',
    'postcss.config.mjs': 'PostCSS configuration for Tailwind processing',
    
    // Application structure
    'src/app/layout.tsx': 'Root layout with Geist fonts and global structure',
    'src/app/page.tsx': 'Smart routing logic - redirects based on auth state',
    'src/app/globals.css': 'Tailwind CSS v4 imports and custom CSS variables',
    
    // Authentication system
    'src/lib/supabase.ts': 'SSR-compatible Supabase client configuration',
    'src/app/login/page.tsx': 'Complete auth implementation - signup/signin with validation',
    'src/app/dashboard/page.tsx': 'Protected route with server-side auth validation',
    'src/components/LogoutButton.tsx': 'Client component pattern for auth actions',
    
  };
  
  return purposes[filePath] || 'Essential project file';
}

function cleanForSimplicity(content, filePath) {
  // Keep full code - minimal cleaning for complete understanding
  let cleaned = content;
  
  // Only remove excessive empty lines
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Run the scanner
try {
  generateSimpleKnowledgeBase();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

export { generateSimpleKnowledgeBase };