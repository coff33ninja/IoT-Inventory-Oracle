import DatabaseService from './databaseService.js';
import RecommendationService, { RecommendationConfig } from './recommendationService.js';
import ComponentAlternativeEngine from './componentAlternativeEngine.js';
import AnalyticsService from './analyticsService.js';
import PredictionEngine from './predictionEngine.js';
import { RecommendationErrorHandler } from './errorHandler.js';

/**
 * Service factory for creating and managing service instances
 * Handles dependency injection and service lifecycle
 */
export class ServiceFactory {
  private static instance: ServiceFactory;
  private dbService?: DatabaseService;
  private recommendationService?: RecommendationService;
  private analyticsService?: AnalyticsService;
  private predictionEngine?: PredictionEngine;

  private constructor() {}

  /**
   * Get singleton instance of ServiceFactory
   */
  static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory();
    }
    return ServiceFactory.instance;
  }

  /**
   * Get or create DatabaseService instance
   */
  getDatabaseService(): DatabaseService {
    if (!this.dbService) {
      this.dbService = new DatabaseService();
    }
    return this.dbService;
  }

  /**
   * Get or create AnalyticsService instance
   */
  getAnalyticsService(): AnalyticsService {
    if (!this.analyticsService) {
      const dbService = this.getDatabaseService();
      const errorHandler = new RecommendationErrorHandler();
      
      this.analyticsService = new AnalyticsService(dbService, errorHandler);
    }
    return this.analyticsService;
  }

  /**
   * Get or create PredictionEngine instance
   */
  getPredictionEngine(): PredictionEngine {
    if (!this.predictionEngine) {
      const dbService = this.getDatabaseService();
      const errorHandler = new RecommendationErrorHandler();
      
      this.predictionEngine = new PredictionEngine(dbService, errorHandler);
    }
    return this.predictionEngine;
  }

  /**
   * Get or create RecommendationService instance
   */
  getRecommendationService(config?: Partial<RecommendationConfig>): RecommendationService {
    if (!this.recommendationService) {
      const dbService = this.getDatabaseService();
      const analyticsService = this.getAnalyticsService();
      const predictionEngine = this.getPredictionEngine();
      
      // Initialize with basic dependencies
      this.recommendationService = new RecommendationService(
        dbService,
        config,
        {
          analyticsService,
          predictionEngine,
          // componentKnowledgeService: this.getComponentKnowledgeService(),
          // geminiService: this.getGeminiService()
        }
      );
    }
    return this.recommendationService;
  }

  /**
   * Initialize all services with proper dependencies
   */
  async initializeServices(): Promise<void> {
    try {
      // Initialize database service first
      const dbService = this.getDatabaseService();
      
      // Initialize recommendation service
      const recommendationService = this.getRecommendationService();
      
      console.log('✅ All services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Cleanup all services
   */
  async cleanup(): Promise<void> {
    try {
      if (this.dbService) {
        this.dbService.close();
        this.dbService = undefined;
      }
      
      this.recommendationService = undefined;
      this.analyticsService = undefined;
      this.predictionEngine = undefined;
      
      console.log('✅ All services cleaned up successfully');
    } catch (error) {
      console.error('❌ Failed to cleanup services:', error);
      throw error;
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    database: boolean;
    recommendation: boolean;
    overall: boolean;
  }> {
    const health = {
      database: false,
      recommendation: false,
      overall: false
    };

    try {
      // Check database service
      if (this.dbService) {
        const stats = this.dbService.getInventoryStats();
        health.database = stats !== null;
      }

      // Check recommendation service
      if (this.recommendationService) {
        const stats = this.recommendationService.getRecommendationStats();
        health.recommendation = stats !== null;
      }

      health.overall = health.database && health.recommendation;
    } catch (error) {
      console.error('Health check failed:', error);
    }

    return health;
  }
}

/**
 * Convenience function to get service factory instance
 */
export function getServiceFactory(): ServiceFactory {
  return ServiceFactory.getInstance();
}

/**
 * Convenience function to get recommendation service
 */
export function getRecommendationService(config?: Partial<RecommendationConfig>): RecommendationService {
  return getServiceFactory().getRecommendationService(config);
}

/**
 * Convenience function to get database service
 */
export function getDatabaseService(): DatabaseService {
  return getServiceFactory().getDatabaseService();
}

/**
 * Convenience function to get analytics service
 */
export function getAnalyticsService(): AnalyticsService {
  return getServiceFactory().getAnalyticsService();
}

/**
 * Convenience function to get prediction engine
 */
export function getPredictionEngine(): PredictionEngine {
  return getServiceFactory().getPredictionEngine();
}

export default ServiceFactory;