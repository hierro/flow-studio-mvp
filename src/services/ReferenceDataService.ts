/**
 * ReferenceDataService - Load predefined script data for development
 * 
 * This service loads the reference script data from src/data/reference-script.json
 * and transforms it to match our master JSON schema structure.
 */

// Import the reference JSON data
import referenceScriptData from '../data/reference-script.json'

interface ReferenceDataResponse {
  masterJSON: any;
  success: boolean;
  error?: string;
}

/**
 * Simulates PDF processing and loads reference script data
 * @param pdfFileName - The name of the uploaded PDF file
 * @param projectName - The project name for metadata
 * @returns Promise with master JSON data
 */
export async function processReferenceScript(
  pdfFileName: string = "Script_STELLARE+storyboard 0611_B.pdf",
  projectName: string = "New Project"
): Promise<ReferenceDataResponse> {
  
  // Simulate AI processing delay (1 second)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // Transform the reference data to our master JSON schema
    const masterJSON = transformReferenceToMasterJSON(referenceScriptData, projectName, pdfFileName);
    
    return {
      masterJSON,
      success: true
    };
    
  } catch (error) {
    console.error('Error processing reference script:', error);
    return {
      masterJSON: {},
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Transform reference data to match our master JSON schema v3.0
 */
function transformReferenceToMasterJSON(referenceData: any, projectName: string, pdfFileName: string): any {
  // Extract the first item from the array (reference data is an array)
  const data = Array.isArray(referenceData) ? referenceData[0] : referenceData;
  
  return {
    // Core scenes data
    scenes: data.scenes || {},
    
    // Elements data  
    elements: data.elements || {},
    
    // Global style configuration
    global_style: data.global_style || {
      color_palette: {
        primary: "Deep blue backgrounds",
        secondary: "Warm amber lighting", 
        character_tones: "Natural skin tones"
      },
      rendering_style: {
        level: "simplified illustration transitioning to cinematic realism",
        line_work: "clean vector-style outlines",
        detail_level: "stylized but scalable to photorealistic"
      }
    },
    
    // Project metadata with current project info
    project_metadata: {
      title: data.project_metadata?.title || projectName,
      client: data.project_metadata?.client || "Client Name",
      schema_version: "3.0",
      production_workflow: "animatic_to_video_scalable",
      source_pdf: pdfFileName,
      extraction_date: new Date().toISOString().split('T')[0],
      extraction_method: "reference_data_simulation"
    }
  };
}

/**
 * Get processing status messages for UI feedback
 */
export function getProcessingStatusMessages(): string[] {
  return [
    "🔄 Analyzing PDF structure...",
    "🤖 Extracting scenes with AI...", 
    "🎭 Identifying characters and elements...",
    "🎨 Processing style guidelines...",
    "✅ Script extraction complete!"
  ];
}

/**
 * Validate that the reference data is properly structured
 */
export function validateReferenceData(): boolean {
  try {
    const data = Array.isArray(referenceScriptData) ? referenceScriptData[0] : referenceScriptData;
    
    // Check required fields
    if (!data.scenes || !data.elements || !data.global_style || !data.project_metadata) {
      console.warn('Reference data missing required fields');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Reference data validation failed:', error);
    return false;
  }
}