/**
 * ProjectViewNavigation - Global project view tabs
 * 
 * Clean separation between project views and phase-specific content:
 * - JSON: Raw data view (debug/technical)
 * - Timeline: Visual timeline interface 
 * - Elements: Cross-scene element management (Phase 2+)
 * - Style: Global style control (future)
 */

import React from 'react'

interface ProjectViewNavigationProps {
  activeView: 'json' | 'timeline' | 'elements' | 'style' | 'config';
  onViewChange: (view: 'json' | 'timeline' | 'elements' | 'style' | 'config') => void;
  masterJSON?: any; // For unlock logic
}

export default function ProjectViewNavigation({ 
  activeView, 
  onViewChange,
  masterJSON
}: ProjectViewNavigationProps) {
  
  const tabs = [
    { id: 'json', label: 'JSON', icon: '{ }', description: 'Raw data view' },
    { id: 'timeline', label: 'Timeline', icon: '📊', description: 'Visual timeline interface' },
    { id: 'elements', label: 'Elements', icon: '🎭', description: 'Element management (Phase 2+)' },
    { id: 'style', label: 'Style', icon: '🎨', description: 'Global style control' },
    { id: 'config', label: 'Config', icon: '⚙️', description: 'LLM configuration (Admin)' }
  ] as const;

  // Check if Phase 1 JSON generation is complete (has scenes)
  const hasScenes = masterJSON?.scenes && 
                   typeof masterJSON.scenes === 'object' &&
                   Object.keys(masterJSON.scenes).length > 0

  // Unlock logic for tabs
  const isTabUnlocked = (tabId: string): boolean => {
    if (tabId === 'json' || tabId === 'timeline') return true
    if (tabId === 'style') return hasScenes // Style unlocks after Phase 1 JSON generation
    if (tabId === 'elements') return false // Elements still locked (Phase 2+)
    return true
  }

  const getTabTooltip = (tabId: string): string => {
    if (tabId === 'elements') return 'Available in Phase 2+'
    if (tabId === 'style' && !hasScenes) return 'Complete Phase 1 JSON generation first'
    return tabs.find(t => t.id === tabId)?.description || ''
  }

  return (
    <div className="project-view-navigation">
      {/* Navigation Bar - Horizontal buttons spanning full width */}
      <div className="flex gap-md p-md">
        {tabs.map((tab) => {
          const isUnlocked = isTabUnlocked(tab.id)
          return (
            <button
              key={tab.id}
              onClick={() => isUnlocked && onViewChange(tab.id as any)}
              className={`
                flex-1 flex items-center justify-center transition-fast cursor-pointer
                border border-solid rounded-lg font-semibold
                ${activeView === tab.id 
                  ? 'bg-accent border-focus text-primary shadow-md' 
                  : 'bg-secondary border-default text-secondary hover:text-primary hover:bg-accent hover:border-light'
                }
                ${!isUnlocked ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                minHeight: '2.5rem'
              }}
              disabled={!isUnlocked}
              title={getTabTooltip(tab.id)}
            >
              <span className="font-semibold">{tab.label.toUpperCase()}</span>
            </button>
          )
        })}
      </div>
    </div>
  );
}