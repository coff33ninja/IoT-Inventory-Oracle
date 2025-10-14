import React, { useEffect, useRef } from 'react';
import { PersonalizedRecommendation } from '../../types';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { 
  XMarkIcon,
  SparklesIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '../icons/AnalyticsIcons';

interface RecommendationTooltipProps {
  recommendation: PersonalizedRecommendation;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onClose: () => void;
}

const RecommendationTooltip: React.FC<RecommendationTooltipProps> = ({
  recommendation,
  position = 'top',
  onClose
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const { formatCurrency } = useCurrencyFormat();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-50 w-80 bg-white border border-gray-200 rounded-lg shadow-lg';
    
    switch (position) {
      case 'top':
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
      case 'bottom':
        return `${baseClasses} top-full left-1/2 transform -translate-x-1/2 mt-2`;
      case 'left':
        return `${baseClasses} right-full top-1/2 transform -translate-y-1/2 mr-2`;
      case 'right':
        return `${baseClasses} left-full top-1/2 transform -translate-y-1/2 ml-2`;
      case 'top-left':
        return `${baseClasses} bottom-full right-0 mb-2`;
      case 'top-right':
        return `${baseClasses} bottom-full left-0 mb-2`;
      case 'bottom-left':
        return `${baseClasses} top-full right-0 mt-2`;
      case 'bottom-right':
        return `${baseClasses} top-full left-0 mt-2`;
      default:
        return `${baseClasses} bottom-full left-1/2 transform -translate-x-1/2 mb-2`;
    }
  };

  const getArrowClasses = () => {
    const arrowBase = 'absolute w-3 h-3 bg-white border transform rotate-45';
    
    switch (position) {
      case 'top':
        return `${arrowBase} top-full left-1/2 -translate-x-1/2 -mt-1.5 border-t-0 border-l-0`;
      case 'bottom':
        return `${arrowBase} bottom-full left-1/2 -translate-x-1/2 -mb-1.5 border-b-0 border-r-0`;
      case 'left':
        return `${arrowBase} left-full top-1/2 -translate-y-1/2 -ml-1.5 border-l-0 border-b-0`;
      case 'right':
        return `${arrowBase} right-full top-1/2 -translate-y-1/2 -mr-1.5 border-r-0 border-t-0`;
      case 'top-left':
      case 'top-right':
        return `${arrowBase} top-full right-4 -mt-1.5 border-t-0 border-l-0`;
      case 'bottom-left':
      case 'bottom-right':
        return `${arrowBase} bottom-full right-4 -mb-1.5 border-b-0 border-r-0`;
      default:
        return `${arrowBase} top-full left-1/2 -translate-x-1/2 -mt-1.5 border-t-0 border-l-0`;
    }
  };

  const getRelevanceFactors = () => {
    // Parse reasoning to extract key factors
    const reasoning = recommendation.reasoning.toLowerCase();
    const factors = [];

    if (reasoning.includes('project history') || reasoning.includes('past projects')) {
      factors.push({ icon: ChartBarIcon, text: 'Based on your project history', weight: 'high' });
    }
    if (reasoning.includes('skill level') || reasoning.includes('experience')) {
      factors.push({ icon: SparklesIcon, text: 'Matches your skill level', weight: 'medium' });
    }
    if (reasoning.includes('budget') || reasoning.includes('cost') || reasoning.includes('price')) {
      factors.push({ icon: CurrencyDollarIcon, text: 'Within your budget range', weight: 'medium' });
    }
    if (reasoning.includes('time') || reasoning.includes('duration')) {
      factors.push({ icon: ClockIcon, text: 'Fits your time preferences', weight: 'low' });
    }
    if (reasoning.includes('popular') || reasoning.includes('trending')) {
      factors.push({ icon: SparklesIcon, text: 'Currently trending', weight: 'low' });
    }

    return factors;
  };

  const relevanceFactors = getRelevanceFactors();

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWeightColor = (weight: string) => {
    switch (weight) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={getPositionClasses()} ref={tooltipRef}>
      {/* Arrow */}
      <div className={getArrowClasses()}></div>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <SparklesIcon className="h-5 w-5 text-purple-500 mr-2" />
          <h3 className="font-semibold text-gray-900">Recommendation Details</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close tooltip"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Relevance Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Relevance Score</span>
            <span className={`text-lg font-bold ${getScoreColor(recommendation.relevanceScore)}`}>
              {(recommendation.relevanceScore * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                recommendation.relevanceScore >= 0.8 ? 'bg-green-500' :
                recommendation.relevanceScore >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${recommendation.relevanceScore * 100}%` }}
            />
          </div>
        </div>

        {/* Recommendation Factors */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Why this recommendation?</h4>
          <div className="space-y-2">
            {relevanceFactors.length > 0 ? (
              relevanceFactors.map((factor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <factor.icon className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700">{factor.text}</span>
                  </div>
                  <span className={`text-xs font-medium ${getWeightColor(factor.weight)}`}>
                    {factor.weight}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">{recommendation.reasoning}</p>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
          <div>
            <span className="text-xs font-medium text-gray-500">Type</span>
            <p className="text-sm text-gray-900 capitalize">{recommendation.type}</p>
          </div>
          {recommendation.difficulty && (
            <div>
              <span className="text-xs font-medium text-gray-500">Difficulty</span>
              <p className="text-sm text-gray-900 capitalize">{recommendation.difficulty}</p>
            </div>
          )}
          {recommendation.estimatedCost && (
            <div>
              <span className="text-xs font-medium text-gray-500">Est. Cost</span>
              <p className="text-sm text-gray-900">{formatCurrency(recommendation.estimatedCost)}</p>
            </div>
          )}
          {recommendation.estimatedTime && (
            <div>
              <span className="text-xs font-medium text-gray-500">Est. Time</span>
              <p className="text-sm text-gray-900">{recommendation.estimatedTime}</p>
            </div>
          )}
        </div>

        {/* Confidence Indicator */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Confidence Level</span>
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full mr-1 ${
                    i < Math.round(recommendation.relevanceScore * 5)
                      ? 'bg-blue-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          This recommendation is based on your usage patterns and preferences
        </p>
      </div>
    </div>
  );
};

export default RecommendationTooltip;