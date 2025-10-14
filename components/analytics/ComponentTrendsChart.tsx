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
    if (growth > 10) return 'text-green-400';
    if (growth > 0) return 'text-green-500';
    if (growth < -10) return 'text-red-400';
    if (growth < 0) return 'text-red-500';
    return 'text-text-secondary';
  };

  const getTrendBgColor = (growth: number) => {
    if (growth > 10) return 'bg-green-100 border-green-300';
    if (growth > 0) return 'bg-green-500/10 border-green-500/20';
    if (growth < -10) return 'bg-red-500/20 border-red-500/30';
    if (growth < 0) return 'bg-red-500/10 border-red-500/20';
    return 'bg-secondary border-border-color';
  };

  const sortedData = [...data].sort((a, b) => b.trendScore - a.trendScore);
  const maxTrendScore = Math.max(...data.map(item => item.trendScore));

  return (
    <div className={`bg-secondary p-6 rounded-lg shadow border border-border-color ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <TrendingUpIcon className="h-6 w-6 text-text-secondary mr-2" />
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('visual')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'visual' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                : 'bg-primary text-text-primary border border-border-color hover:bg-secondary'
            }`}
          >
            Visual
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'list' 
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                : 'bg-primary text-text-primary border border-border-color hover:bg-secondary'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUpIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary">No trending data available</p>
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
                        <span className="text-sm font-medium text-text-secondary w-6">
                          {index + 1}.
                        </span>
                        <div>
                          <h4 className="font-medium text-text-primary">{trend.componentName}</h4>
                          <p className="text-sm text-text-secondary">Trend Score: {trend.trendScore.toFixed(1)}</p>
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
                          <p className="text-xs text-text-secondary">growth</p>
                        </div>
                        
                        {showDetails && (
                          <InformationCircleIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Trend Score Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                        <span>Trend Strength</span>
                        <span>{trend.trendScore.toFixed(1)}/{maxTrendScore.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-primary border border-border-color rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(trend.trendScore / maxTrendScore) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {selectedTrend?.componentId === trend.componentId && showDetails && (
                      <div className="mt-4 pt-4 border-t border-border-color">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-text-primary mb-2">Trend Analysis</h5>
                            <p className="text-sm text-text-secondary">{trend.reasonForTrend}</p>
                          </div>
                          <div>
                            <h5 className="font-medium text-text-primary mb-2">Key Metrics</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-text-secondary">Trend Score:</span>
                                <span className="font-medium text-text-primary">{trend.trendScore.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-text-secondary">Usage Growth:</span>
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
                  <p className="text-sm text-text-secondary">
                    Showing top 15 of {data.length} trending components
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* List View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-color">
                <thead className="bg-secondary border-b border-border-color">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Component
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Trend Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Usage Growth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-secondary divide-y divide-border-color">
                  {sortedData.map((trend, index) => {
                    const TrendIcon = getTrendIcon(trend.usageGrowth);
                    const trendColor = getTrendColor(trend.usageGrowth);
                    
                    return (
                      <tr key={trend.componentId} className={index % 2 === 0 ? 'bg-secondary' : 'bg-primary'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">
                          #{index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-text-primary">
                            {trend.componentName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 max-w-20 bg-primary border border-border-color rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(trend.trendScore / maxTrendScore) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-text-primary">
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
                        <td className="px-6 py-4 text-sm text-text-secondary max-w-xs truncate">
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
      <div className="mt-6 pt-4 border-t border-border-color">
        <h4 className="text-sm font-medium text-text-primary mb-2">Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <TrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-text-secondary">Strong Growth ({'>'}5%)</span>
          </div>
          <div className="flex items-center">
            <MinusIcon className="h-4 w-4 text-text-secondary mr-1" />
            <span className="text-text-secondary">Stable (-5% to 5%)</span>
          </div>
          <div className="flex items-center">
            <TrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
            <span className="text-text-secondary">Declining ({'<'}-5%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentTrendsChart;