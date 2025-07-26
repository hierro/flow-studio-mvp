/**
 * App-Level Modal System
 * 
 * Global modal management for loading states, progress tracking, and overlays
 * Used by any component that needs non-disruptive modal displays
 */

import { useState, useCallback } from 'react';

export interface ModalContent {
  title: string;
  message: string;
  details?: string[];
  progress?: {
    current: number;
    total: number;
    percentage: number;
    currentItem?: string;
  };
  type?: 'loading' | 'success' | 'error' | 'info';
}

export interface AppModalState {
  isVisible: boolean;
  content: ModalContent | null;
}

export function useAppModal() {
  const [modalState, setModalState] = useState<AppModalState>({
    isVisible: false,
    content: null
  });

  // Show modal with content
  const showModal = useCallback((content: ModalContent) => {
    setModalState({
      isVisible: true,
      content
    });
  }, []);

  // Update modal content (for progress updates)
  const updateModal = useCallback((updates: Partial<ModalContent>) => {
    setModalState(prev => ({
      ...prev,
      content: prev.content ? { ...prev.content, ...updates } : null
    }));
  }, []);

  // Hide modal
  const hideModal = useCallback(() => {
    setModalState({
      isVisible: false,
      content: null
    });
  }, []);

  // Show LLM loading modal (convenience method)
  const showLLMLoading = useCallback((provider: string, totalScenes: number) => {
    showModal({
      title: '🤖 Generating Prompts',
      message: `Processing ${totalScenes} scenes with ${provider.toUpperCase()}...`,
      details: [
        'Single batch call for efficiency',
        'Cross-scene consistency optimization', 
        'Variable injection processing'
      ],
      type: 'loading'
    });
  }, [showModal]);

  // Update LLM progress (convenience method)
  const updateLLMProgress = useCallback((current: number, total: number, currentItem?: string) => {
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    updateModal({
      progress: {
        current,
        total,
        percentage,
        currentItem
      }
    });
  }, [updateModal]);

  return {
    modalState,
    showModal,
    updateModal,
    hideModal,
    showLLMLoading,
    updateLLMProgress
  };
}

// Global modal instance (optional - can also use React Context)
let globalModalInstance: ReturnType<typeof useAppModal> | null = null;

export const setGlobalModalInstance = (instance: ReturnType<typeof useAppModal>) => {
  globalModalInstance = instance;
};

export const getGlobalModal = () => globalModalInstance;