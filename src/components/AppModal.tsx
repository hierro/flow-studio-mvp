/**
 * App-Level Modal Component
 * 
 * Renders at top app level for non-disruptive overlays
 * Handles loading states, progress tracking, and various modal types
 */

import { useEffect } from 'react';
import { AppModalState } from '../hooks/useAppModal';

interface AppModalProps {
  modalState: AppModalState;
  onClose: () => void;
}

export default function AppModal({ modalState, onClose }: AppModalProps) {
  const { isVisible, content } = modalState;

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible && content?.type !== 'loading') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, content?.type, onClose]);

  if (!isVisible || !content) return null;

  const getModalIcon = () => {
    switch (content.type) {
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '🤖';
    }
  };

  const getModalClass = () => {
    const baseClass = 'app-modal-content';
    const typeClass = content.type ? `app-modal-${content.type}` : '';
    return `${baseClass} ${typeClass}`.trim();
  };

  return (
    <div className="app-modal-overlay">
      <div className={getModalClass()}>
        {/* Header */}
        <div className="app-modal-header">
          <div className="app-modal-title">
            <span className="app-modal-icon">{getModalIcon()}</span>
            <h3>{content.title}</h3>
          </div>
          {content.type !== 'loading' && (
            <button 
              className="app-modal-close"
              onClick={onClose}
              title="Close"
            >
              ×
            </button>
          )}
        </div>

        {/* Content */}
        <div className="app-modal-body">
          <p className="app-modal-message">{content.message}</p>

          {/* Progress Bar */}
          {content.progress && (
            <div className="app-modal-progress">
              <div className="app-modal-progress-bar">
                <div 
                  className="app-modal-progress-fill"
                  style={{ width: `${content.progress.percentage}%` }}
                />
              </div>
              <div className="app-modal-progress-text">
                {content.progress.current}/{content.progress.total} ({content.progress.percentage}%)
                {content.progress.currentItem && (
                  <span className="app-modal-progress-item">
                    • {content.progress.currentItem}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Details List */}
          {content.details && content.details.length > 0 && (
            <div className="app-modal-details">
              {content.details.map((detail, index) => (
                <p key={index} className="app-modal-detail">• {detail}</p>
              ))}
            </div>
          )}
        </div>

        {/* Loading Spinner for loading type */}
        {content.type === 'loading' && (
          <div className="app-modal-spinner-container">
            <div className="app-modal-spinner" />
          </div>
        )}
      </div>
    </div>
  );
}