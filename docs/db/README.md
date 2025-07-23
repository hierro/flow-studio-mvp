# Database Schema Documentation

## 🗂️ **Current Schema Status**

**Active Version:** v2.0 (Fresh deployment with timeline features)  
**Deployed:** ✅ Successfully deployed and tested  
**Status:** Production ready with enhanced timeline architecture

---

## 📁 **File Organization**

### **Schema Files**
- **`schema_v2.sql`** - Current active schema (timeline architecture + enhanced features)
- **`schema_v1.sql`** - Previous schema backup (basic 4-table structure)

### **Documentation**
- **`schema_v2_compatibility.md`** - Compatibility verification vs v1 functions
- **`schema_v2_deployment_notes.md`** - Risk analysis and deployment notes
- **`deployment_comparison_summary.md`** - Strategic decision documentation

### **Utilities**
- **`backup_procedures.md`** - Reusable backup and deployment procedures

---

## 🚀 **Quick Reference**

### **Current Schema (v2.0) Features**
```sql
-- Core Tables (Enhanced)
✅ projects           -- Project metadata + timeline features
✅ project_phases     -- 5-phase workflow + cross-phase tracking  
✅ phase_versions     -- Version history + change relationships
✅ n8n_jobs          -- Workflow tracking + enhanced reliability

-- Timeline Tables (New)
✅ content_changes    -- Cross-phase change tracking
✅ project_assets     -- Phase 2+ asset management
✅ user_activities    -- Analytics and debugging
```

### **Verified Compatibility**
- ✅ All existing database functions work unchanged
- ✅ Italian campaign template fully compatible
- ✅ n8n integration preserved exactly
- ✅ Version history system enhanced
- ✅ Phase progression logic intact

---

## 🔄 **Schema Evolution History**

| Version | Date | Changes | Status |
|---------|------|---------|--------|
| v1.0 | Initial | Basic 4-table structure | ✅ Working |
| v2.0 | Current | Timeline architecture + enhanced features | ✅ Active |

---

## 📋 **Future Schema Changes**

For future database modifications:

1. **Create backup** using procedures in `backup_procedures.md`
2. **Design new schema** as `schema_v3.sql`
3. **Document compatibility** in `schema_v3_compatibility.md`
4. **Test thoroughly** before deployment
5. **Update this README** with new version info

---

## ⚠️ **Important Notes**

- **Always backup before changes** - Use `backup_procedures.md`
- **Test compatibility** - Verify all database functions work
- **Document decisions** - Keep deployment notes for future reference
- **Version incrementally** - Don't skip version numbers for clarity