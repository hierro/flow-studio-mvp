/**
 * BackupManager - localStorage backup for unsaved changes
 * 
 * Provides data loss prevention by automatically backing up unsaved changes
 * to localStorage and offering restoration when user returns.
 */

export interface BackupData {
  masterJSON: any;
  timestamp: string;
  projectId: string;
  version: number;
}

export class BackupManager {
  private static BACKUP_PREFIX = 'flow-studio-backup-';
  private static BACKUP_EXPIRY_DAYS = 7; // Clean up old backups after 7 days

  /**
   * Save current state to localStorage backup
   * @param projectId - Project ID
   * @param masterJSON - Current master JSON state
   * @param currentVersion - Current saved version number
   */
  static saveBackup(projectId: string, masterJSON: any, currentVersion: number): void {
    try {
      const backupData: BackupData = {
        masterJSON,
        timestamp: new Date().toISOString(),
        projectId,
        version: currentVersion
      };

      const backupKey = this.BACKUP_PREFIX + projectId;
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      console.log('✅ Backup saved for project:', projectId);
    } catch (error) {
      console.warn('Failed to save backup to localStorage:', error);
      // Graceful degradation - don't break the app if localStorage fails
    }
  }

  /**
   * Check if backup exists and is newer than current saved version
   * @param projectId - Project ID
   * @param currentVersion - Current saved version number
   * @returns BackupData if restoration candidate exists, null otherwise
   */
  static checkForRestoration(projectId: string, currentVersion: number): BackupData | null {
    try {
      const backupKey = this.BACKUP_PREFIX + projectId;
      const backupString = localStorage.getItem(backupKey);
      
      if (!backupString) return null;

      const backupData: BackupData = JSON.parse(backupString);
      
      // Check if backup is valid and potentially newer
      if (backupData.projectId === projectId && backupData.masterJSON) {
        // If backup was created after current saved version, it might have unsaved changes
        const backupTime = new Date(backupData.timestamp).getTime();
        const isRecent = Date.now() - backupTime < (this.BACKUP_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        
        if (isRecent) {
          console.log('🔄 Found potential backup for restoration:', {
            backupVersion: backupData.version,
            currentVersion,
            timestamp: backupData.timestamp
          });
          return backupData;
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to check backup from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear backup after successful save
   * @param projectId - Project ID
   */
  static clearBackup(projectId: string): void {
    try {
      const backupKey = this.BACKUP_PREFIX + projectId;
      localStorage.removeItem(backupKey);
      console.log('🗑️ Backup cleared for project:', projectId);
    } catch (error) {
      console.warn('Failed to clear backup from localStorage:', error);
    }
  }

  /**
   * Clean up old backups across all projects
   */
  static cleanupOldBackups(): void {
    try {
      const keysToRemove: string[] = [];
      const expiryTime = Date.now() - (this.BACKUP_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.BACKUP_PREFIX)) {
          const backupString = localStorage.getItem(key);
          if (backupString) {
            const backupData: BackupData = JSON.parse(backupString);
            const backupTime = new Date(backupData.timestamp).getTime();
            
            if (backupTime < expiryTime) {
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${keysToRemove.length} old backups`);
      }
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error);
    }
  }
}