import React, { useState } from 'react';
import { CategoryUsage } from '../../types';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
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
  const { formatCurrency } = useCurrencyFormat();
  const [viewMode, setViewMode] = useState<'pie' | 'bar' | 'table'>('pie');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const totalQuantity = data.reduce((sum, item) => sum + item.totalQuantityUsed, 0);
  const totalValue = data.reduce((sum, item) => sum + (item.totalQuantityUsed * item.averagePrice), 0);

  const getPercentage = (quantity: number) => {
    return totalQuantity > 0 ? (quantity / totalQuantity) * 100 : 0;
  };

  const getColor = (index: number) => {
    const colors = [
      'bg-emerald-500', 'bg-green-500', 'bg-teal-500', 'bg-cyan-500', 
      'bg-blue-500', 'bg-indigo-500', 'bg-green-600', 'bg-emerald-600',
      'bg-emerald-400', 'bg-green-400', 'bg-teal-400', 'bg-cyan-400'
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
      case 'increasing': return 'text-emerald-500';
      case 'decreasing': return 'text-red-500';
      default: return 'text-slate-500';
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
    <div className={`bg-secondary p-6 rounded-lg shadow border border-border-color ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ChartPieIcon className="h-6 w-6 text-accent mr-2" />
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setViewMode('pie')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'pie' 
                ? 'bg-accent text-white' 
                : 'bg-primary text-text-secondary hover:text-text-primary'
            }`}
          >
            Pie
          </button>
          <button
            type="button"
            onClick={() => setViewMode('bar')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'bar' 
                ? 'bg-accent text-white' 
                : 'bg-primary text-text-secondary hover:text-text-primary'
            }`}
          >
            Bar
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'table' 
                ? 'bg-accent text-white' 
                : 'bg-primary text-text-secondary hover:text-text-primary'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-12">
          <ChartPieIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary">No category data available</p>
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
                  <div className="w-full h-full rounded-full bg-primary"></div>
                  
                  {/* Pie segments (simplified representation) */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-1 w-48 h-48">
                      {pieSegments.slice(0, 4).map((segment, index) => (
                        <div
                          key={`chart-segment-${segment.category}`}
                          className={`${segment.color} rounded flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${
                            selectedCategory === segment.category ? 'ring-2 ring-green-400' : ''
                          }`}
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
                    <div className="bg-secondary rounded-full w-20 h-20 flex items-center justify-center shadow border border-border-color">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{data.length}</div>
                        <div className="text-xs text-text-secondary">Categories</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="space-y-3">
                <h4 className="font-medium text-text-primary flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Categories
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sortedData.map((item, index) => {
                    const TrendIcon = getTrendIcon(item.popularityTrend);
                    const trendColor = getTrendColor(item.popularityTrend);
                    const percentage = getPercentage(item.totalQuantityUsed);
                    
                    return (
                      <div 
                        key={`chart-item-${item.category}`}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                          selectedCategory === item.category 
                            ? 'bg-green-500/10 border border-green-500/20' 
                            : 'hover:bg-primary'
                        }`}
                        onClick={() => setSelectedCategory(
                          selectedCategory === item.category ? null : item.category
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${getColor(index)}`}></div>
                          <div>
                            <div className="text-sm font-medium text-text-primary">{item.category}</div>
                            <div className="text-xs text-text-secondary">
                              {item.totalComponents} components • {formatCurrency(item.averagePrice)} avg
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
                        <span className="text-sm font-medium text-text-secondary w-6">
                          {index + 1}.
                        </span>
                        <div>
                          <span className="text-sm font-medium text-text-primary">{item.category}</span>
                          <div className="flex items-center space-x-2 text-xs text-text-secondary">
                            <span>{item.totalComponents} components</span>
                            <span>•</span>
                            <span>{formatCurrency(item.averagePrice)} avg</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                          <span className={trendColor}>{item.popularityTrend}</span>
                        </div>
                        <span className="font-medium">{item.totalQuantityUsed}</span>
                        <span className="text-text-secondary">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-primary rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${getColor(index)} transition-all duration-300`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary w-16">
                        {formatCurrency(item.totalQuantityUsed * item.averagePrice)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border-color">
                <thead className="bg-primary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Components
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Total Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Avg Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Total Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Trend
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-secondary divide-y divide-border-color">
                  {sortedData.map((item, index) => {
                    const TrendIcon = getTrendIcon(item.popularityTrend);
                    const trendColor = getTrendColor(item.popularityTrend);
                    const percentage = getPercentage(item.totalQuantityUsed);
                    const totalValue = item.totalQuantityUsed * item.averagePrice;
                    
                    return (
                      <tr key={`chart-table-${item.category}`} className={index % 2 === 0 ? 'bg-secondary' : 'bg-primary'}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded ${getColor(index)} mr-3`}></div>
                            <div>
                              <div className="text-sm font-medium text-text-primary">{item.category}</div>
                              <div className="text-xs text-text-secondary">{percentage.toFixed(1)}% of total</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {item.totalComponents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {item.totalQuantityUsed}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {formatCurrency(item.averagePrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                          {formatCurrency(totalValue)}
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
          <div className="mt-6 pt-4 border-t border-border-color">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="text-2xl font-bold text-green-400">{data.length}</div>
                <div className="text-sm text-text-secondary">Categories</div>
              </div>
              <div className="p-3 bg-primary rounded-lg border border-border-color">
                <div className="text-2xl font-bold text-text-primary">{totalQuantity}</div>
                <div className="text-sm text-text-secondary">Total Components</div>
              </div>
              <div className="p-3 bg-primary rounded-lg border border-border-color">
                <div className="text-2xl font-bold text-text-primary">{formatCurrency(totalValue)}</div>
                <div className="text-sm text-text-secondary">Total Value</div>
              </div>
              <div className="p-3 bg-primary rounded-lg border border-border-color">
                <div className="text-2xl font-bold text-text-primary">
                  {data.length > 0 ? formatCurrency(totalValue / totalQuantity) : formatCurrency(0)}
                </div>
                <div className="text-sm text-text-secondary">Avg Component Price</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryBreakdownChart;