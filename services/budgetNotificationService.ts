import { InventoryItem, Project, BudgetStatus, SpendingAnalysis } from '../types';
import BudgetService from './budgetService';

export interface BudgetNotification {
  id: string;
  type: 'budget_exceeded' | 'budget_warning' | 'spending_spike' | 'optimization_opportunity' | 'forecast_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  category?: string;
  currentAmount: number;
  limitAmount?: number;
  recommendedAction: string;
  timestamp: string;
  isRead: boolean;
  isActive: boolean;
  metadata?: {
    projectId?: string;
    componentId?: string;
    savingsAmount?: number;
    forecastPeriod?: number;
  };
}

export interface BudgetThreshold {
  id: string;
  category?: string;
  type: 'total_budget' | 'category_budget' | 'project_budget' | 'monthly_spending';
  warningThreshold: number; // percentage (e.g., 80 for 80%)
  criticalThreshold: number; // percentage (e.g., 95 for 95%)
  limit: number;
  isEnabled: boolean;
  notificationFrequency: 'immediate' | 'daily' | 'weekly';
  lastNotified?: string;
}

export interface BudgetMonitoringConfig {
  enableRealTimeMonitoring: boolean;
  enableSpendingSpikeDection: boolean;
  enableOptimizationAlerts: boolean;
  enableForecastAlerts: boolean;
  spendingSpikeThreshold: number; // percentage increase
  forecastConfidenceThreshold: number; // minimum confidence for alerts
  maxNotificationsPerDay: number;
}

/**
 * Service for managing budget alerts and notifications
 */
export class BudgetNotificationService {
  private static notifications: BudgetNotification[] = [];
  private static thresholds: BudgetThreshold[] = [];
  private static config: BudgetMonitoringConfig = {
    enableRealTimeMonitoring: true,
    enableSpendingSpikeDection: true,
    enableOptimizationAlerts: true,
    enableForecastAlerts: true,
    spendingSpikeThreshold: 25, // 25% increase
    forecastConfidenceThreshold: 70, // 70% confidence
    maxNotificationsPerDay: 10
  };

  /**
   * Monitor budget status and generate notifications
   */
  static monitorBudgetStatus(
    inventory: InventoryItem[],
    projects: Project[],
    budgetLimits?: { [category: string]: number },
    totalBudgetLimit?: number
  ): BudgetNotification[] {
    if (!this.config.enableRealTimeMonitoring) {
      return [];
    }

    const newNotifications: BudgetNotification[] = [];
    const budgetStatus = BudgetService.calculateBudgetStatus(
      inventory, 
      projects, 
      budgetLimits, 
      totalBudgetLimit
    );

    // Check total budget threshold
    if (totalBudgetLimit && budgetStatus.budgetUtilization) {
      const totalThreshold = this.thresholds.find(t => t.type === 'total_budget');
      if (totalThreshold?.isEnabled) {
        const notification = this.checkBudgetThreshold(
          'Total Budget',
          budgetStatus.totalSpent,
          totalBudgetLimit,
          budgetStatus.budgetUtilization,
          totalThreshold
        );
        if (notification) {
          newNotifications.push(notification);
        }
      }
    }

    // Check category budget thresholds
    budgetStatus.categoryStatus.forEach(categoryStatus => {
      if (categoryStatus.limit && categoryStatus.utilization) {
        const categoryThreshold = this.thresholds.find(
          t => t.type === 'category_budget' && t.category === categoryStatus.category
        );
        if (categoryThreshold?.isEnabled) {
          const notification = this.checkBudgetThreshold(
            `${categoryStatus.category} Budget`,
            categoryStatus.spent,
            categoryStatus.limit,
            categoryStatus.utilization,
            categoryThreshold,
            categoryStatus.category
          );
          if (notification) {
            newNotifications.push(notification);
          }
        }
      }
    });

    // Check for spending spikes
    if (this.config.enableSpendingSpikeDection) {
      const spikeNotifications = this.detectSpendingSpikes(inventory, projects);
      newNotifications.push(...spikeNotifications);
    }

    // Check for optimization opportunities
    if (this.config.enableOptimizationAlerts) {
      const optimizationNotifications = this.generateOptimizationAlerts(inventory, projects);
      newNotifications.push(...optimizationNotifications);
    }

    // Check forecast alerts
    if (this.config.enableForecastAlerts) {
      const forecastNotifications = this.generateForecastAlerts(inventory, projects);
      newNotifications.push(...forecastNotifications);
    }

    // Add new notifications and limit daily count
    const today = new Date().toDateString();
    const todayNotifications = this.notifications.filter(
      n => new Date(n.timestamp).toDateString() === today
    );

    if (todayNotifications.length < this.config.maxNotificationsPerDay) {
      const remainingSlots = this.config.maxNotificationsPerDay - todayNotifications.length;
      const notificationsToAdd = newNotifications
        .slice(0, remainingSlots)
        .filter(notification => !this.isDuplicateNotification(notification));

      this.notifications.push(...notificationsToAdd);
    }

    return newNotifications;
  }

  /**
   * Check if a budget threshold has been exceeded
   */
  private static checkBudgetThreshold(
    name: string,
    currentAmount: number,
    limitAmount: number,
    utilization: number,
    threshold: BudgetThreshold,
    category?: string
  ): BudgetNotification | null {
    // Check if we should notify based on frequency
    if (!this.shouldNotify(threshold)) {
      return null;
    }

    let notification: BudgetNotification | null = null;

    if (utilization >= threshold.criticalThreshold) {
      notification = {
        id: `budget-critical-${Date.now()}-${Math.random()}`,
        type: 'budget_exceeded',
        severity: 'critical',
        title: `${name} Exceeded`,
        message: `${name} has exceeded ${threshold.criticalThreshold}% (${utilization.toFixed(1)}%) of the limit.`,
        category,
        currentAmount,
        limitAmount,
        recommendedAction: 'Review spending immediately and adjust budget or reduce expenses',
        timestamp: new Date().toISOString(),
        isRead: false,
        isActive: true
      };
    } else if (utilization >= threshold.warningThreshold) {
      notification = {
        id: `budget-warning-${Date.now()}-${Math.random()}`,
        type: 'budget_warning',
        severity: 'high',
        title: `${name} Warning`,
        message: `${name} has reached ${utilization.toFixed(1)}% of the limit. Consider monitoring spending closely.`,
        category,
        currentAmount,
        limitAmount,
        recommendedAction: 'Monitor spending and consider budget adjustments',
        timestamp: new Date().toISOString(),
        isRead: false,
        isActive: true
      };
    }

    if (notification) {
      // Update last notified timestamp
      threshold.lastNotified = new Date().toISOString();
    }

    return notification;
  }

  /**
   * Detect spending spikes based on historical patterns
   */
  private static detectSpendingSpikes(
    inventory: InventoryItem[],
    projects: Project[]
  ): BudgetNotification[] {
    const notifications: BudgetNotification[] = [];
    const spendingAnalysis = BudgetService.calculateSpendingAnalysis(inventory, projects);
    
    // Analyze monthly trend for spikes
    if (spendingAnalysis.monthlyTrend.length >= 2) {
      const recentMonth = spendingAnalysis.monthlyTrend[spendingAnalysis.monthlyTrend.length - 1];
      const previousMonth = spendingAnalysis.monthlyTrend[spendingAnalysis.monthlyTrend.length - 2];
      
      if (previousMonth.amount > 0) {
        const increasePercentage = ((recentMonth.amount - previousMonth.amount) / previousMonth.amount) * 100;
        
        if (increasePercentage >= this.config.spendingSpikeThreshold) {
          notifications.push({
            id: `spending-spike-${Date.now()}`,
            type: 'spending_spike',
            severity: increasePercentage >= 50 ? 'high' : 'medium',
            title: 'Spending Spike Detected',
            message: `Spending increased by ${increasePercentage.toFixed(1)}% compared to last month.`,
            currentAmount: recentMonth.amount,
            limitAmount: previousMonth.amount,
            recommendedAction: 'Review recent purchases and identify causes of increased spending',
            timestamp: new Date().toISOString(),
            isRead: false,
            isActive: true,
            metadata: {
              savingsAmount: recentMonth.amount - previousMonth.amount
            }
          });
        }
      }
    }

    return notifications;
  }

  /**
   * Generate optimization opportunity alerts
   */
  private static generateOptimizationAlerts(
    inventory: InventoryItem[],
    projects: Project[]
  ): BudgetNotification[] {
    const notifications: BudgetNotification[] = [];
    const optimization = BudgetService.generateBudgetOptimization(inventory, projects);
    
    // Alert for high-impact optimization opportunities
    optimization.optimizationOpportunities
      .filter(opp => opp.impact === 'high' && opp.potentialSavings > 50)
      .slice(0, 2) // Limit to top 2 opportunities
      .forEach(opportunity => {
        notifications.push({
          id: `optimization-${opportunity.type}-${Date.now()}`,
          type: 'optimization_opportunity',
          severity: 'medium',
          title: 'Cost Optimization Opportunity',
          message: `${opportunity.description}`,
          currentAmount: 0,
          recommendedAction: `Potential savings: $${opportunity.potentialSavings.toFixed(2)}. ${opportunity.description}`,
          timestamp: new Date().toISOString(),
          isRead: false,
          isActive: true,
          metadata: {
            savingsAmount: opportunity.potentialSavings
          }
        });
      });

    return notifications;
  }

  /**
   * Generate forecast-based alerts
   */
  private static generateForecastAlerts(
    inventory: InventoryItem[],
    projects: Project[]
  ): BudgetNotification[] {
    const notifications: BudgetNotification[] = [];
    const forecast = BudgetService.generateSpendingForecast(inventory, projects, 30);
    
    if (forecast.confidence >= this.config.forecastConfidenceThreshold) {
      // Check if forecast exceeds any budget limits
      const totalThreshold = this.thresholds.find(t => t.type === 'total_budget');
      if (totalThreshold && forecast.projectedSpending > totalThreshold.limit * 0.8) {
        notifications.push({
          id: `forecast-alert-${Date.now()}`,
          type: 'forecast_alert',
          severity: 'medium',
          title: 'Budget Forecast Alert',
          message: `Projected spending for next 30 days (${forecast.projectedSpending.toFixed(2)}) may approach budget limits.`,
          currentAmount: forecast.projectedSpending,
          limitAmount: totalThreshold.limit,
          recommendedAction: 'Review planned purchases and consider budget adjustments',
          timestamp: new Date().toISOString(),
          isRead: false,
          isActive: true,
          metadata: {
            forecastPeriod: 30
          }
        });
      }
    }

    return notifications;
  }

  /**
   * Check if we should notify based on frequency settings
   */
  private static shouldNotify(threshold: BudgetThreshold): boolean {
    if (!threshold.lastNotified) {
      return true;
    }

    const lastNotified = new Date(threshold.lastNotified);
    const now = new Date();
    const hoursSinceLastNotification = (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60);

    switch (threshold.notificationFrequency) {
      case 'immediate':
        return hoursSinceLastNotification >= 1; // At least 1 hour between notifications
      case 'daily':
        return hoursSinceLastNotification >= 24;
      case 'weekly':
        return hoursSinceLastNotification >= 168; // 24 * 7
      default:
        return true;
    }
  }

  /**
   * Check if notification is duplicate
   */
  private static isDuplicateNotification(notification: BudgetNotification): boolean {
    const recentNotifications = this.notifications.filter(
      n => new Date(n.timestamp).getTime() > Date.now() - (24 * 60 * 60 * 1000) // Last 24 hours
    );

    return recentNotifications.some(
      n => n.type === notification.type && 
           n.category === notification.category &&
           n.severity === notification.severity
    );
  }

  /**
   * Get all active notifications
   */
  static getActiveNotifications(): BudgetNotification[] {
    return this.notifications.filter(n => n.isActive).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get unread notifications count
   */
  static getUnreadCount(): number {
    return this.notifications.filter(n => n.isActive && !n.isRead).length;
  }

  /**
   * Mark notification as read
   */
  static markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  /**
   * Dismiss notification
   */
  static dismissNotification(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isActive = false;
    }
  }

  /**
   * Add or update budget threshold
   */
  static setBudgetThreshold(threshold: BudgetThreshold): void {
    const existingIndex = this.thresholds.findIndex(
      t => t.type === threshold.type && t.category === threshold.category
    );
    
    if (existingIndex >= 0) {
      this.thresholds[existingIndex] = threshold;
    } else {
      this.thresholds.push(threshold);
    }
  }

  /**
   * Get all budget thresholds
   */
  static getBudgetThresholds(): BudgetThreshold[] {
    return [...this.thresholds];
  }

  /**
   * Update monitoring configuration
   */
  static updateConfig(newConfig: Partial<BudgetMonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current monitoring configuration
   */
  static getConfig(): BudgetMonitoringConfig {
    return { ...this.config };
  }

  /**
   * Clear old notifications (older than 30 days)
   */
  static cleanupOldNotifications(): void {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    this.notifications = this.notifications.filter(
      n => new Date(n.timestamp).getTime() > thirtyDaysAgo
    );
  }

  /**
   * Generate summary of budget health
   */
  static generateBudgetHealthSummary(
    inventory: InventoryItem[],
    projects: Project[],
    budgetLimits?: { [category: string]: number },
    totalBudgetLimit?: number
  ): {
    overallHealth: 'excellent' | 'good' | 'warning' | 'critical';
    activeAlerts: number;
    totalSpent: number;
    budgetUtilization: number;
    topConcerns: string[];
    recommendations: string[];
  } {
    const budgetStatus = BudgetService.calculateBudgetStatus(
      inventory, 
      projects, 
      budgetLimits, 
      totalBudgetLimit
    );
    
    const activeAlerts = this.getActiveNotifications().length;
    const criticalAlerts = this.getActiveNotifications().filter(n => n.severity === 'critical').length;
    const highAlerts = this.getActiveNotifications().filter(n => n.severity === 'high').length;
    
    let overallHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';
    
    if (criticalAlerts > 0 || (budgetStatus.budgetUtilization && budgetStatus.budgetUtilization > 95)) {
      overallHealth = 'critical';
    } else if (highAlerts > 0 || (budgetStatus.budgetUtilization && budgetStatus.budgetUtilization > 80)) {
      overallHealth = 'warning';
    } else if (activeAlerts > 0 || (budgetStatus.budgetUtilization && budgetStatus.budgetUtilization > 60)) {
      overallHealth = 'good';
    }
    
    const topConcerns: string[] = [];
    const recommendations: string[] = [];
    
    // Identify top concerns
    if (criticalAlerts > 0) {
      topConcerns.push(`${criticalAlerts} critical budget alert${criticalAlerts > 1 ? 's' : ''}`);
    }
    if (budgetStatus.budgetUtilization && budgetStatus.budgetUtilization > 90) {
      topConcerns.push('Budget utilization exceeds 90%');
    }
    
    const overBudgetCategories = budgetStatus.categoryStatus.filter(c => c.status === 'over');
    if (overBudgetCategories.length > 0) {
      topConcerns.push(`${overBudgetCategories.length} categor${overBudgetCategories.length > 1 ? 'ies' : 'y'} over budget`);
    }
    
    // Generate recommendations
    if (overallHealth === 'critical') {
      recommendations.push('Immediate budget review required');
      recommendations.push('Consider pausing non-essential purchases');
    } else if (overallHealth === 'warning') {
      recommendations.push('Monitor spending closely');
      recommendations.push('Review upcoming planned expenses');
    } else if (overallHealth === 'good') {
      recommendations.push('Continue current spending patterns');
      recommendations.push('Look for optimization opportunities');
    } else {
      recommendations.push('Budget is well managed');
      recommendations.push('Consider increasing investment in high-value projects');
    }
    
    return {
      overallHealth,
      activeAlerts,
      totalSpent: budgetStatus.totalSpent,
      budgetUtilization: budgetStatus.budgetUtilization || 0,
      topConcerns: topConcerns.slice(0, 3),
      recommendations: recommendations.slice(0, 3)
    };
  }
}

export default BudgetNotificationService;