import React, { useState } from 'react';

interface QuickActionButtonProps {
  action: 'add-alternative' | 'reorder' | 'find-compatible' | 'view-insights';
  label?: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  action,
  label,
  onClick,
  disabled = false,
  loading = false,
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const getActionConfig = () => {
    switch (action) {
      case 'add-alternative':
        return {
          icon: '🔄',
          defaultLabel: 'Add Alternative',
          color: 'bg-blue-500 hover:bg-blue-600',
          description: 'Add recommended alternative to inventory'
        };
      case 'reorder':
        return {
          icon: '📦',
          defaultLabel: 'Reorder',
          color: 'bg-green-500 hover:bg-green-600',
          description: 'Add to shopping list for reordering'
        };
      case 'find-compatible':
        return {
          icon: '🔍',
          defaultLabel: 'Find Compatible',
          color: 'bg-purple-500 hover:bg-purple-600',
          description: 'Find compatible components'
        };
      case 'view-insights':
        return {
          icon: '📊',
          defaultLabel: 'View Insights',
          color: 'bg-orange-500 hover:bg-orange-600',
          description: 'View usage and market insights'
        };
      default:
        return {
          icon: '⚡',
          defaultLabel: 'Action',
          color: 'bg-gray-500 hover:bg-gray-600',
          description: 'Quick action'
        };
    }
  };

  const config = getActionConfig();
  const displayLabel = label || config.defaultLabel;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
          text-white transition-all duration-200 transform
          ${config.color}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-md'}
          ${className}
        `}
        title={config.description}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        ) : (
          <span className="text-sm">{config.icon}</span>
        )}
        <span>{displayLabel}</span>
      </button>

      {/* Tooltip */}
      {isHovered && !disabled && !loading && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap z-10">
          {config.description}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  );
};

export default QuickActionButton;