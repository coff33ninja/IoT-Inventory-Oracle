import React from 'react';
import { SpendingAnalysis, Project, InventoryItem } from '../../types';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '../icons/AnalyticsIcons';

interface BudgetAlertsProps {
  spendingAnalysis: SpendingAnalysis | null;
  projects: Project[];
  inventory: InventoryItem[];
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  action?: string;
  severity: 'low' | 'medium' | 'high';
}

const BudgetAlerts: React.FC<BudgetAlertsProps> = ({
  spendingAnalysis,
  projects,
  inventory
}) => {
  const { formatCurrency } = useCurrencyFormat();
  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];

    // Budget utilization alerts
    if (spendingAnalysis) {
      if (spendingAnalysis.budgetEfficiency < 25) {
        alerts.push({
          id: 'budget-critical',
          type: 'error',
          title: 'Budget Critical',
          message: `Budget efficiency is low at ${spendingAnalysis.budgetEfficiency.toFixed(1)}%. Consider reviewing spending patterns.`,
          action: 'Review Budget',
          severity: 'high'
        });
      } else if (spendingAnalysis.budgetEfficiency < 50) {
        alerts.push({
          id: 'budget-warning',
          type: 'warning',
          title: 'Budget Warning',
          message: `Budget efficiency is moderate at ${spendingAnalysis.budgetEfficiency.toFixed(1)}%. Monitor spending closely.`,
          action: 'Check Spending',
          severity: 'medium'
        });
      }

      // Spending trend alerts
      if (spendingAnalysis.budgetEfficiency < 75) {
        alerts.push({
          id: 'spending-increase',
          type: 'warning',
          title: 'Increasing Spending Trend',
          message: 'Your spending has been increasing compared to previous periods. Review recent purchases.',
          action: 'Analyze Trends',
          severity: 'medium'
        });
      }

      // Cost saving opportunities
      if (spendingAnalysis.recommendations && spendingAnalysis.recommendations.length > 0) {
        alerts.push({
          id: 'recommendations',
          type: 'info',
          title: 'Spending Recommendations',
          message: `${spendingAnalysis.recommendations.length} spending recommendations available to improve efficiency.`,
          action: 'View Recommendations',
          severity: 'low'
        });
      }
    }

    // Project-based alerts
    const expensiveProjects = projects.filter(project => {
      const projectCost = project.components.reduce((sum, component) => {
        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        const price = inventoryItem?.purchasePrice || 0;
        return sum + (price * component.quantity);
      }, 0);
      return projectCost > 500; // Threshold for expensive projects
    });

    if (expensiveProjects.length > 0) {
      alerts.push({
        id: 'expensive-projects',
        type: 'info',
        title: 'High-Cost Projects',
        message: `${expensiveProjects.length} project${expensiveProjects.length !== 1 ? 's' : ''} with costs over ${formatCurrency(500)} detected.`,
        action: 'Review Projects',
        severity: 'low'
      });
    }

    // Inventory-based alerts
    const expensiveItems = inventory.filter(item => 
      item.purchasePrice && item.purchasePrice > 100
    );

    if (expensiveItems.length > 5) {
      alerts.push({
        id: 'expensive-inventory',
        type: 'warning',
        title: 'High-Value Inventory',
        message: `${expensiveItems.length} items worth over ${formatCurrency(100)} each in inventory. Consider usage optimization.`,
        action: 'Review Inventory',
        severity: 'medium'
      });
    }

    // Unused inventory alert
    const unusedItems = inventory.filter(item => 
      !item.usedInProjects || item.usedInProjects.length === 0
    );

    if (unusedItems.length > 10) {
      const unusedValue = unusedItems.reduce((sum, item) => 
        sum + ((item.purchasePrice || 0) * item.quantity), 0
      );
      
      alerts.push({
        id: 'unused-inventory',
        type: 'warning',
        title: 'Unused Inventory',
        message: `${unusedItems.length} items (worth ${formatCurrency(unusedValue)}) haven't been used in any projects.`,
        action: 'Optimize Inventory',
        severity: 'medium'
      });
    }

    // Success alerts
    if (spendingAnalysis && spendingAnalysis.budgetEfficiency > 75) {
      alerts.push({
        id: 'budget-healthy',
        type: 'success',
        title: 'Budget On Track',
        message: `Great job! Your budget efficiency is ${spendingAnalysis.budgetEfficiency.toFixed(1)}%.`,
        severity: 'low'
      });
    }

    return alerts.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const alerts = generateAlerts();

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error': return XCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'info': return InformationCircleIcon;
      case 'success': return CheckCircleIcon;
      default: return InformationCircleIcon;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColor = (type: Alert['type']) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'success': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="bg-secondary p-6 rounded-lg shadow border border-border-color">
        <div className="flex items-center">
          <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">All Good!</h3>
            <p className="text-text-secondary">No budget alerts at this time. Keep up the good work!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">Budget Alerts</h3>
        <span className="px-2 py-1 bg-primary text-text-secondary text-sm rounded-full border border-border-color">
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const AlertIcon = getAlertIcon(alert.type);
          const alertStyles = getAlertStyles(alert.type);
          const iconColor = getIconColor(alert.type);

          return (
            <div key={alert.id} className={`p-4 rounded-lg border ${alertStyles}`}>
              <div className="flex items-start">
                <AlertIcon className={`h-5 w-5 mr-3 mt-0.5 ${iconColor}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{alert.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-sm mt-1 opacity-90">{alert.message}</p>
                  {alert.action && (
                    <button className="text-sm font-medium mt-2 hover:underline">
                      {alert.action} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alert Summary */}
      <div className="bg-secondary p-4 rounded-lg border border-border-color">
        <h4 className="font-medium text-text-primary mb-2">Alert Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-red-600">
              {alerts.filter(a => a.severity === 'high').length}
            </div>
            <div className="text-sm text-text-secondary">High Priority</div>
          </div>
          <div>
            <div className="text-lg font-bold text-yellow-600">
              {alerts.filter(a => a.severity === 'medium').length}
            </div>
            <div className="text-sm text-text-secondary">Medium Priority</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">
              {alerts.filter(a => a.severity === 'low').length}
            </div>
            <div className="text-sm text-text-secondary">Low Priority</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {alerts.filter(a => a.type === 'success').length}
            </div>
            <div className="text-sm text-text-secondary">Positive</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetAlerts;