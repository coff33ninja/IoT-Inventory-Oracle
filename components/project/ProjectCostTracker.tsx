import React, { useState, useEffect } from 'react';
import { Project, ProjectCostBreakdown, ProjectBudgetPlan, CostOptimizationSuggestion } from '../../types';
import { useInventory } from '../../contexts/InventoryContext';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import ProjectCostService from '../../services/projectCostService';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CubeIcon
} from '../icons/AnalyticsIcons';

interface ProjectCostTrackerProps {
  project: Project;
  budgetLimit?: number;
  className?: string;
}

const ProjectCostTracker: React.FC<ProjectCostTrackerProps> = ({
  project,
  budgetLimit,
  className = ""
}) => {
  const { inventory } = useInventory();
  const { formatCurrency } = useCurrencyFormat();
  
  const [costBreakdown, setCostBreakdown] = useState<ProjectCostBreakdown | null>(null);
  const [budgetPlan, setBudgetPlan] = useState<ProjectBudgetPlan | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<CostOptimizationSuggestion | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'budget' | 'optimization'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateCosts = async () => {
      setIsLoading(true);
      try {
        // Calculate cost breakdown
        const breakdown = ProjectCostService.calculateProjectCostBreakdown(
          project,
          inventory,
          budgetLimit
        );
        setCostBreakdown(breakdown);

        // Create budget plan if budget limit is provided
        if (budgetLimit) {
          const plan = ProjectCostService.createProjectBudgetPlan(
            project,
            inventory,
            budgetLimit
          );
          setBudgetPlan(plan);
        }

        // Generate optimization suggestions
        const suggestions = ProjectCostService.generateCostOptimizationSuggestions(
          project,
          inventory
        );
        setOptimizationSuggestions(suggestions);
      } catch (error) {
        console.error('Error calculating project costs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateCosts();
  }, [project, inventory, budgetLimit]);

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'in_stock': return 'text-green-500 bg-green-900/20';
      case 'low_stock': return 'text-yellow-500 bg-yellow-900/20';
      case 'out_of_stock': return 'text-red-500 bg-red-900/20';
      default: return 'text-gray-500 bg-gray-900/20';
    }
  };

  const getRiskColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-500 bg-red-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-900/20';
      case 'low': return 'text-green-500 bg-green-900/20';
      default: return 'text-gray-500 bg-gray-900/20';
    }
  };

  if (isLoading) {
    return (
      <div className={`project-cost-tracker ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-secondary rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-secondary rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!costBreakdown) {
    return (
      <div className={`project-cost-tracker ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-text-primary">Unable to calculate project costs</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`project-cost-tracker ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-500 mr-3" />
              Project Cost Tracker
            </h2>
            <p className="text-text-secondary">{project.name}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-text-primary">
              {formatCurrency(costBreakdown?.totalCost || 0)}
            </div>
            <div className="text-sm text-text-secondary">Total Cost</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Cost */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Total Cost</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-semibold text-text-primary">
                  {formatCurrency(costBreakdown?.totalCost || 0)}
                </p>
                {/* Cost trend indicator */}
                <div title={costBreakdown?.budgetStatus.isOverBudget ? "Cost trending up" : "Cost under control"}>
                  {costBreakdown?.budgetStatus.isOverBudget ? (
                    <TrendingUpIcon className="h-5 w-5 text-red-400" />
                  ) : (
                    <TrendingDownIcon className="h-5 w-5 text-green-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Component Count */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <CubeIcon className="h-6 w-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Components</p>
              <p className="text-2xl font-semibold text-text-primary">
                {costBreakdown?.componentCosts.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Status */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg border ${
              costBreakdown?.budgetStatus.isOverBudget 
                ? 'bg-red-500/10 border-red-500/20' 
                : 'bg-green-500/10 border-green-500/20'
            }`}>
              {costBreakdown?.budgetStatus.isOverBudget ? (
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              ) : (
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Budget</p>
              <p className="text-2xl font-semibold text-text-primary">
                {costBreakdown?.budgetStatus.isOverBudget ? 'Over' : 'On Track'}
              </p>
            </div>
          </div>
        </div>

        {/* Optimizations */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <LightBulbIcon className="h-6 w-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Optimizations</p>
              <p className="text-2xl font-semibold text-text-primary">
                {costBreakdown?.costOptimizations.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Utilization Bar */}
      {budgetLimit && (
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Budget Utilization</h3>
            <span className="text-sm text-text-secondary">
              {formatCurrency(costBreakdown?.totalCost || 0)} / {formatCurrency(budgetLimit)}
            </span>
          </div>
          <div className="w-full bg-primary rounded-full h-4">
            <div 
              className={`h-4 rounded-full transition-all duration-300 ${
                costBreakdown?.budgetStatus.isOverBudget ? 'bg-red-500' : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min((costBreakdown?.budgetStatus.utilizationPercentage || 0), 100)}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-sm mt-2">
            <span className="text-text-secondary">
              {(costBreakdown?.budgetStatus.utilizationPercentage || 0).toFixed(1)}% utilized
            </span>
            <span className={`font-medium ${
              costBreakdown?.budgetStatus.isOverBudget ? 'text-red-500' : 'text-green-500'
            }`}>
              {costBreakdown?.budgetStatus.remainingBudget !== undefined 
                ? formatCurrency(Math.abs(costBreakdown.budgetStatus.remainingBudget))
                : 'N/A'
              } {costBreakdown?.budgetStatus.isOverBudget ? 'over budget' : 'remaining'}
            </span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-border-color">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'breakdown', label: 'Cost Breakdown', icon: CurrencyDollarIcon },
            { id: 'budget', label: 'Budget Plan', icon: ClockIcon },
            { id: 'optimization', label: 'Optimizations', icon: LightBulbIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-color'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Category Breakdown */}
            <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Cost by Category</h3>
              <div className="space-y-3">
                {costBreakdown?.categoryBreakdown.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded mr-3"
                        style={{ backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` }}
                      />
                      <span className="text-sm font-medium text-text-primary">{category.category}</span>
                      <span className="text-xs text-text-secondary ml-2">
                        ({category.componentCount} components)
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-text-primary">
                        {formatCurrency(category.totalCost)}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Cost Optimizations */}
            {costBreakdown?.costOptimizations && costBreakdown.costOptimizations.length > 0 && (
              <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Top Cost Optimizations
                </h3>
                <div className="space-y-3">
                  {costBreakdown.costOptimizations.slice(0, 3).map((optimization, index) => (
                    <div key={index} className="p-3 bg-primary rounded-lg border border-border-color">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">
                            {optimization.description}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              optimization.effort === 'low' ? 'bg-green-900/20 text-green-400' :
                              optimization.effort === 'medium' ? 'bg-yellow-900/20 text-yellow-400' :
                              'bg-red-900/20 text-red-400'
                            }`}>
                              {optimization.effort} effort
                            </span>
                            <span className="text-xs text-text-secondary">
                              {optimization.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-lg font-semibold text-green-400">
                            {formatCurrency(optimization.potentialSavings)}
                          </div>
                          <div className="text-xs text-text-secondary">savings</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Component Cost Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-color">
                    <th className="text-left py-2 text-text-primary">Component</th>
                    <th className="text-left py-2 text-text-primary">Category</th>
                    <th className="text-right py-2 text-text-primary">Qty</th>
                    <th className="text-right py-2 text-text-primary">Unit Price</th>
                    <th className="text-right py-2 text-text-primary">Total</th>
                    <th className="text-center py-2 text-text-primary">Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {costBreakdown?.componentCosts.map((component) => (
                    <tr key={component.componentId} className="border-b border-border-color">
                      <td className="py-2 text-text-primary font-medium">
                        {component.componentName}
                      </td>
                      <td className="py-2 text-text-secondary">{component.category}</td>
                      <td className="py-2 text-right text-text-primary">{component.quantity}</td>
                      <td className="py-2 text-right text-text-primary">
                        {formatCurrency(component.unitPrice)}
                      </td>
                      <td className="py-2 text-right font-semibold text-text-primary">
                        {formatCurrency(component.totalPrice)}
                      </td>
                      <td className="py-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${getAvailabilityColor(component.availability)}`}>
                          {component.availability.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'budget' && budgetPlan && (
          <div className="space-y-6">
            {/* Budget Overview */}
            <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Budget Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {formatCurrency(budgetPlan?.plannedBudget || 0)}
                  </div>
                  <div className="text-sm text-blue-300">Planned Budget</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(budgetPlan?.currentCost || 0)}
                  </div>
                  <div className="text-sm text-green-300">Current Cost</div>
                </div>
                <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    {formatCurrency(budgetPlan?.projectedCost || 0)}
                  </div>
                  <div className="text-sm text-purple-300">Projected Cost</div>
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Project Milestones</h3>
              <div className="space-y-3">
                {budgetPlan?.milestones.map((milestone) => (
                  <div key={milestone.id} className="p-3 bg-primary rounded-lg border border-border-color">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-text-primary">{milestone.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            milestone.status === 'completed' ? 'bg-green-900/20 text-green-400' :
                            milestone.status === 'in_progress' ? 'bg-blue-900/20 text-blue-400' :
                            milestone.status === 'overdue' ? 'bg-red-900/20 text-red-400' :
                            'bg-gray-900/20 text-gray-400'
                          }`}>
                            {milestone.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-text-primary">
                          {formatCurrency(milestone.plannedCost)}
                        </div>
                        <div className="text-xs text-text-secondary">planned</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Factors */}
            {budgetPlan?.riskFactors && budgetPlan.riskFactors.length > 0 && (
              <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Risk Factors</h3>
                <div className="space-y-3">
                  {budgetPlan.riskFactors.map((risk, index) => (
                    <div key={index} className="p-3 bg-primary rounded-lg border border-border-color">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${getRiskColor(risk.impact)}`}>
                              {risk.impact} impact
                            </span>
                            <span className="text-xs text-text-secondary">
                              {risk.probability}% probability
                            </span>
                          </div>
                          <p className="text-sm text-text-primary mb-1">{risk.description}</p>
                          <p className="text-xs text-text-secondary">
                            <strong>Mitigation:</strong> {risk.mitigation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'optimization' && optimizationSuggestions && (
          <div className="space-y-6">
            {/* Optimization Summary */}
            <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-primary">Cost Optimization Suggestions</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">
                    {formatCurrency(optimizationSuggestions?.totalPotentialSavings || 0)}
                  </div>
                  <div className="text-sm text-text-secondary">Total Potential Savings</div>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-4">
              {optimizationSuggestions?.suggestions.map((suggestion) => {
                const priority = optimizationSuggestions?.recommendedPriority.find(
                  p => p.suggestionId === suggestion.id
                );
                
                return (
                  <div key={suggestion.id} className="bg-secondary p-6 rounded-lg shadow border border-border-color">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-text-primary">{suggestion.title}</h4>
                          {priority && (
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              priority.priority >= 8 ? 'bg-green-900/20 text-green-400' :
                              priority.priority >= 6 ? 'bg-yellow-900/20 text-yellow-400' :
                              'bg-red-900/20 text-red-400'
                            }`}>
                              Priority {priority.priority}/10
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-secondary mb-3">{suggestion.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-text-secondary mb-3">
                          <span>Effort: {suggestion.implementationEffort}</span>
                          <span>Risk: {suggestion.riskLevel}</span>
                          <span>Time: {suggestion.estimatedTimeToImplement}</span>
                        </div>
                        
                        {priority && (
                          <p className="text-xs text-text-secondary italic">{priority.reasoning}</p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-xl font-bold text-green-400">
                          {formatCurrency(suggestion.potentialSavings)}
                        </div>
                        <div className="text-xs text-text-secondary">savings</div>
                      </div>
                    </div>
                    
                    <div className="border-t border-border-color pt-3">
                      <h5 className="text-sm font-medium text-text-primary mb-2">Implementation Steps:</h5>
                      <ol className="list-decimal list-inside space-y-1">
                        {suggestion.steps.map((step, index) => (
                          <li key={index} className="text-xs text-text-secondary">{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCostTracker;