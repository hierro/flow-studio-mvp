/**
 * SceneCard - Individual scene visualization for DirectorsTimeline
 * 
 * Shows scene info with expandable content containing rich parsing data
 * equivalent to scenes_description.json structure from n8n workflow.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { TimelineScene, TimelineElement } from '../../utils/TimelineParser';
import clsx from 'clsx';

interface SceneCardProps {
  scene: TimelineScene;
  elements: TimelineElement[];
  onSelect: (sceneId: number) => void;
  isSelected: boolean;
  onElementHover: (elementId: string | null) => void;
  hoveredElement: string | null;
}

export default function SceneCard({ 
  scene, 
  elements, 
  onSelect, 
  isSelected, 
  onElementHover,
  hoveredElement 
}: SceneCardProps) {
  const [expandedSections, setExpandedSections] = useState<{
    primaryFocus: boolean;
    composition: boolean;
    description: boolean;
  }>({
    primaryFocus: false,
    composition: false,
    description: false
  });

  // Get elements present in this scene, grouped by type
  const sceneElements = elements.filter(el => 
    scene.elements_present.includes(el.id)
  );

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
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeInOut' }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="default"
      whileHover="hover"
      animate={isSelected ? "selected" : "default"}
      className={clsx(
        'timeline-scene-card',
        'rounded-lg border overflow-hidden cursor-pointer'
      )}
      style={{
        minWidth: '300px',
        backgroundColor: '#1a1a1a',
        border: '1px solid #333'
      }}
      onClick={() => onSelect(scene.scene_id)}
    >
      {/* Scene Header */}
      <div style={{ padding: '16px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            color: '#3b82f6',
            backgroundColor: '#eff6ff',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            Scene {scene.scene_id}
          </span>
          <span style={{ 
            fontSize: '12px', 
            color: '#ccc',
            backgroundColor: '#333',
            padding: '4px 8px',
            borderRadius: '4px',
            fontWeight: '500'
          }}>
            {scene.duration}
          </span>
        </div>

        {/* Action Summary (Main Title) */}
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: '700', 
          color: '#fff',
          marginBottom: '12px',
          lineHeight: '1.3'
        }}>
          {scene.action_summary || scene.title}
        </h3>

        {/* Camera Type & Mood - Two Rows */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '6px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '12px', color: '#ccc' }}>
            Camera: <span style={{ color: '#10b981', fontWeight: '500' }}>{scene.camera_type}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#ccc' }}>
            Mood: <span style={{ color: '#8b5cf6', fontWeight: '500' }}>{scene.mood}</span>
          </div>
        </div>

        {/* Dialogue Section */}
        {scene.dialogue && (
          <div style={{ 
            backgroundColor: '#0f0f0f',
            border: '1px solid #333',
            borderRadius: '6px',
            padding: '10px',
            marginBottom: '12px'
          }}>
            <p style={{ 
              fontSize: '12px',
              color: '#ccc',
              fontStyle: 'italic',
              lineHeight: '1.4',
              margin: 0
            }}>
              "{scene.dialogue.length > 80 ? `${scene.dialogue.substring(0, 80)}...` : scene.dialogue}"
            </p>
          </div>
        )}

        {/* Elements Section */}
        <div style={{ 
          border: '1px solid #333',
          borderRadius: '6px',
          padding: '10px',
          marginBottom: '12px'
        }}>
          <div style={{ 
            fontSize: '11px', 
            fontWeight: '600', 
            color: '#f59e0b',
            marginBottom: '8px'
          }}>
            Elements ({sceneElements.length})
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '6px'
          }}>
            {Object.entries(groupedElements).map(([type, typeElements]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ 
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#999',
                  minWidth: '50px',
                  textTransform: 'capitalize'
                }}>
                  {type}:
                </span>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '4px'
                }}>
                  {typeElements.map(element => (
                    <motion.div
                      key={element.id}
                      whileHover={{ scale: 1.05 }}
                      onMouseEnter={() => onElementHover(element.id)}
                      onMouseLeave={() => onElementHover(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: hoveredElement === element.id ? element.color : `${element.color}20`,
                        color: hoveredElement === element.id ? 'white' : element.color,
                        border: `1px solid ${element.color}`,
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
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

        {/* Individual Expandable Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Primary Focus Button & Content */}
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSections(prev => ({ ...prev, primaryFocus: !prev.primaryFocus }));
              }}
              style={{
                width: '100%',
                padding: '6px 12px',
                backgroundColor: expandedSections.primaryFocus ? '#0066cc' : '#333',
                border: '1px solid #555',
                borderRadius: '4px',
                fontSize: '11px',
                color: expandedSections.primaryFocus ? 'white' : '#ccc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
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
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#0f0f0f',
                    border: '1px solid #333',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px'
                  }}>
                    <p style={{ 
                      fontSize: '12px',
                      color: '#ccc',
                      lineHeight: '1.4',
                      margin: 0
                    }}>
                      {scene.primary_focus || 'No specific focus defined'}
                    </p>
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
              style={{
                width: '100%',
                padding: '6px 12px',
                backgroundColor: expandedSections.composition ? '#0066cc' : '#333',
                border: '1px solid #555',
                borderRadius: '4px',
                fontSize: '11px',
                color: expandedSections.composition ? 'white' : '#ccc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
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
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#0f0f0f',
                    border: '1px solid #333',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px'
                  }}>
                    <p style={{ 
                      fontSize: '12px',
                      color: '#ccc',
                      lineHeight: '1.4',
                      margin: 0
                    }}>
                      {scene.composition_approach || 'Standard composition'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Description Button & Content */}
          <div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSections(prev => ({ ...prev, description: !prev.description }));
              }}
              style={{
                width: '100%',
                padding: '6px 12px',
                backgroundColor: expandedSections.description ? '#0066cc' : '#333',
                border: '1px solid #555',
                borderRadius: '4px',
                fontSize: '11px',
                color: expandedSections.description ? 'white' : '#ccc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
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
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ 
                    padding: '8px 12px', 
                    backgroundColor: '#0f0f0f',
                    border: '1px solid #333',
                    borderTop: 'none',
                    borderRadius: '0 0 4px 4px'
                  }}>
                    <p style={{ 
                      fontSize: '11px',
                      color: '#999',
                      lineHeight: '1.4',
                      margin: 0
                    }}>
                      {scene.natural_description}
                    </p>
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