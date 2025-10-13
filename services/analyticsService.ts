import DatabaseService from "./databaseService.js";
import { RecommendationErrorHandler } from "./errorHandler.js";
import {
  UsageAnalytics,
  ComponentUtilization,
  CategoryUsage,
  TrendingComponent,
  SeasonalPattern,
  WasteMetrics,
  InventoryItem,
  Project,
  UsageMetrics,
  ProjectPattern,
} from "../types.js";

/**
 * Configuration for the analytics service
 */
export interface AnalyticsConfig {
  analysisTimeframe: {
    short: number; // days
    medium: number; // days
    long: number; // days
  };
  trendThresholds: {
    minUsageForTrend: number;
    growthRateThreshold: number; // percentage
    confidenceThreshold: number;
  };
  cacheExpirationHours: number;
  enableSeasonalAnalysis: boolean;
}

/**
 * Default analytics configuration
 */
const DEFAULT_CONFIG: AnalyticsConfig = {
  analysisTimeframe: {
    short: 30, // 1 month
    medium: 90, // 3 months
    long: 365, // 1 year
  },
  trendThresholds: {
    minUsageForTrend: 3,
    growthRateThreshold: 20, // 20% growth
    confidenceThreshold: 0.7,
  },
  cacheExpirationHours: 6, // Analytics data changes frequently
  enableSeasonalAnalysis: true,
};

/**
 * Time period for analysis
 */
export type AnalysisTimeframe = "short" | "medium" | "long" | "custom";

/**
 * Analytics service for usage pattern recognition and insights
 */
export class AnalyticsService {
  private dbService: DatabaseService;
  private errorHandler: RecommendationErrorHandler;
  private config: AnalyticsConfig;

  constructor(
    dbService: DatabaseService,
    errorHandler: RecommendationErrorHandler,
    config: Partial<AnalyticsConfig> = {}
  ) {
    this.dbService = dbService;
    this.errorHandler = errorHandler;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze usage patterns across different timeframes
   */
  async analyzeUsagePatterns(
    timeframe: string = "medium"
  ): Promise<UsageAnalytics> {
    try {
      const cacheKey = `usage_patterns_${timeframe}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      const timeframeDays = this.getTimeframeDays(
        timeframe as AnalysisTimeframe
      );
      const cutoffDate = new Date(
        Date.now() - timeframeDays * 24 * 60 * 60 * 1000
      );

      // Get all inventory items and their usage metrics
      const allItems = this.dbService.getAllItems();
      const totalProjects = await this.getTotalProjectsInTimeframe(cutoffDate);

      // Calculate component utilization
      const componentUtilization = await this.calculateComponentUtilization(
        allItems,
        cutoffDate
      );

      // Calculate category usage breakdown
      const categoryBreakdown = await this.calculateCategoryUsage(
        allItems,
        cutoffDate
      );

      // Identify trending components
      const trendingComponents = await this.identifyTrendingComponents(
        allItems,
        cutoffDate
      );

      // Analyze seasonal patterns if enabled
      const seasonalPatterns = this.config.enableSeasonalAnalysis
        ? await this.analyzeSeasonalPatterns(cutoffDate)
        : [];

      // Calculate waste analysis
      const wasteAnalysis = await this.calculateWasteMetrics(allItems);

      const analytics: UsageAnalytics = {
        totalProjects,
        componentUtilization,
        categoryBreakdown,
        trendingComponents,
        seasonalPatterns,
        wasteAnalysis,
      };

      // Cache the results
      this.dbService.setCacheData(
        cacheKey,
        analytics,
        this.config.cacheExpirationHours
      );

      return analytics;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: "analyzeUsagePatterns", additionalData: { timeframe } },
        {
          totalProjects: 0,
          componentUtilization: [],
          categoryBreakdown: [],
          trendingComponents: [],
          seasonalPatterns: [],
          wasteAnalysis: {
            unusedComponents: 0,
            totalWasteValue: 0,
            wasteByCategory: [],
            suggestions: [],
          },
        }
      );
    }
  }

  /**
   * Calculate component utilization rates
   */
  private async calculateComponentUtilization(
    items: InventoryItem[],
    cutoffDate: Date
  ): Promise<ComponentUtilization[]> {
    const utilization: ComponentUtilization[] = [];

    for (const item of items) {
      const metrics = this.dbService.getUsageMetrics(item.id);

      if (metrics) {
        // Calculate utilization rate based on quantity vs usage
        const utilizationRate =
          item.quantity > 0
            ? Math.min((metrics.totalUsed / item.quantity) * 100, 100)
            : metrics.totalUsed > 0
            ? 100
            : 0;

        // Calculate average projects per month
        const monthsSinceCreation = this.getMonthsSince(
          new Date(item.createdAt)
        );
        const averageProjectsPerMonth =
          monthsSinceCreation > 0
            ? metrics.projectsUsedIn / monthsSinceCreation
            : 0;

        utilization.push({
          componentId: item.id,
          componentName: item.name,
          utilizationRate,
          totalQuantityUsed: metrics.totalUsed,
          averageProjectsPerMonth,
          lastUsed: metrics.lastUsedDate,
        });
      } else {
        // Component never used
        utilization.push({
          componentId: item.id,
          componentName: item.name,
          utilizationRate: 0,
          totalQuantityUsed: 0,
          averageProjectsPerMonth: 0,
          lastUsed: "Never",
        });
      }
    }

    // Sort by utilization rate descending
    return utilization.sort((a, b) => b.utilizationRate - a.utilizationRate);
  }

  /**
   * Calculate category usage statistics
   */
  private async calculateCategoryUsage(
    items: InventoryItem[],
    cutoffDate: Date
  ): Promise<CategoryUsage[]> {
    const categoryStats = new Map<
      string,
      {
        totalComponents: number;
        totalQuantityUsed: number;
        totalValue: number;
        usageHistory: { date: string; usage: number }[];
      }
    >();

    // Group items by category
    for (const item of items) {
      const category = item.category || "Uncategorized";

      if (!categoryStats.has(category)) {
        categoryStats.set(category, {
          totalComponents: 0,
          totalQuantityUsed: 0,
          totalValue: 0,
          usageHistory: [],
        });
      }

      const stats = categoryStats.get(category)!;
      stats.totalComponents++;

      const metrics = this.dbService.getUsageMetrics(item.id);
      if (metrics) {
        stats.totalQuantityUsed += metrics.totalUsed;
      }

      if (item.purchasePrice) {
        stats.totalValue += item.purchasePrice * item.quantity;
      }
    }

    // Convert to CategoryUsage array with trend analysis
    const categoryUsage: CategoryUsage[] = [];

    for (const [category, stats] of categoryStats) {
      const averagePrice =
        stats.totalComponents > 0
          ? stats.totalValue / stats.totalComponents
          : 0;

      // Simple trend analysis (would be enhanced with historical data)
      const popularityTrend = this.calculateCategoryTrend(category, stats);

      categoryUsage.push({
        category,
        totalComponents: stats.totalComponents,
        totalQuantityUsed: stats.totalQuantityUsed,
        averagePrice,
        popularityTrend,
      });
    }

    // Sort by total quantity used descending
    return categoryUsage.sort(
      (a, b) => b.totalQuantityUsed - a.totalQuantityUsed
    );
  }

  /**
   * Identify trending components based on usage growth
   */
  private async identifyTrendingComponents(
    items: InventoryItem[],
    cutoffDate: Date
  ): Promise<TrendingComponent[]> {
    const trending: TrendingComponent[] = [];

    for (const item of items) {
      const metrics = this.dbService.getUsageMetrics(item.id);

      if (
        metrics &&
        metrics.totalUsed >= this.config.trendThresholds.minUsageForTrend
      ) {
        // Calculate trend score based on recent usage vs historical average
        const trendScore = this.calculateTrendScore(item, metrics);
        const usageGrowth = this.calculateUsageGrowth(item, metrics);

        if (
          Math.abs(usageGrowth) >=
          this.config.trendThresholds.growthRateThreshold
        ) {
          trending.push({
            componentId: item.id,
            componentName: item.name,
            trendScore,
            usageGrowth,
            reasonForTrend: this.generateTrendReason(usageGrowth, metrics),
          });
        }
      }
    }

    // Sort by trend score descending
    return trending.sort((a, b) => b.trendScore - a.trendScore).slice(0, 10);
  }

  /**
   * Analyze seasonal usage patterns
   */
  private async analyzeSeasonalPatterns(
    cutoffDate: Date
  ): Promise<SeasonalPattern[]> {
    const patterns: SeasonalPattern[] = [];

    // Analyze quarterly patterns
    const quarters = ["Q1", "Q2", "Q3", "Q4"];

    for (const quarter of quarters) {
      const quarterData = await this.getQuarterlyData(quarter);

      patterns.push({
        period: quarter,
        averageUsage: quarterData.averageUsage,
        popularCategories: quarterData.popularCategories,
        budgetTrend: quarterData.budgetTrend,
      });
    }

    return patterns;
  }

  /**
   * Calculate waste metrics for unused components
   */
  private async calculateWasteMetrics(
    items: InventoryItem[]
  ): Promise<WasteMetrics> {
    let unusedComponents = 0;
    let totalWasteValue = 0;
    const wasteByCategory = new Map<string, { count: number; value: number }>();

    for (const item of items) {
      const metrics = this.dbService.getUsageMetrics(item.id);

      // Consider component unused if never used or not used in last 6 months
      const isUnused =
        !metrics ||
        metrics.totalUsed === 0 ||
        this.isStale(metrics.lastUsedDate, 180); // 6 months

      if (isUnused && item.quantity > 0) {
        unusedComponents++;

        const itemValue = (item.purchasePrice || 0) * item.quantity;
        totalWasteValue += itemValue;

        const category = item.category || "Uncategorized";
        const categoryWaste = wasteByCategory.get(category) || {
          count: 0,
          value: 0,
        };
        categoryWaste.count++;
        categoryWaste.value += itemValue;
        wasteByCategory.set(category, categoryWaste);
      }
    }

    // Convert category waste to array
    const wasteByCategories = Array.from(wasteByCategory.entries()).map(
      ([category, waste]) => ({
        category,
        count: waste.count,
        value: waste.value,
      })
    );

    // Generate waste reduction suggestions
    const suggestions = this.generateWasteSuggestions(
      unusedComponents,
      totalWasteValue,
      wasteByCategories
    );

    return {
      unusedComponents,
      totalWasteValue,
      wasteByCategory: wasteByCategories,
      suggestions,
    };
  }

  /**
   * Predict stock depletion for a component
   */
  async predictStockDepletion(componentId: string): Promise<{
    predictedDepletionDate: string | null;
    confidence: number;
    consumptionRate: number;
    recommendedReorderQuantity: number;
    factors: string[];
  }> {
    try {
      const cacheKey = `stock_prediction_${componentId}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      const component = this.dbService.getItemById(componentId);
      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }

      const metrics = this.dbService.getUsageMetrics(componentId);
      if (!metrics || metrics.totalUsed === 0) {
        return {
          predictedDepletionDate: null,
          confidence: 0,
          consumptionRate: 0,
          recommendedReorderQuantity: 0,
          factors: ["No usage history available"],
        };
      }

      // Calculate consumption rate (units per month)
      const monthsSinceCreation = this.getMonthsSince(
        new Date(component.createdAt)
      );
      const consumptionRate =
        monthsSinceCreation > 0 ? metrics.totalUsed / monthsSinceCreation : 0;

      // Predict depletion date
      const currentStock = component.quantity;
      const monthsUntilDepletion =
        consumptionRate > 0 ? currentStock / consumptionRate : Infinity;

      const predictedDepletionDate =
        monthsUntilDepletion < 120 // 10 years max
          ? new Date(
              Date.now() + monthsUntilDepletion * 30 * 24 * 60 * 60 * 1000
            ).toISOString()
          : null;

      // Calculate confidence based on usage consistency
      const confidence = this.calculatePredictionConfidence(
        metrics,
        monthsSinceCreation
      );

      // Recommend reorder quantity (3 months supply + safety stock)
      const recommendedReorderQuantity = Math.ceil(consumptionRate * 3 * 1.2); // 20% safety stock

      // Identify factors affecting prediction
      const factors = this.identifyPredictionFactors(
        component,
        metrics,
        consumptionRate
      );

      const prediction = {
        predictedDepletionDate,
        confidence,
        consumptionRate,
        recommendedReorderQuantity,
        factors,
      };

      // Cache the prediction
      this.dbService.setCacheData(
        cacheKey,
        prediction,
        this.config.cacheExpirationHours
      );

      return prediction;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: "predictStockDepletion", componentId },
        {
          predictedDepletionDate: null,
          confidence: 0,
          consumptionRate: 0,
          recommendedReorderQuantity: 0,
          factors: ["Prediction failed"],
        }
      );
    }
  }

  /**
   * Calculate component popularity within a category
   */
  async calculateComponentPopularity(category?: string): Promise<{
    popularComponents: {
      componentId: string;
      name: string;
      popularityScore: number;
    }[];
    categoryRanking: { category: string; popularityScore: number }[];
    trendingUp: string[];
    trendingDown: string[];
  }> {
    try {
      const cacheKey = `popularity_${category || "all"}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      const allItems = category
        ? this.dbService.getItemsByCategory(category)
        : this.dbService.getAllItems();

      // Calculate popularity scores
      const popularComponents = allItems
        .map((item) => {
          const metrics = this.dbService.getUsageMetrics(item.id);
          const popularityScore = this.calculatePopularityScore(item, metrics);

          return {
            componentId: item.id,
            name: item.name,
            popularityScore,
          };
        })
        .sort((a, b) => b.popularityScore - a.popularityScore);

      // Calculate category rankings if no specific category
      const categoryRanking = category
        ? []
        : await this.calculateCategoryPopularity();

      // Identify trending components
      const trendingUp: string[] = [];
      const trendingDown: string[] = [];

      for (const item of allItems) {
        const metrics = this.dbService.getUsageMetrics(item.id);
        if (metrics) {
          const growth = this.calculateUsageGrowth(item, metrics);
          if (growth > 20) trendingUp.push(item.name);
          if (growth < -20) trendingDown.push(item.name);
        }
      }

      const popularity = {
        popularComponents: popularComponents.slice(0, 20), // Top 20
        categoryRanking,
        trendingUp: trendingUp.slice(0, 10),
        trendingDown: trendingDown.slice(0, 10),
      };

      this.dbService.setCacheData(
        cacheKey,
        popularity,
        this.config.cacheExpirationHours
      );
      return popularity;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "calculateComponentPopularity",
          additionalData: { category },
        },
        {
          popularComponents: [],
          categoryRanking: [],
          trendingUp: [],
          trendingDown: [],
        }
      );
    }
  }

  /**
   * Generate spending insights and trends
   */
  async generateSpendingInsights(timeframe: string = "medium"): Promise<{
    totalSpent: number;
    spendingByCategory: {
      category: string;
      amount: number;
      percentage: number;
    }[];
    monthlyTrend: { month: string; amount: number }[];
    topExpenses: { componentName: string; amount: number; quantity: number }[];
    budgetEfficiency: number;
    recommendations: string[];
  }> {
    try {
      const cacheKey = `spending_insights_${timeframe}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      const timeframeDays = this.getTimeframeDays(
        timeframe as AnalysisTimeframe
      );
      const cutoffDate = new Date(
        Date.now() - timeframeDays * 24 * 60 * 60 * 1000
      );

      const allItems = this.dbService.getAllItems();
      const recentItems = allItems.filter(
        (item) => item.purchaseDate && new Date(item.purchaseDate) >= cutoffDate
      );

      // Calculate total spending
      const totalSpent = recentItems.reduce(
        (sum, item) => sum + (item.purchasePrice || 0) * item.quantity,
        0
      );

      // Spending by category
      const categorySpending = new Map<string, number>();
      recentItems.forEach((item) => {
        const category = item.category || "Uncategorized";
        const amount = (item.purchasePrice || 0) * item.quantity;
        categorySpending.set(
          category,
          (categorySpending.get(category) || 0) + amount
        );
      });

      const spendingByCategory = Array.from(categorySpending.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Monthly trend (simplified)
      const monthlyTrend = this.calculateMonthlySpendingTrend(recentItems);

      // Top expenses
      const topExpenses = recentItems
        .map((item) => ({
          componentName: item.name,
          amount: (item.purchasePrice || 0) * item.quantity,
          quantity: item.quantity,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10);

      // Budget efficiency (usage vs spending)
      const budgetEfficiency = this.calculateBudgetEfficiency(recentItems);

      // Generate recommendations
      const recommendations = this.generateSpendingRecommendations(
        spendingByCategory,
        budgetEfficiency,
        topExpenses
      );

      const insights = {
        totalSpent,
        spendingByCategory,
        monthlyTrend,
        topExpenses,
        budgetEfficiency,
        recommendations,
      };

      this.dbService.setCacheData(
        cacheKey,
        insights,
        this.config.cacheExpirationHours
      );
      return insights;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "generateSpendingInsights",
          additionalData: { timeframe },
        },
        {
          totalSpent: 0,
          spendingByCategory: [],
          monthlyTrend: [],
          topExpenses: [],
          budgetEfficiency: 0,
          recommendations: [],
        }
      );
    }
  }

  /**
   * Identify project patterns for a user
   */
  async identifyProjectPatterns(
    userId: string = "default"
  ): Promise<ProjectPattern[]> {
    try {
      const cacheKey = `project_patterns_${userId}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // This would analyze actual project data
      // For now, return common patterns based on component usage
      const patterns = await this.analyzeCommonProjectPatterns();

      this.dbService.setCacheData(
        cacheKey,
        patterns,
        this.config.cacheExpirationHours
      );
      return patterns;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: "identifyProjectPatterns", userId },
        []
      );
    }
  }

  // Helper methods

  private getTimeframeDays(timeframe: AnalysisTimeframe): number {
    switch (timeframe) {
      case "short":
        return this.config.analysisTimeframe.short;
      case "medium":
        return this.config.analysisTimeframe.medium;
      case "long":
        return this.config.analysisTimeframe.long;
      default:
        return this.config.analysisTimeframe.medium;
    }
  }

  private async getTotalProjectsInTimeframe(cutoffDate: Date): Promise<number> {
    // This would query actual project data
    // For now, estimate based on component usage
    const allItems = this.dbService.getAllItems();
    const totalProjectsEstimate = allItems.reduce((sum, item) => {
      const metrics = this.dbService.getUsageMetrics(item.id);
      return sum + (metrics?.projectsUsedIn || 0);
    }, 0);

    return Math.max(totalProjectsEstimate / 3, 1); // Rough estimate
  }

  private getMonthsSince(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return diffTime / (1000 * 60 * 60 * 24 * 30); // Approximate months
  }

  private calculateCategoryTrend(
    category: string,
    stats: any
  ): "increasing" | "stable" | "decreasing" {
    // Simplified trend calculation
    // In a real implementation, this would analyze historical data
    if (stats.totalQuantityUsed > stats.totalComponents * 2)
      return "increasing";
    if (stats.totalQuantityUsed < stats.totalComponents * 0.5)
      return "decreasing";
    return "stable";
  }

  private calculateTrendScore(
    item: InventoryItem,
    metrics: UsageMetrics
  ): number {
    // Calculate trend score based on usage frequency and recency
    const recencyScore = this.isStale(metrics.lastUsedDate, 30) ? 0 : 50;
    const frequencyScore =
      metrics.usageFrequency === "high"
        ? 50
        : metrics.usageFrequency === "medium"
        ? 25
        : 10;

    return recencyScore + frequencyScore;
  }

  private calculateUsageGrowth(
    item: InventoryItem,
    metrics: UsageMetrics
  ): number {
    // Simplified growth calculation
    // In reality, this would compare recent vs historical usage
    const monthsSinceCreation = this.getMonthsSince(new Date(item.createdAt));
    const monthlyUsage =
      monthsSinceCreation > 0 ? metrics.totalUsed / monthsSinceCreation : 0;

    // Estimate growth based on usage frequency
    if (metrics.usageFrequency === "high") return 30;
    if (metrics.usageFrequency === "medium") return 10;
    return -5;
  }

  private generateTrendReason(
    usageGrowth: number,
    metrics: UsageMetrics
  ): string {
    if (usageGrowth > 0) {
      return `Increasing usage trend (+${usageGrowth.toFixed(
        1
      )}%) - component becoming more popular`;
    } else {
      return `Decreasing usage trend (${usageGrowth.toFixed(
        1
      )}%) - component usage declining`;
    }
  }

  private async getQuarterlyData(quarter: string): Promise<{
    averageUsage: number;
    popularCategories: string[];
    budgetTrend: number;
  }> {
    // Simplified quarterly analysis
    return {
      averageUsage: Math.random() * 100,
      popularCategories: ["Development Board", "Sensor", "Display"],
      budgetTrend: (Math.random() - 0.5) * 20,
    };
  }

  private isStale(dateString: string, daysThreshold: number): boolean {
    if (!dateString || dateString === "Never") return true;

    const date = new Date(dateString);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    return diffDays > daysThreshold;
  }

  private generateWasteSuggestions(
    unusedCount: number,
    wasteValue: number,
    wasteByCategory: { category: string; count: number; value: number }[]
  ): string[] {
    const suggestions: string[] = [];

    if (unusedCount > 10) {
      suggestions.push(
        `Consider reviewing ${unusedCount} unused components for potential projects or disposal`
      );
    }

    if (wasteValue > 100) {
      suggestions.push(
        `$${wasteValue.toFixed(
          2
        )} in unused inventory - consider component sharing or selling`
      );
    }

    const topWasteCategory = wasteByCategory.sort(
      (a, b) => b.value - a.value
    )[0];
    if (topWasteCategory && topWasteCategory.count > 3) {
      suggestions.push(
        `High waste in ${topWasteCategory.category} category - review purchasing patterns`
      );
    }

    return suggestions;
  }

  private calculatePredictionConfidence(
    metrics: UsageMetrics,
    monthsSinceCreation: number
  ): number {
    let confidence = 0.5; // Base confidence

    // More usage history increases confidence
    if (metrics.projectsUsedIn >= 5) confidence += 0.3;
    else if (metrics.projectsUsedIn >= 2) confidence += 0.1;

    // Longer history increases confidence
    if (monthsSinceCreation >= 6) confidence += 0.2;
    else if (monthsSinceCreation >= 3) confidence += 0.1;

    // Regular usage increases confidence
    if (metrics.usageFrequency === "high") confidence += 0.2;
    else if (metrics.usageFrequency === "medium") confidence += 0.1;

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  private identifyPredictionFactors(
    component: InventoryItem,
    metrics: UsageMetrics,
    consumptionRate: number
  ): string[] {
    const factors: string[] = [];

    if (metrics.projectsUsedIn < 3) {
      factors.push("Limited usage history may affect accuracy");
    }

    if (consumptionRate < 0.5) {
      factors.push(
        "Low consumption rate - component may last longer than predicted"
      );
    }

    if (metrics.usageFrequency === "high") {
      factors.push("High usage frequency indicates consistent demand");
    }

    if (component.category === "Consumables") {
      factors.push("Consumable category may have different usage patterns");
    }

    return factors;
  }

  private calculatePopularityScore(
    item: InventoryItem,
    metrics: UsageMetrics | null
  ): number {
    if (!metrics) return 0;

    let score = 0;

    // Usage frequency weight
    score +=
      metrics.usageFrequency === "high"
        ? 40
        : metrics.usageFrequency === "medium"
        ? 20
        : 5;

    // Total usage weight
    score += Math.min(metrics.totalUsed * 2, 30);

    // Project count weight
    score += Math.min(metrics.projectsUsedIn * 5, 25);

    // Success rate weight
    score += metrics.successRate * 5;

    return Math.min(score, 100);
  }

  private async calculateCategoryPopularity(): Promise<
    { category: string; popularityScore: number }[]
  > {
    const allItems = this.dbService.getAllItems();
    const categoryScores = new Map<string, number>();

    allItems.forEach((item) => {
      const category = item.category || "Uncategorized";
      const metrics = this.dbService.getUsageMetrics(item.id);
      const score = this.calculatePopularityScore(item, metrics);

      categoryScores.set(category, (categoryScores.get(category) || 0) + score);
    });

    return Array.from(categoryScores.entries())
      .map(([category, score]) => ({ category, popularityScore: score }))
      .sort((a, b) => b.popularityScore - a.popularityScore);
  }

  private calculateMonthlySpendingTrend(
    items: InventoryItem[]
  ): { month: string; amount: number }[] {
    const monthlySpending = new Map<string, number>();

    items.forEach((item) => {
      if (item.purchaseDate) {
        const date = new Date(item.purchaseDate);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
        const amount = (item.purchasePrice || 0) * item.quantity;

        monthlySpending.set(
          monthKey,
          (monthlySpending.get(monthKey) || 0) + amount
        );
      }
    });

    return Array.from(monthlySpending.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private calculateBudgetEfficiency(items: InventoryItem[]): number {
    let totalSpent = 0;
    let totalUsed = 0;

    items.forEach((item) => {
      const spent = (item.purchasePrice || 0) * item.quantity;
      totalSpent += spent;

      const metrics = this.dbService.getUsageMetrics(item.id);
      if (metrics && metrics.totalUsed > 0) {
        totalUsed += spent; // Count as efficiently used if used at all
      }
    });

    return totalSpent > 0 ? (totalUsed / totalSpent) * 100 : 0;
  }

  private generateSpendingRecommendations(
    spendingByCategory: {
      category: string;
      amount: number;
      percentage: number;
    }[],
    budgetEfficiency: number,
    topExpenses: { componentName: string; amount: number; quantity: number }[]
  ): string[] {
    const recommendations: string[] = [];

    if (budgetEfficiency < 60) {
      recommendations.push(
        "Consider reviewing purchasing decisions - low budget efficiency detected"
      );
    }

    const topCategory = spendingByCategory[0];
    if (topCategory && topCategory.percentage > 50) {
      recommendations.push(
        `High spending concentration in ${topCategory.category} - consider diversifying purchases`
      );
    }

    const expensiveItem = topExpenses[0];
    if (expensiveItem && expensiveItem.amount > 100) {
      recommendations.push(
        `Review high-value purchase: ${expensiveItem.componentName} ($${expensiveItem.amount})`
      );
    }

    return recommendations;
  }

  private async analyzeCommonProjectPatterns(): Promise<ProjectPattern[]> {
    // This would analyze actual project data
    // For now, return some common patterns based on component categories
    return [
      {
        patternId: "iot-sensor-project",
        name: "IoT Sensor Project",
        description:
          "Common pattern for IoT projects with sensors and connectivity",
        commonComponents: [
          "Development Board",
          "Sensor",
          "WiFi Module",
          "Power Supply",
        ],
        averageCost: 45.99,
        averageTime: "2-3 weeks",
        successRate: 0.85,
        difficulty: "intermediate",
        tags: ["IoT", "Sensors", "Connectivity"],
      },
      {
        patternId: "led-display-project",
        name: "LED Display Project",
        description: "Projects involving LED displays and controllers",
        commonComponents: ["Development Board", "LED", "Display", "Resistor"],
        averageCost: 32.5,
        averageTime: "1-2 weeks",
        successRate: 0.92,
        difficulty: "beginner",
        tags: ["LED", "Display", "Visual"],
      },
    ];
  }
}

export default AnalyticsService;
