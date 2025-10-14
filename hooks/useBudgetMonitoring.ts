import { useState, useEffect, useCallback } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { BudgetNotification, BudgetHealthSummary } from '../types';

interface BudgetMonitoringState {
  notifications: BudgetNotification[];
  unreadCount: number;
  healthSummary: BudgetHealthSummary | null;
  isMonitoring: boolean;
  lastUpdate: Date | null;
}

interface UseBudgetMonitoringOptions {
  enableRealTimeMonitoring?: boolean;
  monitoringInterval?: number; // in milliseconds
  budgetLimits?: { [category: string]: number };
  totalBudgetLimit?: number;
}

export const useBudgetMonitoring = (options: UseBudgetMonitoringOptions = {}) => {
  const {
    enableRealTimeMonitoring = true,
    monitoringInterval = 5 * 60 * 1000, // 5 minutes default
    budgetLimits,
    totalBudgetLimit
  } = options;

  const {
    getBudgetNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    dismissNotification,
    getBudgetHealthSummary,
    subscribeToRecommendationUpdates
  } = useInventory();

  const [state, setState] = useState<BudgetMonitoringState>({
    notifications: [],
    unreadCount: 0,
    healthSummary: null,
    isMonitoring: false,
    lastUpdate: null
  });

  const [error, setError] = useState<string | null>(null);

  // Update budget monitoring data
  const updateBudgetData = useCallback(async () => {
    try {
      setError(null);
      
      const notifications = getBudgetNotifications();
      const unreadCount = getUnreadNotificationCount();
      const healthSummary = getBudgetHealthSummary(budgetLimits, totalBudgetLimit);

      setState(prev => ({
        ...prev,
        notifications,
        unreadCount,
        healthSummary,
        lastUpdate: new Date()
      }));
    } catch (err) {
      console.error('Error updating budget monitoring data:', err);
      setError('Failed to update budget monitoring data');
    }
  }, [getBudgetNotifications, getUnreadNotificationCount, getBudgetHealthSummary, budgetLimits, totalBudgetLimit]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: true }));
    updateBudgetData();
  }, [updateBudgetData]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setState(prev => ({ ...prev, isMonitoring: false }));
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    markNotificationAsRead(notificationId);
    updateBudgetData();
  }, [markNotificationAsRead, updateBudgetData]);

  // Dismiss notification
  const dismiss = useCallback((notificationId: string) => {
    dismissNotification(notificationId);
    updateBudgetData();
  }, [dismissNotification, updateBudgetData]);

  // Get notifications by severity
  const getNotificationsBySeverity = useCallback((severity: BudgetNotification['severity']) => {
    return state.notifications.filter(n => n.severity === severity);
  }, [state.notifications]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: BudgetNotification['type']) => {
    return state.notifications.filter(n => n.type === type);
  }, [state.notifications]);

  // Check if there are critical alerts
  const hasCriticalAlerts = useCallback(() => {
    return state.notifications.some(n => n.severity === 'critical');
  }, [state.notifications]);

  // Get budget health status
  const getBudgetHealthStatus = useCallback(() => {
    return state.healthSummary?.overallHealth || 'unknown';
  }, [state.healthSummary]);

  // Set up real-time monitoring
  useEffect(() => {
    if (!enableRealTimeMonitoring) return;

    startMonitoring();

    // Set up periodic updates
    const interval = setInterval(updateBudgetData, monitoringInterval);

    // Subscribe to inventory/project changes
    const unsubscribe = subscribeToRecommendationUpdates((data) => {
      // Update when inventory or projects change
      if (data.type === 'item_added' || data.type === 'item_updated' || 
          data.type === 'project_added' || data.type === 'project_updated') {
        updateBudgetData();
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
      stopMonitoring();
    };
  }, [enableRealTimeMonitoring, monitoringInterval, startMonitoring, stopMonitoring, updateBudgetData, subscribeToRecommendationUpdates]);

  // Update when budget limits change
  useEffect(() => {
    if (state.isMonitoring) {
      updateBudgetData();
    }
  }, [budgetLimits, totalBudgetLimit, updateBudgetData, state.isMonitoring]);

  return {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    healthSummary: state.healthSummary,
    isMonitoring: state.isMonitoring,
    lastUpdate: state.lastUpdate,
    error,

    // Actions
    startMonitoring,
    stopMonitoring,
    markAsRead,
    dismiss,
    refresh: updateBudgetData,

    // Utilities
    getNotificationsBySeverity,
    getNotificationsByType,
    hasCriticalAlerts,
    getBudgetHealthStatus,

    // Computed values
    hasUnreadNotifications: state.unreadCount > 0,
    criticalAlerts: getNotificationsBySeverity('critical'),
    highPriorityAlerts: getNotificationsBySeverity('high'),
    isHealthy: state.healthSummary?.overallHealth === 'excellent' || state.healthSummary?.overallHealth === 'good',
    needsAttention: state.healthSummary?.overallHealth === 'warning' || state.healthSummary?.overallHealth === 'critical'
  };
};

export default useBudgetMonitoring;