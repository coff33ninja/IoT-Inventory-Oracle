import React, { useState, useEffect } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { UsageAnalytics, ComponentUtilization, CategoryUsage, TrendingComponent } from '../types';
import UsageAnalyticsChart from './analytics/UsageAnalyticsChart';
import ComponentTrendsChart from './analytics/ComponentTrendsChart';
import CategoryBreakdownChart from './analytics/CategoryBreakdownChart';
import StockPredictionChart from './analytics/StockPredictionChart';
import AnalyticsFilters from './analytics/AnalyticsFilters';
import AnalyticsMetrics from './analytics/AnalyticsMetrics';
import { ChartBarIcon, TrendingUpIcon, CubeIcon, ExclamationTriangleIcon } from './icons/AnalyticsIcons';

interface AnalyticsDashboardProps {
  className?: string;
}

export interface DashboardFilters {
  timeframe: '7d' | '30d' | '90d' | '1y';
  categories: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  showTrends: boolean;
  showPredictions: boolean;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className = '' }) => {
  const { 
    usageAnalytics, 
    getUsagePatterns, 
    getSpendingInsights,
    spendingAnalysis,
    inventory 
  } = useInventory();

  const [filters, setFilters] = useState<DashboardFilters>({
    timeframe: '30d',
    categories: [],
    dateRange: { start: null, end: null },
    showTrends: true,
    showPredictions: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'trends' | 'predictions'>('overview');

  // Load analytics data when filters change
  useEffect(() => {
    loadAnalyticsData();
  }, [filters.timeframe]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        getUsagePatterns(filters.timeframe),
        getSpendingInsights(filters.timeframe)
      ]);
    } catch (err) {
      setError('Failed to load analytics data. Please try again.');
      console.error('Analytics loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const getFilteredData = () => {
    if (!usageAnalytics) return null;

    let filteredData = { ...usageAnalytics };

    // Filter by categories if specified
    if (filters.categories.length > 0) {
      filteredData.componentUtilization = filteredData.componentUtilization.filter(
        comp => filters.categories.some(cat => 
          inventory.find(item => item.id === comp.componentId)?.category === cat
        )
      );
      
      filteredData.categoryBreakdown = filteredData.categoryBreakdown.filter(
        cat => filters.categories.includes(cat.category)
      );
    }

    return filteredData;
  };

  const renderTabContent = () => {
    const filteredData = getFilteredData();
    
    if (!filteredData) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No analytics data available</p>
            <button 
              onClick={loadAnalyticsData}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Load Data
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <AnalyticsMetrics 
              analytics={filteredData} 
              spendingAnalysis={spendingAnalysis}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryBreakdownChart 
                data={filteredData.categoryBreakdown}
                title="Category Usage Distribution"
              />
              <ComponentTrendsChart 
                data={filteredData.trendingComponents}
                title="Trending Components"
              />
            </div>
          </div>
        );
        
      case 'usage':
        return (
          <div className="space-y-6">
            <UsageAnalyticsChart 
              data={filteredData.componentUtilization}
              title="Component Usage Analytics"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Top Used Components</h3>
                <div className="space-y-3">
                  {filteredData.componentUtilization
                    .sort((a, b) => b.utilizationRate - a.utilizationRate)
                    .slice(0, 10)
                    .map((comp, index) => (
                      <div key={comp.componentId} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-600 w-6">
                            {index + 1}.
                          </span>
                          <span className="text-sm font-medium">{comp.componentName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${comp.utilizationRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">
                            {comp.utilizationRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Usage Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Projects:</span>
                    <span className="font-semibold">{filteredData.totalProjects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Components:</span>
                    <span className="font-semibold">{filteredData.componentUtilization.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categories:</span>
                    <span className="font-semibold">{filteredData.categoryBreakdown.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trending Components:</span>
                    <span className="font-semibold">{filteredData.trendingComponents.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'trends':
        return (
          <div className="space-y-6">
            <ComponentTrendsChart 
              data={filteredData.trendingComponents}
              title="Component Trends Analysis"
              showDetails={true}
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredData.trendingComponents.slice(0, 3).map((trend, index) => (
                <div key={trend.componentId} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{trend.componentName}</h3>
                    <TrendingUpIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trend Score:</span>
                      <span className="font-semibold">{trend.trendScore.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Usage Growth:</span>
                      <span className={`font-semibold ${trend.usageGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.usageGrowth >= 0 ? '+' : ''}{trend.usageGrowth.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">{trend.reasonForTrend}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        
      case 'predictions':
        return (
          <div className="space-y-6">
            <StockPredictionChart 
              inventory={inventory}
              title="Stock Predictions & Alerts"
            />
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                Waste Analysis
              </h3>
              {filteredData.wasteAnalysis && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {filteredData.wasteAnalysis.unusedComponents}
                      </div>
                      <div className="text-sm text-red-600">Unused Components</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        ${filteredData.wasteAnalysis.totalWasteValue.toFixed(2)}
                      </div>
                      <div className="text-sm text-yellow-600">Total Waste Value</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {filteredData.wasteAnalysis.suggestions.length}
                      </div>
                      <div className="text-sm text-blue-600">Optimization Tips</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Optimization Suggestions:</h4>
                    <ul className="space-y-2">
                      {filteredData.wasteAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-sm text-gray-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`analytics-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Component usage patterns and insights</p>
          </div>
          <button
            onClick={loadAnalyticsData}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            ) : (
              'Refresh Data'
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <AnalyticsFilters 
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableCategories={[...new Set(inventory.map(item => item.category).filter(Boolean))] as string[]}
          instanceId="analytics-dashboard"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'usage', label: 'Usage Analytics', icon: CubeIcon },
            { id: 'trends', label: 'Trends', icon: TrendingUpIcon },
            { id: 'predictions', label: 'Predictions', icon: ExclamationTriangleIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-96">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        ) : (
          renderTabContent()
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;