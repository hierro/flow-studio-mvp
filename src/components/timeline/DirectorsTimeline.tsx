/**
 * DirectorsTimeline - Revolutionary timeline interface for Phase 1
 * 
 * Transforms JSON structure into visual story intelligence with:
 * - Horizontal scene cards with expandable rich content
 * - Element relationship visualization
 * - Interactive scene navigation
 * - Character consistency tracking
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TimelineParser, TimelineData, TimelineElement } from '../../utils/TimelineParser';
import SceneCard from './SceneCard';
import clsx from 'clsx';

interface DirectorsTimelineProps {
  content: any; // Raw Phase 1 JSON content from database
  projectId: string;
  projectName: string;
  onContentUpdate?: (updatedContent: any) => void;
}

export default function DirectorsTimeline({ 
  content, 
  projectId, 
  projectName,
  onContentUpdate 
}: DirectorsTimelineProps) {
  const [selectedScene, setSelectedScene] = useState<number | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'scenes' | 'elements'>('scenes'); // Timeline is default, elements for future

  // Parse content into timeline data
  const timelineData: TimelineData = useMemo(() => {
    if (!content) return {
      project_info: { title: 'Loading...', client: '', schema_version: '1.0', production_workflow: '' },
      global_style: {} as any,
      scenes: [],
      elements: [],
      style_evolution: { color_evolution: [], mood_evolution: [], camera_progression: [] }
    };
    
    try {
      return TimelineParser.parsePhase1Content(content);
    } catch (error) {
      console.error('Error parsing timeline content:', error);
      return {
        project_info: { title: 'Parsing Error', client: '', schema_version: '1.0', production_workflow: '' },
        global_style: {} as any,
        scenes: [],
        elements: [],
        style_evolution: { color_evolution: [], mood_evolution: [], camera_progression: [] }
      };
    }
  }, [content]);

  // Get elements with consistency scoring, grouped by type
  const elementsWithStats = useMemo(() => {
    const elementsWithPercentage = timelineData.elements.map(element => ({
      ...element,
      usage_percentage: Math.round((element.frequency / timelineData.scenes.length) * 100)
    }));

    // Group by type
    const grouped = elementsWithPercentage.reduce((acc, element) => {
      if (!acc[element.type]) {
        acc[element.type] = [];
      }
      acc[element.type].push(element);
      return acc;
    }, {} as Record<string, typeof elementsWithPercentage>);

    return grouped;
  }, [timelineData]);

  // Handle scene selection
  const handleSceneSelect = (sceneId: number) => {
    setSelectedScene(selectedScene === sceneId ? null : sceneId);
  };

  // Handle element hover
  const handleElementHover = (elementId: string | null) => {
    setHoveredElement(elementId);
  };

  if (!content) {
    return (
      <div style={{ 
        padding: '32px', 
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <div style={{ marginBottom: '16px' }}>📊</div>
        <p>No content available for timeline visualization</p>
        <p style={{ fontSize: '14px', marginTop: '8px' }}>
          Generate Phase 1 content first to see the timeline
        </p>
      </div>
    );
  }

  return (
    <div className="directors-timeline" style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
      {/* Compact Project Header */}
      <div style={{ 
        padding: '16px 20px',
        borderBottom: '1px solid #333',
        backgroundColor: '#1a1a1a'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: '#fff',
              marginBottom: '2px'
            }}>
              {projectName}
            </h2>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              fontSize: '13px',
              color: '#999'
            }}>
              <span>🎬 {timelineData.scenes.length} scenes</span>
              <span>🎭 {timelineData.elements.length} elements</span>
              <span>👤 {timelineData.elements.find(el => el.subtype === 'primary')?.name || 'No primary'}</span>
              <span>⏱️ {timelineData.scenes.reduce((total, scene) => {
                const duration = parseInt(scene.duration) || 3;
                return total + duration;
              }, 0)}s total</span>
              <span>🎨 {timelineData.global_style.mood_style?.overall_mood || 'Mixed mood'}</span>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div style={{ 
            display: 'flex',
            backgroundColor: '#333',
            borderRadius: '6px',
            padding: '2px'
          }}>
            <button
              onClick={() => setViewMode('scenes')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewMode === 'scenes' ? '#0066cc' : 'transparent',
                color: viewMode === 'scenes' ? 'white' : '#ccc',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              📊 Timeline
            </button>
            <button
              onClick={() => setViewMode('elements')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: viewMode === 'elements' ? '#0066cc' : 'transparent',
                color: viewMode === 'elements' ? 'white' : '#ccc',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              🎭 Elements
            </button>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div style={{ flex: 1, overflow: 'visible', minHeight: '500px' }}>
        {viewMode === 'scenes' ? (
          // Scenes View
          <div style={{ minHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            {/* Element Overview Bar */}
            <div style={{ 
              padding: '16px 20px',
              backgroundColor: '#1a1a1a',
              borderBottom: '1px solid #333'
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#fff',
                marginBottom: '8px'
              }}>
                Element Overview ({timelineData.elements.length} total)
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '8px'
              }}>
                {Object.entries(elementsWithStats).map(([type, elements]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#999',
                      minWidth: '70px',
                      textTransform: 'capitalize'
                    }}>
                      {type}:
                    </span>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '6px'
                    }}>
                      {elements.map(element => (
                        <motion.div
                          key={element.id}
                          whileHover={{ scale: 1.05 }}
                          onMouseEnter={() => handleElementHover(element.id)}
                          onMouseLeave={() => handleElementHover(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: hoveredElement === element.id ? element.color : 'white',
                            color: hoveredElement === element.id ? 'white' : element.color,
                            border: `1px solid ${element.color}`,
                            borderRadius: '12px',
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {element.name}
                          <span style={{ 
                            marginLeft: '6px',
                            fontSize: '9px',
                            backgroundColor: hoveredElement === element.id ? 'rgba(255,255,255,0.2)' : `${element.color}20`,
                            padding: '1px 4px',
                            borderRadius: '6px'
                          }}>
                            {element.usage_percentage}%
                          </span>
                          <span style={{ 
                            marginLeft: '3px',
                            fontSize: '9px'
                          }}>
                            {element.consistency_score === 'excellent' ? '✅' : 
                             element.consistency_score === 'good' ? '👍' : '⚠️'}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scene Grid Timeline */}
            <div style={{ 
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              backgroundColor: '#000',
              minHeight: '500px'
            }}>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '16px',
                paddingBottom: '20px'
              }}>
                {timelineData.scenes.map((scene) => (
                  <SceneCard
                    key={scene.scene_id}
                    scene={scene}
                    elements={timelineData.elements}
                    onSelect={handleSceneSelect}
                    isSelected={selectedScene === scene.scene_id}
                    onElementHover={handleElementHover}
                    hoveredElement={hoveredElement}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Elements View (Future Enhancement)
          <div style={{ 
            padding: '32px', 
            textAlign: 'center',
            color: '#ccc',
            backgroundColor: '#000'
          }}>
            <div style={{ marginBottom: '16px' }}>🎭</div>
            <p style={{ color: '#fff' }}>Elements view coming soon!</p>
            <p style={{ fontSize: '14px', marginTop: '8px', color: '#ccc' }}>
              This will show element-centric visualization with cross-scene relationships
            </p>
          </div>
        )}
      </div>
    </div>
  );
}