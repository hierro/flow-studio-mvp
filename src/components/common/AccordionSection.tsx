/**
 * AccordionSection - Reusable collapsible section
 */

import { useState, ReactNode } from 'react';

interface AccordionSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: string;
}

export default function AccordionSection({ 
  title, 
  children, 
  defaultOpen = false,
  icon = '📋'
}: AccordionSectionProps) {
  // Use localStorage to persist accordion state
  const storageKey = `accordion-${title.replace(/\s+/g, '-').toLowerCase()}`;
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem(storageKey);
    return stored !== null ? JSON.parse(stored) : defaultOpen;
  });

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem(storageKey, JSON.stringify(newState));
  };

  return (
    <div className="accordion-section">
      <button 
        className={`accordion-header ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
      >
        <div className="accordion-title">
          <span className="accordion-icon">{icon}</span>
          <span className="accordion-label">{title}</span>
        </div>
        <span className="accordion-arrow">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>
      
      {isOpen && (
        <div className="accordion-content">
          <div className="accordion-inner">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}