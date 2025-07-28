-- FLOW.STUDIO MVP - Complete Database Cleanup Script
-- Purpose: Clean all custom tables for fresh schema deployment
-- Usage: Run this before deploying new schema versions

-- ============================================================================
-- SUPABASE DATABASE CLEANUP (PRESERVE AUTH ONLY)
-- ============================================================================

-- Drop all custom tables in correct order (foreign key dependencies)
DROP TABLE IF EXISTS user_activities CASCADE;
DROP TABLE IF EXISTS content_changes CASCADE; 
DROP TABLE IF EXISTS n8n_jobs CASCADE;
DROP TABLE IF EXISTS project_phases CASCADE;
DROP TABLE IF EXISTS project_assets CASCADE;
DROP TABLE IF EXISTS project_versions CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS project_configuration_templates CASCADE;

-- Drop all custom functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_project_version() CASCADE;
DROP FUNCTION IF EXISTS initialize_project_phases() CASCADE;

-- Clean complete - ready for fresh schema deployment
-- Note: Supabase auth.users table and system tables are preserved