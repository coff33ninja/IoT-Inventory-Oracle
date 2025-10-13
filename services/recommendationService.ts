import DatabaseService from './databaseService.js';
import { RecommendationErrorHandler, ErrorSeverity, withErrorHandling } from './errorHandler.js';
import ComponentAlternativeEngine from './componentAlternativeEngine.js';
import AnalyticsService from './analyticsService.js';
import PredictionEngine from './predictionEngine.js';
import {
  ComponentAlternative,
  ComponentPrediction,
  ComponentSuggestion,
  CompatibilityAnalysis,
  PersonalizedRecommendation,
  ProjectContext,
  UserPreferences,
  RecommendationError,
  InventoryItem,
  ComponentSpecification,
  UsageMetrics
} from '../types.js';

/**
 * Core recommendation service interfaces
 */
export interface IRecommendationService {
  getComponentAlternatives(componentId: string, context?: ProjectContext): Promise<ComponentAlternative[]>;
  predictComponentNeeds(projectId: string): Promise<ComponentPrediction[]>;
  suggestProjectComponents(projectType: string, userPreferences: UserPreferences): Promise<ComponentSuggestion[]>;
  analyzeComponentCompatibility(components: string[]): Promise<CompatibilityAnalysis>;
  getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation[]>;
}

export interface IAnalyticsService {
  analyzeUsagePatterns(timeframe: string): Promise<any>;
  predictStockDepletion(componentId: string): Promise<any>;
  calculateComponentPopularity(category?: string): Promise<any>;
  generateSpendingInsights(timeframe: string): Promise<any>;
  identifyProjectPatterns(userId: string): Promise<any>;
}

export interface IComponentKnowledgeService {
  searchComponents(query: any): Promise<any[]>;
  getComponentSpecs(componentId: string): Promise<ComponentSpecification | null>;
  findCompatibleComponents(specs: ComponentSpecification): Promise<any[]>;
  updateComponentDatabase(source: 'datasheet' | 'user' | 'api'): Promise<void>;
  validateComponentCompatibility(comp1: string, comp2: string): Promise<any>;
}

export interface IPredictionEngine {
  predictProjectSuccess(components: string[], projectType: string): Promise<any>;
  forecastComponentDemand(componentId: string, horizon: number): Promise<any>;
  suggestOptimalQuantities(componentId: string, projectPipeline: any[]): Promise<any>;
  identifyComponentTrends(category: string): Promise<any>;
}

/**
 * Recommendation service configuration
 */
export interface RecommendationConfig {
  maxAlternatives: number;
  confidenceThreshold: number;
  cacheExpirationHours: number;
  fallbackEnabled: boolean;
  aiServiceTimeout: number;
}

/**
 * Default configuration for the recommendation service
 */
const DEFAULT_CONFIG: RecommendationConfig = {
  maxAlternatives: 5,
  confidenceThreshold: 0.7,
  cacheExpirationHours: 24,
  fallbackEnabled: true,
  aiServiceTimeout: 30000 // 30 seconds
};

/**
 * Core recommendation service that orchestrates all recommendation logic
 */
export class RecommendationService implements IRecommendationService {
  private dbService: DatabaseService;
  private config: RecommendationConfig;
  private errorHandler: RecommendationErrorHandler;
  private alternativeEngine: ComponentAlternativeEngine;
  private analyticsService?: IAnalyticsService;
  private componentKnowledgeService?: IComponentKnowledgeService;
  private predictionEngine?: IPredictionEngine;
  private geminiService?: any; // Will be injected

  constructor(
    dbService: DatabaseService,
    config: Partial<RecommendationConfig> = {},
    dependencies: {
      analyticsService?: IAnalyticsService;
      componentKnowledgeService?: IComponentKnowledgeService;
      predictionEngine?: IPredictionEngine;
      geminiService?: any;
      errorHandler?: RecommendationErrorHandler;
      alternativeEngine?: ComponentAlternativeEngine;
    } = {}
  ) {
    this.dbService = dbService;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.errorHandler = dependencies.errorHandler || new RecommendationErrorHandler({
      fallbackEnabled: this.config.fallbackEnabled
    });
    
    // Initialize the alternative engine
    this.alternativeEngine = dependencies.alternativeEngine || new ComponentAlternativeEngine(
      this.dbService,
      this.errorHandler,
      {
        maxAlternatives: this.config.maxAlternatives,
        minCompatibilityScore: this.config.confidenceThreshold * 100,
        enableAIAnalysis: true
      },
      dependencies.geminiService
    );
    
    // Initialize the analytics service
    this.analyticsService = dependencies.analyticsService || new AnalyticsService(
      this.dbService,
      this.errorHandler
    );
    
    // Initialize the prediction engine
    this.predictionEngine = dependencies.predictionEngine || new PredictionEngine(
      this.dbService,
      this.errorHandler
    );
    this.componentKnowledgeService = dependencies.componentKnowledgeService;
    this.predictionEngine = dependencies.predictionEngine;
    this.geminiService = dependencies.geminiService;
  }

  /**
   * Get component alternatives for a given component
   */
  async getComponentAlternatives(
    componentId: string, 
    context?: ProjectContext
  ): Promise<ComponentAlternative[]> {
    try {
      // Check cache first
      const cacheKey = `alternatives_${componentId}_${context?.projectId || 'global'}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // Get component details
      const component = this.dbService.getItemById(componentId);
      if (!component) {
        throw this.errorHandler.createError(
          'insufficient_data', 
          `Component ${componentId} not found`,
          { operation: 'getComponentAlternatives', componentId }
        );
      }

      // Get component specifications
      const specs = this.dbService.getComponentSpecifications(componentId);
      
      // Find alternatives using the enhanced alternative engine
      const alternatives = await this.alternativeEngine.findAlternatives(component, specs, context);

      // Cache the results
      this.dbService.setCacheData(cacheKey, alternatives, this.config.cacheExpirationHours);

      return alternatives;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: 'getComponentAlternatives', componentId },
        []
      );
    }
  }

  /**
   * Predict component needs for a project
   */
  async predictComponentNeeds(projectId: string): Promise<ComponentPrediction[]> {
    try {
      // Check cache
      const cacheKey = `predictions_${projectId}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // Get project data (would need to implement project loading)
      // For now, return empty array with proper structure
      const predictions: ComponentPrediction[] = [];

      // Cache results
      this.dbService.setCacheData(cacheKey, predictions, this.config.cacheExpirationHours);

      return predictions;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: 'predictComponentNeeds', projectId },
        []
      );
    }
  }

  /**
   * Suggest components for a project type
   */
  async suggestProjectComponents(
    projectType: string, 
    userPreferences: UserPreferences
  ): Promise<ComponentSuggestion[]> {
    try {
      const cacheKey = `project_suggestions_${projectType}_${userPreferences.skillLevel}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // Get project patterns for this type
      const suggestions = await this.generateProjectSuggestions(projectType, userPreferences);

      // Cache results
      this.dbService.setCacheData(cacheKey, suggestions, this.config.cacheExpirationHours);

      return suggestions;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: 'suggestProjectComponents', additionalData: { projectType, skillLevel: userPreferences.skillLevel } },
        []
      );
    }
  }

  /**
   * Analyze compatibility between components
   */
  async analyzeComponentCompatibility(components: string[]): Promise<CompatibilityAnalysis> {
    try {
      const cacheKey = `compatibility_${components.sort().join('_')}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      const analysis = await this.performCompatibilityAnalysis(components);

      // Cache results
      this.dbService.setCacheData(cacheKey, analysis, this.config.cacheExpirationHours);

      return analysis;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: 'analyzeComponentCompatibility', additionalData: { componentCount: components.length } },
        {
          overallCompatibility: 0,
          issues: [],
          suggestions: [],
          requiredModifications: []
        }
      );
    }
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendation[]> {
    try {
      const cacheKey = `personalized_${userId}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // Get user preferences
      const preferences = this.dbService.getUserPreferences(userId);
      if (!preferences) {
        throw this.errorHandler.createError(
          'insufficient_data', 
          `No preferences found for user ${userId}`,
          { operation: 'getPersonalizedRecommendations', userId }
        );
      }

      const recommendations = await this.generatePersonalizedRecommendations(userId, preferences);

      // Cache results for shorter time (personalized data changes more frequently)
      this.dbService.setCacheData(cacheKey, recommendations, 6); // 6 hours

      return recommendations;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: 'getPersonalizedRecommendations', userId },
        []
      );
    }
  }

  /**
   * Get the alternative engine for advanced configuration
   */
  getAlternativeEngine(): ComponentAlternativeEngine {
    return this.alternativeEngine;
  }

  /**
   * Legacy method - now handled by ComponentAlternativeEngine
   */
  private async findAlternatives(
    component: InventoryItem,
    specs: ComponentSpecification | null,
    context?: ProjectContext
  ): Promise<ComponentAlternative[]> {
    const alternatives: ComponentAlternative[] = [];

    try {
      // Strategy 1: Find components in same category
      if (component.category) {
        const categoryComponents = this.dbService.getItemsByCategory(component.category);
        
        for (const candidate of categoryComponents) {
          if (candidate.id === component.id) continue;
          
          const alternative = await this.evaluateAlternative(component, candidate, specs);
          if (alternative && alternative.compatibilityScore >= this.config.confidenceThreshold * 100) {
            alternatives.push(alternative);
          }
        }
      }

      // Strategy 2: Use AI service if available
      if (this.geminiService && specs) {
        try {
          const aiAlternatives = await this.getAIAlternatives(component, specs, context);
          alternatives.push(...aiAlternatives);
        } catch (aiError) {
          console.warn('AI service failed, continuing with rule-based alternatives:', aiError);
        }
      }

      // Sort by compatibility score and limit results
      return alternatives
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, this.config.maxAlternatives);

    } catch (error) {
      console.error('Error finding alternatives:', error);
      return [];
    }
  }

  /**
   * Evaluate if a component is a suitable alternative
   */
  private async evaluateAlternative(
    original: InventoryItem,
    candidate: InventoryItem,
    specs: ComponentSpecification | null
  ): Promise<ComponentAlternative | null> {
    try {
      // Basic compatibility scoring
      let compatibilityScore = 0;

      // Same category bonus
      if (original.category === candidate.category) {
        compatibilityScore += 30;
      }

      // Same manufacturer bonus
      if (original.manufacturer === candidate.manufacturer) {
        compatibilityScore += 20;
      }

      // Availability check
      if (candidate.quantity > 0) {
        compatibilityScore += 25;
      }

      // Price comparison
      const priceComparison = this.calculatePriceComparison(original, candidate);
      if (priceComparison.percentageDifference <= 20) {
        compatibilityScore += 25;
      }

      // Only return if meets minimum threshold
      if (compatibilityScore < 50) {
        return null;
      }

      return {
        componentId: candidate.id,
        name: candidate.name,
        compatibilityScore,
        priceComparison,
        technicalDifferences: [], // Will be populated by detailed analysis
        usabilityImpact: compatibilityScore > 80 ? 'minimal' : 'moderate',
        explanation: this.generateExplanation(original, candidate, compatibilityScore),
        confidence: Math.min(compatibilityScore, 95), // Cap confidence at 95%
        requiredModifications: [] // Will be populated if needed
      };
    } catch (error) {
      console.error('Error evaluating alternative:', error);
      return null;
    }
  }

  /**
   * Calculate price comparison between components
   */
  private calculatePriceComparison(original: InventoryItem, alternative: InventoryItem) {
    const originalPrice = original.purchasePrice || 0;
    const alternativePrice = alternative.purchasePrice || 0;
    
    const savings = originalPrice - alternativePrice;
    const percentageDifference = originalPrice > 0 
      ? Math.abs(savings / originalPrice) * 100 
      : 0;

    return {
      original: originalPrice,
      alternative: alternativePrice,
      savings,
      percentageDifference
    };
  }

  /**
   * Generate explanation for why a component is an alternative
   */
  private generateExplanation(original: InventoryItem, alternative: InventoryItem, score: number): string {
    const reasons = [];

    if (original.category === alternative.category) {
      reasons.push(`same category (${original.category})`);
    }

    if (original.manufacturer === alternative.manufacturer) {
      reasons.push(`same manufacturer (${original.manufacturer})`);
    }

    if (alternative.quantity > 0) {
      reasons.push(`in stock (${alternative.quantity} available)`);
    }

    const priceComp = this.calculatePriceComparison(original, alternative);
    if (priceComp.savings > 0) {
      reasons.push(`costs less ($${priceComp.savings.toFixed(2)} savings)`);
    }

    return `This component is suggested because it has ${reasons.join(', ')}. Compatibility score: ${score}%`;
  }

  /**
   * Get AI-powered alternatives (placeholder for AI integration)
   */
  private async getAIAlternatives(
    component: InventoryItem,
    specs: ComponentSpecification,
    context?: ProjectContext
  ): Promise<ComponentAlternative[]> {
    // This would integrate with Gemini AI service
    // For now, return empty array
    return [];
  }

  /**
   * Generate project component suggestions
   */
  private async generateProjectSuggestions(
    projectType: string,
    userPreferences: UserPreferences
  ): Promise<ComponentSuggestion[]> {
    // Placeholder implementation
    return [];
  }

  /**
   * Perform compatibility analysis between components
   */
  private async performCompatibilityAnalysis(components: string[]): Promise<CompatibilityAnalysis> {
    // Placeholder implementation
    return {
      overallCompatibility: 85,
      issues: [],
      suggestions: [],
      requiredModifications: []
    };
  }

  /**
   * Generate personalized recommendations
   */
  private async generatePersonalizedRecommendations(
    userId: string,
    preferences: UserPreferences
  ): Promise<PersonalizedRecommendation[]> {
    // Placeholder implementation
    return [];
  }

  /**
   * Get error handler statistics
   */
  getErrorStats() {
    return this.errorHandler.getErrorStats();
  }

  /**
   * Check if the recommendation system is healthy
   */
  isSystemHealthy() {
    return this.errorHandler.isSystemHealthy();
  }

  /**
   * Update component usage metrics when components are used
   */
  async updateComponentUsage(componentId: string, projectId: string, quantity: number): Promise<void> {
    try {
      const existingMetrics = this.dbService.getUsageMetrics(componentId);
      
      const updatedMetrics: UsageMetrics = {
        totalUsed: (existingMetrics?.totalUsed || 0) + quantity,
        projectsUsedIn: (existingMetrics?.projectsUsedIn || 0) + 1,
        averageQuantityPerProject: 0, // Will be calculated
        lastUsedDate: new Date().toISOString(),
        usageFrequency: 'medium', // Will be calculated based on usage patterns
        successRate: existingMetrics?.successRate || 1.0
      };

      // Calculate average quantity per project
      updatedMetrics.averageQuantityPerProject = updatedMetrics.totalUsed / updatedMetrics.projectsUsedIn;

      // Update usage frequency based on recent usage
      updatedMetrics.usageFrequency = this.calculateUsageFrequency(updatedMetrics);

      this.dbService.updateUsageMetrics(componentId, updatedMetrics);
    } catch (error) {
      console.error('Error updating component usage:', error);
    }
  }

  /**
   * Calculate usage frequency based on metrics
   */
  private calculateUsageFrequency(metrics: UsageMetrics): 'high' | 'medium' | 'low' {
    if (metrics.projectsUsedIn >= 5 && metrics.averageQuantityPerProject >= 2) {
      return 'high';
    } else if (metrics.projectsUsedIn >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get recommendation statistics
   */
  getRecommendationStats(): {
    totalRecommendations: number;
    cacheHitRate: number;
    averageConfidence: number;
    errorRate: number;
  } {
    // This would track actual statistics
    return {
      totalRecommendations: 0,
      cacheHitRate: 0,
      averageConfidence: 0,
      errorRate: 0
    };
  }
}

export default RecommendationService;