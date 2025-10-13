import React, { useState } from 'react';
import { CategoryUsage } from '../../types';
import { 
  ChartPieIcon, 
  TrendingUpIcon, 
  TrendingDownIcon, 
  MinusIcon 
} from '../icons/AnalyticsIcons';

interface CategoryBreakdownChartProps {
  data: CategoryUsage[];
  title: string;
  className?: string;
}

const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({ 
  data, 
  title, 
  className = '' 
}) => {
  const [viewMode, setViewMode] = useState<'pie' | 'bar' | 'table'>('pie');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const totalQuantity = data.reduce((sum, item) => sum + item.totalQuantityUsed, 0);
  const totalValue = data.reduce((sum, item) => sum + (item.totalQuantityUsed * item.averagePrice), 0);

  const getPercentage = (quantity: number) => {
    return totalQuantity > 0 ? (quantity / totalQuantity) * 100 : 0;
  };

  const getColor = (index: number) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-purple-500', 'bg-indigo-500', 'bg-pink-500', 'bg-gray-500',
      'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-red-400'
    ];
    return colors[index % colors.length];
  };

  const getTextColor = (index: number) => {
    const colors = [
      'text-blue-600', 'text-green-600', 'text-yellow-600', 'text-red-600', 
      'text-purple-600', 'text-indigo-600', 'text-pink-600', 'text-gray-600',
      'text-blue-500', 'text-green-500', 'text-yellow-500', 'text-red-500'
    ];
    return colors[index % colors.length];
  };

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing': return TrendingUpIcon;
      case 'decreasing': return TrendingDownIcon;
      default: return MinusIcon;
    }
  };

  const getTrendColor = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing': return 'text-green-500';
      case 'decreasing': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const sortedData = [...data].sort((a, b) => b.totalQuantityUsed - a.totalQuantityUsed);
  const maxQuantity = Math.max(...data.map(item => item.totalQuantityUsed));

  // Simple pie chart calculation (for visual representation)
  const createPieSegments = () => {
    let cumulativePercentage = 0;
    return sortedData.slice(0, 8).map((item, index) => {
      const percentage = getPercentage(item.totalQuantityUsed);
      const startAngle = cumulativePercentage * 3.6; // Convert to degrees
      const endAngle = (cumulativePercentage + percentage) * 3.6;
      cumulativePercentage += percentage;
      
      return {
        ...item,
        percentage,
        startAngle,
        endAngle,
        color: getColor(index)
      };
    });
  };

  const pieSegments = createPieSegments();

  return (
    <div className={`bg-white p-6 rounded-lg shadow border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ChartPieIcon className="h-6 w-6 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('pie')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'pie' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Pie
          </button>
          <button
            onClick={() => setViewMode('bar')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'bar' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'table' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <ChartPieIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No category data available</p>
        </div>
      ) : (
        <>
          {viewMode === 'pie' ? (
            /* Pie Chart View */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Simple Pie Visualization */}
              <div className="flex items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Background circle */}
                  <div className="w-full h-full rounded-full bg-gray-200"></div>
                  
                  {/* Pie segments (simplified representation) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-1 w-48 h-48">
                      {pieSegments.slice(0, 4).map((segment, index) => (
                        <div
                          key={`chart-segment-${segment.category}`}
                          className={`${segment.color} rounded-sm flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                          style={{ 
                            height: `${Math.max(20, segment.percentage * 2)}px`,
                            opacity: selectedCategory === segment.category ? 1 : 0.8
                          }}
                          onClick={() => setSelectedCategory(
                            selectedCategory === segment.category ? null : segment.category
                          )}
                          title={`${segment.category}: ${segment.percentage.toFixed(1)}%`}
                        >
                          <span className="text-white text-xs font-medium">
                            {segment.percentage.toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{data.length}</div>
                        <div className="text-xs text-gray-500">Categories</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Categories</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sortedData.map((item, index) => {
                    const TrendIcon = getTrendIcon(item.popularityTrend);
                    const trendColor = getTrendColor(item.popularityTrend);
                    const percentage = getPercentage(item.totalQuantityUsed);
                    
                    return (
                      <div 
                        key={`chart-item-${item.category}`}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          selectedCategory === item.category ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedCategory(
                          selectedCategory === item.category ? null : item.category
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${getColor(index)}`}></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.category}</div>
                            <div className="text-xs text-gray-500">
                              {item.totalComponents} components • ${item.averagePrice.toFixed(2)} avg
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                          <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : viewMode === 'bar' ? (
            /* Bar Chart View */
            <div className="space-y-4">
              {sortedData.map((item, index) => {
                const TrendIcon = getTrendIcon(item.popularityTrend);
                const trendColor = getTrendColor(item.popularityTrend);
                const percentage = getPercentage(item.totalQuantityUsed);
                const barWidth = (item.totalQuantityUsed / maxQuantity) * 100;
                
                return (
                  <div key={`chart-detail-${item.category}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-600 w-6">
                          {index + 1}.
                        </span>
                        <div>
                          <span className="text-sm font-medium text-gray-900">{item.category}</span>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{item.totalComponents} components</span>
                            <span>•</span>
                            <span>${item.averagePrice.toFixed(2)} avg</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                          <span className={trendColor}>{item.popularityTrend}</span>
                        </div>
                        <span className="font-medium">{item.totalQuantityUsed}</span>
                        <span className="text-gray-500">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${getColor(index)} transition-all duration-300`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-16">
                        ${(item.totalQuantityUsed * item.averagePrice).toFixed(0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Components
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedData.map((item, index) => {
                    const TrendIcon = getTrendIcon(item.popularityTrend);
                    const trendColor = getTrendColor(item.popularityTrend);
                    const percentage = getPercentage(item.totalQuantityUsed);
                    const totalValue = item.totalQuantityUsed * item.averagePrice;
                    
                    return (
                      <tr key={`chart-table-${item.category}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded ${getColor(index)} mr-3`}></div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.category}</div>
                              <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of total</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.totalComponents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.totalQuantityUsed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${item.averagePrice.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${totalValue.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`flex items-center ${trendColor}`}>
                            <TrendIcon className="h-4 w-4 mr-1" />
                            <span className="text-sm capitalize">{item.popularityTrend}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{data.length}</div>
                <div className="text-sm text-gray-500">Categories</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{totalQuantity}</div>
                <div className="text-sm text-gray-500">Total Components</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">${totalValue.toFixed(0)}</div>
                <div className="text-sm text-gray-500">Total Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${data.length > 0 ? (totalValue / totalQuantity).toFixed(2) : '0.00'}
                </div>
                <div className="text-sm text-gray-500">Avg Component Price</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryBreakdownChart;