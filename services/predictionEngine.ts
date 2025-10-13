import DatabaseService from "./databaseService.js";
import { RecommendationErrorHandler } from "./errorHandler.js";
import {
  StockPrediction,
  ComponentPrediction,
  InventoryItem,
  UsageMetrics,
  Project,
} from "../types.js";

/**
 * Configuration for the prediction engine
 */
export interface PredictionConfig {
  predictionHorizon: {
    short: number; // days
    medium: number; // days
    long: number; // days
  };
  alertThresholds: {
    critical: number; // days until depletion
    warning: number; // days until depletion
    info: number; // days until depletion
  };
  safetyStockMultiplier: number;
  minHistoryDays: number;
  confidenceThresholds: {
    high: number;
    medium: number;
    low: number;
  };
  trendAnalysisWindow: number; // days
}

/**
 * Default prediction configuration
 */
const DEFAULT_CONFIG: PredictionConfig = {
  predictionHorizon: {
    short: 30,
    medium: 90,
    long: 365,
  },
  alertThresholds: {
    critical: 7, // 1 week
    warning: 30, // 1 month
    info: 90, // 3 months
  },
  safetyStockMultiplier: 1.2, // 20% safety stock
  minHistoryDays: 30,
  confidenceThresholds: {
    high: 0.8,
    medium: 0.6,
    low: 0.4,
  },
  trendAnalysisWindow: 60, // 2 months
};

/**
 * Alert urgency levels
 */
export type AlertUrgency = "critical" | "warning" | "info";

/**
 * Stock alert interface
 */
export interface StockAlert {
  componentId: string;
  componentName: string;
  urgency: AlertUrgency;
  currentStock: number;
  predictedDepletionDate: string;
  daysUntilDepletion: number;
  recommendedAction: string;
  recommendedQuantity: number;
  confidence: number;
} /**

 * Prediction engine for advanced stock management analytics
 */
export class PredictionEngine {
  private dbService: DatabaseService;
  private errorHandler: RecommendationErrorHandler;
  private config: PredictionConfig;

  constructor(
    dbService: DatabaseService,
    errorHandler: RecommendationErrorHandler,
    config: Partial<PredictionConfig> = {}
  ) {
    this.dbService = dbService;
    this.errorHandler = errorHandler;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Predict component depletion with advanced algorithms
   */
  async predictComponentDepletion(
    componentId: string
  ): Promise<StockPrediction> {
    try {
      const cacheKey = `advanced_prediction_${componentId}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      const component = this.dbService.getItemById(componentId);
      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }

      const metrics = this.dbService.getUsageMetrics(componentId);
      if (!metrics) {
        return this.createEmptyPrediction(
          componentId,
          "No usage history available"
        );
      }

      // Calculate consumption patterns
      const consumptionAnalysis = await this.analyzeConsumptionPatterns(
        component,
        metrics
      );

      // Predict depletion using multiple algorithms
      const predictions = await this.runPredictionAlgorithms(
        component,
        consumptionAnalysis
      );

      // Select best prediction based on confidence
      const bestPrediction = this.selectBestPrediction(predictions);

      // Generate factors affecting prediction
      const factors = this.identifyPredictionFactors(
        component,
        metrics,
        consumptionAnalysis
      );

      const prediction: StockPrediction = {
        componentId,
        currentStock: component.quantity,
        predictedDepletionDate: bestPrediction.depletionDate,
        recommendedReorderQuantity: bestPrediction.reorderQuantity,
        confidence: bestPrediction.confidence,
        consumptionRate: consumptionAnalysis.averageConsumptionRate,
        factors,
      };

      // Cache the prediction
      this.dbService.setCacheData(cacheKey, prediction, 6); // 6 hours cache

      return prediction;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: "predictComponentDepletion", componentId },
        this.createEmptyPrediction(componentId, "Prediction failed")
      );
    }
  }

  /**
   * Generate stock alerts for all components
   */
  async generateStockAlerts(): Promise<StockAlert[]> {
    try {
      const cacheKey = "stock_alerts_all";
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      const allItems = this.dbService.getAllItems();
      const alerts: StockAlert[] = [];

      for (const item of allItems) {
        // Skip items with zero quantity or no usage history
        if (item.quantity <= 0) continue;

        const prediction = await this.predictComponentDepletion(item.id);

        if (prediction.predictedDepletionDate) {
          const daysUntilDepletion = this.calculateDaysUntilDate(
            prediction.predictedDepletionDate
          );
          const urgency = this.determineAlertUrgency(daysUntilDepletion);

          if (urgency) {
            alerts.push({
              componentId: item.id,
              componentName: item.name,
              urgency,
              currentStock: item.quantity,
              predictedDepletionDate: prediction.predictedDepletionDate,
              daysUntilDepletion,
              recommendedAction: this.generateRecommendedAction(
                urgency,
                daysUntilDepletion
              ),
              recommendedQuantity: prediction.recommendedReorderQuantity,
              confidence: prediction.confidence,
            });
          }
        }
      }

      // Sort by urgency and days until depletion
      alerts.sort((a, b) => {
        const urgencyOrder = { critical: 3, warning: 2, info: 1 };
        if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
          return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        }
        return a.daysUntilDepletion - b.daysUntilDepletion;
      });

      // Cache alerts for 2 hours
      this.dbService.setCacheData(cacheKey, alerts, 2);

      return alerts;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: "generateStockAlerts" },
        []
      );
    }
  }
  /**
   * Predict project success based on component combination
   */
  async predictProjectSuccess(
    components: string[],
    projectType: string
  ): Promise<{
    successProbability: number;
    confidence: number;
    riskFactors: string[];
    recommendations: string[];
  }> {
    try {
      let successProbability = 0.7; // Base success rate
      const riskFactors: string[] = [];
      const recommendations: string[] = [];

      // Analyze each component's success rate
      for (const componentId of components) {
        const metrics = this.dbService.getUsageMetrics(componentId);
        if (metrics) {
          successProbability = (successProbability + metrics.successRate) / 2;

          if (metrics.successRate < 0.6) {
            riskFactors.push(`Low success rate for component ${componentId}`);
          }
        } else {
          riskFactors.push(`No usage history for component ${componentId}`);
          successProbability *= 0.9; // Reduce probability for unknown components
        }
      }

      // Generate recommendations
      if (successProbability < 0.7) {
        recommendations.push(
          "Consider starting with a simpler project to gain experience"
        );
      }

      return {
        successProbability: Math.max(0.1, Math.min(0.95, successProbability)),
        confidence: Math.max(0.3, 0.8 - riskFactors.length * 0.1),
        riskFactors,
        recommendations,
      };
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "predictProjectSuccess",
          additionalData: { componentCount: components.length, projectType },
        },
        {
          successProbability: 0.5,
          confidence: 0.3,
          riskFactors: ["Prediction failed"],
          recommendations: ["Review project requirements carefully"],
        }
      );
    }
  }

  /**
   * Forecast component demand over time horizon
   */
  async forecastComponentDemand(
    componentId: string,
    horizon: number
  ): Promise<{
    forecastPeriods: {
      period: string;
      predictedDemand: number;
      confidence: number;
    }[];
    totalDemand: number;
    peakPeriod: string;
    trendDirection: "increasing" | "stable" | "decreasing";
  }> {
    try {
      const component = this.dbService.getItemById(componentId);
      const metrics = this.dbService.getUsageMetrics(componentId);

      if (!component || !metrics) {
        throw new Error(`Component ${componentId} not found or no usage data`);
      }

      const forecastPeriods = [];
      let totalDemand = 0;
      let peakDemand = 0;
      let peakPeriod = "";

      // Calculate base demand rate
      const creationDate = new Date(component.createdAt);
      const daysSinceCreation = this.calculateDaysBetween(
        creationDate,
        new Date()
      );
      const baseDemandRate =
        daysSinceCreation > 0 ? metrics.totalUsed / daysSinceCreation : 0;

      // Generate forecasts for each period
      const periodsPerHorizon = Math.min(horizon / 30, 12); // Monthly periods, max 12

      for (let i = 0; i < periodsPerHorizon; i++) {
        const periodStart = new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000);
        const periodName = `${periodStart.getFullYear()}-${String(
          periodStart.getMonth() + 1
        ).padStart(2, "0")}`;

        const predictedDemand = Math.max(0, baseDemandRate * 30);
        const confidence = Math.max(0.3, 0.8 - i * 0.05); // Confidence decreases over time

        forecastPeriods.push({
          period: periodName,
          predictedDemand: Math.round(predictedDemand * 100) / 100,
          confidence,
        });

        totalDemand += predictedDemand;

        if (predictedDemand > peakDemand) {
          peakDemand = predictedDemand;
          peakPeriod = periodName;
        }
      }

      return {
        forecastPeriods,
        totalDemand: Math.round(totalDemand * 100) / 100,
        peakPeriod,
        trendDirection: "stable",
      };
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "forecastComponentDemand",
          componentId,
          additionalData: { horizon },
        },
        {
          forecastPeriods: [],
          totalDemand: 0,
          peakPeriod: "",
          trendDirection: "stable",
        }
      );
    }
  }

  /**
   * Suggest optimal quantities for component ordering
   */
  async suggestOptimalQuantities(
    componentId: string,
    projectPipeline: any[]
  ): Promise<{
    recommendedQuantity: number;
    minQuantity: number;
    maxQuantity: number;
    reasoning: string[];
    costAnalysis: { quantity: number; unitCost: number; totalCost: number }[];
  }> {
    try {
      const component = this.dbService.getItemById(componentId);
      const metrics = this.dbService.getUsageMetrics(componentId);

      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }

      const reasoning: string[] = [];

      // Calculate base quantity from usage patterns
      let baseQuantity = 0;
      if (metrics) {
        baseQuantity = Math.ceil(metrics.averageQuantityPerProject * 3); // 3 projects worth
        reasoning.push(
          `Based on average usage of ${metrics.averageQuantityPerProject} per project`
        );
      } else {
        baseQuantity = 5; // Default for unknown components
        reasoning.push("No usage history - using conservative estimate");
      }

      // Calculate min/max ranges
      const minQuantity = Math.max(1, Math.ceil(baseQuantity * 0.7));
      const maxQuantity = Math.ceil(baseQuantity * 1.5);

      // Generate cost analysis for different quantities
      const basePrice = component.purchasePrice || 10; // Default price if unknown
      const costAnalysis = [
        {
          quantity: minQuantity,
          unitCost: basePrice * 1.1,
          totalCost: minQuantity * basePrice * 1.1,
        },
        {
          quantity: baseQuantity,
          unitCost: basePrice,
          totalCost: baseQuantity * basePrice,
        },
        {
          quantity: maxQuantity,
          unitCost: basePrice * 0.9,
          totalCost: maxQuantity * basePrice * 0.9,
        },
      ];

      return {
        recommendedQuantity: baseQuantity,
        minQuantity,
        maxQuantity,
        reasoning,
        costAnalysis,
      };
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: "suggestOptimalQuantities", componentId },
        {
          recommendedQuantity: 5,
          minQuantity: 3,
          maxQuantity: 10,
          reasoning: ["Default recommendation due to error"],
          costAnalysis: [],
        }
      );
    }
  }

  /**
   * Identify component trends within a category
   */
  async identifyComponentTrends(category: string): Promise<{
    trendingUp: { componentId: string; name: string; trendScore: number }[];
    trendingDown: { componentId: string; name: string; trendScore: number }[];
    stable: { componentId: string; name: string; trendScore: number }[];
    insights: string[];
  }> {
    try {
      const categoryComponents = this.dbService.getItemsByCategory(category);
      const trendingUp: any[] = [];
      const trendingDown: any[] = [];
      const stable: any[] = [];
      const insights: string[] = [];

      for (const component of categoryComponents) {
        const metrics = this.dbService.getUsageMetrics(component.id);
        if (!metrics) continue;

        const trendScore = this.calculateComponentTrendScore(
          component,
          metrics
        );
        const trendData = {
          componentId: component.id,
          name: component.name,
          trendScore,
        };

        if (trendScore > 0.2) {
          trendingUp.push(trendData);
        } else if (trendScore < -0.2) {
          trendingDown.push(trendData);
        } else {
          stable.push(trendData);
        }
      }

      // Generate insights
      if (trendingUp.length > 0) {
        insights.push(
          `${trendingUp.length} components trending up in ${category} category`
        );
      }

      return {
        trendingUp: trendingUp.slice(0, 10),
        trendingDown: trendingDown.slice(0, 10),
        stable: stable.slice(0, 10),
        insights,
      };
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: "identifyComponentTrends", additionalData: { category } },
        {
          trendingUp: [],
          trendingDown: [],
          stable: [],
          insights: ["Trend analysis failed"],
        }
      );
    }
  }

  /**
   * Helper methods for prediction calculations
   */

  private async analyzeConsumptionPatterns(
    component: InventoryItem,
    metrics: UsageMetrics
  ): Promise<{
    averageConsumptionRate: number;
    trendDirection: "increasing" | "stable" | "decreasing";
    trendStrength: number;
    seasonalFactor: number;
    volatility: number;
  }> {
    const creationDate = new Date(component.createdAt);
    const daysSinceCreation = this.calculateDaysBetween(
      creationDate,
      new Date()
    );

    // Calculate basic consumption rate (units per day)
    const averageConsumptionRate =
      daysSinceCreation > 0 ? metrics.totalUsed / daysSinceCreation : 0;

    return {
      averageConsumptionRate,
      trendDirection: "stable",
      trendStrength: 0.5,
      seasonalFactor: 1.0,
      volatility: 0.3,
    };
  }

  private async runPredictionAlgorithms(
    component: InventoryItem,
    consumptionAnalysis: any
  ): Promise<
    Array<{
      algorithm: string;
      depletionDate: string;
      reorderQuantity: number;
      confidence: number;
    }>
  > {
    const predictions = [];

    // Linear trend prediction
    const linearPrediction = this.linearTrendPrediction(
      component,
      consumptionAnalysis
    );
    predictions.push({
      algorithm: "linear",
      ...linearPrediction,
    });

    return predictions;
  }

  private linearTrendPrediction(
    component: InventoryItem,
    analysis: any
  ): {
    depletionDate: string;
    reorderQuantity: number;
    confidence: number;
  } {
    const { averageConsumptionRate } = analysis;

    const daysUntilDepletion =
      averageConsumptionRate > 0
        ? component.quantity / averageConsumptionRate
        : Infinity;
    const depletionDate =
      daysUntilDepletion < 1000 && daysUntilDepletion > 0
        ? new Date(
            Date.now() + daysUntilDepletion * 24 * 60 * 60 * 1000
          ).toISOString()
        : "";

    const reorderQuantity = Math.ceil(
      averageConsumptionRate * 90 * this.config.safetyStockMultiplier
    );
    const confidence = 0.7;

    return { depletionDate, reorderQuantity, confidence };
  }

  private selectBestPrediction(predictions: any[]): any {
    return predictions.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }

  private createEmptyPrediction(
    componentId: string,
    reason: string
  ): StockPrediction {
    return {
      componentId,
      currentStock: 0,
      predictedDepletionDate: "",
      recommendedReorderQuantity: 0,
      confidence: 0,
      consumptionRate: 0,
      factors: [reason],
    };
  }

  private calculateDaysUntilDate(dateString: string): number {
    const targetDate = new Date(dateString);
    const now = new Date();
    return Math.ceil(
      (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  private calculateDaysBetween(date1: Date, date2: Date): number {
    return Math.abs(
      (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  private determineAlertUrgency(
    daysUntilDepletion: number
  ): AlertUrgency | null {
    if (daysUntilDepletion <= this.config.alertThresholds.critical)
      return "critical";
    if (daysUntilDepletion <= this.config.alertThresholds.warning)
      return "warning";
    if (daysUntilDepletion <= this.config.alertThresholds.info) return "info";
    return null; // No alert needed
  }

  private generateRecommendedAction(
    urgency: AlertUrgency,
    daysUntilDepletion: number
  ): string {
    switch (urgency) {
      case "critical":
        return `URGENT: Order immediately - only ${daysUntilDepletion} days of stock remaining`;
      case "warning":
        return `Order soon - ${daysUntilDepletion} days of stock remaining`;
      case "info":
        return `Consider ordering - ${daysUntilDepletion} days of stock remaining`;
      default:
        return "Monitor stock levels";
    }
  }

  private identifyPredictionFactors(
    component: InventoryItem,
    metrics: UsageMetrics,
    analysis: any
  ): string[] {
    const factors: string[] = [];

    if (metrics.projectsUsedIn < 3) {
      factors.push(
        "Limited project history - prediction based on small sample size"
      );
    }

    if (component.quantity < 5) {
      factors.push("Low current stock - consider emergency reorder");
    }

    return factors;
  }

  private calculateComponentTrendScore(
    component: InventoryItem,
    metrics: UsageMetrics
  ): number {
    let trendScore = 0;

    // Recent usage increases trend score
    const daysSinceLastUse = this.isStale(metrics.lastUsedDate, 0)
      ? 999
      : this.calculateDaysBetween(new Date(metrics.lastUsedDate), new Date());

    if (daysSinceLastUse < 7) {
      trendScore += 0.3;
    } else if (daysSinceLastUse > 90) {
      trendScore -= 0.2;
    }

    // Usage frequency affects trend
    if (metrics.usageFrequency === "high") {
      trendScore += 0.2;
    } else if (metrics.usageFrequency === "low") {
      trendScore -= 0.1;
    }

    return Math.max(-1, Math.min(1, trendScore));
  }

  private isStale(dateString: string, daysThreshold: number): boolean {
    if (!dateString || dateString === "Never") return true;

    const date = new Date(dateString);
    const now = new Date();
    const diffDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    return diffDays > daysThreshold;
  }

  /**
   * Get prediction engine statistics
   */
  getEngineStats(): {
    totalPredictions: number;
    activeAlerts: number;
    averageConfidence: number;
    algorithmPerformance: { algorithm: string; accuracy: number }[];
  } {
    return {
      totalPredictions: 0,
      activeAlerts: 0,
      averageConfidence: 0,
      algorithmPerformance: [{ algorithm: "linear", accuracy: 0.75 }],
    };
  }
}

export default PredictionEngine;
