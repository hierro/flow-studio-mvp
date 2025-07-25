import { useState } from 'react'
import { createTextFieldEditor } from '../../utils/JsonFieldEditor'

interface StyleControlProps {
  masterJson: any;
  onContentUpdate: (updatedContent: any) => void;
}

export default function StyleControl({ masterJson, onContentUpdate }: StyleControlProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})

  // Style field paths for global_style object
  const styleFieldPaths = {
    // Color Palette
    primary: 'global_style.color_palette.primary',
    secondary: 'global_style.color_palette.secondary', 
    accent: 'global_style.color_palette.accent',
    character_tones: 'global_style.color_palette.character_tones',
    
    // Rendering Style
    level: 'global_style.rendering_style.level',
    line_work: 'global_style.rendering_style.line_work',
    shading: 'global_style.rendering_style.shading',
    detail_level: 'global_style.rendering_style.detail_level',
    
    // Composition
    framing: 'global_style.composition.framing',
    depth: 'global_style.composition.depth',
    camera_style: 'global_style.composition.camera_style',
    aspect_ratio: 'global_style.composition.aspect_ratio',
    
    // Mood Style
    overall_mood: 'global_style.mood_style.overall_mood',
    lighting_description: 'global_style.mood_style.lighting_description',
    atmosphere: 'global_style.mood_style.atmosphere',
    tone: 'global_style.mood_style.tone'
  }

  // Create field editor helper
  const createFieldEditor = (fieldPath: string) => {
    if (!masterJson || !onContentUpdate) return null
    return createTextFieldEditor(masterJson, fieldPath, onContentUpdate)
  }

  // Editable field renderer (reusing scene card pattern)
  const renderEditableField = (currentValue: string, label: string, fieldKey: string) => {
    const isEditing = editingField === fieldKey
    const fieldPath = styleFieldPaths[fieldKey as keyof typeof styleFieldPaths]
    const fieldEditor = createFieldEditor(fieldPath)
    
    if (!fieldEditor || !masterJson || !onContentUpdate) {
      // Fallback to display-only if no editing capability
      return (
        <div className="style-field-container">
          <strong className="style-field-label">{label}:</strong>
          <div className="style-field-value">
            {currentValue || `No ${label.toLowerCase()}`}
          </div>
        </div>
      )
    }

    return (
      <div className="scene-field-row">
        <strong className="scene-field-label">{label}:</strong>
        <div className="scene-field-value-area">
          {isEditing ? (
            <div className="scene-field-edit-container">
              <input
                type="text"
                value={fieldValues[fieldKey] ?? fieldEditor.currentValue}
                onChange={(e) => {
                  const newValue = e.target.value
                  setFieldValues(prev => ({ ...prev, [fieldKey]: newValue }))
                }}
                onBlur={() => {
                  const finalValue = fieldValues[fieldKey] ?? fieldEditor.currentValue
                  fieldEditor.updateValue(finalValue)
                  setEditingField(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const finalValue = fieldValues[fieldKey] ?? fieldEditor.currentValue
                    fieldEditor.updateValue(finalValue)
                    setEditingField(null)
                  }
                  if (e.key === 'Escape') {
                    setFieldValues(prev => {
                      const { [fieldKey]: _, ...rest } = prev
                      return rest
                    })
                    setEditingField(null)
                  }
                }}
                className="scene-field-input"
                autoFocus
              />
            </div>
          ) : (
            <div 
              className="scene-field-value-display editable-field"
              onClick={() => setEditingField(fieldKey)}
            >
              {currentValue || `Click to edit`}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Get current values from master JSON
  const getStyleValue = (fieldKey: string): string => {
    const fieldPath = styleFieldPaths[fieldKey as keyof typeof styleFieldPaths]
    const pathParts = fieldPath.split('.')
    let current = masterJson
    
    for (const part of pathParts) {
      if (!current || typeof current !== 'object') return ''
      current = current[part]
    }
    
    return current || ''
  }

  return (
    <div className="style-control-container">
      <div className="style-cards-container">
        
        {/* Card 1: Color Palette */}
        <div className="timeline-scene-card">
          <div className="scene-card-content">
            <div className="scene-card-header">
              <h3 className="style-card-title">Color Palette</h3>
            </div>
            <div className="style-grid-2x2">
              {renderEditableField(getStyleValue('primary'), 'Primary', 'primary')}
              {renderEditableField(getStyleValue('secondary'), 'Secondary', 'secondary')}
              {renderEditableField(getStyleValue('accent'), 'Accent', 'accent')}
              {renderEditableField(getStyleValue('character_tones'), 'Character Tones', 'character_tones')}
            </div>
          </div>
        </div>

        {/* Card 2: Rendering Style */}
        <div className="timeline-scene-card">
          <div className="scene-card-content">
            <div className="scene-card-header">
              <h3 className="style-card-title">Rendering Style</h3>
            </div>
            <div className="style-grid-2x2">
              {renderEditableField(getStyleValue('level'), 'Level', 'level')}
              {renderEditableField(getStyleValue('line_work'), 'Line Work', 'line_work')}
              {renderEditableField(getStyleValue('shading'), 'Shading', 'shading')}
              {renderEditableField(getStyleValue('detail_level'), 'Detail Level', 'detail_level')}
            </div>
          </div>
        </div>

        {/* Card 3: Composition */}
        <div className="timeline-scene-card">
          <div className="scene-card-content">
            <div className="scene-card-header">
              <h3 className="style-card-title">Composition</h3>
            </div>
            <div className="style-grid-2x2">
              {renderEditableField(getStyleValue('framing'), 'Framing', 'framing')}
              {renderEditableField(getStyleValue('depth'), 'Depth', 'depth')}
              {renderEditableField(getStyleValue('camera_style'), 'Camera Style', 'camera_style')}
              {renderEditableField(getStyleValue('aspect_ratio'), 'Aspect Ratio', 'aspect_ratio')}
            </div>
          </div>
        </div>

        {/* Card 4: Mood Style */}
        <div className="timeline-scene-card">
          <div className="scene-card-content">
            <div className="scene-card-header">
              <h3 className="style-card-title">Mood Style</h3>
            </div>
            <div className="style-grid-2x2">
              {renderEditableField(getStyleValue('overall_mood'), 'Overall Mood', 'overall_mood')}
              {renderEditableField(getStyleValue('lighting_description'), 'Lighting', 'lighting_description')}
              {renderEditableField(getStyleValue('atmosphere'), 'Atmosphere', 'atmosphere')}
              {renderEditableField(getStyleValue('tone'), 'Tone', 'tone')}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}