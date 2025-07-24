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
    { id: 'json', label: 'JSON', icon: '{ }', description: 'Raw data view' },
    { id: 'timeline', label: 'Timeline', icon: '📊', description: 'Visual timeline interface' },
    { id: 'elements', label: 'Elements', icon: '🎭', description: 'Element management (Phase 2+)' },
    { id: 'style', label: 'Style', icon: '🎨', description: 'Global style control' }
  ] as const;

  return (
    <div className="project-view-navigation">
      {/* Navigation Bar - Horizontal buttons spanning full width */}
      <div className="flex gap-md p-md">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id as any)}
            className={`
              flex-1 flex items-center justify-center transition-fast cursor-pointer
              border border-solid rounded-lg font-semibold
              ${activeView === tab.id 
                ? 'bg-accent border-focus text-primary shadow-md' 
                : 'bg-secondary border-default text-secondary hover:text-primary hover:bg-accent hover:border-light'
              }
              ${(tab.id === 'elements' || tab.id === 'style') ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{
              padding: '1rem 1.5rem',
              fontSize: '1rem',
              minHeight: '3rem'
            }}
            disabled={tab.id === 'elements' || tab.id === 'style'}
            title={
              tab.id === 'elements' ? 'Available in Phase 2+' :
              tab.id === 'style' ? 'Coming soon' :
              tab.description
            }
          >
            <span className="font-semibold">{tab.label}</span>
            {(tab.id === 'elements' || tab.id === 'style') && (
              <span className="text-xs text-muted">
                {tab.id === 'elements' ? '(Phase 2+)' : '(Soon)'}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}