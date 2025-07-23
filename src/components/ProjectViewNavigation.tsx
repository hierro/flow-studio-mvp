/**
 * ProjectViewNavigation - Global project view tabs
 * 
 * Clean separation between project views and phase-specific content:
 * - JSON: Raw data view (debug/technical)
 * - Timeline: Visual timeline interface 
 * - Elements: Cross-scene element management (Phase 2+)
 * - Style: Global style control (future)
 */

interface ProjectViewNavigationProps {
  activeView: 'json' | 'timeline' | 'elements' | 'style';
  onViewChange: (view: 'json' | 'timeline' | 'elements' | 'style') => void;
}

export default function ProjectViewNavigation({ 
  activeView, 
  onViewChange 
}: ProjectViewNavigationProps) {
  
  const tabs = [
    { id: 'json', label: 'JSON', icon: '📝', description: 'Raw data view' },
    { id: 'timeline', label: 'Timeline', icon: '📊', description: 'Visual timeline interface' },
    { id: 'elements', label: 'Elements', icon: '🎭', description: 'Element management (Phase 2+)' },
    { id: 'style', label: 'Style', icon: '🎨', description: 'Global style control' }
  ] as const;

  return (
    <div className="project-view-navigation">
      {/* Navigation Bar */}
      <div className="flex bg-secondary border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id as any)}
            className={`
              flex items-center gap-sm px-xl py-lg text-sm font-medium
              transition-fast cursor-pointer border-none
              ${activeView === tab.id 
                ? 'bg-primary text-primary border-b-2 border-focus' 
                : 'bg-transparent text-secondary hover:text-primary hover:bg-accent'
              }
              ${(tab.id === 'elements' || tab.id === 'style') ? 'tab-disabled' : ''}
            `}
            disabled={tab.id === 'elements' || tab.id === 'style'}
            title={
              tab.id === 'elements' ? 'Available in Phase 2+' :
              tab.id === 'style' ? 'Coming soon' :
              tab.description
            }
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {(tab.id === 'elements' || tab.id === 'style') && (
              <span className="text-xs text-muted ml-sm">
                {tab.id === 'elements' ? '(Phase 2+)' : '(Soon)'}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}