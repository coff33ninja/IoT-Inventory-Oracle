import React, { useState } from 'react';
import { PersonalizedRecommendation } from '../../types';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import RecommendationTooltip from './RecommendationTooltip';
import { 
  CubeIcon,
  SparklesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  InformationCircleIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftIcon
} from '../icons/AnalyticsIcons';

interface RecommendationCardProps {
  recommendation: PersonalizedRecommendation;
  onAction: (recommendation: PersonalizedRecommendation, action: 'accept' | 'dismiss' | 'feedback') => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAction
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { formatCurrency } = useCurrencyFormat();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'component': return CubeIcon;
      case 'project': return SparklesIcon;
      case 'bundle': return CubeIcon;
      default: return CubeIcon;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'component': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'project': return 'bg-green-100 text-green-800 border-green-200';
      case 'bundle': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600';
      case 'intermediate': return 'text-yellow-600';
      case 'advanced': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Time not specified';
    return timeString;
  };

  const formatCost = (cost?: number) => {
    if (!cost) return 'Cost not specified';
    return formatCurrency(cost);
  };

  const TypeIcon = getTypeIcon(recommendation.type);

  return (
    <div className="bg-white rounded-lg shadow border hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-gray-50">
              <TypeIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {recommendation.title}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(recommendation.type)}`}>
                  {recommendation.type}
                </span>
                {recommendation.difficulty && (
                  <span className={`text-xs font-medium ${getDifficultyColor(recommendation.difficulty)}`}>
                    {recommendation.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Relevance Score */}
          <div className="relative">
            <div 
              className={`px-2 py-1 rounded-full text-xs font-bold ${getRelevanceColor(recommendation.relevanceScore)}`}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {(recommendation.relevanceScore * 100).toFixed(0)}%
            </div>
            {showTooltip && (
              <RecommendationTooltip
                recommendation={recommendation}
                position="top-right"
                onClose={() => setShowTooltip(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Description */}
        <p className={`text-sm text-gray-600 mb-4 ${isExpanded ? '' : 'line-clamp-3'}`}>
          {recommendation.description}
        </p>
        
        {!isExpanded && recommendation.description.length > 150 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-4"
          >
            Read more...
          </button>
        )}

        {isExpanded && recommendation.description.length > 150 && (
          <button
            onClick={() => setIsExpanded(false)}
            className="text-sm text-blue-600 hover:text-blue-800 mb-4"
          >
            Show less
          </button>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {recommendation.estimatedCost && (
            <div className="flex items-center text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4 mr-1" />
              <span>{formatCost(recommendation.estimatedCost)}</span>
            </div>
          )}
          
          {recommendation.estimatedTime && (
            <div className="flex items-center text-sm text-gray-600">
              <ClockIcon className="h-4 w-4 mr-1" />
              <span>{formatTime(recommendation.estimatedTime)}</span>
            </div>
          )}
        </div>

        {/* Reasoning */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start">
            <InformationCircleIcon className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">Why this recommendation?</p>
              <p className="text-xs text-gray-600">{recommendation.reasoning}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onAction(recommendation, 'accept')}
              className="flex items-center px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
            >
              <HandThumbUpIcon className="h-4 w-4 mr-1" />
              Accept
            </button>
            
            <button
              onClick={() => onAction(recommendation, 'dismiss')}
              className="flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
            >
              <HandThumbDownIcon className="h-4 w-4 mr-1" />
              Dismiss
            </button>
          </div>
          
          <button
            onClick={() => onAction(recommendation, 'feedback')}
            className="flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200 transition-colors"
          >
            <ChatBubbleLeftIcon className="h-4 w-4 mr-1" />
            Feedback
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="mt-4 space-y-3">
            {/* Additional metadata if available */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Recommendation ID:</span>
                <span className="text-gray-600 ml-2">{recommendation.itemId}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Relevance Score:</span>
                <span className="text-gray-600 ml-2">{(recommendation.relevanceScore * 100).toFixed(1)}%</span>
              </div>
            </div>
            
            {/* Detailed reasoning */}
            <div>
              <span className="font-medium text-gray-700 text-sm">Detailed Analysis:</span>
              <p className="text-sm text-gray-600 mt-1">{recommendation.reasoning}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationCard;