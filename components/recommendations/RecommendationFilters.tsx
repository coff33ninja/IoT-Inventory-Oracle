import React, { useState } from 'react';
import { RecommendationFilters } from '../PersonalizedRecommendations';
import { 
  FunnelIcon, 
  XMarkIcon, 
  AdjustmentsHorizontalIcon,
  CubeIcon,
  SparklesIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '../icons/AnalyticsIcons';

interface RecommendationFiltersProps {
  filters: RecommendationFilters;
  onFiltersChange: (filters: RecommendationFilters) => void;
  totalRecommendations: number;
  filteredCount: number;
}

const RecommendationFiltersComponent: React.FC<RecommendationFiltersProps> = ({
  filters,
  onFiltersChange,
  totalRecommendations,
  filteredCount
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof RecommendationFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const handlePriceRangeChange = (field: 'min' | 'max', value: number) => {
    onFiltersChange({
      ...filters,
      priceRange: {
        ...filters.priceRange,
        [field]: value
      }
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      type: 'all',
      difficulty: 'all',
      priceRange: { min: 0, max: 1000 },
      timeRange: 'all',
      relevanceThreshold: 0.5
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.type !== 'all' ||
      filters.difficulty !== 'all' ||
      filters.priceRange.min > 0 ||
      filters.priceRange.max < 1000 ||
      filters.timeRange !== 'all' ||
      filters.relevanceThreshold > 0.5
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.type !== 'all') count++;
    if (filters.difficulty !== 'all') count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) count++;
    if (filters.timeRange !== 'all') count++;
    if (filters.relevanceThreshold > 0.5) count++;
    return count;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
          {hasActiveFilters() && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
              {getActiveFilterCount()} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {filteredCount} of {totalRecommendations} recommendations
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
            {isExpanded ? 'Hide' : 'Show'} Filters
          </button>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters (Always Visible) */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Type Filter */}
        <div className="flex items-center space-x-2">
          <CubeIcon className="h-4 w-4 text-gray-500" />
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by recommendation type"
          >
            <option value="all">All Types</option>
            <option value="component">Components</option>
            <option value="project">Projects</option>
            <option value="bundle">Bundles</option>
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="flex items-center space-x-2">
          <SparklesIcon className="h-4 w-4 text-gray-500" />
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by difficulty level"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Relevance Threshold */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Min Relevance:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={filters.relevanceThreshold}
            onChange={(e) => handleFilterChange('relevanceThreshold', parseFloat(e.target.value))}
            className="w-20"
            aria-label="Minimum relevance threshold"
          />
          <span className="text-sm font-medium text-gray-900 w-8">
            {(filters.relevanceThreshold * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-6 pt-4 border-t border-gray-200">
          {/* Price Range */}
          <div>
            <div className="flex items-center mb-3">
              <CurrencyDollarIcon className="h-4 w-4 text-gray-500 mr-2" />
              <label className="text-sm font-medium text-gray-700">Price Range</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Minimum ($)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Maximum ($)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', parseInt(e.target.value) || 1000)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1000"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>${filters.priceRange.min}</span>
              <span>${filters.priceRange.max}</span>
            </div>
          </div>

          {/* Time Range */}
          <div>
            <div className="flex items-center mb-3">
              <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
              <label className="text-sm font-medium text-gray-700">Time Commitment</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              {[
                { value: 'all', label: 'Any Duration' },
                { value: 'quick', label: 'Quick (< 1 day)' },
                { value: 'medium', label: 'Medium (1-7 days)' },
                { value: 'long', label: 'Long (> 1 week)' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange('timeRange', option.value)}
                  className={`px-3 py-2 text-sm rounded border transition-colors ${
                    filters.timeRange === option.value
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Advanced Options</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Relevance Threshold: {(filters.relevanceThreshold * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={filters.relevanceThreshold}
                  onChange={(e) => handleFilterChange('relevanceThreshold', parseFloat(e.target.value))}
                  className="w-full"
                  aria-label="Detailed relevance threshold slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0% (Show All)</span>
                  <span>50% (Balanced)</span>
                  <span>100% (Only Best)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            <span className="text-xs text-gray-500">{getActiveFilterCount()} active</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.type !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Type: {filters.type}
                <button
                  onClick={() => handleFilterChange('type', 'all')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  aria-label="Remove type filter"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.difficulty !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Difficulty: {filters.difficulty}
                <button
                  onClick={() => handleFilterChange('difficulty', 'all')}
                  className="ml-1 text-green-600 hover:text-green-800"
                  aria-label="Remove difficulty filter"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {(filters.priceRange.min > 0 || filters.priceRange.max < 1000) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Price: ${filters.priceRange.min}-${filters.priceRange.max}
                <button
                  onClick={() => {
                    handlePriceRangeChange('min', 0);
                    handlePriceRangeChange('max', 1000);
                  }}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                  aria-label="Remove price range filter"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.timeRange !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Time: {filters.timeRange}
                <button
                  onClick={() => handleFilterChange('timeRange', 'all')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                  aria-label="Remove time range filter"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.relevanceThreshold > 0.5 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Min Relevance: {(filters.relevanceThreshold * 100).toFixed(0)}%
                <button
                  onClick={() => handleFilterChange('relevanceThreshold', 0.5)}
                  className="ml-1 text-red-600 hover:text-red-800"
                  aria-label="Remove relevance threshold filter"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationFiltersComponent;