import React, { useState } from 'react';
import { ComponentUtilization } from '../../types';
import { ChartBarIcon, ArrowUpIcon, ArrowDownIcon } from '../icons/AnalyticsIcons';

interface UsageAnalyticsChartProps {
  data: ComponentUtilization[];
  title: string;
  className?: string;
}

type SortField = 'componentName' | 'utilizationRate' | 'totalQuantityUsed' | 'averageProjectsPerMonth' | 'lastUsed';
type SortDirection = 'asc' | 'desc';

const UsageAnalyticsChart: React.FC<UsageAnalyticsChartProps> = ({ 
  data, 
  title, 
  className = '' 
}) => {
  const [sortField, setSortField] = useState<SortField>('utilizationRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle date sorting for lastUsed
    if (sortField === 'lastUsed') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const maxUtilization = Math.max(...data.map(item => item.utilizationRate));
  const maxQuantity = Math.max(...data.map(item => item.totalQuantityUsed));

  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    if (rate >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatLastUsed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ArrowUpIcon className="h-4 w-4" /> : 
      <ArrowDownIcon className="h-4 w-4" />;
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ChartBarIcon className="h-6 w-6 text-gray-500 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('chart')}
            className={`px-3 py-1 rounded text-sm font-medium ${
              viewMode === 'chart' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Chart
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
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No usage data available</p>
        </div>
      ) : (
        <>
          {viewMode === 'chart' ? (
            /* Chart View */
            <div className="space-y-4">
              {sortedData.slice(0, 20).map((item, index) => (
                <div key={item.componentId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-600 w-6">
                        {index + 1}.
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {item.componentName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{item.utilizationRate.toFixed(1)}%</span>
                      <span>{item.totalQuantityUsed} used</span>
                      <span>{item.averageProjectsPerMonth.toFixed(1)}/mo</span>
                    </div>
                  </div>
                  
                  {/* Utilization Bar */}
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${getUtilizationColor(item.utilizationRate)}`}
                        style={{ width: `${(item.utilizationRate / maxUtilization) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-16">
                      {formatLastUsed(item.lastUsed)}
                    </span>
                  </div>
                </div>
              ))}
              
              {data.length > 20 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">
                    Showing top 20 of {data.length} components
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('componentName')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Component</span>
                        <SortIcon field="componentName" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('utilizationRate')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Utilization</span>
                        <SortIcon field="utilizationRate" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('totalQuantityUsed')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Total Used</span>
                        <SortIcon field="totalQuantityUsed" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('averageProjectsPerMonth')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Projects/Month</span>
                        <SortIcon field="averageProjectsPerMonth" />
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('lastUsed')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Last Used</span>
                        <SortIcon field="lastUsed" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedData.map((item, index) => (
                    <tr key={item.componentId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.componentName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 max-w-20 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${getUtilizationColor(item.utilizationRate)}`}
                              style={{ width: `${item.utilizationRate}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-900">
                            {item.utilizationRate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.totalQuantityUsed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.averageProjectsPerMonth.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatLastUsed(item.lastUsed)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsageAnalyticsChart;