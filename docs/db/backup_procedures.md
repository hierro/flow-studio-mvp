# Database Backup & Deployment Procedures

## 🎯 **Reusable Instructions for Future Schema Changes**

---

## 📋 **Pre-Change Backup Procedure**

### **Step 1: Export Current Schema Structure**
```sql
-- Run in Supabase SQL Editor and save results

-- Get all table structures  
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Get constraints and indexes
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name;
```

### **Step 2: Export Data Counts**
```sql
-- Verify data integrity before changes
SELECT 
  'projects' as table_name, COUNT(*) as row_count FROM projects
UNION ALL
SELECT 
  'project_phases' as table_name, COUNT(*) as row_count FROM project_phases  
UNION ALL
SELECT 
  'phase_versions' as table_name, COUNT(*) as row_count FROM phase_versions
UNION ALL
SELECT 
  'n8n_jobs' as table_name, COUNT(*) as row_count FROM n8n_jobs
UNION ALL
SELECT 
  'content_changes' as table_name, COUNT(*) as row_count FROM content_changes
UNION ALL
SELECT 
  'project_assets' as table_name, COUNT(*) as row_count FROM project_assets
UNION ALL
SELECT 
  'user_activities' as table_name, COUNT(*) as row_count FROM user_activities;
```

### **Step 3: Create Schema Backup File**
1. **File name**: `schema_v{X}.sql` (increment version number)
2. **Include**: Complete CREATE TABLE statements with all constraints
3. **Add header**: Version info, date, and purpose
4. **Save location**: `docs/db/schema_v{X}.sql`

---

## 🚀 **Fresh Deployment Procedure**

### **When to Use Fresh Deployment:**
- ✅ Only test data exists
- ✅ Major schema restructuring needed
- ✅ Want clean, optimized structure
- ✅ Schema changes are complex (many related modifications)

### **Fresh Deployment Steps:**
1. **Backup current schema** (see above)
2. **Supabase Dashboard** → **Settings** → **Database** → **Reset Database**
3. **SQL Editor** → **Paste new schema** → **Run**
4. **Verify deployment** → **Check success messages**
5. **Test application** → **Verify all functions work**

---

## 🔄 **Additive Deployment Procedure**

### **When to Use Additive Deployment:**
- ✅ Production data must be preserved
- ✅ Minor schema additions only
- ✅ Changes are simple and isolated
- ✅ Migration complexity is low

### **Additive Deployment Steps:**
1. **Backup current schema** (see above)
2. **Create migration script** with ALTER TABLE statements
3. **Test migration** on development database first
4. **Run migration** in production
5. **Verify compatibility** with existing functions
6. **Monitor application** for any issues

---

## 🧪 **Post-Deployment Testing Checklist**

### **Core Functionality Testing:**
```bash
# 1. Application startup
npm run dev                              # Should start without errors

# 2. Authentication flow  
# Login with test account                # Should work unchanged

# 3. Project management
# Create new project                     # Should work unchanged
# Open existing project                  # Should work unchanged

# 4. Phase 1 workflow
# Script interpretation module           # Should load normally
# Generate script (n8n integration)     # Should work if n8n available
# Edit and save content                  # Should work unchanged
# View version history                   # Should work unchanged

# 5. Database queries
# Check data integrity                   # Row counts should be preserved
# Verify new tables/columns exist        # New features should be available
```

### **Performance Testing:**
```sql
-- Check query performance hasn't degraded
EXPLAIN ANALYZE SELECT * FROM projects WHERE user_id = 'test-uuid';
EXPLAIN ANALYZE SELECT * FROM project_phases WHERE project_id = 'test-uuid';
EXPLAIN ANALYZE SELECT * FROM phase_versions WHERE phase_id = 'test-uuid';
```

---

## ⚠️ **Rollback Procedures**

### **Immediate Rollback (Fresh Deployment)**
```bash
# If deployed fresh schema has issues:
# Time: ~2 minutes

# 1. Reset database again
# Supabase Dashboard → Settings → Database → Reset Database

# 2. Restore previous schema
# SQL Editor → Paste content from schema_v{X-1}.sql → Run

# 3. Verify restoration
npm run dev && test core functionality
```

### **Rollback from Additive Changes**
```sql
-- If additive changes cause issues:

-- 1. Drop new tables (if any)  
DROP TABLE IF EXISTS new_table_name;

-- 2. Drop new columns (if any)
ALTER TABLE existing_table DROP COLUMN IF EXISTS new_column_name;

-- 3. Revert constraint changes (if any)
-- (Specific to the changes made)

-- 4. Verify application works
-- Test core functionality
```

---

## 📝 **Documentation Requirements**

### **For Each Schema Change:**
1. **Version number** - Increment from previous version
2. **Compatibility analysis** - Which functions affected
3. **Risk assessment** - What could go wrong
4. **Deployment notes** - Specific instructions or considerations
5. **Testing results** - Confirmation that deployment worked

### **File Naming Convention:**
- **Schema**: `schema_v{X}.sql`
- **Compatibility**: `schema_v{X}_compatibility.md`
- **Deployment Notes**: `schema_v{X}_deployment_notes.md`

---

## 🎯 **Best Practices**

1. **Always backup first** - Never modify schema without backup
2. **Test in development** - Use local postgres or separate Supabase project
3. **Document everything** - Future you will thank present you
4. **Incremental changes** - Small, focused modifications are safer
5. **Verify compatibility** - Check all database functions still work
6. **Monitor after deployment** - Watch for issues in first 24 hours

---

## 🔍 **Troubleshooting Guide**

### **Common Issues:**

**Schema deployment fails:**
- Check SQL syntax errors
- Verify foreign key references exist
- Ensure constraint names don't conflict

**Application breaks after deployment:**
- Check database function compatibility
- Verify TypeScript interfaces match new schema
- Look for missing columns or changed data types

**Performance degradation:**
- Check if indexes were dropped accidentally
- Verify query plans haven't changed significantly
- Consider adding indexes for new query patterns

**Data integrity issues:**
- Compare row counts before/after
- Check for constraint violations
- Verify foreign key relationships maintained