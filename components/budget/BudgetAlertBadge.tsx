import React, { useState } from "react";
import { useBudgetMonitoring } from "../../hooks/useBudgetMonitoring";
import { useCurrencyFormat } from "../../hooks/useCurrencyFormat";
import {
  BellIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "../icons/AnalyticsIcons";

interface BudgetAlertBadgeProps {
  className?: string;
  showDropdown?: boolean;
  budgetLimits?: { [category: string]: number };
  totalBudgetLimit?: number;
}

const BudgetAlertBadge: React.FC<BudgetAlertBadgeProps> = ({
  className = "",
  showDropdown = true,
  budgetLimits,
  totalBudgetLimit,
}) => {
  const { formatCurrency } = useCurrencyFormat();
  const [isOpen, setIsOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    healthSummary,
    hasCriticalAlerts,
    markAsRead,
    dismiss,
    isHealthy,
    needsAttention,
  } = useBudgetMonitoring({
    enableRealTimeMonitoring: true,
    budgetLimits,
    totalBudgetLimit,
  });

  const getAlertColor = () => {
    if (hasCriticalAlerts()) return "text-red-500";
    if (needsAttention) return "text-yellow-500";
    if (unreadCount > 0) return "text-blue-500";
    return "text-green-500";
  };

  const getAlertIcon = () => {
    if (hasCriticalAlerts()) return XCircleIcon;
    if (needsAttention) return ExclamationTriangleIcon;
    if (unreadCount > 0) return BellIcon;
    return CheckCircleIcon;
  };

  const AlertIcon = getAlertIcon();
  const alertColor = getAlertColor();

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className={`budget-alert-badge relative ${className}`}>
      {/* Alert Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg hover:bg-secondary transition-colors ${alertColor}`}
        title={`${unreadCount} budget alerts`}
        aria-label={`Budget alerts: ${unreadCount} unread`}>
        <AlertIcon className="h-6 w-6" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-secondary border border-border-color rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-border-color">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-text-primary">
                  Budget Alerts
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-text-secondary hover:text-text-primary"
                  title="Close alerts"
                  aria-label="Close budget alerts dropdown">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Health Summary */}
              {healthSummary && (
                <div className="mt-2 p-2 rounded bg-primary">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Budget Health:</span>
                    <span
                      className={`font-medium capitalize ${
                        healthSummary.overallHealth === "excellent"
                          ? "text-green-500"
                          : healthSummary.overallHealth === "good"
                          ? "text-blue-500"
                          : healthSummary.overallHealth === "warning"
                          ? "text-yellow-500"
                          : "text-red-500"
                      }`}>
                      {healthSummary.overallHealth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-text-secondary">Utilization:</span>
                    <span className="text-text-primary">
                      {healthSummary.budgetUtilization.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="max-h-64 overflow-y-auto">
              {recentNotifications.length === 0 ? (
                <div className="p-4 text-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-text-primary">No alerts</p>
                  <p className="text-xs text-text-secondary">
                    Your budget is on track
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border-color">
                  {recentNotifications.map((notification) => {
                    const NotificationIcon =
                      notification.severity === "critical"
                        ? XCircleIcon
                        : notification.severity === "high"
                        ? ExclamationTriangleIcon
                        : notification.type === "optimization_opportunity"
                        ? CheckCircleIcon
                        : BellIcon;

                    const iconColor =
                      notification.severity === "critical"
                        ? "text-red-500"
                        : notification.severity === "high"
                        ? "text-yellow-500"
                        : notification.severity === "medium"
                        ? "text-blue-500"
                        : "text-green-500";

                    return (
                      <div
                        key={notification.id}
                        className="p-3 hover:bg-primary">
                        <div className="flex items-start space-x-3">
                          <NotificationIcon
                            className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColor}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-text-primary truncate">
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                              )}
                            </div>
                            <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                              {notification.message}
                            </p>

                            {notification.limitAmount && (
                              <div className="text-xs text-text-secondary mt-1">
                                {formatCurrency(notification.currentAmount)} /{" "}
                                {formatCurrency(notification.limitAmount)}
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-text-secondary">
                                {new Date(
                                  notification.timestamp
                                ).toLocaleTimeString()}
                              </span>
                              <div className="flex items-center space-x-1">
                                {!notification.isRead && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                                    Read
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismiss(notification.id);
                                  }}
                                  className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">
                                  Dismiss
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 5 && (
              <div className="p-3 border-t border-border-color text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications view
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800">
                  View all {notifications.length} alerts
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BudgetAlertBadge;
