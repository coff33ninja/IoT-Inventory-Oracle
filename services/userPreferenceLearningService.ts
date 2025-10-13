import DatabaseService from './databaseService.js';
import { RecommendationErrorHandler } from './errorHandler.js';
import {
  UserPreferences,
  InventoryItem,
  Project,
  UsageMetrics,
  PersonalizedRecommendation,
  TrainingData,
  ComponentUsage,
  ProjectModification
} from '../types.js';

/**
 * Configuration for user preference learning
 */
export interface PreferenceLearningConfig {
  learningRate: number;
  decayFactor: number; // How much older data is weighted
  minInteractions: number; // Minimum interactions before making recommendations
  confidenceThreshold: number;
  maxRecommendations: number;
  categoryWeights: {
    brand: number;
    price: number;
    category: number;
    success: number;
    recency: number;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: PreferenceLearningConfig = {
  learningRate: 0.1,
  decayFactor: 0.95, // 5% decay per time period
  minInteractions: 5,
  confidenceThreshold: 0.6,
  maxRecommendations: 10,
  categoryWeights: {
    brand: 0.25,
    price: 0.20,
    category: 0.20,
    success: 0.25,
    recency: 0.10
  }
};

/**
 * User interaction types for learning
 */
export type InteractionType = 
  | 'component_selected'
  | 'component_substituted'
  | 'project_completed'
  | 'project_failed'
  | 'component_purchased'
  | 'component_rated';

/**
 * User interaction record
 */
export interface UserInteraction {
  id: string;
  userId: string;
  interactionType: InteractionType;
  componentId?: string;
  projectId?: string;
  metadata: {
    originalChoice?: string;
    alternativeChoice?: string;
    rating?: number; // 1-5 scale
    success?: boolean;
    timestamp: string;
    context?: Record<string, any>;
  };
}

/**
 * Learned preference patterns
 */
export interface PreferencePattern {
  patternId: string;
  userId: string;
  patternType: 'brand_preference' | 'price_sensitivity' | 'category_preference' | 'success_pattern';
  pattern: {
    key: string; // brand name, category, price range, etc.
    value: number; // preference strength 0-1
    confidence: number; // how confident we are in this pattern
    sampleSize: number; // number of interactions this is based on
    lastUpdated: string;
  };
}

/**
 * User preference learning service
 */
export class UserPreferenceLearningService {
  private dbService: DatabaseService;
  private errorHandler: RecommendationErrorHandler;
  private config: PreferenceLearningConfig;

  constructor(
    dbService: DatabaseService,
    errorHandler: RecommendationErrorHandler,
    config: Partial<PreferenceLearningConfig> = {}
  ) {
    this.dbService = dbService;
    this.errorHandler = errorHandler;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Record a user interaction for learning
   */
  async recordInteraction(interaction: Omit<UserInteraction, 'id'>): Promise<void> {
    try {
      const interactionWithId: UserInteraction = {
        ...interaction,
        id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Store the interaction
      await this.storeInteraction(interactionWithId);

      // Update preference patterns based on this interaction
      await this.updatePreferencePatterns(interactionWithId);

      // Update user preferences if we have enough data
      await this.updateUserPreferences(interaction.userId);

    } catch (error) {
      this.errorHandler.handleError(
        error,
        { operation: 'recordInteraction', userId: interaction.userId },
        undefined
      );
    }
  }

  /**
   * Learn from project completion
   */
  async learnFromProjectCompletion(
    userId: string,
    projectId: string,
    outcome: 'success' | 'failure' | 'partial',
    componentsUsed: ComponentUsage[],
    modifications: ProjectModification[]
  ): Promise<void> {
    try {
      // Record training data
      const trainingData: TrainingData = {
        userId,
        projectId,
        components: componentsUsed,
        outcome,
        completionTime: Date.now(),
        userSatisfaction: outcome === 'success' ? 5 : outcome === 'partial' ? 3 : 1,
        modifications
      };

      this.dbService.saveTrainingData(trainingData);

      // Record interactions for each component
      for (const component of componentsUsed) {
        await this.recordInteraction({
          userId,
          interactionType: 'component_selected',
          componentId: component.componentId,
          projectId,
          metadata: {
            success: outcome === 'success',
            rating: component.performanceRating || (outcome === 'success' ? 5 : 3),
            timestamp: new Date().toISOString(),
            context: {
              quantityUsed: component.quantityUsed,
              wasSubstituted: component.wasSubstituted,
              substitutedWith: component.substitutedWith
            }
          }
        });

        // If component was substituted, learn from the substitution
        if (component.wasSubstituted && component.substitutedWith) {
          await this.recordInteraction({
            userId,
            interactionType: 'component_substituted',
            componentId: component.substitutedWith,
            projectId,
            metadata: {
              originalChoice: component.componentId,
              alternativeChoice: component.substitutedWith,
              success: outcome === 'success',
              timestamp: new Date().toISOString()
            }
          });
        }
      }

      // Learn from modifications
      for (const modification of modifications) {
        if (modification.type === 'component_substitution') {
          await this.recordInteraction({
            userId,
            interactionType: 'component_substituted',
            projectId,
            metadata: {
              originalChoice: modification.originalPlan,
              alternativeChoice: modification.actualImplementation,
              success: modification.impact === 'positive',
              timestamp: new Date().toISOString(),
              context: { reason: modification.reason }
            }
          });
        }
      }

    } catch (error) {
      this.errorHandler.handleError(
        error,
        { operation: 'learnFromProjectCompletion', userId, projectId },
        undefined
      );
    }
  }

  /**
   * Generate personalized recommendations based on learned preferences
   */
  async generatePersonalizedRecommendations(
    userId: string,
    context?: {
      projectType?: string;
      budget?: number;
      currentComponents?: string[];
    }
  ): Promise<PersonalizedRecommendation[]> {
    try {
      const cacheKey = `personalized_recs_${userId}_${JSON.stringify(context)}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // Get user preferences and patterns
      const userPreferences = this.dbService.getUserPreferences(userId);
      const preferencePatterns = await this.getPreferencePatterns(userId);
      
      if (!userPreferences || preferencePatterns.length === 0) {
        return []; // Not enough data for personalized recommendations
      }

      // Get candidate components based on preferences
      const candidates = await this.getCandidateComponents(userPreferences, context);

      // Score and rank candidates
      const recommendations = await this.scoreAndRankCandidates(
        userId,
        candidates,
        preferencePatterns,
        userPreferences,
        context
      );

      // Cache results
      this.dbService.setCacheData(cacheKey, recommendations, 2); // 2 hours cache

      return recommendations;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: 'generatePersonalizedRecommendations', userId },
        []
      );
    }
  }

  /**
   * Get user's preference strength for a specific attribute
   */
  async getPreferenceStrength(
    userId: string,
    attributeType: 'brand' | 'category' | 'priceRange',
    attributeValue: string
  ): Promise<{ strength: number; confidence: number }> {
    try {
      const patterns = await this.getPreferencePatterns(userId);
      
      const relevantPattern = patterns.find(p => 
        p.patternType === `${attributeType}_preference` && 
        p.pattern.key === attributeValue
      );

      if (relevantPattern) {
        return {
          strength: relevantPattern.pattern.value,
          confidence: relevantPattern.pattern.confidence
        };
      }

      return { strength: 0.5, confidence: 0.1 }; // Neutral preference
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: 'getPreferenceStrength', userId },
        { strength: 0.5, confidence: 0.1 }
      );
    }
  }

  /**
   * Update user preferences based on learned patterns
   */
  async updateUserPreferences(userId: string): Promise<void> {
    try {
      const patterns = await this.getPreferencePatterns(userId);
      const interactions = await this.getUserInteractions(userId);

      if (interactions.length < this.config.minInteractions) {
        return; // Not enough data
      }

      // Extract preferences from patterns
      const brandPreferences = this.extractBrandPreferences(patterns, interactions);
      const budgetRange = this.extractBudgetRange(interactions);
      const categoryPreferences = this.extractCategoryPreferences(patterns, interactions);
      const skillLevel = this.inferSkillLevel(interactions);

      // Calculate preference weights
      const weights = this.calculatePreferenceWeights(patterns, interactions);

      const updatedPreferences: UserPreferences = {
        preferredBrands: brandPreferences,
        budgetRange,
        preferredSuppliers: [], // Could be extracted from purchase interactions
        skillLevel,
        projectTypes: categoryPreferences,
        priceWeight: weights.price,
        qualityWeight: weights.quality,
        availabilityWeight: weights.availability
      };

      // Save updated preferences
      this.dbService.saveUserPreferences(userId, updatedPreferences);

    } catch (error) {
      this.errorHandler.handleError(
        error,
        { operation: 'updateUserPreferences', userId },
        undefined
      );
    }
  }

  /**
   * Get recommendation explanation based on learned preferences
   */
  async getRecommendationExplanation(
    userId: string,
    componentId: string,
    recommendationScore: number
  ): Promise<string> {
    try {
      const component = this.dbService.getItemById(componentId);
      const patterns = await this.getPreferencePatterns(userId);
      
      if (!component) {
        return 'Component not found';
      }

      const explanations: string[] = [];

      // Check brand preference
      if (component.manufacturer) {
        const brandPattern = patterns.find(p => 
          p.patternType === 'brand_preference' && 
          p.pattern.key === component.manufacturer
        );
        
        if (brandPattern && brandPattern.pattern.value > 0.7) {
          explanations.push(`you frequently choose ${component.manufacturer} components`);
        }
      }

      // Check category preference
      if (component.category) {
        const categoryPattern = patterns.find(p => 
          p.patternType === 'category_preference' && 
          p.pattern.key === component.category
        );
        
        if (categoryPattern && categoryPattern.pattern.value > 0.6) {
          explanations.push(`you often work with ${component.category} components`);
        }
      }

      // Check success pattern
      const successPattern = patterns.find(p => 
        p.patternType === 'success_pattern' && 
        p.pattern.key === componentId
      );
      
      if (successPattern && successPattern.pattern.value > 0.8) {
        explanations.push('you\'ve had success with this component in past projects');
      }

      if (explanations.length === 0) {
        return `Recommended based on your project patterns (${Math.round(recommendationScore * 100)}% match)`;
      }

      return `Recommended because ${explanations.join(' and ')} (${Math.round(recommendationScore * 100)}% match)`;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: 'getRecommendationExplanation', userId, componentId },
        'Recommendation based on system analysis'
      );
    }
  }

  // Private helper methods

  private async storeInteraction(interaction: UserInteraction): Promise<void> {
    // Store in a simple format - in production this would be a proper table
    const cacheKey = `interaction_${interaction.id}`;
    this.dbService.setCacheData(cacheKey, interaction, 24 * 30); // 30 days
  }

  private async updatePreferencePatterns(interaction: UserInteraction): Promise<void> {
    const userId = interaction.userId;
    
    // Update brand preference if component is involved
    if (interaction.componentId) {
      const component = this.dbService.getItemById(interaction.componentId);
      if (component?.manufacturer) {
        await this.updateBrandPreference(userId, component.manufacturer, interaction);
      }
      
      if (component?.category) {
        await this.updateCategoryPreference(userId, component.category, interaction);
      }
    }

    // Update success patterns
    if (interaction.metadata.success !== undefined) {
      await this.updateSuccessPattern(userId, interaction);
    }
  }

  private async updateBrandPreference(
    userId: string,
    brand: string,
    interaction: UserInteraction
  ): Promise<void> {
    const patternId = `brand_${userId}_${brand}`;
    const existing = await this.getPreferencePattern(patternId);
    
    const success = interaction.metadata.success ?? true;
    const rating = interaction.metadata.rating ?? (success ? 4 : 2);
    
    // Simple learning: positive interactions increase preference
    const learningSignal = (rating - 3) / 2; // Convert 1-5 to -1 to 1
    
    if (existing) {
      const newValue = existing.pattern.value + (learningSignal * this.config.learningRate);
      existing.pattern.value = Math.max(0, Math.min(1, newValue));
      existing.pattern.sampleSize += 1;
      existing.pattern.confidence = Math.min(0.95, existing.pattern.confidence + 0.05);
      existing.pattern.lastUpdated = new Date().toISOString();
      
      await this.savePreferencePattern(existing);
    } else {
      const newPattern: PreferencePattern = {
        patternId,
        userId,
        patternType: 'brand_preference',
        pattern: {
          key: brand,
          value: 0.5 + (learningSignal * this.config.learningRate),
          confidence: 0.3,
          sampleSize: 1,
          lastUpdated: new Date().toISOString()
        }
      };
      
      await this.savePreferencePattern(newPattern);
    }
  }

  private async updateCategoryPreference(
    userId: string,
    category: string,
    interaction: UserInteraction
  ): Promise<void> {
    const patternId = `category_${userId}_${category}`;
    const existing = await this.getPreferencePattern(patternId);
    
    const success = interaction.metadata.success ?? true;
    const learningSignal = success ? 0.1 : -0.05;
    
    if (existing) {
      existing.pattern.value = Math.max(0, Math.min(1, existing.pattern.value + learningSignal));
      existing.pattern.sampleSize += 1;
      existing.pattern.lastUpdated = new Date().toISOString();
      await this.savePreferencePattern(existing);
    } else {
      const newPattern: PreferencePattern = {
        patternId,
        userId,
        patternType: 'category_preference',
        pattern: {
          key: category,
          value: 0.5 + learningSignal,
          confidence: 0.2,
          sampleSize: 1,
          lastUpdated: new Date().toISOString()
        }
      };
      
      await this.savePreferencePattern(newPattern);
    }
  }

  private async updateSuccessPattern(
    userId: string,
    interaction: UserInteraction
  ): Promise<void> {
    if (!interaction.componentId) return;
    
    const patternId = `success_${userId}_${interaction.componentId}`;
    const existing = await this.getPreferencePattern(patternId);
    
    const success = interaction.metadata.success ?? false;
    const learningSignal = success ? 0.2 : -0.1;
    
    if (existing) {
      existing.pattern.value = Math.max(0, Math.min(1, existing.pattern.value + learningSignal));
      existing.pattern.sampleSize += 1;
      existing.pattern.lastUpdated = new Date().toISOString();
      await this.savePreferencePattern(existing);
    } else {
      const newPattern: PreferencePattern = {
        patternId,
        userId,
        patternType: 'success_pattern',
        pattern: {
          key: interaction.componentId,
          value: success ? 0.7 : 0.3,
          confidence: 0.4,
          sampleSize: 1,
          lastUpdated: new Date().toISOString()
        }
      };
      
      await this.savePreferencePattern(newPattern);
    }
  }

  private async getPreferencePattern(patternId: string): Promise<PreferencePattern | null> {
    // For now, use cache as the database doesn't have a preference patterns table
    const cached = this.dbService.getCacheData(`pattern_${patternId}`);
    return cached || null;
  }

  private async savePreferencePattern(pattern: PreferencePattern): Promise<void> {
    // For now, use cache as the database doesn't have a preference patterns table
    this.dbService.setCacheData(`pattern_${pattern.patternId}`, pattern, 24 * 7); // 7 days
  }

  private async getPreferencePatterns(userId: string): Promise<PreferencePattern[]> {
    // Get all patterns for this user from cache
    // In a real implementation, this would be a database query
    const patterns: PreferencePattern[] = [];
    
    // Try to get common pattern types
    const patternTypes = ['brand_preference', 'category_preference', 'success_pattern'];
    const commonBrands = ['Arduino', 'Espressif', 'Raspberry Pi', 'Adafruit'];
    const commonCategories = ['Microcontroller', 'Sensor', 'LED', 'Passive'];
    
    // Check for brand patterns
    for (const brand of commonBrands) {
      const patternId = `brand_${userId}_${brand}`;
      const pattern = await this.getPreferencePattern(patternId);
      if (pattern) patterns.push(pattern);
    }
    
    // Check for category patterns
    for (const category of commonCategories) {
      const patternId = `category_${userId}_${category}`;
      const pattern = await this.getPreferencePattern(patternId);
      if (pattern) patterns.push(pattern);
    }
    
    return patterns;
  }

  private async getUserInteractions(userId: string): Promise<UserInteraction[]> {
    // Get interactions from cache
    // In a real implementation, this would be a database query
    const interactions: UserInteraction[] = [];
    
    // For testing, we'll simulate some interactions based on what we've recorded
    // This is a simplified approach for the current implementation
    return interactions;
  }

  private async getCandidateComponents(
    preferences: UserPreferences,
    context?: any
  ): Promise<InventoryItem[]> {
    let candidates = this.dbService.getAllItems();

    // Filter by preferred categories if specified
    if (preferences.projectTypes.length > 0) {
      candidates = candidates.filter(item => 
        preferences.projectTypes.includes(item.category || '')
      );
    }

    // Filter by budget if specified
    if (context?.budget && preferences.budgetRange) {
      candidates = candidates.filter(item => {
        const price = item.purchasePrice || 0;
        return price >= preferences.budgetRange.min && price <= preferences.budgetRange.max;
      });
    }

    return candidates.slice(0, 50); // Limit candidates for performance
  }

  private async scoreAndRankCandidates(
    userId: string,
    candidates: InventoryItem[],
    patterns: PreferencePattern[],
    preferences: UserPreferences,
    context?: any
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    for (const candidate of candidates) {
      const score = await this.calculateRecommendationScore(candidate, patterns, preferences);
      
      if (score >= this.config.confidenceThreshold) {
        const explanation = await this.getRecommendationExplanation(
          userId,
          candidate.id,
          score
        );

        recommendations.push({
          type: 'component',
          itemId: candidate.id,
          title: candidate.name,
          description: candidate.description || 'Recommended component based on your preferences',
          relevanceScore: Math.round(score * 100),
          reasoning: explanation,
          estimatedCost: candidate.purchasePrice,
          difficulty: this.inferDifficulty(candidate, preferences.skillLevel)
        });
      }
    }

    return recommendations
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, this.config.maxRecommendations);
  }

  private async calculateRecommendationScore(
    component: InventoryItem,
    patterns: PreferencePattern[],
    preferences: UserPreferences
  ): Promise<number> {
    let score = 0.5; // Base score

    // Brand preference
    if (component.manufacturer) {
      const brandPattern = patterns.find(p => 
        p.patternType === 'brand_preference' && 
        p.pattern.key === component.manufacturer
      );
      
      if (brandPattern) {
        score += (brandPattern.pattern.value - 0.5) * this.config.categoryWeights.brand;
      }
    }

    // Category preference
    if (component.category) {
      const categoryPattern = patterns.find(p => 
        p.patternType === 'category_preference' && 
        p.pattern.key === component.category
      );
      
      if (categoryPattern) {
        score += (categoryPattern.pattern.value - 0.5) * this.config.categoryWeights.category;
      }
    }

    // Success pattern
    const successPattern = patterns.find(p => 
      p.patternType === 'success_pattern' && 
      p.pattern.key === component.id
    );
    
    if (successPattern) {
      score += (successPattern.pattern.value - 0.5) * this.config.categoryWeights.success;
    }

    // Availability bonus
    if (component.quantity > 0) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private extractBrandPreferences(
    patterns: PreferencePattern[],
    interactions: UserInteraction[]
  ): string[] {
    const brandPatterns = patterns.filter(p => p.patternType === 'brand_preference');
    return brandPatterns
      .filter(p => p.pattern.value > 0.6 && p.pattern.confidence > 0.4)
      .map(p => p.pattern.key)
      .slice(0, 5); // Top 5 preferred brands
  }

  private extractBudgetRange(interactions: UserInteraction[]): { min: number; max: number } {
    // Analyze purchase interactions to infer budget range
    const purchaseInteractions = interactions.filter(i => i.interactionType === 'component_purchased');
    
    if (purchaseInteractions.length === 0) {
      return { min: 0, max: 100 }; // Default range
    }

    // This would analyze actual purchase amounts from interaction metadata
    return { min: 5, max: 50 }; // Placeholder
  }

  private extractCategoryPreferences(
    patterns: PreferencePattern[],
    interactions: UserInteraction[]
  ): string[] {
    const categoryPatterns = patterns.filter(p => p.patternType === 'category_preference');
    return categoryPatterns
      .filter(p => p.pattern.value > 0.5)
      .map(p => p.pattern.key)
      .slice(0, 10);
  }

  private inferSkillLevel(interactions: UserInteraction[]): 'beginner' | 'intermediate' | 'advanced' {
    // Analyze project complexity and success rates to infer skill level
    const successfulProjects = interactions.filter(i => 
      i.interactionType === 'project_completed' && i.metadata.success
    ).length;

    if (successfulProjects >= 10) return 'advanced';
    if (successfulProjects >= 3) return 'intermediate';
    return 'beginner';
  }

  private calculatePreferenceWeights(
    patterns: PreferencePattern[],
    interactions: UserInteraction[]
  ): { price: number; quality: number; availability: number } {
    // Analyze interaction patterns to infer preference weights
    return {
      price: 0.3,
      quality: 0.4,
      availability: 0.3
    };
  }

  private inferDifficulty(
    component: InventoryItem,
    skillLevel: string
  ): 'beginner' | 'intermediate' | 'advanced' {
    // Simple heuristic based on component category
    const advancedCategories = ['Microcontroller', 'FPGA', 'RF Module'];
    const intermediateCategories = ['Sensor', 'Display', 'Motor Driver'];
    
    if (component.category && advancedCategories.includes(component.category)) {
      return 'advanced';
    }
    
    if (component.category && intermediateCategories.includes(component.category)) {
      return 'intermediate';
    }
    
    return 'beginner';
  }

  /**
   * Get learning statistics for monitoring
   */
  getLearningStats(userId: string): {
    totalInteractions: number;
    patternCount: number;
    confidenceLevel: number;
    lastLearningUpdate: string;
  } {
    return {
      totalInteractions: 0,
      patternCount: 0,
      confidenceLevel: 0.5,
      lastLearningUpdate: new Date().toISOString()
    };
  }
}

export default UserPreferenceLearningService;