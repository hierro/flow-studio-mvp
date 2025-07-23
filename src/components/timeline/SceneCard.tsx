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
      opacity: 1
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
      onClick={() => onSelect(scene.scene_id)}
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
          {scene.action_summary || scene.title}
        </h3>

        {/* Camera Type & Mood - Two Rows */}
        <div className="scene-meta">
          <div className="scene-meta-item">
            Camera: <span className="scene-camera">{scene.camera_type}</span>
          </div>
          <div className="scene-meta-item">
            Mood: <span className="scene-mood">{scene.mood}</span>
          </div>
        </div>

        {/* Dialogue Section */}
        {scene.dialogue && (
          <div className="scene-dialogue">
            <p className="scene-dialogue-text">
              "{scene.dialogue.length > 80 ? `${scene.dialogue.substring(0, 80)}...` : scene.dialogue}"
            </p>
          </div>
        )}

        {/* Elements Section */}
        <div className="scene-elements">
          <div className="scene-elements-title">
            Elements ({sceneElements.length})
          </div>
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

        {/* Individual Expandable Sections */}
        <div className="scene-expandable-sections">
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
                    <p className="scene-expand-text">
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
                    <p className="scene-expand-text">
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
                    <p className="scene-expand-text description">
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