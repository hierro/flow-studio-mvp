/**
 * SceneCard - 3-Column Layout for Scene Cards
 * 
 * Complete scene card with narrow top row + 3 columns (config, image, video)
 * Includes title editing, field editing, and media generation placeholders
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { TimelineScene, TimelineElement } from '../../utils/TimelineParser';
import { createTextFieldEditor, createSelectFieldEditor } from '../../utils/JsonFieldEditor';
import placeholderImage from '../../assets/16-9placeholder.png';

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
    title: `scenes.scene_${scene.scene_id}.title`,
    camera_type: `scenes.scene_${scene.scene_id}.camera_type`,
    mood: `scenes.scene_${scene.scene_id}.mood`,
    dialogue: `scenes.scene_${scene.scene_id}.dialogue`,
    natural_description: `scenes.scene_${scene.scene_id}.natural_description`,
    primary_focus: `scenes.scene_${scene.scene_id}.primary_focus`,
    scene_frame_prompt: `scenes.scene_${scene.scene_id}.scene_frame_prompt`,
    composition_approach: `scenes.scene_${scene.scene_id}.composition_approach`
  };

  // Editable field renderer (same as original)
  const renderEditableField = (currentValue: string, label: string, fieldKey: string, fieldType: 'text' | 'textarea' | 'select' = 'text', options?: string[]) => {
    const isEditing = editingField === fieldKey;
    const fieldPath = sceneFieldPaths[fieldKey as keyof typeof sceneFieldPaths];
    const fieldEditor = createFieldEditor(fieldPath, fieldType === 'select' ? 'select' : 'text', options);
    
    if (!fieldEditor || !masterJson || !onSceneEdit) {
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
              {fieldType === 'textarea' ? (
                <textarea
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
                    if (e.key === 'Escape') {
                      setFieldValues(prev => {
                        const { [fieldKey]: _, ...rest } = prev;
                        return rest;
                      });
                      setEditingField(null);
                    }
                  }}
                  className="scene-field-textarea"
                  autoFocus
                  rows={3}
                />
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

  // Custom title renderer with scene number
  const renderTitleWithSceneNumber = (currentValue: string, sceneId: string) => {
    const isEditing = editingField === 'title';
    const fieldPath = sceneFieldPaths.title;
    const fieldEditor = createFieldEditor(fieldPath, 'text');
    
    if (!fieldEditor || !masterJson || !onSceneEdit) {
      return (
        <div className="scene-title-with-number">
          <span className="scene-number-part">Scene {sceneId}:</span>
          <span className="scene-title-part">{currentValue || 'Untitled'}</span>
        </div>
      );
    }

    return (
      <div className="scene-title-with-number">
        <span className="scene-number-part">Scene {sceneId}:</span>
        {isEditing ? (
          <input
            type="text"
            value={fieldValues.title ?? currentValue ?? 'Untitled'}
            onChange={(e) => {
              const newValue = e.target.value;
              setFieldValues(prev => ({ ...prev, title: newValue }));
            }}
            onBlur={() => {
              const finalValue = fieldValues.title ?? currentValue;
              if (finalValue !== currentValue) {
                fieldEditor.updateValue(finalValue);
              }
              setEditingField(null);
              // Clear the local field value after saving
              setFieldValues(prev => {
                const { title: _, ...rest } = prev;
                return rest;
              });
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const finalValue = fieldValues.title ?? currentValue;
                if (finalValue !== currentValue) {
                  fieldEditor.updateValue(finalValue);
                }
                setEditingField(null);
                // Clear the local field value after saving
                setFieldValues(prev => {
                  const { title: _, ...rest } = prev;
                  return rest;
                });
              }
              if (e.key === 'Escape') {
                // Cancel editing - revert to original value without saving
                setFieldValues(prev => {
                  const { title: _, ...rest } = prev;
                  return rest;
                });
                setEditingField(null);
              }
            }}
            className="scene-title-input"
            autoFocus
          />
        ) : (
          <span 
            className="scene-title-part editable-field"
            onClick={(e) => {
              e.stopPropagation();
              setEditingField('title');
              // Store the current displayed value for editing
              setFieldValues(prev => ({ ...prev, title: currentValue || 'Untitled' }));
            }}
            title="Click to edit title"
          >
            {currentValue || 'Untitled'}
          </span>
        )}
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
      {/* NEW: Narrow Top Row - Title with Scene Number, Duration (right aligned) */}
      <div className="scene-top-row">
        <div className="scene-title-container">
          {renderTitleWithSceneNumber(
            masterJson && createFieldEditor(sceneFieldPaths.title, 'text')?.currentValue || scene.title || '', 
            scene.scene_id
          )}
        </div>
        <span className="scene-duration">
          {scene.duration}
        </span>
      </div>

      {/* NEW: Three Column Layout */}
      <div className="scene-card-three-columns">
        
        {/* Column 1: Configuration (existing content moved here) */}
        <div className="scene-column scene-column-config">
          <div className="scene-column-header">
            <h4 className="scene-column-title">Configuration</h4>
          </div>
          
          {/* Scene Primary Fields */}
          {renderEditableField(scene.camera_type || '', 'Camera', 'camera_type')}
          {renderEditableField(scene.mood || '', 'Mood', 'mood')}
          {renderEditableField(scene.dialogue || '', 'Speech', 'dialogue')}

          {/* Expandable Sections */}
          <div className="scene-expandable-sections">
            {/* Description */}
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
                {expandedSections.description && (
                  <motion.div
                    variants={expandVariants}
                    initial="collapsed"
                    animate="expanded"
                    exit="collapsed"
                    className="scene-expand-content"
                  >
                    <div className="scene-expand-inner">
                      {renderEditableField(scene.natural_description || '', 'Description', 'natural_description', 'textarea')}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Primary Focus */}
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
                      {renderEditableField(scene.primary_focus || '', 'Primary Focus', 'primary_focus', 'textarea')}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Composition */}
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
                      {renderEditableField(scene.composition_approach || '', 'Composition', 'composition_approach', 'textarea')}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Elements */}
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

        {/* Column 2: Image Generation (NEW - Phase 3) */}
        <div className="scene-column scene-column-image">
          <div className="scene-column-header">
            <h4 className="scene-column-title">Image Generation</h4>
          </div>
          
          {/* Image Placeholder */}
          <div className="scene-media-placeholder">
            <img 
              src={placeholderImage} 
              alt="Scene placeholder" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)'
              }}
            />
          </div>
          
          {/* Generated Prompt */}
          <div className="scene-prompt-container">
            <div className="scene-prompt-header">
              <label className="scene-prompt-label">Generated Prompt</label>
            </div>
            <textarea
              className="scene-prompt-textarea"
              placeholder={scene.scene_frame_prompt ? "Click to edit generated prompt..." : "Generated image prompt will appear here..."}
              value={editingField === 'scene_frame_prompt' ? (fieldValues.scene_frame_prompt || '') : (scene.scene_frame_prompt || '')}
              rows={6}
              readOnly={editingField !== 'scene_frame_prompt'}
              onClick={(e) => {
                e.stopPropagation();
                if (editingField !== 'scene_frame_prompt') {
                  setEditingField('scene_frame_prompt');
                  setFieldValues(prev => ({ ...prev, scene_frame_prompt: scene.scene_frame_prompt || '' }));
                }
              }}
              onChange={(e) => {
                if (editingField === 'scene_frame_prompt') {
                  setFieldValues(prev => ({ ...prev, scene_frame_prompt: e.target.value }));
                }
              }}
              onBlur={() => {
                if (editingField === 'scene_frame_prompt') {
                  const fieldEditor = createFieldEditor(sceneFieldPaths.scene_frame_prompt, 'text');
                  if (fieldEditor) {
                    fieldEditor.updateValue(fieldValues.scene_frame_prompt || '');
                  }
                  setEditingField(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.currentTarget.blur();
                }
                if (e.key === 'Escape') {
                  setEditingField(null);
                  setFieldValues(prev => ({ ...prev, scene_frame_prompt: scene.scene_frame_prompt || '' }));
                }
              }}
              style={{
                cursor: editingField === 'scene_frame_prompt' ? 'text' : 'pointer',
                backgroundColor: editingField === 'scene_frame_prompt' ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                border: editingField === 'scene_frame_prompt' ? '1px solid var(--color-border-focus)' : '1px solid var(--color-border-default)'
              }}
            />
          </div>
          
          {/* Generation Buttons */}
          <div className="scene-generate-buttons">
            <button className="scene-generate-btn" disabled>
              Prompt
            </button>
            <button className="scene-generate-btn" disabled>
              Image
            </button>
          </div>
        </div>

        {/* Column 3: Video Generation (NEW - Phase 4 Future) */}
        <div className="scene-column scene-column-video">
          <div className="scene-column-header">
            <h4 className="scene-column-title">Video Generation</h4>
          </div>
          
          {/* Video Placeholder */}
          <div className="scene-media-placeholder">
            <img 
              src={placeholderImage} 
              alt="Video placeholder" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 'var(--radius-sm)'
              }}
            />
          </div>
          
          {/* Video Prompt */}
          <textarea
            className="scene-prompt-textarea"
            placeholder="Video generation prompt will appear here..."
            rows={6}
            readOnly
          />
          
          {/* Generation Buttons */}
          <div className="scene-generate-buttons">
            <button className="scene-generate-btn" disabled>
              Prompt
            </button>
            <button className="scene-generate-btn" disabled>
              Video
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
}