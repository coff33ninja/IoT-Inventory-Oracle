import { 
  InventoryItem, 
  Project, 
  SpendingAnalysis
} from '../types';

/**
 * Service for calculating real budget and spending analytics
 */
export class BudgetService {
  
  /**
   * Calculate comprehensive spending analysis from real data
   */
  static calculateSpendingAnalysis(
    inventory: InventoryItem[], 
    projects: Project[]
  ): SpendingAnalysis {
    const spendingByCategory = this.calculateSpendingByCategory(inventory, projects);
    const totalSpent = spendingByCategory.reduce((sum, cat) => sum + cat.amount, 0);
    const budgetEfficiency = this.calculateBudgetEfficiency(inventory, projects);
    const recommendations = this.generateSpendingRecommendations(inventory, projects, spendingByCategory);
    const monthlyTrend = this.calculateMonthlyTrend(projects, inventory);
    const topExpenses = this.calculateTopExpenses(projects, inventory);

    return {
      totalSpent,
      spendingByCategory,
      monthlyTrend,
      topExpenses,
      budgetEfficiency,
      recommendations
    };
  }

  /**
   * Calculate spending breakdown by category
   */
  private static calculateSpendingByCategory(
    inventory: InventoryItem[], 
    projects: Project[]
  ): Array<{ category: string; amount: number; percentage: number }> {
    const categorySpending = new Map<string, number>();
    let totalSpending = 0;

    // Calculate spending from project components
    projects.forEach(project => {
      project.components.forEach(component => {
        if (!component.inventoryItemId) return; // Skip components without inventory links
        
        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        if (inventoryItem) {
          const category = inventoryItem.category || 'Uncategorized';
          const cost = (inventoryItem.purchasePrice || 0) * component.quantity;
          
          categorySpending.set(category, (categorySpending.get(category) || 0) + cost);
          totalSpending += cost;
        }
      });
    });

    // Also include unused inventory as spending
    inventory.forEach(item => {
      if (item.category) {
        const category = item.category;
        const cost = (item.purchasePrice || 0) * item.quantity;
        
        // Only add if not already counted in projects
        const usedInProjects = projects.some(project => 
          project.components.some(comp => comp.inventoryItemId === item.id)
        );
        
        if (!usedInProjects) {
          categorySpending.set(category, (categorySpending.get(category) || 0) + cost);
          totalSpending += cost;
        }
      }
    });

    // Convert to array with percentages
    const result = Array.from(categorySpending.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0
    }));

    return result.sort((a, b) => b.amount - a.amount);
  }

  /**
   * Calculate budget efficiency based on component utilization
   */
  private static calculateBudgetEfficiency(
    inventory: InventoryItem[], 
    projects: Project[]
  ): number {
    let totalValue = 0;
    let utilizedValue = 0;

    // Calculate total inventory value
    inventory.forEach(item => {
      const itemValue = (item.purchasePrice || 0) * item.quantity;
      totalValue += itemValue;
    });

    // Calculate utilized value from projects
    const usedComponents = new Set<string>();
    projects.forEach(project => {
      project.components.forEach(component => {
        if (component.inventoryItemId) {
          usedComponents.add(component.inventoryItemId);
          
          const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
          if (inventoryItem) {
            const componentValue = (inventoryItem.purchasePrice || 0) * component.quantity;
            utilizedValue += componentValue;
          }
        }
      });
    });

    // Calculate efficiency as percentage of value that has been utilized
    return totalValue > 0 ? Math.min(100, (utilizedValue / totalValue) * 100) : 0;
  }

  /**
   * Generate spending recommendations based on analysis
   */
  private static generateSpendingRecommendations(
    inventory: InventoryItem[], 
    projects: Project[],
    spendingByCategory: Array<{ category: string; amount: number; percentage: number }>
  ): string[] {
    const recommendations: string[] = [];

    // Find unused components
    const usedComponents = new Set<string>();
    projects.forEach(project => {
      project.components.forEach(component => {
        if (component.inventoryItemId) {
          usedComponents.add(component.inventoryItemId);
        }
      });
    });

    const unusedComponents = inventory.filter(item => !usedComponents.has(item.id));
    const unusedValue = unusedComponents.reduce((sum, item) => 
      sum + (item.purchasePrice || 0) * item.quantity, 0
    );

    if (unusedComponents.length > 0) {
      recommendations.push(
        `You have ${unusedComponents.length} unused components worth $${unusedValue.toFixed(2)}. Consider using them in upcoming projects.`
      );
    }

    // Analyze spending concentration
    const topCategory = spendingByCategory[0];
    if (topCategory && topCategory.percentage > 50) {
      recommendations.push(
        `${topCategory.percentage.toFixed(1)}% of spending is on ${topCategory.category}. Consider diversifying component purchases.`
      );
    }

    // Check for low-value, high-quantity items
    const lowValueItems = inventory.filter(item => 
      (item.purchasePrice || 0) < 1 && item.quantity > 10
    );
    
    if (lowValueItems.length > 0) {
      recommendations.push(
        `Consider bulk purchasing for ${lowValueItems.length} low-cost components to reduce per-unit costs.`
      );
    }

    // Analyze project completion rates
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const totalProjects = projects.length;
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    if (completionRate < 70 && totalProjects > 3) {
      recommendations.push(
        `Project completion rate is ${completionRate.toFixed(1)}%. Focus on completing existing projects before starting new ones.`
      );
    }

    // Check for duplicate or similar components
    const componentNames = inventory.map(item => item.name.toLowerCase());
    const duplicates = componentNames.filter((name, index) => 
      componentNames.indexOf(name) !== index
    );

    if (duplicates.length > 0) {
      recommendations.push(
        `Found ${duplicates.length} potentially duplicate components. Review inventory for consolidation opportunities.`
      );
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Calculate project costs from current component prices
   */
  static calculateProjectCosts(
    project: Project,
    inventory: InventoryItem[]
  ): {
    totalCost: number;
    componentCosts: Array<{
      componentId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  } {
    const componentCosts = project.components
      .filter(component => component.inventoryItemId) // Filter out components without valid IDs
      .map(component => {
        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        const unitPrice = inventoryItem?.purchasePrice || 0;
        const totalPrice = unitPrice * component.quantity;

        return {
          componentId: component.inventoryItemId!,
          name: inventoryItem?.name || 'Unknown Component',
          quantity: component.quantity,
          unitPrice,
          totalPrice
        };
      });

    const totalCost = componentCosts.reduce((sum, cost) => sum + cost.totalPrice, 0);

    return {
      totalCost,
      componentCosts
    };
  }

  /**
   * Generate budget alerts based on spending patterns
   */
  static generateBudgetAlerts(
    inventory: InventoryItem[], 
    projects: Project[],
    budgetLimits?: { [category: string]: number }
  ): Array<{
    type: 'warning' | 'danger' | 'info';
    category: string;
    message: string;
    currentSpending: number;
    limit?: number;
  }> {
    const alerts: Array<{
      type: 'warning' | 'danger' | 'info';
      category: string;
      message: string;
      currentSpending: number;
      limit?: number;
    }> = [];

    const spendingByCategory = this.calculateSpendingByCategory(inventory, projects);

    // Check against budget limits if provided
    if (budgetLimits) {
      spendingByCategory.forEach(({ category, amount }) => {
        const limit = budgetLimits[category];
        if (limit) {
          const percentage = (amount / limit) * 100;
          
          if (percentage >= 100) {
            alerts.push({
              type: 'danger',
              category,
              message: `Budget exceeded for ${category} by $${(amount - limit).toFixed(2)}`,
              currentSpending: amount,
              limit
            });
          } else if (percentage >= 80) {
            alerts.push({
              type: 'warning',
              category,
              message: `${category} spending at ${percentage.toFixed(1)}% of budget`,
              currentSpending: amount,
              limit
            });
          }
        }
      });
    }

    // Check for unusual spending patterns
    const averageSpending = spendingByCategory.reduce((sum, cat) => sum + cat.amount, 0) / spendingByCategory.length;
    
    spendingByCategory.forEach(({ category, amount }) => {
      if (amount > averageSpending * 3) {
        alerts.push({
          type: 'info',
          category,
          message: `${category} spending is significantly higher than average`,
          currentSpending: amount
        });
      }
    });

    return alerts.sort((a, b) => {
      const priority = { danger: 3, warning: 2, info: 1 };
      return priority[b.type] - priority[a.type];
    });
  }

  /**
   * Calculate monthly spending trend
   */
  private static calculateMonthlyTrend(
    projects: Project[], 
    inventory: InventoryItem[]
  ): Array<{ month: string; amount: number }> {
    const monthlySpending = new Map<string, number>();

    projects.forEach(project => {
      const date = new Date(project.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      let projectCost = 0;
      project.components.forEach(component => {
        if (!component.inventoryItemId) return; // Skip components without inventory links
        
        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        if (inventoryItem) {
          projectCost += (inventoryItem.purchasePrice || 0) * component.quantity;
        }
      });

      monthlySpending.set(monthKey, (monthlySpending.get(monthKey) || 0) + projectCost);
    });

    return Array.from(monthlySpending.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Calculate top expenses by component
   */
  private static calculateTopExpenses(
    projects: Project[], 
    inventory: InventoryItem[]
  ): Array<{ componentName: string; amount: number; quantity: number }> {
    const componentExpenses = new Map<string, { amount: number; quantity: number; name: string }>();

    projects.forEach(project => {
      project.components.forEach(component => {
        if (!component.inventoryItemId) return; // Skip components without inventory links
        
        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        if (inventoryItem) {
          const cost = (inventoryItem.purchasePrice || 0) * component.quantity;
          const existing = componentExpenses.get(component.inventoryItemId) || {
            amount: 0,
            quantity: 0,
            name: inventoryItem.name
          };

          existing.amount += cost;
          existing.quantity += component.quantity;
          componentExpenses.set(component.inventoryItemId, existing);
        }
      });
    });

    return Array.from(componentExpenses.values())
      .map(({ name, amount, quantity }) => ({
        componentName: name,
        amount,
        quantity
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 expenses
  }

  /**
   * Calculate budget status with limits and alerts
   */
  static calculateBudgetStatus(
    inventory: InventoryItem[],
    projects: Project[],
    budgetLimits?: { [category: string]: number },
    totalBudgetLimit?: number
  ): {
    totalSpent: number;
    totalBudgetLimit?: number;
    remainingBudget?: number;
    budgetUtilization?: number;
    categoryStatus: Array<{
      category: string;
      spent: number;
      limit?: number;
      utilization?: number;
      status: 'under' | 'near' | 'over';
    }>;
    alerts: Array<{
      type: 'warning' | 'danger' | 'info';
      category: string;
      message: string;
      currentSpending: number;
      limit?: number;
    }>;
  } {
    const spendingByCategory = this.calculateSpendingByCategory(inventory, projects);
    const totalSpent = spendingByCategory.reduce((sum, cat) => sum + cat.amount, 0);
    
    const categoryStatus = spendingByCategory.map(({ category, amount }) => {
      const limit = budgetLimits?.[category];
      const utilization = limit ? (amount / limit) * 100 : undefined;
      
      let status: 'under' | 'near' | 'over' = 'under';
      if (utilization !== undefined) {
        if (utilization >= 100) status = 'over';
        else if (utilization >= 80) status = 'near';
      }
      
      return {
        category,
        spent: amount,
        limit,
        utilization,
        status
      };
    });

    const alerts = this.generateBudgetAlerts(inventory, projects, budgetLimits);
    
    return {
      totalSpent,
      totalBudgetLimit,
      remainingBudget: totalBudgetLimit ? totalBudgetLimit - totalSpent : undefined,
      budgetUtilization: totalBudgetLimit ? (totalSpent / totalBudgetLimit) * 100 : undefined,
      categoryStatus,
      alerts
    };
  }

  /**
   * Generate spending forecasts based on historical data
   */
  static generateSpendingForecast(
    inventory: InventoryItem[],
    projects: Project[],
    forecastPeriodDays: number = 30
  ): {
    projectedSpending: number;
    confidence: number;
    breakdown: Array<{
      category: string;
      projectedAmount: number;
      trend: 'increasing' | 'stable' | 'decreasing';
    }>;
  } {
    const monthlyTrend = this.calculateMonthlyTrend(projects, inventory);
    const spendingByCategory = this.calculateSpendingByCategory(inventory, projects);
    
    // Calculate average monthly spending
    const averageMonthlySpending = monthlyTrend.length > 0 
      ? monthlyTrend.reduce((sum, month) => sum + month.amount, 0) / monthlyTrend.length
      : 0;
    
    // Project spending for the forecast period
    const projectedSpending = (averageMonthlySpending / 30) * forecastPeriodDays;
    
    // Calculate confidence based on data consistency
    const spendingVariance = monthlyTrend.length > 1 
      ? monthlyTrend.reduce((sum, month) => sum + Math.pow(month.amount - averageMonthlySpending, 2), 0) / monthlyTrend.length
      : 0;
    const confidence = Math.max(0, Math.min(100, 100 - (spendingVariance / averageMonthlySpending) * 100));
    
    // Generate category breakdown with trends
    const breakdown = spendingByCategory.map(({ category, amount, percentage }) => {
      const categoryProjected = (projectedSpending * percentage) / 100;
      
      // Simple trend analysis based on recent vs older data
      const recentMonths = monthlyTrend.slice(-3);
      const olderMonths = monthlyTrend.slice(0, -3);
      const recentAvg = recentMonths.length > 0 ? recentMonths.reduce((sum, m) => sum + m.amount, 0) / recentMonths.length : 0;
      const olderAvg = olderMonths.length > 0 ? olderMonths.reduce((sum, m) => sum + m.amount, 0) / olderMonths.length : 0;
      
      let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (recentAvg > olderAvg * 1.1) trend = 'increasing';
      else if (recentAvg < olderAvg * 0.9) trend = 'decreasing';
      
      return {
        category,
        projectedAmount: categoryProjected,
        trend
      };
    });
    
    return {
      projectedSpending,
      confidence,
      breakdown
    };
  }

  /**
   * Calculate return on investment for projects
   */
  static calculateProjectROI(
    project: Project,
    inventory: InventoryItem[]
  ): {
    totalInvestment: number;
    estimatedValue: number;
    roi: number;
    paybackPeriod?: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const projectCosts = this.calculateProjectCosts(project, inventory);
    const totalInvestment = projectCosts.totalCost;
    
    // Estimate project value based on complexity and component quality
    const componentCount = project.components.length;
    const averageComponentValue = totalInvestment / Math.max(componentCount, 1);
    
    // Simple heuristic for project value estimation
    let estimatedValue = totalInvestment * 1.2; // Base 20% value increase
    
    // Adjust based on project status
    if (project.status === 'Completed') {
      estimatedValue *= 1.5; // Completed projects have higher realized value
    } else if (project.status === 'In Progress') {
      estimatedValue *= 1.2; // In progress projects have some realized value
    }
    
    // Adjust based on component diversity (more diverse = potentially more valuable)
    const uniqueCategories = new Set(
      project.components
        .map(comp => inventory.find(item => item.id === comp.inventoryItemId)?.category)
        .filter(Boolean)
    ).size;
    
    if (uniqueCategories > 3) {
      estimatedValue *= 1.3; // Multi-category projects often more valuable
    }
    
    const roi = totalInvestment > 0 ? ((estimatedValue - totalInvestment) / totalInvestment) * 100 : 0;
    
    // Calculate risk level based on project complexity and investment size
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (totalInvestment > 500 || componentCount > 20) riskLevel = 'high';
    else if (totalInvestment > 200 || componentCount > 10) riskLevel = 'medium';
    
    // Estimate payback period (simplified)
    const paybackPeriod = roi > 0 ? (totalInvestment / (estimatedValue - totalInvestment)) * 12 : undefined; // months
    
    return {
      totalInvestment,
      estimatedValue,
      roi,
      paybackPeriod,
      riskLevel
    };
  }

  /**
   * Generate budget optimization recommendations
   */
  static generateBudgetOptimization(
    inventory: InventoryItem[],
    projects: Project[],
    budgetConstraints?: {
      totalBudget?: number;
      categoryLimits?: { [category: string]: number };
      timeframe?: number; // days
    }
  ): {
    currentEfficiency: number;
    optimizationOpportunities: Array<{
      type: 'reduce_waste' | 'bulk_purchase' | 'alternative_components' | 'project_prioritization';
      description: string;
      potentialSavings: number;
      effort: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
    }>;
    recommendedActions: string[];
  } {
    const spendingAnalysis = this.calculateSpendingAnalysis(inventory, projects);
    const currentEfficiency = spendingAnalysis.budgetEfficiency;
    
    const optimizationOpportunities: Array<{
      type: 'reduce_waste' | 'bulk_purchase' | 'alternative_components' | 'project_prioritization';
      description: string;
      potentialSavings: number;
      effort: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
    }> = [];
    
    // Identify unused inventory waste
    const unusedItems = inventory.filter(item => 
      !projects.some(project => 
        project.components.some(comp => comp.inventoryItemId === item.id)
      )
    );
    
    if (unusedItems.length > 0) {
      const wasteValue = unusedItems.reduce((sum, item) => 
        sum + (item.purchasePrice || 0) * item.quantity, 0
      );
      
      optimizationOpportunities.push({
        type: 'reduce_waste',
        description: `${unusedItems.length} unused components worth ${wasteValue.toFixed(2)} could be utilized in future projects`,
        potentialSavings: wasteValue * 0.8, // 80% of waste value could be recovered
        effort: 'low',
        impact: wasteValue > 100 ? 'high' : wasteValue > 50 ? 'medium' : 'low'
      });
    }
    
    // Identify bulk purchase opportunities
    const lowQuantityItems = inventory.filter(item => 
      item.quantity < 5 && (item.purchasePrice || 0) < 10
    );
    
    if (lowQuantityItems.length > 5) {
      const bulkSavings = lowQuantityItems.length * 2; // Estimated $2 savings per item
      
      optimizationOpportunities.push({
        type: 'bulk_purchase',
        description: `${lowQuantityItems.length} low-quantity items could benefit from bulk purchasing`,
        potentialSavings: bulkSavings,
        effort: 'medium',
        impact: 'medium'
      });
    }
    
    // Identify expensive components that could have alternatives
    const expensiveComponents = inventory.filter(item => 
      (item.purchasePrice || 0) > 50
    );
    
    if (expensiveComponents.length > 0) {
      const alternativeSavings = expensiveComponents.reduce((sum, item) => 
        sum + (item.purchasePrice || 0) * 0.2, 0 // Assume 20% savings with alternatives
      );
      
      optimizationOpportunities.push({
        type: 'alternative_components',
        description: `${expensiveComponents.length} expensive components could have lower-cost alternatives`,
        potentialSavings: alternativeSavings,
        effort: 'high',
        impact: alternativeSavings > 100 ? 'high' : 'medium'
      });
    }
    
    // Project prioritization recommendations
    const incompleteProjects = projects.filter(p => p.status !== 'Completed');
    if (incompleteProjects.length > 5) {
      optimizationOpportunities.push({
        type: 'project_prioritization',
        description: `${incompleteProjects.length} incomplete projects could be prioritized to improve ROI`,
        potentialSavings: 0, // Indirect savings through better resource utilization
        effort: 'medium',
        impact: 'high'
      });
    }
    
    // Generate recommended actions
    const recommendedActions = [
      ...spendingAnalysis.recommendations,
      ...optimizationOpportunities
        .filter(opp => opp.impact === 'high')
        .map(opp => opp.description)
    ].slice(0, 5);
    
    return {
      currentEfficiency,
      optimizationOpportunities: optimizationOpportunities.sort((a, b) => b.potentialSavings - a.potentialSavings),
      recommendedActions
    };
  }
}

export default BudgetService;