import React, { useState, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { BudgetHealthSummary } from '../../types';
import BudgetNotificationService from '../../services/budgetNotificationService';
import {
  HeartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  LightBulbIcon
} from '../icons/AnalyticsIcons';

interface BudgetHealthDashboardProps {
  className?: string;
  budgetLimits?: { [category: string]: number };
  totalBudgetLimit?: number;
}

const BudgetHealthDashboard: React.FC<BudgetHealthDashboardProps> = ({
  className = "",
  budgetLimits,
  totalBudgetLimit
}) => {
  const { inventory, projects } = useInventory();
  const { formatCurrency } = useCurrencyFormat();
  
  const [healthSummary, setHealthSummary] = useState<BudgetHealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateHealthSummary = () => {
      setIsLoading(true);
      try {
        const summary = BudgetNotificationService.generateBudgetHealthSummary(
          inventory,
          projects,
          budgetLimits,
          totalBudgetLimit
        );
        setHealthSummary(summary);
      } catch (error) {
        console.error('Error generating budget health summary:', error);
      } finally {
        setIsLoading(false);
      }
    };

    updateHealthSummary();
    
    // Update every 5 minutes
    const interval = setInterval(updateHealthSummary, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [inventory, projects, budgetLimits, totalBudgetLimit]);

  const getHealthIcon = (health: BudgetHealthSummary['overallHealth']) => {
    switch (health) {
      case 'excellent': return CheckCircleIcon;
      case 'good': return HeartIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'critical': return XCircleIcon;
      default: return ChartBarIcon;
    }
  };

  const getHealthColor = (health: BudgetHealthSummary['overallHealth']) => {
    switch (health) {
      case 'excellent': return 'text-green-500 bg-green-900/20 border-green-500/20';
      case 'good': return 'text-blue-500 bg-blue-900/20 border-blue-500/20';
      case 'warning': return 'text-yellow-500 bg-yellow-900/20 border-yellow-500/20';
      case 'critical': return 'text-red-500 bg-red-900/20 border-red-500/20';
      default: return 'text-gray-500 bg-gray-900/20 border-gray-500/20';
    }
  };

  const getHealthMessage = (health: BudgetHealthSummary['overallHealth']) => {
    switch (health) {
      case 'excellent': return 'Your budget is in excellent shape! Keep up the great work.';
      case 'good': return 'Budget is well managed with minor areas for improvement.';
      case 'warning': return 'Budget requires attention. Monitor spending closely.';
      case 'critical': return 'Immediate budget review required. Take action now.';
      default: return 'Budget status unknown.';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 95) return 'bg-red-500';
    if (utilization >= 80) return 'bg-yellow-500';
    if (utilization >= 60) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <div className={`budget-health-dashboard ${className}`}>
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

  if (!healthSummary) {
    return (
      <div className={`budget-health-dashboard ${className}`}>
        <div className="text-center py-8">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-text-primary">Unable to load budget health data</p>
        </div>
      </div>
    );
  }

  const HealthIcon = getHealthIcon(healthSummary.overallHealth);
  const healthColorClasses = getHealthColor(healthSummary.overallHealth);

  return (
    <div className={`budget-health-dashboard ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary flex items-center mb-2">
          <HeartIcon className="h-8 w-8 text-red-500 mr-3" />
          Budget Health
        </h2>
        <p className="text-text-secondary">
          Real-time overview of your budget status and financial health
        </p>
      </div>

      {/* Health Status Card */}
      <div className={`p-6 rounded-lg border mb-6 ${healthColorClasses}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <HealthIcon className="h-12 w-12 mr-4" />
            <div>
              <h3 className="text-2xl font-bold capitalize">
                {healthSummary.overallHealth}
              </h3>
              <p className="opacity-90">
                {getHealthMessage(healthSummary.overallHealth)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              {healthSummary.budgetUtilization.toFixed(0)}%
            </div>
            <div className="text-sm opacity-75">Budget Used</div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Spent */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Total Spent</p>
              <p className="text-2xl font-semibold text-text-primary">
                {formatCurrency(healthSummary.totalSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg border ${
              healthSummary.activeAlerts > 0 
                ? 'bg-red-500/10 border-red-500/20' 
                : 'bg-green-500/10 border-green-500/20'
            }`}>
              {healthSummary.activeAlerts > 0 ? (
                <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
              ) : (
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-text-secondary">Active Alerts</p>
              <p className="text-2xl font-semibold text-text-primary">
                {healthSummary.activeAlerts}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-text-secondary">Utilization</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {healthSummary.budgetUtilization.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          <div className="w-full bg-primary rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getUtilizationColor(healthSummary.budgetUtilization)}`}
              style={{ width: `${Math.min(healthSummary.budgetUtilization, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top Concerns */}
      {healthSummary.topConcerns.length > 0 && (
        <div className="bg-secondary p-6 rounded-lg shadow border border-border-color mb-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            Top Concerns
          </h3>
          <div className="space-y-3">
            {healthSummary.topConcerns.map((concern, index) => (
              <div key={index} className="flex items-center p-3 bg-yellow-900/10 rounded-lg border border-yellow-500/20">
                <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-3 flex-shrink-0" />
                <span className="text-sm text-text-primary">{concern}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
          <LightBulbIcon className="h-5 w-5 text-blue-500 mr-2" />
          Recommendations
        </h3>
        <div className="space-y-3">
          {healthSummary.recommendations.map((recommendation, index) => (
            <div key={index} className="flex items-center p-3 bg-blue-900/10 rounded-lg border border-blue-500/20">
              <CheckCircleIcon className="h-4 w-4 text-blue-500 mr-3 flex-shrink-0" />
              <span className="text-sm text-text-primary">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Health Trend Indicator */}
      <div className="mt-6 p-4 bg-primary rounded-lg border border-border-color">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              healthSummary.overallHealth === 'excellent' || healthSummary.overallHealth === 'good'
                ? 'bg-green-500/10 border border-green-500/20'
                : 'bg-yellow-500/10 border border-yellow-500/20'
            }`}>
              {healthSummary.overallHealth === 'excellent' || healthSummary.overallHealth === 'good' ? (
                <TrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDownIcon className="h-4 w-4 text-yellow-500" />
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-text-primary">Budget Trend</p>
              <p className="text-xs text-text-secondary">
                {healthSummary.overallHealth === 'excellent' || healthSummary.overallHealth === 'good'
                  ? 'Positive trajectory - budget is well managed'
                  : 'Requires attention - monitor spending closely'
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-text-secondary">Last updated</p>
            <p className="text-xs text-text-secondary">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetHealthDashboard;