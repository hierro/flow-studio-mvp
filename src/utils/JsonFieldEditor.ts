/**
 * JsonFieldEditor - Reusable pattern for editing any JSON field in master JSON
 * 
 * This utility provides a clean, consistent way to edit any field in the master JSON
 * across all phases with proper validation and error handling.
 */

export interface JsonFieldEditConfig {
  fieldPath: string;        // e.g., 'project_metadata.title' or 'scenes.scene_1.camera_type'
  currentValue: any;        // Current value from JSON
  newValue: any;           // New value to set
  validation?: (value: any) => boolean;  // Optional validation function
}

export class JsonFieldEditor {
  
  /**
   * Update any field in master JSON using dot notation path
   * @param masterJson - The complete master JSON object
   * @param fieldPath - Dot notation path to field (e.g., 'project_metadata.title')
   * @param newValue - New value to set
   * @returns Updated master JSON object
   */
  static updateField(masterJson: any, fieldPath: string, newValue: any): any {
    const updatedJson = { ...masterJson };
    const pathParts = fieldPath.split('.');
    
    // Navigate to parent object
    let current = updatedJson;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) {
        current[part] = {};
      } else {
        current[part] = { ...current[part] };
      }
      current = current[part];
    }
    
    // Set the final value
    const finalKey = pathParts[pathParts.length - 1];
    current[finalKey] = newValue;
    
    return updatedJson;
  }

  /**
   * Get field value using dot notation path
   * @param masterJson - The complete master JSON object
   * @param fieldPath - Dot notation path to field
   * @returns Field value or undefined if not found
   */
  static getField(masterJson: any, fieldPath: string): any {
    const pathParts = fieldPath.split('.');
    let current = masterJson;
    
    for (const part of pathParts) {
      if (!current || typeof current !== 'object') {
        return undefined;
      }
      current = current[part];
    }
    
    return current;
  }

  /**
   * Validate field value
   * @param value - Value to validate
   * @param fieldPath - Field path for context
   * @returns true if valid, false otherwise
   */
  static validateField(value: any, fieldPath: string): boolean {
    // Basic validation rules
    if (fieldPath.includes('title') && typeof value === 'string') {
      return value.trim().length > 0;
    }
    
    if (fieldPath.includes('duration') && typeof value === 'string') {
      return /^\d+s$/.test(value); // Format: "3s", "5s", etc.
    }
    
    if (fieldPath.includes('camera_type') && typeof value === 'string') {
      const validCameraTypes = ['wide', 'medium', 'close', 'extreme_close', 'establishing'];
      return validCameraTypes.includes(value);
    }
    
    // Default: non-empty values are valid
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Create edit handler function for React components
   * @param onContentUpdate - Parent update callback
   * @param fieldPath - Field path to edit
   * @returns Edit handler function
   */
  static createEditHandler(
    onContentUpdate: (updatedContent: any) => void,
    fieldPath: string
  ) {
    return (masterJson: any, newValue: any) => {
      try {
        // Validate new value
        if (!JsonFieldEditor.validateField(newValue, fieldPath)) {
          console.warn(`Invalid value for field ${fieldPath}:`, newValue);
          return false;
        }

        // Update JSON
        const updatedJson = JsonFieldEditor.updateField(masterJson, fieldPath, newValue);
        
        // Call parent update
        onContentUpdate(updatedJson);
        return true;
      } catch (error) {
        console.error(`Error editing field ${fieldPath}:`, error);
        return false;
      }
    };
  }
}

/**
 * WORKING PATTERNS - Copy these for any new editable field
 */

// PATTERN 1: Simple text field (like title)
export const createTextFieldEditor = (
  masterJson: any,
  fieldPath: string,
  onContentUpdate: (content: any) => void
) => {
  const currentValue = JsonFieldEditor.getField(masterJson, fieldPath) || '';
  const editHandler = JsonFieldEditor.createEditHandler(onContentUpdate, fieldPath);
  
  return {
    currentValue,
    updateValue: (newValue: string) => editHandler(masterJson, newValue.trim())
  };
};

// PATTERN 2: Dropdown/Select field (like camera_type)
export const createSelectFieldEditor = (
  masterJson: any,
  fieldPath: string,
  validOptions: string[],
  onContentUpdate: (content: any) => void
) => {
  const currentValue = JsonFieldEditor.getField(masterJson, fieldPath) || validOptions[0];
  const editHandler = JsonFieldEditor.createEditHandler(onContentUpdate, fieldPath);
  
  return {
    currentValue,
    validOptions,
    updateValue: (newValue: string) => {
      if (validOptions.includes(newValue)) {
        return editHandler(masterJson, newValue);
      }
      return false;
    }
  };
};

// USAGE EXAMPLES:
/*
// In any component that needs to edit JSON:

// 1. Text field editing (title, description, etc.)
const titleEditor = createTextFieldEditor(
  content, 
  'project_metadata.title', 
  onContentUpdate
);

// 2. Scene field editing  
const cameraEditor = createSelectFieldEditor(
  content,
  'scenes.scene_1.camera_type',
  ['wide', 'medium', 'close', 'extreme_close', 'establishing'],
  onContentUpdate
);

// 3. Manual editing for complex fields
const updateSceneDuration = (sceneId: string, newDuration: string) => {
  const updated = JsonFieldEditor.updateField(
    content, 
    `scenes.${sceneId}.duration`, 
    newDuration
  );
  onContentUpdate(updated);
};
*/