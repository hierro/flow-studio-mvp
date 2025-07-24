/**
 * DirectorsTimeline - Simplified timeline display for master JSON
 * 
 * Shows timeline visualization without complex editing (for now)
 * - Horizontal scene cards with expandable rich content
 * - Element relationship visualization  
 * - Interactive scene navigation
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TimelineParser, TimelineData } from '../../utils/TimelineParser';
import { createTextFieldEditor } from '../../utils/JsonFieldEditor';
import SceneCard from './SceneCard';

interface DirectorsTimelineProps {
  content: any; // Master JSON content
  projectId: string;
  projectName: string;
  phaseId: string;
  onContentUpdate?: (updatedContent: any) => void;
}

export default function DirectorsTimeline({ 
  content, 
  projectId, 
  projectName,
  phaseId,
  onContentUpdate 
}: DirectorsTimelineProps) {
  const [selectedScene, setSelectedScene] = useState<number | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');

  // Parse master JSON into timeline data
  const timelineData: TimelineData = useMemo(() => {
    if (!content || Object.keys(content).length === 0) {
      return {
        project_info: { title: 'Loading...', client: '', schema_version: '1.0', production_workflow: '' },
        global_style: {} as any,
        scenes: [],
        elements: [],
        style_evolution: { color_evolution: [], mood_evolution: [], camera_progression: [] }
      };
    }
    
    try {
      const parsed = TimelineParser.parsePhase1Content(content, projectName);
      return parsed;
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
  }, [content, projectName]);

  // Clean title editor using JsonFieldEditor pattern
  const titleEditor = useMemo(() => {
    if (!onContentUpdate) return null;
    return createTextFieldEditor(content, 'project_metadata.title', onContentUpdate);
  }, [content, onContentUpdate]);

  // Handle title edit start
  const handleTitleEditStart = () => {
    if (!titleEditor?.currentValue) {
      console.error('Cannot edit title - title editor not available');
      return;
    }
    setTitleValue(titleEditor.currentValue);
    setEditingTitle(true);
  };

  // Handle title save
  const handleTitleSave = async () => {
    if (!titleEditor || !titleValue.trim()) {
      setEditingTitle(false);
      return;
    }

    try {
      // Use the clean editor pattern
      const success = titleEditor.updateValue(titleValue);
      if (success) {
        setEditingTitle(false);
      }
    } catch (error) {
      console.error('Error saving title:', error);
      // Keep editing mode on error
    }
  };

  // Handle title cancel
  const handleTitleCancel = () => {
    setTitleValue('');
    setEditingTitle(false);
  };

  // Calculate total duration and get elements with consistency scoring
  const projectStats = useMemo(() => {
    // Calculate total duration by parsing scene durations
    const totalDurationSeconds = timelineData.scenes.reduce((total, scene) => {
      const duration = scene.duration || '3s';
      const seconds = parseInt(duration.replace(/[^\d]/g, '')) || 3;
      return total + seconds;
    }, 0);
    
    const totalMinutes = Math.floor(totalDurationSeconds / 60);
    const remainingSeconds = totalDurationSeconds % 60;
    const formattedDuration = totalMinutes > 0 
      ? `${totalMinutes}m ${remainingSeconds}s`
      : `${totalDurationSeconds}s`;

    return {
      totalDuration: formattedDuration,
      scenesCount: timelineData.scenes.length,
      elementsCount: timelineData.elements.length
    };
  }, [timelineData]);

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

  if (!timelineData.scenes.length) {
    return (
      <div className="timeline-container">
        <div className="timeline-header">
          <h2>Timeline View</h2>
          <p>No scenes available. Complete Phase 1 to see timeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {/* Project Header */}
      <div className="timeline-header">
        <div className="project-title-section">
          {editingTitle ? (
            <div className="title-edit-container">
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') handleTitleCancel();
                }}
                className="title-edit-input"
                autoFocus
                onBlur={handleTitleSave}
              />
              <div className="title-edit-buttons">
                <button onClick={handleTitleSave} className="title-save-btn">
                  ✓
                </button>
                <button onClick={handleTitleCancel} className="title-cancel-btn">
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <h1 
              className="project-title-display editable-title"
              onClick={handleTitleEditStart}
              title="Click to edit project title"
            >
              {timelineData?.project_info?.title || 'Untitled Project'}
            </h1>
          )}
          <div className="project-stats">
            <span><strong>{projectStats.scenesCount}</strong> scenes</span>
            <span>•</span>
            <span><strong>{projectStats.elementsCount}</strong> elements</span>
            <span>•</span>
            <span><strong>{projectStats.totalDuration}</strong> total</span>
            <span>•</span>
            <span><strong>{timelineData.project_info.client}</strong></span>
          </div>
        </div>
      </div>

      {/* Elements Overview Bar - Use same format as scene card elements */}
      <div className="elements-overview">
        <div className="elements-overview-header">
          <h3>Story Elements</h3>
          <span className="elements-count">{timelineData.elements.length} total</span>
        </div>
        
        <div className="elements-horizontal">
          {Object.entries(elementsWithStats).map(([type, elements]) => (
            <div key={type} className="scene-element-group">
              <span className="scene-element-type">{type}s:</span>
              <div className="scene-element-tags">
                {elements.map((element) => (
                  <motion.div
                    key={element.id}
                    whileHover={{ scale: 1.05 }}
                    onMouseEnter={() => handleElementHover(element.id)}
                    onMouseLeave={() => handleElementHover(null)}
                    className="scene-element-tag"
                    style={{
                      backgroundColor: hoveredElement === element.id ? element.color : `${element.color}20`,
                      color: hoveredElement === element.id ? 'white' : element.color,
                      borderColor: element.color
                    }}
                  >
                    {element.name} ({element.usage_percentage}%)
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline Scenes */}
      <div className="timeline-scenes">
        <div className="timeline-scenes-responsive-grid">
          {timelineData.scenes.map((scene) => (
            <SceneCard
              key={scene.scene_id}
              scene={scene}
              elements={timelineData.elements}
              isSelected={selectedScene === scene.scene_id}
              hoveredElement={hoveredElement}
              onSelect={() => handleSceneSelect(scene.scene_id)}
              onElementHover={handleElementHover}
            />
          ))}
        </div>
      </div>
    </div>
  );
}