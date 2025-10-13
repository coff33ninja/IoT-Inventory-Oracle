import React, { useState } from 'react';
import { CalendarIcon, FunnelIcon, XMarkIcon } from '../icons/AnalyticsIcons';

interface AnalyticsFilters {
  timeframe: '7d' | '30d' | '90d' | '1y';
  categories: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  showTrends: boolean;
  showPredictions: boolean;
}

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: Partial<AnalyticsFilters>) => void;
  availableCategories: string[];
  instanceId?: string;
}

const AnalyticsFilters: React.FC<AnalyticsFiltersProps> = ({
  filters,
  onFiltersChange,
  availableCategories,
  instanceId = 'default'
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const timeframeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
    { value: '1y', label: 'Last year' }
  ];

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({ categories: newCategories });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      timeframe: '30d',
      categories: [],
      dateRange: { start: null, end: null },
      showTrends: true,
      showPredictions: true
    });
  };

  const formatDate = (date: Date | null) => {
    return date ? date.toISOString().split('T')[0] : '';
  };

  const parseDate = (dateString: string) => {
    return dateString ? new Date(dateString) : null;
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <FunnelIcon className="h-5 w-5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Filters</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
          </button>
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Timeframe Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Period
          </label>
          <div className="flex flex-wrap gap-2">
            {timeframeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => onFiltersChange({ timeframe: option.value as any })}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filters.timeframe === option.value
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories ({filters.categories.length} selected)
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableCategories.map(category => (
              <button
                key={`filter-category-${instanceId}-${category}`}
                onClick={() => handleCategoryToggle(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filters.categories.includes(category)
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          {availableCategories.length === 0 && (
            <p className="text-sm text-gray-500 italic">No categories available</p>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            {/* Custom Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Custom Date Range
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formatDate(filters.dateRange.start)}
                    onChange={(e) => onFiltersChange({
                      dateRange: {
                        ...filters.dateRange,
                        start: parseDate(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Start date"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formatDate(filters.dateRange.end)}
                    onChange={(e) => onFiltersChange({
                      dateRange: {
                        ...filters.dateRange,
                        end: parseDate(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="End date"
                  />
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Options
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showTrends}
                    onChange={(e) => onFiltersChange({ showTrends: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show trend indicators</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showPredictions}
                    onChange={(e) => onFiltersChange({ showPredictions: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show predictions</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {(filters.categories.length > 0 || filters.dateRange.start || filters.dateRange.end) && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              <span className="text-xs text-gray-500">
                {filters.categories.length + (filters.dateRange.start ? 1 : 0) + (filters.dateRange.end ? 1 : 0)} active
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.categories.map(category => (
                <span
                  key={`active-filter-${instanceId}-${category}`}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {category}
                  <button
                    onClick={() => handleCategoryToggle(category)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                    aria-label={`Remove ${category} filter`}
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {filters.dateRange.start && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  From: {filters.dateRange.start.toLocaleDateString()}
                  <button
                    onClick={() => onFiltersChange({
                      dateRange: { ...filters.dateRange, start: null }
                    })}
                    className="ml-1 text-green-600 hover:text-green-800"
                    aria-label="Remove start date filter"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.dateRange.end && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  To: {filters.dateRange.end.toLocaleDateString()}
                  <button
                    onClick={() => onFiltersChange({
                      dateRange: { ...filters.dateRange, end: null }
                    })}
                    className="ml-1 text-green-600 hover:text-green-800"
                    aria-label="Remove end date filter"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsFilters;