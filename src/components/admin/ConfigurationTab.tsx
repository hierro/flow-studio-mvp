/**
 * ConfigurationTab - LLM Configuration Management
 * 
 * Simple JSON editor for app configuration with load/save testing
 */

import { useState, useEffect } from 'react';
import { getAppConfiguration, saveAppConfiguration } from '../../lib/database';
import AccordionSection from '../common/AccordionSection';

export default function ConfigurationTab() {
  const [configData, setConfigData] = useState<any>({});
  const [jsonContent, setJsonContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Load configuration on mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    setError('');
    try {
      const config = await getAppConfiguration();
      setConfigData(config);
      setJsonContent(JSON.stringify(config, null, 2));
      setHasUnsavedChanges(false);
    } catch (error) {
      setError('Failed to load configuration');
      console.error('Load error:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    console.log('💾 Save button clicked, hasUnsavedChanges:', hasUnsavedChanges);
    setIsSaving(true);
    setError('');
    try {
      const parsedConfig = JSON.parse(jsonContent);
      console.log('📤 Saving configuration to database...');
      const success = await saveAppConfiguration(parsedConfig);
      if (success) {
        setConfigData(parsedConfig);
        setHasUnsavedChanges(false);
        console.log('✅ Configuration marked as saved, hasUnsavedChanges set to false');
        
        // Trigger global config reload event
        window.dispatchEvent(new CustomEvent('llm-config-updated', { 
          detail: parsedConfig 
        }));
        
        // Reload local config to ensure sync
        await loadConfiguration();
        
        console.log('✅ Configuration saved and reloaded successfully');
      } else {
        setError('Failed to save configuration');
        console.error('❌ Save failed');
      }
    } catch (error) {
      setError('Invalid JSON format');
      console.error('Save error:', error);
    }
    setIsSaving(false);
  };

  const handleJsonChange = (value: string) => {
    setJsonContent(value);
    setHasUnsavedChanges(true);
    setError('');
  };

  const updateConfigSection = (section: string, value: string) => {
    try {
      const parsedValue = JSON.parse(value);
      const updatedConfig = {
        ...configData,
        [section]: parsedValue
      };
      setConfigData(updatedConfig);
      setJsonContent(JSON.stringify(updatedConfig, null, 2));
      setHasUnsavedChanges(true);
      setError('');
    } catch (error) {
      setError(`Invalid JSON in ${section} section`);
    }
  };

  // Process prompts for LLM consumption (convert escaped newlines to actual newlines)
  const processPromptForLLM = (prompt: string): string => {
    return prompt
      .replace(/\\n\\n/g, '\n\n')  // Convert \n\n to actual double line breaks
      .replace(/\\n/g, '\n')       // Convert \n to actual line breaks
      .replace(/\\"/g, '"')        // Convert \" to actual quotes
      .trim();
  };

  if (isLoading) {
    return (
      <div className="config-tab">
        <div className="config-loading">Loading configuration...</div>
      </div>
    );
  }

  return (
    <div className="config-tab">
      {/* Header */}
      <div className="config-header">
        <div>
          <h2>⚙️ LLM Configuration</h2>
          <p className="config-subtitle">Manage AI providers, prompts, and generation settings</p>
        </div>
        <div className="config-actions">
          <button 
            onClick={loadConfiguration}
            disabled={isSaving}
            className="btn btn-secondary"
          >
            🔄 Reload
          </button>
        </div>
      </div>

      {/* Save Button & Status - Always Visible at Top */}
      <div style={{
        padding: '1rem',
        backgroundColor: hasUnsavedChanges ? '#2d1b00' : '#0a2a0a',
        border: `2px solid ${hasUnsavedChanges ? '#ff6b35' : '#4ade80'}`,
        borderRadius: '0.5rem',
        marginBottom: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 'bold',
          color: hasUnsavedChanges ? '#ff6b35' : '#4ade80'
        }}>
          {hasUnsavedChanges ? '⚠️ UNSAVED CHANGES' : '✅ ALL CHANGES SAVED'}
          {hasUnsavedChanges && (
            <div style={{ fontSize: '0.75rem', fontWeight: 'normal', marginTop: '0.25rem', opacity: 0.8 }}>
              Click "Save Configuration" to persist changes to database
            </div>
          )}
        </div>
        <button 
          onClick={handleSave} 
          disabled={!hasUnsavedChanges || isSaving}
          className={`btn ${hasUnsavedChanges ? 'btn-primary' : 'btn-secondary'}`}
          style={{ minWidth: '140px' }}
        >
          {isSaving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save Configuration' : '✅ Saved'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="config-error">
          ⚠️ {error}
        </div>
      )}

      {/* Accordion Sections */}
      <div className="config-accordion">
        
        <AccordionSection title="Scene Frame Prompt Generation" icon="✨" defaultOpen={true}>
          <div className="config-section">
            <p>System and user prompts for scene start frame generation</p>
            
            {/* System Prompt Sub-section */}
            <div className="prompt-subsection">
              <h4 className="prompt-subsection-title">🔧 System Prompt</h4>
              <p className="prompt-subsection-desc">Instructions for the AI model about how to generate scene prompts</p>
              <textarea
                value={configData?.start_frame_prompt_generation?.system_prompt || ''}
                onChange={(e) => {
                  // Store RAW textarea content (with actual line breaks)
                  const updatedConfig = {
                    ...configData,
                    start_frame_prompt_generation: {
                      ...configData?.start_frame_prompt_generation,
                      system_prompt: e.target.value // Raw content, no escaping
                    }
                  };
                  setConfigData(updatedConfig);
                  setJsonContent(JSON.stringify(updatedConfig, null, 2));
                  setHasUnsavedChanges(true); // Mark as changed, require manual save
                  setError('');
                }}
                className="section-textarea prompt-textarea"
                rows={8}
                placeholder="Enter system prompt instructions..."
              />
              
              {/* Format Preview */}
              <div className="prompt-preview">
                <details>
                  <summary className="prompt-preview-toggle">📋 Preview stored format</summary>
                  <pre className="prompt-preview-content">
                    {configData?.start_frame_prompt_generation?.system_prompt || 'No content'}
                  </pre>
                </details>
              </div>
            </div>

            {/* User Prompt Sub-section */}
            <div className="prompt-subsection">
              <h4 className="prompt-subsection-title">👤 User Prompt</h4>
              <p className="prompt-subsection-desc">Template for user input to generate scene descriptions</p>
              <textarea
                value={configData?.start_frame_prompt_generation?.user_prompt || ''}
                onChange={(e) => {
                  // Store RAW textarea content (with actual line breaks)
                  const updatedConfig = {
                    ...configData,
                    start_frame_prompt_generation: {
                      ...configData?.start_frame_prompt_generation,
                      user_prompt: e.target.value // Raw content, no escaping
                    }
                  };
                  setConfigData(updatedConfig);
                  setJsonContent(JSON.stringify(updatedConfig, null, 2));
                  setHasUnsavedChanges(true); // Mark as changed, require manual save
                  setError('');
                }}
                className="section-textarea prompt-textarea"
                rows={6}
                placeholder="Enter user prompt template..."
              />
              
              {/* Format Preview */}
              <div className="prompt-preview">
                <details>
                  <summary className="prompt-preview-toggle">📋 Preview stored format</summary>
                  <pre className="prompt-preview-content">
                    {configData?.start_frame_prompt_generation?.user_prompt || 'No content'}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </AccordionSection>

        <AccordionSection title="LLM Providers" icon="🤖" defaultOpen={false}>
          <div className="config-section">
            <p>Model configurations for different AI providers</p>
            <textarea
              value={JSON.stringify(configData?.llm_providers || {}, null, 2)}
              onChange={(e) => updateConfigSection('llm_providers', e.target.value)}
              className="section-textarea"
              rows={8}
            />
          </div>
        </AccordionSection>

        <AccordionSection title="Image Generation" icon="🖼️" defaultOpen={false}>
          <div className="config-section">
            <p>Image generation API settings and parameters</p>
            <textarea
              value={JSON.stringify(configData?.image_generation || {}, null, 2)}
              onChange={(e) => updateConfigSection('image_generation', e.target.value)}
              className="section-textarea"
              rows={8}
            />
          </div>
        </AccordionSection>

        <AccordionSection title="Video Generation" icon="🎥" defaultOpen={false}>
          <div className="config-section">
            <p>Video generation API settings and parameters</p>
            <textarea
              value={JSON.stringify(configData?.video_generation || {}, null, 2)}
              onChange={(e) => updateConfigSection('video_generation', e.target.value)}
              className="section-textarea"
              rows={8}
            />
          </div>
        </AccordionSection>

        <AccordionSection title="Raw JSON" icon="📝" defaultOpen={false}>
          <div className="config-section">
            <p>Complete configuration JSON (advanced editing)</p>
            <textarea
              value={jsonContent}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="section-textarea"
              rows={20}
            />
          </div>
        </AccordionSection>

      </div>

      {/* Version Info */}
      <div style={{ 
        textAlign: 'center', 
        fontSize: '0.75rem', 
        color: '#666', 
        marginTop: '1rem',
        paddingTop: '1rem',
        borderTop: '1px solid #333'
      }}>
        Configuration Version: {configData?.configuration_metadata?.version || 'Unknown'}
      </div>
    </div>
  );
}