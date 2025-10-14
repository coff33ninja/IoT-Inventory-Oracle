import React, { useState, useEffect } from 'react';
import { BudgetNotification, BudgetThreshold, BudgetMonitoringConfig } from '../../types';
import { useInventory } from '../../contexts/InventoryContext';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';
import BudgetNotificationService from '../../services/budgetNotificationService';
import {
  BellIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  CogIcon,
  EyeIcon,
  EyeSlashIcon
} from '../icons/AnalyticsIcons';

interface BudgetNotificationCenterProps {
  className?: string;
}

const BudgetNotificationCenter: React.FC<BudgetNotificationCenterProps> = ({
  className = ""
}) => {
  const { inventory, projects } = useInventory();
  const { formatCurrency } = useCurrencyFormat();
  
  const [notifications, setNotifications] = useState<BudgetNotification[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [config, setConfig] = useState<BudgetMonitoringConfig>(
    BudgetNotificationService.getConfig()
  );
  const [thresholds, setThresholds] = useState<BudgetThreshold[]>(
    BudgetNotificationService.getBudgetThresholds()
  );

  useEffect(() => {
    // Monitor budget status and update notifications
    const monitorBudget = () => {
      const newNotifications = BudgetNotificationService.monitorBudgetStatus(
        inventory,
        projects
      );
      
      if (newNotifications.length > 0) {
        setNotifications(BudgetNotificationService.getActiveNotifications());
      }
    };

    // Initial check
    monitorBudget();

    // Set up periodic monitoring (every 5 minutes)
    const interval = setInterval(monitorBudget, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [inventory, projects]);

  useEffect(() => {
    // Load initial notifications
    setNotifications(BudgetNotificationService.getActiveNotifications());
  }, []);

  const getNotificationIcon = (type: BudgetNotification['type'], severity: BudgetNotification['severity']) => {
    if (severity === 'critical') return XCircleIcon;
    if (severity === 'high') return ExclamationTriangleIcon;
    if (type === 'optimization_opportunity') return CheckCircleIcon;
    return InformationCircleIcon;
  };

  const getNotificationColor = (severity: BudgetNotification['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-900/20 border-red-500/20';
      case 'high': return 'text-yellow-500 bg-yellow-900/20 border-yellow-500/20';
      case 'medium': return 'text-blue-500 bg-blue-900/20 border-blue-500/20';
      case 'low': return 'text-green-500 bg-green-900/20 border-green-500/20';
      default: return 'text-gray-500 bg-gray-900/20 border-gray-500/20';
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    BudgetNotificationService.markAsRead(notificationId);
    setNotifications(BudgetNotificationService.getActiveNotifications());
  };

  const handleDismiss = (notificationId: string) => {
    BudgetNotificationService.dismissNotification(notificationId);
    setNotifications(BudgetNotificationService.getActiveNotifications());
  };

  const handleConfigUpdate = (newConfig: Partial<BudgetMonitoringConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    BudgetNotificationService.updateConfig(updatedConfig);
  };

  const handleThresholdUpdate = (threshold: BudgetThreshold) => {
    BudgetNotificationService.setBudgetThreshold(threshold);
    setThresholds(BudgetNotificationService.getBudgetThresholds());
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayNotifications = showAllNotifications ? notifications : notifications.slice(0, 5);

  return (
    <div className={`budget-notification-center ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <BellIcon className="h-6 w-6 text-text-primary mr-2" />
          <h3 className="text-lg font-semibold text-text-primary">Budget Alerts</h3>
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowAllNotifications(!showAllNotifications)}
            className="p-2 text-text-secondary hover:text-text-primary rounded"
            title={showAllNotifications ? 'Show fewer' : 'Show all'}
          >
            {showAllNotifications ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-text-secondary hover:text-text-primary rounded"
            title="Settings"
          >
            <CogIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3 mb-4">
        {displayNotifications.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-text-primary font-medium">All good!</p>
            <p className="text-text-secondary">No budget alerts at this time.</p>
          </div>
        ) : (
          displayNotifications.map((notification) => {
            const NotificationIcon = getNotificationIcon(notification.type, notification.severity);
            const colorClasses = getNotificationColor(notification.severity);
            
            return (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${colorClasses} ${
                  !notification.isRead ? 'ring-2 ring-opacity-50' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <NotificationIcon className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium">{notification.title}</h4>
                        <div className="flex items-center space-x-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            notification.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            notification.severity === 'high' ? 'bg-yellow-100 text-yellow-800' :
                            notification.severity === 'medium' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {notification.severity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDismiss(notification.id)}
                            className="text-text-secondary hover:text-text-primary"
                            title="Dismiss"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm opacity-90 mb-2">{notification.message}</p>
                      
                      {notification.limitAmount && (
                        <div className="text-sm mb-2">
                          <span className="font-medium">Current: </span>
                          {formatCurrency(notification.currentAmount)}
                          <span className="mx-2">•</span>
                          <span className="font-medium">Limit: </span>
                          {formatCurrency(notification.limitAmount)}
                        </div>
                      )}
                      
                      <div className="text-sm">
                        <span className="font-medium">Recommended Action: </span>
                        <span className="opacity-90">{notification.recommendedAction}</span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs opacity-75">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs px-2 py-1 bg-primary text-text-primary rounded hover:bg-secondary"
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {notifications.length > 5 && !showAllNotifications && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowAllNotifications(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Show {notifications.length - 5} more notifications
          </button>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-6 p-4 bg-secondary rounded-lg border border-border-color">
          <h4 className="text-lg font-semibold text-text-primary mb-4">Notification Settings</h4>
          
          {/* Monitoring Configuration */}
          <div className="space-y-4 mb-6">
            <h5 className="font-medium text-text-primary">Monitoring Options</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableRealTimeMonitoring}
                  onChange={(e) => handleConfigUpdate({ enableRealTimeMonitoring: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-text-primary">Real-time monitoring</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableSpendingSpikeDection}
                  onChange={(e) => handleConfigUpdate({ enableSpendingSpikeDection: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-text-primary">Spending spike detection</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableOptimizationAlerts}
                  onChange={(e) => handleConfigUpdate({ enableOptimizationAlerts: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-text-primary">Optimization alerts</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.enableForecastAlerts}
                  onChange={(e) => handleConfigUpdate({ enableForecastAlerts: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-text-primary">Forecast alerts</span>
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Spending Spike Threshold (%)
                </label>
                <input
                  type="number"
                  value={config.spendingSpikeThreshold}
                  onChange={(e) => handleConfigUpdate({ spendingSpikeThreshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-primary border border-border-color rounded-md text-text-primary"
                  min="1"
                  max="100"
                  title="Spending spike threshold percentage"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Max Notifications Per Day
                </label>
                <input
                  type="number"
                  value={config.maxNotificationsPerDay}
                  onChange={(e) => handleConfigUpdate({ maxNotificationsPerDay: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-primary border border-border-color rounded-md text-text-primary"
                  min="1"
                  max="50"
                  title="Maximum notifications per day"
                />
              </div>
            </div>
          </div>

          {/* Budget Thresholds */}
          <div className="space-y-4">
            <h5 className="font-medium text-text-primary">Budget Thresholds</h5>
            
            <div className="text-sm text-text-secondary mb-2">
              Configure when to receive budget alerts based on spending thresholds.
            </div>
            
            <button
              type="button"
              onClick={() => {
                const newThreshold: BudgetThreshold = {
                  id: `threshold-${Date.now()}`,
                  type: 'total_budget',
                  warningThreshold: 80,
                  criticalThreshold: 95,
                  limit: 1000,
                  isEnabled: true,
                  notificationFrequency: 'daily'
                };
                handleThresholdUpdate(newThreshold);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Add Budget Threshold
            </button>
            
            {thresholds.length > 0 && (
              <div className="space-y-2">
                {thresholds.map((threshold) => (
                  <div key={threshold.id} className="p-3 bg-primary rounded border border-border-color">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-text-primary">
                          {threshold.type.replace('_', ' ').toUpperCase()}
                          {threshold.category && ` - ${threshold.category}`}
                        </span>
                        <div className="text-sm text-text-secondary">
                          Warning: {threshold.warningThreshold}% • Critical: {threshold.criticalThreshold}%
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={threshold.isEnabled}
                            onChange={(e) => handleThresholdUpdate({
                              ...threshold,
                              isEnabled: e.target.checked
                            })}
                            className="mr-1"
                          />
                          <span className="text-sm text-text-primary">Enabled</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetNotificationCenter;