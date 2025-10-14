import { 
  InventoryItem, 
  Project, 
  UsageAnalytics, 
  ComponentUtilization, 
  CategoryUsage, 
  TrendingComponent, 
  WasteMetrics,
  SeasonalPattern,
  StockPrediction
} from '../types';

/**
 * Service for calculating real analytics from inventory and project data
 */
export class AnalyticsService {
  
  /**
   * Calculate comprehensive usage analytics from real data
   */
  static calculateUsageAnalytics(
    inventory: InventoryItem[], 
    projects: Project[]
  ): UsageAnalytics {
    const componentUtilization = this.calculateComponentUtilization(inventory, projects);
    const categoryBreakdown = this.calculateCategoryUsage(inventory, projects);
    const trendingComponents = this.calculateTrendingComponents(inventory, projects);
    const seasonalPatterns = this.calculateSeasonalPatterns(projects);
    const wasteAnalysis = this.calculateWasteMetrics(inventory, projects);

    return {
      totalProjects: projects.length,
      componentUtilization,
      categoryBreakdown,
      trendingComponents,
      seasonalPatterns,
      wasteAnalysis
    };
  }

  /**
   * Calculate component utilization rates from project usage
   */
  private static calculateComponentUtilization(
    inventory: InventoryItem[], 
    projects: Project[]
  ): ComponentUtilization[] {
    const utilizationMap = new Map<string, {
      componentName: string;
      totalUsed: number;
      projectCount: number;
      lastUsed: Date;
    }>();

    // Analyze project components
    projects.forEach(project => {
      const projectDate = new Date(project.createdAt);
      
      project.components.forEach(component => {
        if (!component.inventoryItemId) return; // Skip components without inventory links
        
        const existing = utilizationMap.get(component.inventoryItemId) || {
          componentName: '',
          totalUsed: 0,
          projectCount: 0,
          lastUsed: new Date(0)
        };

        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        if (inventoryItem) {
          existing.componentName = inventoryItem.name;
          existing.totalUsed += component.quantity;
          existing.projectCount += 1;
          
          if (projectDate > existing.lastUsed) {
            existing.lastUsed = projectDate;
          }
          
          utilizationMap.set(component.inventoryItemId, existing);
        }
      });
    });

    // Calculate utilization rates and convert to array
    const result: ComponentUtilization[] = [];
    
    utilizationMap.forEach((data, componentId) => {
      const inventoryItem = inventory.find(item => item.id === componentId);
      if (!inventoryItem) return;

      // Calculate utilization rate based on stock vs usage
      const totalStock = inventoryItem.quantity + data.totalUsed;
      const utilizationRate = totalStock > 0 ? (data.totalUsed / totalStock) * 100 : 0;
      
      // Calculate average projects per month
      const monthsSinceFirstUse = this.getMonthsSinceDate(data.lastUsed);
      const averageProjectsPerMonth = monthsSinceFirstUse > 0 ? data.projectCount / monthsSinceFirstUse : 0;

      result.push({
        componentId,
        componentName: data.componentName,
        utilizationRate: Math.min(100, utilizationRate),
        totalQuantityUsed: data.totalUsed,
        averageProjectsPerMonth,
        lastUsed: data.lastUsed.toISOString()
      });
    });

    return result.sort((a, b) => b.utilizationRate - a.utilizationRate);
  }

  /**
   * Calculate category usage statistics
   */
  private static calculateCategoryUsage(
    inventory: InventoryItem[], 
    projects: Project[]
  ): CategoryUsage[] {
    const categoryMap = new Map<string, {
      components: Set<string>;
      totalQuantityUsed: number;
      totalValue: number;
      recentUsage: number; // usage in last 3 months
      oldUsage: number; // usage before 3 months ago
    }>();

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Analyze project components by category
    projects.forEach(project => {
      const projectDate = new Date(project.createdAt);
      const isRecent = projectDate > threeMonthsAgo;
      
      project.components.forEach(component => {
        if (!component.inventoryItemId) return; // Skip components without inventory links
        
        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        if (!inventoryItem) return;

        const category = inventoryItem.category || 'Uncategorized';
        const existing = categoryMap.get(category) || {
          components: new Set(),
          totalQuantityUsed: 0,
          totalValue: 0,
          recentUsage: 0,
          oldUsage: 0
        };

        existing.components.add(component.inventoryItemId);
        existing.totalQuantityUsed += component.quantity;
        existing.totalValue += component.quantity * (inventoryItem.purchasePrice || 0);
        
        if (isRecent) {
          existing.recentUsage += component.quantity;
        } else {
          existing.oldUsage += component.quantity;
        }
        
        categoryMap.set(category, existing);
      });
    });

    // Convert to array and calculate trends
    const result: CategoryUsage[] = [];
    
    categoryMap.forEach((data, category) => {
      const averagePrice = data.totalQuantityUsed > 0 ? data.totalValue / data.totalQuantityUsed : 0;
      
      // Determine trend based on recent vs old usage
      let popularityTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
      if (data.recentUsage > data.oldUsage * 1.2) {
        popularityTrend = 'increasing';
      } else if (data.recentUsage < data.oldUsage * 0.8) {
        popularityTrend = 'decreasing';
      }

      result.push({
        category,
        totalComponents: data.components.size,
        totalQuantityUsed: data.totalQuantityUsed,
        averagePrice,
        popularityTrend
      });
    });

    return result.sort((a, b) => b.totalQuantityUsed - a.totalQuantityUsed);
  }

  /**
   * Calculate trending components based on usage growth
   */
  private static calculateTrendingComponents(
    inventory: InventoryItem[], 
    projects: Project[]
  ): TrendingComponent[] {
    const componentUsage = new Map<string, {
      name: string;
      recentUsage: number;
      oldUsage: number;
      totalProjects: number;
    }>();

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Analyze usage patterns
    projects.forEach(project => {
      const projectDate = new Date(project.createdAt);
      const isRecent = projectDate > threeMonthsAgo;
      
      project.components.forEach(component => {
        if (!component.inventoryItemId) return; // Skip components without inventory links
        
        const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
        if (!inventoryItem) return;

        const existing = componentUsage.get(component.inventoryItemId) || {
          name: inventoryItem.name,
          recentUsage: 0,
          oldUsage: 0,
          totalProjects: 0
        };

        if (isRecent) {
          existing.recentUsage += component.quantity;
        } else {
          existing.oldUsage += component.quantity;
        }
        existing.totalProjects += 1;
        
        componentUsage.set(component.inventoryItemId, existing);
      });
    });

    // Calculate trends and scores
    const result: TrendingComponent[] = [];
    
    componentUsage.forEach((data, componentId) => {
      if (data.totalProjects < 2) return; // Need at least 2 projects to determine trend
      
      // Calculate usage growth percentage
      const usageGrowth = data.oldUsage > 0 
        ? ((data.recentUsage - data.oldUsage) / data.oldUsage) * 100
        : data.recentUsage > 0 ? 100 : 0;
      
      // Calculate trend score (combination of growth and absolute usage)
      const trendScore = (usageGrowth * 0.7) + (data.recentUsage * 0.3);
      
      // Generate reasoning
      let reasonForTrend = 'Stable usage pattern';
      if (usageGrowth > 50) {
        reasonForTrend = 'Rapidly increasing usage in recent projects';
      } else if (usageGrowth > 20) {
        reasonForTrend = 'Growing popularity in new projects';
      } else if (usageGrowth < -20) {
        reasonForTrend = 'Declining usage, possibly being replaced';
      }

      result.push({
        componentId,
        componentName: data.name,
        trendScore: Math.max(0, trendScore),
        usageGrowth,
        reasonForTrend
      });
    });

    return result
      .filter(item => Math.abs(item.usageGrowth) > 10) // Only show significant trends
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 10); // Top 10 trending components
  }

  /**
   * Calculate seasonal usage patterns
   */
  private static calculateSeasonalPatterns(projects: Project[]): SeasonalPattern[] {
    const quarterlyData = new Map<string, {
      usage: number;
      categories: Map<string, number>;
      totalValue: number;
    }>();

    projects.forEach(project => {
      const date = new Date(project.createdAt);
      const quarter = `Q${Math.floor(date.getMonth() / 3) + 1}`;
      
      const existing = quarterlyData.get(quarter) || {
        usage: 0,
        categories: new Map(),
        totalValue: 0
      };

      existing.usage += project.components.length;
      
      project.components.forEach(component => {
        // Note: We'd need category info here, but it requires inventory lookup
        // For now, we'll use a simplified approach
        existing.totalValue += component.quantity;
      });
      
      quarterlyData.set(quarter, existing);
    });

    const result: SeasonalPattern[] = [];
    quarterlyData.forEach((data, period) => {
      const popularCategories = Array.from(data.categories.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);

      result.push({
        period,
        averageUsage: data.usage,
        popularCategories,
        budgetTrend: data.totalValue
      });
    });

    return result;
  }

  /**
   * Calculate waste metrics (unused components)
   */
  private static calculateWasteMetrics(
    inventory: InventoryItem[], 
    projects: Project[]
  ): WasteMetrics {
    const usedComponents = new Set<string>();
    
    // Track which components have been used
    projects.forEach(project => {
      project.components.forEach(component => {
        if (component.inventoryItemId) {
          usedComponents.add(component.inventoryItemId);
        }
      });
    });

    // Find unused components
    const unusedComponents = inventory.filter(item => !usedComponents.has(item.id));
    const totalWasteValue = unusedComponents.reduce((sum, item) => 
      sum + (item.purchasePrice || 0) * item.quantity, 0
    );

    // Group by category
    const wasteByCategory = new Map<string, { count: number; value: number }>();
    unusedComponents.forEach(item => {
      const category = item.category || 'Uncategorized';
      const existing = wasteByCategory.get(category) || { count: 0, value: 0 };
      existing.count += item.quantity;
      existing.value += (item.purchasePrice || 0) * item.quantity;
      wasteByCategory.set(category, existing);
    });

    // Generate suggestions
    const suggestions: string[] = [];
    if (unusedComponents.length > 0) {
      suggestions.push(`Consider using ${unusedComponents.length} unused components in upcoming projects`);
      
      if (totalWasteValue > 100) {
        suggestions.push(`Unused inventory worth $${totalWasteValue.toFixed(2)} could be repurposed`);
      }
      
      const topWasteCategory = Array.from(wasteByCategory.entries())
        .sort((a, b) => b[1].value - a[1].value)[0];
      
      if (topWasteCategory) {
        suggestions.push(`Focus on using ${topWasteCategory[0]} components (highest waste value)`);
      }
    }

    return {
      unusedComponents: unusedComponents.length,
      totalWasteValue,
      wasteByCategory: Array.from(wasteByCategory.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        value: data.value
      })),
      suggestions
    };
  }

  /**
   * Generate stock predictions based on usage patterns
   */
  static generateStockPredictions(
    inventory: InventoryItem[], 
    projects: Project[]
  ): StockPrediction[] {
    const predictions: StockPrediction[] = [];
    
    // Calculate consumption rates for each component
    const componentUsage = new Map<string, {
      totalUsed: number;
      projectCount: number;
      firstUsed: Date;
      lastUsed: Date;
    }>();

    projects.forEach(project => {
      const projectDate = new Date(project.createdAt);
      
      project.components.forEach(component => {
        if (!component.inventoryItemId) return; // Skip components without inventory links
        
        const existing = componentUsage.get(component.inventoryItemId) || {
          totalUsed: 0,
          projectCount: 0,
          firstUsed: projectDate,
          lastUsed: projectDate
        };

        existing.totalUsed += component.quantity;
        existing.projectCount += 1;
        
        if (projectDate < existing.firstUsed) existing.firstUsed = projectDate;
        if (projectDate > existing.lastUsed) existing.lastUsed = projectDate;
        
        componentUsage.set(component.inventoryItemId, existing);
      });
    });

    // Generate predictions for components with usage history
    componentUsage.forEach((usage, componentId) => {
      const inventoryItem = inventory.find(item => item.id === componentId);
      if (!inventoryItem || usage.projectCount < 2) return;

      // Calculate consumption rate (units per day)
      const usagePeriodDays = Math.max(1, 
        (usage.lastUsed.getTime() - usage.firstUsed.getTime()) / (1000 * 60 * 60 * 24)
      );
      const consumptionRate = usage.totalUsed / usagePeriodDays;

      // Predict depletion date
      const daysUntilDepletion = consumptionRate > 0 ? inventoryItem.quantity / consumptionRate : Infinity;
      const predictedDepletionDate = new Date();
      predictedDepletionDate.setDate(predictedDepletionDate.getDate() + daysUntilDepletion);

      // Calculate confidence based on usage consistency
      const confidence = Math.min(0.95, usage.projectCount / 10); // Higher confidence with more data points

      // Determine recommended reorder quantity (2-3 months supply)
      const recommendedReorderQuantity = Math.ceil(consumptionRate * 60); // 60 days supply

      predictions.push({
        componentId,
        currentStock: inventoryItem.quantity,
        predictedDepletionDate: predictedDepletionDate.toISOString(),
        recommendedReorderQuantity,
        confidence,
        consumptionRate,
        factors: [
          `Based on ${usage.projectCount} projects`,
          `Average usage: ${(usage.totalUsed / usage.projectCount).toFixed(1)} units per project`,
          `Usage period: ${Math.ceil(usagePeriodDays)} days`
        ]
      });
    });

    return predictions
      .filter(p => p.consumptionRate > 0 && isFinite(p.consumptionRate))
      .sort((a, b) => new Date(a.predictedDepletionDate).getTime() - new Date(b.predictedDepletionDate).getTime());
  }

  /**
   * Helper function to calculate months since a date
   */
  private static getMonthsSinceDate(date: Date): number {
    const now = new Date();
    const yearDiff = now.getFullYear() - date.getFullYear();
    const monthDiff = now.getMonth() - date.getMonth();
    return Math.max(1, yearDiff * 12 + monthDiff);
  }
}

export default AnalyticsService;