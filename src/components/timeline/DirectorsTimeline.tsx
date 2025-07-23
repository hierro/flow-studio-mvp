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
      <div className="timeline-empty-state">
        <div className="timeline-empty-icon">📊</div>
        <p>No content available for timeline visualization</p>
        <p className="timeline-empty-description">
          Generate Phase 1 content first to see the timeline
        </p>
      </div>
    );
  }

  return (
    <div className="directors-timeline">
      {/* Compact Project Header */}
      <div className="timeline-header-section">
        <div className="timeline-header-content mb-lg">
          <div className="timeline-header-info">
            <h2 className="timeline-project-title" style={{ fontSize: '1.25rem', marginBottom: '2px' }}>
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

        </div>
      </div>

      {/* Timeline Content */}
      <div className="timeline-main-content">
        {/* Scenes View */}
          <div className="timeline-scenes-wrapper">
            {/* Element Overview Bar */}
            <div className="timeline-legend-container">
              <div className="timeline-legend-header">
                Element Overview ({timelineData.elements.length} total)
              </div>
              <div className="flex flex-col gap-md">
                {Object.entries(elementsWithStats).map(([type, elements]) => (
                  <div key={type} className="timeline-legend-group">
                    <span className="timeline-legend-text" style={{ minWidth: '4.375rem' }}>
                      {type}:
                    </span>
                    <div className="flex flex-wrap gap-sm">
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
                          <span 
                            className="timeline-element-percentage"
                            style={{ 
                              backgroundColor: hoveredElement === element.id ? 'rgba(255,255,255,0.2)' : `${element.color}20`
                            }}>
                            {element.usage_percentage}%
                          </span>
                          <span className="timeline-element-consistency">
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
            <div className="timeline-scenes-main">
              <div className="timeline-scenes-responsive-grid" style={{ paddingBottom: '1.25rem' }}>
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
      </div>
    </div>
  );
}