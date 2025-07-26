/**
 * PhaseCompletion - Clean architecture for phase progress tracking
 * 
 * Based on CLAUDE.md principle: "Master JSON as single source of truth"
 * No database dependencies, pure content state analysis
 */

export interface PhaseProgress {
  completed_phases: number;
  total_phases: number;
  current_phase: string | null;
}

export class PhaseCompletion {
  
  /**
   * Calculate phase completion based on master JSON content state
   * @param masterJSON - The master JSON object
   * @returns Number of completed phases (0-5)
   */
  static getCompletedPhases(masterJSON: any): number {
    let completed = 0;
    
    // Phase 1: Script Interpretation - Has scenes content
    if (masterJSON?.scenes && 
        typeof masterJSON.scenes === 'object' &&
        Object.keys(masterJSON.scenes).length > 0) {
      completed++;
    }
    
    // Phase 2: Element Images - Has element images (future)
    // if (masterJSON?.elements && this.hasElementImages(masterJSON)) {
    //   completed++;
    // }
    
    // Phase 3: Scene Generation - Has generated frames and prompts
    if (masterJSON?.scenes && this.hasGeneratedFrames(masterJSON)) {
      completed++;
    }
    
    // Phase 4: Scene Videos - Has video files (future)
    // if (masterJSON?.scenes && this.hasSceneVideos(masterJSON)) {
    //   completed++;
    // }
    
    // Phase 5: Final Assembly - Has final video (future)
    // if (masterJSON?.final_output) {
    //   completed++;
    // }
    
    return completed;
  }
  
  /**
   * Calculate phase progress for dashboard cards
   * @param masterJSON - The master JSON object
   * @returns PhaseProgress object
   */
  static getPhaseProgress(masterJSON: any): PhaseProgress {
    const completed_phases = this.getCompletedPhases(masterJSON);
    
    // Determine current phase based on completion
    let current_phase: string | null = null;
    if (completed_phases === 0) {
      current_phase = 'script_interpretation';
    } else if (completed_phases === 1) {
      current_phase = 'element_images';
    } else if (completed_phases === 2) {
      current_phase = 'scene_generation';
    } else if (completed_phases === 3) {
      current_phase = 'scene_videos';
    } else if (completed_phases === 4) {
      current_phase = 'final_assembly';
    }
    // If completed_phases === 5, current_phase remains null (all done)
    
    return {
      completed_phases,
      total_phases: 5,
      current_phase
    };
  }
  
  /**
   * Check if a specific phase is completed
   * @param masterJSON - The master JSON object
   * @param phaseIndex - Phase number (1-5)
   * @returns true if phase is completed
   */
  static isPhaseCompleted(masterJSON: any, phaseIndex: number): boolean {
    const completed = this.getCompletedPhases(masterJSON);
    return completed >= phaseIndex;
  }
  
  /**
   * Check if a phase can proceed (is unlocked)
   * @param masterJSON - The master JSON object
   * @param phaseIndex - Phase number (1-5)
   * @returns true if phase can proceed
   */
  static canPhaseProceeed(masterJSON: any, phaseIndex: number): boolean {
    if (phaseIndex === 1) return true; // Phase 1 always available
    
    if (phaseIndex === 2 || phaseIndex === 3) {
      // Phase 2 & 3 unlock when Phase 1 is completed (has scenes)
      return this.isPhaseCompleted(masterJSON, 1);
    }
    
    if (phaseIndex === 4) {
      // Phase 4 unlocks when Phase 3 is completed
      return this.isPhaseCompleted(masterJSON, 3);
    }
    
    if (phaseIndex === 5) {
      // Phase 5 unlocks when Phase 4 is completed
      return this.isPhaseCompleted(masterJSON, 4);
    }
    
    return false;
  }
  
  /**
   * Check if scenes have generated frames and prompts (Phase 3 completion)
   * @param masterJSON - The master JSON object  
   * @returns true if scenes have both prompts and frame images
   */
  private static hasGeneratedFrames(masterJSON: any): boolean {
    if (!masterJSON.scenes || typeof masterJSON.scenes !== 'object') {
      return false;
    }
    
    const scenes = Object.keys(masterJSON.scenes);
    if (scenes.length === 0) return false;
    
    // Check if all scenes have both prompts and frame images
    return scenes.every(sceneId => {
      const scene = masterJSON.scenes[sceneId];
      return scene?.scene_frame_prompt && scene?.scene_start_frame;
    });
  }
}