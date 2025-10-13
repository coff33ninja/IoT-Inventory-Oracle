import React, { useState } from 'react';
import { TrendingComponent } from '../../types';
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  MinusIcon,
  InformationCircleIcon 
} from '../icons/AnalyticsIcons';

interface ComponentTrendsChartProps {
  data: TrendingComponent[];
  title: string;
  showDetails?: boolean;
  className?: string;
}

const ComponentTrendsChart: React.FC<ComponentTrendsChartProps> = ({ 
  data, 
  title, 
  showDetails = false,
  className = '' 
}) => {
  const [selectedTrend, setSelectedTrend] = useState<TrendingComponent | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

  const getTrendIcon = (growth: number) => {
    if (growth > 5) return TrendingUpIcon;
    if (growth < -5) return TrendingDownIcon;
    return MinusIcon;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 10) return 'text-green-600';
    if (growth > 0) return 'text-green-500';
    if (growth < -10) return 'text-red-600';
    if (growth < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getTrendBgColor = (growth: number) => {
    if (growth > 10) return 'bg-green-100 border-green-300';
    if (growth > 0) return 'bg-green-50 border-green-200';
    if (growth < -10) return 'bg-red-100 border-red-300';
    if (growth < 0) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  const sortedData = [...data].sort((a, b) => b.trendScore - a.trendScore);
  const maxTrendScore = Math.max(...data.map(item => item.trendScore));

  return (
    <div className={`bg-white p-6 rounded-lg shadow border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingUpIcon className="h-6 w-6 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('visual')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'visual' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Visual
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'list' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No trending data available</p>
        </div>
      ) : (
        <>
          {viewMode === 'visual' ? (
            /* Visual View */
            <div className="space-y-4">
              {sortedData.slice(0, 15).map((trend, index) => {
                const TrendIcon = getTrendIcon(trend.usageGrowth);
                const trendColor = getTrendColor(trend.usageGrowth);
                const bgColor = getTrendBgColor(trend.usageGrowth);
                
                return (
                  <div 
                    key={trend.componentId} 
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${bgColor} ${
                      selectedTrend?.componentId === trend.componentId ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTrend(selectedTrend?.componentId === trend.componentId ? null : trend)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600 w-6">
                          {index + 1}.
                        </span>
                        <div>
                          <h4 className="font-medium text-gray-900">{trend.componentName}</h4>
                          <p className="text-sm text-gray-600">Trend Score: {trend.trendScore.toFixed(1)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`flex items-center ${trendColor}`}>
                            <TrendIcon className="h-5 w-5 mr-1" />
                            <span className="font-semibold">
                              {trend.usageGrowth >= 0 ? '+' : ''}{trend.usageGrowth.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">growth</p>
                        </div>
                        
                        {showDetails && (
                          <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Trend Score Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Trend Strength</span>
                        <span>{trend.trendScore.toFixed(1)}/{maxTrendScore.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(trend.trendScore / maxTrendScore) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {selectedTrend?.componentId === trend.componentId && showDetails && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Trend Analysis</h5>
                            <p className="text-sm text-gray-700">{trend.reasonForTrend}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">Key Metrics</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Trend Score:</span>
                                <span className="font-medium">{trend.trendScore.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Usage Growth:</span>
                                <span className={`font-medium ${trendColor}`}>
                                  {trend.usageGrowth >= 0 ? '+' : ''}{trend.usageGrowth.toFixed(2)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {data.length > 15 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">
                    Showing top 15 of {data.length} trending components
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* List View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Component
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage Growth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedData.map((trend, index) => {
                    const TrendIcon = getTrendIcon(trend.usageGrowth);
                    const trendColor = getTrendColor(trend.usageGrowth);
                    
                    return (
                      <tr key={trend.componentId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {trend.componentName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 max-w-20 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(trend.trendScore / maxTrendScore) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">
                              {trend.trendScore.toFixed(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${trendColor}`}>
                            <TrendIcon className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">
                              {trend.usageGrowth >= 0 ? '+' : ''}{trend.usageGrowth.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {trend.reasonForTrend}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-gray-600">Strong Growth ({'>'}5%)</span>
          </div>
          <div className="flex items-center">
            <MinusIcon className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-gray-600">Stable (-5% to 5%)</span>
          </div>
          <div className="flex items-center">
            <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-gray-600">Declining ({'<'}-5%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentTrendsChart;