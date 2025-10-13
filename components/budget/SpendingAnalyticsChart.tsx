import React, { useState } from 'react';
import { SpendingAnalysis, Project, InventoryItem } from '../../types';
import { BudgetFilters } from '../BudgetManagementDashboard';
import { 
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '../icons/AnalyticsIcons';

interface SpendingAnalyticsChartProps {
  spendingAnalysis: SpendingAnalysis | null;
  projects: Project[];
  inventory: InventoryItem[];
  filters: BudgetFilters;
  onFiltersChange: (filters: Partial<BudgetFilters>) => void;
}

const SpendingAnalyticsChart: React.FC<SpendingAnalyticsChartProps> = ({
  spendingAnalysis,
  projects,
  inventory,
  filters,
  onFiltersChange
}) => {
  const [chartType, setChartType] = useState<'category' | 'timeline' | 'projects'>('category');
  const [sortBy, setSortBy] = useState<'amount' | 'percentage' | 'name'>('amount');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const generateTimelineData = () => {
    // Generate mock timeline data based on projects
    const timelineData = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Calculate spending for this date based on project creation dates
      const daySpending = projects
        .filter(project => {
          const projectDate = new Date(project.createdAt);
          return projectDate.toDateString() === date.toDateString();
        })
        .reduce((sum, project) => {
          const projectCost = project.components.reduce((total, component) => {
            const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
            const price = inventoryItem?.purchasePrice || Math.random() * 50; // Fallback random price
            return total + (price * component.quantity);
          }, 0);
          return sum + projectCost;
        }, 0);
      
      timelineData.push({
        date: date.toISOString().split('T')[0],
        amount: daySpending,
        projects: projects.filter(p => new Date(p.createdAt).toDateString() === date.toDateString()).length
      });
    }
    
    return timelineData;
  };

  const generateProjectSpendingData = () => {
    return projects.map(project => {
      const projectCost = project.components.reduce((sum, component) => {
        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        const price = inventoryItem?.purchasePrice || Math.random() * 50; // Fallback random price
        return sum + (price * component.quantity);
      }, 0);
      
      return {
        id: project.id,
        name: project.name,
        cost: projectCost,
        components: project.components.length,
        status: project.status,
        createdAt: project.createdAt
      };
    }).sort((a, b) => {
      if (sortBy === 'amount') return sortDirection === 'desc' ? b.cost - a.cost : a.cost - b.cost;
      if (sortBy === 'name') return sortDirection === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
      return 0;
    });
  };

  const handleSort = (field: 'amount' | 'percentage' | 'name') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const timelineData = generateTimelineData();
  const projectSpendingData = generateProjectSpendingData();
  const maxTimelineAmount = Math.max(...timelineData.map(d => d.amount));
  const maxCategoryAmount = spendingAnalysis ? Math.max(...spendingAnalysis.spendingByCategory.map(c => c.amount)) : 0;

  const SortIcon = ({ field }: { field: 'amount' | 'percentage' | 'name' }) => {
    if (sortBy !== field) return null;
    return sortDirection === 'asc' ? 
      <ArrowUpIcon className="h-4 w-4" /> : 
      <ArrowDownIcon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">Spending Analytics</h3>
            <div className="flex items-center space-x-2">
              {[
                { id: 'category', label: 'By Category' },
                { id: 'timeline', label: 'Timeline' },
                { id: 'projects', label: 'By Project' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => setChartType(type.id as any)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    chartType === type.id
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-500" />
            <select
              value={filters.timeframe}
              onChange={(e) => onFiltersChange({ timeframe: e.target.value as any })}
              className="text-sm border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Select time period for spending analytics"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div className="bg-white p-6 rounded-lg shadow border">
        {chartType === 'category' && spendingAnalysis ? (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Spending by Category</h4>
            <div className="space-y-4">
              {spendingAnalysis.spendingByCategory.map((category, index) => (
                <div key={`budget-spending-${category.category}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-3"
                        style={{ backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` }}
                      />
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="font-semibold">${category.amount.toFixed(2)}</span>
                      <span className="text-gray-500">{category.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(category.amount / maxCategoryAmount) * 100}%`,
                        backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : chartType === 'timeline' ? (
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6">Spending Timeline (Last 30 Days)</h4>
            <div className="space-y-2">
              {timelineData.map((day, index) => (
                <div key={day.date} className="flex items-center space-x-4">
                  <div className="w-20 text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${maxTimelineAmount > 0 ? (day.amount / maxTimelineAmount) * 100 : 0}%` }}
                      />
                    </div>
                    <div className="text-sm font-medium text-gray-900 w-20 text-right">
                      ${day.amount.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 w-16 text-right">
                    {day.projects} project{day.projects !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${timelineData.reduce((sum, day) => sum + day.amount, 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Total Spent</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    ${(timelineData.reduce((sum, day) => sum + day.amount, 0) / 30).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Daily Average</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {timelineData.reduce((sum, day) => sum + day.projects, 0)}
                  </div>
                  <div className="text-sm text-gray-500">Total Projects</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Project Spending</h4>
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-600">Sort by:</span>
                <button
                  onClick={() => handleSort('name')}
                  className={`flex items-center px-2 py-1 rounded ${
                    sortBy === 'name' ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Name <SortIcon field="name" />
                </button>
                <button
                  onClick={() => handleSort('amount')}
                  className={`flex items-center px-2 py-1 rounded ${
                    sortBy === 'amount' ? 'bg-green-100 text-green-800' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Cost <SortIcon field="amount" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {projectSpendingData.slice(0, 20).map((project, index) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 w-6">{index + 1}.</span>
                    <div>
                      <h5 className="font-medium text-gray-900">{project.name}</h5>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{project.components} components</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          project.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          project.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">${project.cost.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {projectSpendingData.length > 20 && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  Showing top 20 of {projectSpendingData.length} projects
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spending</p>
              <p className="text-2xl font-bold text-gray-900">
                ${spendingAnalysis?.totalSpent.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {spendingAnalysis?.spendingByCategory.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <TrendingUpIcon className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Trend</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">
                {spendingAnalysis?.budgetEfficiency && spendingAnalysis.budgetEfficiency > 75 ? 'Improving' : 
                 spendingAnalysis?.budgetEfficiency && spendingAnalysis.budgetEfficiency > 50 ? 'Stable' : 'Declining'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingAnalyticsChart;