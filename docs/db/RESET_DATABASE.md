# Database Reset Instructions for Schema v3.0

## 🚨 WARNING: This will DELETE ALL existing data!

This is a **CLEAN SLATE** deployment. All existing projects, phases, and content will be permanently deleted.

## Prerequisites

1. **Backup existing data** (if needed):
   ```sql
   -- Connect to your current Supabase database and run:
   pg_dump -h [your-host] -U [username] -d [database] > backup_v2.sql
   ```

2. **Supabase Dashboard Access**: You need admin access to your Supabase project

## Step 1: Reset Database Schema

### Option A: Via Supabase Dashboard (RECOMMENDED)

1. **Login to Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your FLOW.STUDIO project

2. **Open SQL Editor**
   - Navigate to "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Drop All Existing Tables**
   ```sql
   -- WARNING: This deletes everything except auth tables
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
   GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
   GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
   ```

4. **Deploy New Schema**
   - Copy the entire contents of `schema_v3.sql`
   - Paste into SQL Editor
   - Click "Run" to execute

### Option B: Via Command Line (Advanced)

```bash
# Connect to your Supabase database
psql "postgresql://[username]:[password]@[host]:5432/[database]?sslmode=require"

# Run the reset commands
\i docs/db/schema_v3.sql
```

## Step 2: Verify Deployment

Run this verification query in SQL Editor:

```sql
-- Check that all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Expected tables:
-- n8n_jobs
-- project_assets  
-- project_phases
-- project_versions
-- projects

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- All tables should show rowsecurity = true
```

## Step 3: Test Authentication

1. **Test Login** in your app
   - Authentication should still work (auth tables preserved)
   - User sessions should remain valid

2. **Test Project Creation**
   - Create a new project via the app
   - Verify it appears in database with default master_json

## Step 4: Update Application Code

The database structure has changed. Update these files:

### Required Code Changes:

1. **Update database.ts functions**:
   - `createProject()` - use new projects table structure
   - `getProject()` - read from master_json field
   - All other functions need updates

2. **Update TypeScript types**:
   - Modify `src/types/project.ts` to match new schema

3. **Update components**:
   - `ProjectDetailPage.tsx` - load from master_json
   - All data loading needs updates

## Rollback Plan (If Something Goes Wrong)

If the new schema causes issues:

1. **Restore from backup**:
   ```sql
   -- Drop new schema
   DROP SCHEMA public CASCADE;
   CREATE SCHEMA public;
   
   -- Restore from backup
   psql -h [host] -U [username] -d [database] -f backup_v2.sql
   ```

2. **Revert code changes** using git:
   ```bash
   git checkout HEAD~1 -- src/lib/database.ts src/types/project.ts
   ```

## Post-Deployment Checklist

- [ ] Database reset completed successfully
- [ ] All expected tables exist
- [ ] RLS policies are active
- [ ] Authentication still works
- [ ] Can create new projects
- [ ] Application builds without errors
- [ ] No console errors on login

## Notes

- **Auth tables are preserved** - users don't need to re-register
- **All project data is lost** - only test data anyway
- **New structure is much cleaner** - single master_json source of truth
- **Version history works automatically** - triggers create versions on changes

## Support

If you encounter issues:

1. Check Supabase logs in Dashboard → Logs
2. Check browser console for errors
3. Verify all code changes were applied correctly
4. Use rollback plan if necessary