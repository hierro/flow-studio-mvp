/**
 * SceneCard - Individual scene visualization for DirectorsTimeline
 * 
 * Simplified display-only component showing scene info with expandable content.
 * No complex editing system - clean visualization for timeline view.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { TimelineScene, TimelineElement } from '../../utils/TimelineParser';
import { createTextFieldEditor, createSelectFieldEditor } from '../../utils/JsonFieldEditor';

interface SceneCardProps {
  scene: TimelineScene;
  elements: TimelineElement[];
  onSelect: () => void;
  isSelected: boolean;
  onElementHover: (elementId: string | null) => void;
  hoveredElement: string | null;
  // Scene editing props
  masterJson?: any;
  onSceneEdit?: (updatedJson: any) => void;
}

export default function SceneCard({ 
  scene, 
  elements, 
  onSelect, 
  isSelected, 
  onElementHover,
  hoveredElement,
  masterJson,
  onSceneEdit
}: SceneCardProps) {
  const [expandedSections, setExpandedSections] = useState<{
    description: boolean;
    elements: boolean;
    primaryFocus: boolean;
    composition: boolean;
  }>({
    description: false,
    elements: false,
    primaryFocus: false,
    composition: false
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Get elements present in this scene, grouped by type
  const sceneElements = elements.filter(el => 
    scene.elements_present?.includes(el.id)
  );

  // Create field editors using JsonFieldEditor patterns
  const createFieldEditor = (fieldPath: string, fieldType: 'text' | 'select', options?: string[]) => {
    if (!masterJson || !onSceneEdit) return null;
    
    if (fieldType === 'select' && options) {
      return createSelectFieldEditor(masterJson, fieldPath, options, onSceneEdit);
    } else {
      return createTextFieldEditor(masterJson, fieldPath, onSceneEdit);
    }
  };

  // Scene field paths
  const sceneFieldPaths = {
    camera_type: `scenes.scene_${scene.scene_id}.camera_type`,
    mood: `scenes.scene_${scene.scene_id}.mood`,
    dialogue: `scenes.scene_${scene.scene_id}.dialogue`
  };

  // Removed camera type options - using text input instead

  // Editable field renderer
  const renderEditableField = (currentValue: string, label: string, fieldKey: string, fieldType: 'text' | 'select' = 'text', options?: string[]) => {
    const isEditing = editingField === fieldKey;
    const fieldPath = sceneFieldPaths[fieldKey as keyof typeof sceneFieldPaths];
    const fieldEditor = createFieldEditor(fieldPath, fieldType, options);
    
    if (!fieldEditor || !masterJson || !onSceneEdit) {
      // Fallback to display-only if no editing capability
      return (
        <div className="scene-field-row">
          <strong className="scene-field-label">{label}:</strong>
          <div className="scene-field-value-area">
            {currentValue || `No ${label.toLowerCase()}`}
          </div>
        </div>
      );
    }

    return (
      <div className="scene-field-row">
        <strong className="scene-field-label">{label}:</strong>
        <div className="scene-field-value-area">
          {isEditing ? (
            <div className="scene-field-edit-container">
              {fieldType === 'select' && options ? (
                <select
                  value={fieldValues[fieldKey] ?? fieldEditor.currentValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFieldValues(prev => ({ ...prev, [fieldKey]: newValue }));
                    fieldEditor.updateValue(newValue);
                  }}
                  onBlur={() => setEditingField(null)}
                  className="scene-field-select"
                  autoFocus
                >
                  {options.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={fieldValues[fieldKey] ?? fieldEditor.currentValue}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setFieldValues(prev => ({ ...prev, [fieldKey]: newValue }));
                  }}
                  onBlur={() => {
                    const finalValue = fieldValues[fieldKey] ?? fieldEditor.currentValue;
                    fieldEditor.updateValue(finalValue);
                    setEditingField(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const finalValue = fieldValues[fieldKey] ?? fieldEditor.currentValue;
                      fieldEditor.updateValue(finalValue);
                      setEditingField(null);
                    }
                    if (e.key === 'Escape') {
                      setFieldValues(prev => {
                        const { [fieldKey]: _, ...rest } = prev;
                        return rest;
                      });
                      setEditingField(null);
                    }
                  }}
                  className="scene-field-input"
                  autoFocus
                />
              )}
            </div>
          ) : (
            <div 
              className="scene-field-value-display editable-field"
              onClick={(e) => {
                e.stopPropagation();
                setEditingField(fieldKey);
                setFieldValues(prev => ({ ...prev, [fieldKey]: fieldEditor.currentValue }));
              }}
              title={`Click to edit ${label.toLowerCase()}`}
            >
              {currentValue || `No ${label.toLowerCase()}`}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Legacy display field for non-editable fields
  const renderDisplayField = (value: string, label: string) => {
    return (
      <div className="scene-field-row">
        <strong className="scene-field-label">{label}:</strong>
        <div className="scene-field-value-area">
          {value || `No ${label.toLowerCase()}`}
        </div>
      </div>
    );
  };

  const groupedElements = sceneElements.reduce((acc, element) => {
    if (!acc[element.type]) {
      acc[element.type] = [];
    }
    acc[element.type].push(element);
    return acc;
  }, {} as Record<string, typeof sceneElements>);

  // Card animation variants
  const cardVariants = {
    default: { 
      scale: 1, 
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    },
    hover: { 
      scale: 1.02, 
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    },
    selected: {
      scale: 1.02,
      boxShadow: '0 0 0 2px #3b82f6, 0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      transition: { duration: 0.2 }
    }
  };

  // Expansion animation
  const expandVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { 
      height: 'auto', 
      opacity: 1
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="default"
      whileHover="hover"
      animate={isSelected ? "selected" : "default"}
      className="timeline-scene-card rounded-lg border overflow-hidden cursor-pointer"
      onClick={onSelect}
    >
      {/* Scene Header */}
      <div className="scene-card-content">
        <div className="scene-card-header">
          <span className="scene-badge">
            Scene {scene.scene_id}
          </span>
          <span className="scene-duration">
            {scene.duration}
          </span>
        </div>

        {/* Action Summary (Main Title) */}
        <h3 className="scene-title">
          {scene.title}
        </h3>

        {/* Scene Primary Fields - Individual bordered fields */}
        {renderEditableField(scene.camera_type || '', 'Camera', 'camera_type')}
        {renderEditableField(scene.mood || '', 'Mood', 'mood')}
        {renderEditableField(scene.dialogue || '', 'Speech', 'dialogue')}

        {/* Individual Expandable Sections - REORDERED: description, primary focus, composition, elements */}
        <div className="scene-expandable-sections">
          {/* Description Button & Content */}
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSections(prev => ({ ...prev, description: !prev.description }));
              }}
              className={`scene-expand-button ${expandedSections.description ? 'expanded' : ''}`}
            >
              <span>📝 Description</span>
              <span>{expandedSections.description ? '▼' : '▶'}</span>
            </button>
            <AnimatePresence>
              {expandedSections.description && scene.natural_description && (
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="scene-expand-content"
                >
                  <div className="scene-expand-inner">
                    {scene.natural_description || 'No description available'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Primary Focus Button & Content */}
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSections(prev => ({ ...prev, primaryFocus: !prev.primaryFocus }));
              }}
              className={`scene-expand-button ${expandedSections.primaryFocus ? 'expanded' : ''}`}
            >
              <span>🎯 Primary Focus</span>
              <span>{expandedSections.primaryFocus ? '▼' : '▶'}</span>
            </button>
            <AnimatePresence>
              {expandedSections.primaryFocus && (
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="scene-expand-content"
                >
                  <div className="scene-expand-inner">
                    {scene.primary_focus || 'No primary focus specified'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Composition Button & Content */}
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSections(prev => ({ ...prev, composition: !prev.composition }));
              }}
              className={`scene-expand-button ${expandedSections.composition ? 'expanded' : ''}`}
            >
              <span>📐 Composition</span>
              <span>{expandedSections.composition ? '▼' : '▶'}</span>
            </button>
            <AnimatePresence>
              {expandedSections.composition && (
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="scene-expand-content"
                >
                  <div className="scene-expand-inner">
                    {scene.composition_approach || 'No composition details specified'}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Elements Button & Content - MOVED TO LAST */}
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSections(prev => ({ ...prev, elements: !prev.elements }));
              }}
              className={`scene-expand-button ${expandedSections.elements ? 'expanded' : ''}`}
            >
              <span>🎭 Elements ({sceneElements.length})</span>
              <span>{expandedSections.elements ? '▼' : '▶'}</span>
            </button>
            <AnimatePresence>
              {expandedSections.elements && (
                <motion.div
                  variants={expandVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  className="scene-expand-content"
                >
                  <div className="scene-expand-inner">
                    <div className="scene-elements-list">
                      {Object.entries(groupedElements).map(([type, typeElements]) => (
                        <div key={type} className="scene-element-group">
                          <span className="scene-element-type">
                            {type}:
                          </span>
                          <div className="scene-element-tags">
                            {typeElements.map(element => (
                              <motion.div
                                key={element.id}
                                whileHover={{ scale: 1.05 }}
                                onMouseEnter={() => onElementHover(element.id)}
                                onMouseLeave={() => onElementHover(null)}
                                className="scene-element-tag"
                                style={{
                                  backgroundColor: hoveredElement === element.id ? element.color : `${element.color}20`,
                                  color: hoveredElement === element.id ? 'white' : element.color,
                                  borderColor: element.color
                                }}
                              >
                                {element.name}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </motion.div>
  );
}