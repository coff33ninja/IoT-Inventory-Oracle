import React from 'react';

interface RecommendationBadgeProps {
  type: 'alternative' | 'low-stock' | 'trending' | 'budget-friendly' | 'compatible';
  count?: number;
  onClick?: () => void;
  className?: string;
}

const RecommendationBadge: React.FC<RecommendationBadgeProps> = ({
  type,
  count,
  onClick,
  className = ''
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'alternative':
        return {
          label: count ? `${count} alternatives` : 'Alternatives',
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: '🔄'
        };
      case 'low-stock':
        return {
          label: 'Low Stock',
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: '⚠️'
        };
      case 'trending':
        return {
          label: 'Trending',
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: '📈'
        };
      case 'budget-friendly':
        return {
          label: 'Budget Option',
          color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          icon: '💰'
        };
      case 'compatible':
        return {
          label: count ? `${count} compatible` : 'Compatible',
          color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
          icon: '✅'
        };
      default:
        return {
          label: 'Recommendation',
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: '💡'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
        border transition-all duration-200 hover:scale-105 hover:shadow-sm
        ${config.color} ${className}
        ${onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
      `}
      disabled={!onClick}
      title={`Click to view ${config.label.toLowerCase()}`}
    >
      <span className="text-xs">{config.icon}</span>
      <span>{config.label}</span>
    </button>
  );
};

export default RecommendationBadge;