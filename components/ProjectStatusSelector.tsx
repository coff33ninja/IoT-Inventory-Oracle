import React, { useState } from 'react';
import { ProjectStatus, PROJECT_STATUS_CONFIG } from '../constants';

interface ProjectStatusSelectorProps {
  currentStatus: ProjectStatus;
  onStatusChange: (newStatus: ProjectStatus) => void;
  disabled?: boolean;
}

const ProjectStatusSelector: React.FC<ProjectStatusSelectorProps> = ({
  currentStatus,
  onStatusChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentConfig = PROJECT_STATUS_CONFIG[currentStatus];
  const availableStates = currentConfig.nextStates;

  const handleStatusChange = (newStatus: ProjectStatus) => {
    onStatusChange(newStatus);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium border transition-colors ${
          currentConfig.color
        } ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:opacity-80 cursor-pointer'
        }`}
        aria-label={`Current status: ${currentConfig.label}. Click to change status.`}
      >
        <span>{currentConfig.icon}</span>
        <span>{currentConfig.label}</span>
        {!disabled && (
          <svg 
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-secondary border border-border-color rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs text-text-secondary mb-2 px-2">
                Change status to:
              </div>
              
              {availableStates.map((status) => {
                const config = PROJECT_STATUS_CONFIG[status];
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(status)}
                    className="w-full flex items-center gap-3 px-2 py-2 text-sm rounded-md hover:bg-primary/50 transition-colors text-left"
                  >
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${config.color}`}>
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </span>
                    <span className="text-xs text-text-secondary flex-1">
                      {config.description}
                    </span>
                  </button>
                );
              })}
              
              {availableStates.length === 0 && (
                <div className="px-2 py-2 text-xs text-text-secondary">
                  No status changes available from {currentConfig.label}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectStatusSelector;