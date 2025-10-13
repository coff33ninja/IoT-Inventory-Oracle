import React from 'react';
import { SpendingAnalysis } from '../../types';
import { BudgetFilters } from '../BudgetManagementDashboard';
import { 
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '../icons/AnalyticsIcons';

interface BudgetOverviewProps {
  spendingAnalysis: SpendingAnalysis | null;
  summary: {
    totalSpent: number;
    totalProjectCosts: number;
    averageProjectCost: number;
    budgetEfficiency: number;
    monthlyBudget: number;
    recommendationsCount: number;
  };
  filters: BudgetFilters;
  onFiltersChange: (filters: Partial<BudgetFilters>) => void;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  spendingAnalysis,
  summary,
  filters,
  onFiltersChange
}) => {
  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing': return TrendingUpIcon;
      case 'decreasing': return TrendingDownIcon;
      default: return ChartBarIcon;
    }
  };

  const getTrendColor = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing': return 'text-red-500';
      case 'decreasing': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getBudgetHealthColor = (utilization: number) => {
    if (utilization > 90) return 'text-red-600 bg-red-50';
    if (utilization > 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getBudgetHealthStatus = (utilization: number) => {
    if (utilization > 90) return 'Over Budget';
    if (utilization > 75) return 'Near Limit';
    return 'On Track';
  };

  return (
    <div className="space-y-6">
      {/* Time Filter */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Budget Overview</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Time Period:</span>
            <select
              value={filters.timeframe}
              onChange={(e) => onFiltersChange({ timeframe: e.target.value as any })}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Select time period for budget overview"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Budget Health Card */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Budget Health</h4>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getBudgetHealthColor(summary.budgetEfficiency)}`}>
            {getBudgetHealthStatus(summary.budgetEfficiency)}
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Budget Utilization Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Budget Efficiency</span>
              <span className="font-medium">{summary.budgetEfficiency.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  summary.budgetEfficiency > 90 ? 'bg-green-500' :
                  summary.budgetEfficiency > 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(summary.budgetEfficiency, 100)}%` }}
              />
            </div>
          </div>

          {/* Budget Status */}
          {spendingAnalysis && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Budget Status:</span>
              <div className="flex items-center">
                <span className={`text-sm font-medium ${
                  summary.budgetEfficiency > 75 ? 'text-green-600' : 
                  summary.budgetEfficiency > 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {summary.budgetEfficiency > 75 ? 'Excellent' : 
                   summary.budgetEfficiency > 50 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          )}

          {/* Monthly Budget */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Monthly Average:</span>
            <span className="text-sm font-medium">${summary.monthlyBudget.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Spending Breakdown */}
      {spendingAnalysis && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h4>
          <div className="space-y-3">
            {spendingAnalysis.spendingByCategory.slice(0, 5).map((category, index) => (
              <div key={`budget-overview-${category.category}`} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-4 h-4 rounded mr-3"
                    style={{ 
                      backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` 
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">{category.category}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">${category.amount.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
          
          {spendingAnalysis.spendingByCategory.length > 5 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                +{spendingAnalysis.spendingByCategory.length - 5} more categories
              </span>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Spent */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">${summary.totalSpent.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Last {filters.timeframe}</p>
            </div>
            <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Average Project Cost */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Project Cost</p>
              <p className="text-2xl font-bold text-gray-900">${summary.averageProjectCost.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Per project</p>
            </div>
            <ChartBarIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Cost Savings */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Recommendations</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.recommendationsCount}
              </p>
              <p className="text-xs text-gray-500">Available</p>
            </div>
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Budget Insights</h4>
        <div className="space-y-3">
          {spendingAnalysis ? (
            <>
              <div className="flex items-start">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  <ChartBarIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Budget Efficiency</p>
                  <p className="text-sm text-gray-600">
                    Your budget efficiency is {summary.budgetEfficiency.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="p-2 bg-green-50 rounded-lg mr-3">
                  <CurrencyDollarIcon className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Spending Pattern</p>
                  <p className="text-sm text-gray-600">
                    Budget efficiency: {spendingAnalysis.budgetEfficiency.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              {spendingAnalysis.recommendations && spendingAnalysis.recommendations.length > 0 && (
                <div className="flex items-start">
                  <div className="p-2 bg-blue-50 rounded-lg mr-3">
                    <ExclamationTriangleIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Recommendations Available</p>
                    <p className="text-sm text-gray-600">
                      {spendingAnalysis.recommendations.length} spending recommendations available
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No spending data available for the selected period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetOverview;