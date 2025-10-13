import DatabaseService from './databaseService.js';
import { RecommendationErrorHandler } from './errorHandler.js';
import {
  InventoryItem,
  Project,
  TrainingData,
  ComponentUsage,
  ProjectModification,
  PersonalizedRecommendation,
  UserPreferences,
  ProjectPattern
} from '../types.js';

/**
 * Configuration for project success prediction
 */
export interface ProjectPredictionConfig {
  minProjectsForPrediction: number; // Minimum projects needed for reliable predictions
  successThreshold: number; // What constitutes a successful project (0-1)
  confidenceThreshold: number; // Minimum confidence for predictions
  maxPredictions: number; // Maximum number of predictions to return
  patternWeights: {
    componentCompatibility: number;
    userExperience: number;
    projectComplexity: number;
    historicalSuccess: number;
    componentQuality: number;
  };
  timeDecayFactor: number; // How much older projects are weighted (0-1)
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: ProjectPredictionConfig = {
  minProjectsForPrediction: 3,
  successThreshold: 0.7,
  confidenceThreshold: 0.6,
  maxPredictions: 10,
  patternWeights: {
    componentCompatibility: 0.25,
    userExperience: 0.20,
    projectComplexity: 0.20,
    historicalSuccess: 0.25,
    componentQuality: 0.10
  },
  timeDecayFactor: 0.95 // 5% decay per time period
};

/**
 * Project success factors
 */
export interface ProjectSuccessFactors {
  componentCompatibility: number; // 0-1, how well components work together
  userExperienceLevel: number; // 0-1, user's skill level for this project type
  projectComplexity: number; // 0-1, complexity of the project
  componentQuality: number; // 0-1, average quality of components
  historicalSuccessRate: number; // 0-1, success rate for similar projects
  budgetAdequacy: number; // 0-1, whether budget is sufficient
}

/**
 * Project success prediction result
 */
export interface ProjectSuccessPrediction {
  projectId: string;
  successProbability: number; // 0-1, probability of success
  confidence: number; // 0-1, confidence in the prediction
  riskFactors: RiskFactor[];
  successFactors: SuccessFactor[];
  recommendations: string[];
  estimatedCompletionTime: number; // days
  budgetRisk: 'low' | 'medium' | 'high';
  technicalRisk: 'low' | 'medium' | 'high';
}

/**
 * Risk factor that could impact project success
 */
export interface RiskFactor {
  type: 'component' | 'complexity' | 'experience' | 'budget' | 'compatibility';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: number; // 0-1, impact on success probability
  mitigation: string;
}

/**
 * Success factor that increases project success probability
 */
export interface SuccessFactor {
  type: 'component' | 'experience' | 'simplicity' | 'budget' | 'compatibility';
  strength: 'low' | 'medium' | 'high';
  description: string;
  impact: number; // 0-1, positive impact on success probability
}

/**
 * Component combination analysis
 */
export interface ComponentCombinationAnalysis {
  components: string[];
  compatibilityScore: number; // 0-1
  successRate: number; // Historical success rate for this combination
  commonIssues: string[];
  recommendations: string[];
  sampleSize: number; // Number of projects this analysis is based on
}

/**
 * Project success prediction engine
 */
export class ProjectSuccessPredictionEngine {
  private dbService: DatabaseService;
  private errorHandler: RecommendationErrorHandler;
  private config: ProjectPredictionConfig;

  constructor(
    dbService: DatabaseService,
    errorHandler: RecommendationErrorHandler,
    config: Partial<ProjectPredictionConfig> = {}
  ) {
    this.dbService = dbService;
    this.errorHandler = errorHandler;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Predict success probability for a project
   */
  async predictProjectSuccess(
    userId: string,
    projectComponents: ComponentUsage[],
    projectType: string,
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    budget?: number
  ): Promise<ProjectSuccessPrediction> {
    try {
      const cacheKey = `project_prediction_${userId}_${JSON.stringify(projectComponents)}_${projectType}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // Analyze success factors
      const successFactors = await this.analyzeSuccessFactors(
        userId,
        projectComponents,
        projectType,
        difficulty,
        budget
      );

      // Calculate overall success probability
      const successProbability = this.calculateSuccessProbability(successFactors);

      // Identify risk factors
      const riskFactors = await this.identifyRiskFactors(
        userId,
        projectComponents,
        projectType,
        difficulty,
        successFactors
      );

      // Identify success factors
      const positiveFactors = await this.identifySuccessFactors(
        successFactors,
        projectComponents,
        projectType
      );

      // Generate recommendations
      const recommendations = await this.generateSuccessRecommendations(
        riskFactors,
        successFactors,
        projectComponents
      );

      // Estimate completion time
      const estimatedCompletionTime = this.estimateCompletionTime(
        projectType,
        difficulty,
        projectComponents.length,
        successFactors.userExperienceLevel
      );

      // Assess risks
      const budgetRisk = this.assessBudgetRisk(budget, projectComponents, successFactors);
      const technicalRisk = this.assessTechnicalRisk(difficulty, successFactors);

      const prediction: ProjectSuccessPrediction = {
        projectId: `prediction_${Date.now()}`,
        successProbability,
        confidence: this.calculatePredictionConfidence(successFactors, projectComponents.length),
        riskFactors,
        successFactors: positiveFactors,
        recommendations,
        estimatedCompletionTime,
        budgetRisk,
        technicalRisk
      };

      // Cache the prediction
      this.dbService.setCacheData(cacheKey, prediction, 1); // 1 hour cache

      return prediction;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { 
          operation: 'predictProjectSuccess', 
          userId, 
          timestamp: new Date().toISOString(),
          additionalData: { projectType }
        },
        {
          projectId: 'error',
          successProbability: 0.5,
          confidence: 0.1,
          riskFactors: [],
          successFactors: [],
          recommendations: ['Unable to generate prediction due to insufficient data'],
          estimatedCompletionTime: 7,
          budgetRisk: 'medium' as const,
          technicalRisk: 'medium' as const
        }
      );
    }
  }

  /**
   * Analyze component combinations for success patterns
   */
  async analyzeComponentCombination(
    componentIds: string[]
  ): Promise<ComponentCombinationAnalysis> {
    try {
      const cacheKey = `component_combination_${componentIds.sort().join('_')}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // Get historical data for these component combinations
      const historicalProjects = await this.getProjectsWithComponents(componentIds);
      
      if (historicalProjects.length === 0) {
        return {
          components: componentIds,
          compatibilityScore: 0.5, // Neutral when no data
          successRate: 0.5,
          commonIssues: ['No historical data available for this combination'],
          recommendations: ['Consider testing compatibility before full implementation'],
          sampleSize: 0
        };
      }

      // Calculate success rate
      const successfulProjects = historicalProjects.filter(p => 
        p.outcome === 'success'
      ).length;
      const successRate = successfulProjects / historicalProjects.length;

      // Analyze compatibility
      const compatibilityScore = await this.calculateComponentCompatibility(componentIds);

      // Extract common issues
      const commonIssues = this.extractCommonIssues(historicalProjects);

      // Generate recommendations
      const recommendations = this.generateCombinationRecommendations(
        successRate,
        compatibilityScore,
        commonIssues
      );

      const analysis: ComponentCombinationAnalysis = {
        components: componentIds,
        compatibilityScore,
        successRate,
        commonIssues,
        recommendations,
        sampleSize: historicalProjects.length
      };

      // Cache the analysis
      this.dbService.setCacheData(cacheKey, analysis, 24); // 24 hour cache

      return analysis;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { 
          operation: 'analyzeComponentCombination', 
          timestamp: new Date().toISOString(),
          additionalData: { componentIds }
        },
        {
          components: componentIds,
          compatibilityScore: 0.5,
          successRate: 0.5,
          commonIssues: ['Analysis failed'],
          recommendations: ['Manual compatibility testing recommended'],
          sampleSize: 0
        }
      );
    }
  }

  /**
   * Get success patterns for a specific project type
   */
  async getProjectTypeSuccessPatterns(
    projectType: string
  ): Promise<ProjectPattern[]> {
    try {
      const cacheKey = `project_patterns_${projectType}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // Get all projects of this type
      const projects = await this.getProjectsByType(projectType);
      
      if (projects.length < this.config.minProjectsForPrediction) {
        return [];
      }

      // Group projects by component patterns
      const patterns = this.identifyComponentPatterns(projects);

      // Calculate success rates for each pattern
      const successPatterns = patterns.map(pattern => ({
        ...pattern,
        successRate: this.calculatePatternSuccessRate(pattern, projects)
      })).filter(pattern => pattern.successRate >= this.config.successThreshold);

      // Cache the patterns
      this.dbService.setCacheData(cacheKey, successPatterns, 12); // 12 hour cache

      return successPatterns;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { 
          operation: 'getProjectTypeSuccessPatterns', 
          timestamp: new Date().toISOString(),
          additionalData: { projectType }
        },
        []
      );
    }
  }

  /**
   * Predict optimal component substitutions for better success
   */
  async predictOptimalSubstitutions(
    userId: string,
    currentComponents: ComponentUsage[],
    projectType: string
  ): Promise<Array<{
    originalComponent: string;
    suggestedSubstitution: string;
    successImprovement: number;
    reasoning: string;
  }>> {
    try {
      const substitutions: Array<{
        originalComponent: string;
        suggestedSubstitution: string;
        successImprovement: number;
        reasoning: string;
      }> = [];

      for (const component of currentComponents) {
        // Find alternative components
        const alternatives = await this.findComponentAlternatives(component.componentId);
        
        for (const alternative of alternatives) {
          // Calculate success improvement
          const currentSuccess = await this.getComponentSuccessRate(
            component.componentId,
            projectType
          );
          const alternativeSuccess = await this.getComponentSuccessRate(
            alternative.id,
            projectType
          );

          const improvement = alternativeSuccess - currentSuccess;
          
          if (improvement > 0.1) { // 10% improvement threshold
            substitutions.push({
              originalComponent: component.componentId,
              suggestedSubstitution: alternative.id,
              successImprovement: improvement,
              reasoning: this.generateSubstitutionReasoning(
                component.componentId,
                alternative.id,
                improvement
              )
            });
          }
        }
      }

      return substitutions.sort((a, b) => b.successImprovement - a.successImprovement);
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { 
          operation: 'predictOptimalSubstitutions', 
          userId, 
          timestamp: new Date().toISOString(),
          additionalData: { projectType }
        },
        []
      );
    }
  }

  // Private helper methods

  private async analyzeSuccessFactors(
    userId: string,
    projectComponents: ComponentUsage[],
    projectType: string,
    difficulty: string,
    budget?: number
  ): Promise<ProjectSuccessFactors> {
    // Get user's historical success rate for this project type
    const userProjects = await this.getUserProjectsByType(userId, projectType);
    const userSuccessRate = userProjects.length > 0 
      ? userProjects.filter(p => p.outcome === 'success').length / userProjects.length
      : 0.5; // Default to neutral

    // Calculate component compatibility
    const componentIds = projectComponents.map(c => c.componentId);
    const compatibilityScore = await this.calculateComponentCompatibility(componentIds);

    // Assess user experience level
    const userExperienceLevel = this.assessUserExperience(userId, projectType, difficulty);

    // Calculate project complexity
    const projectComplexity = this.calculateProjectComplexity(
      projectComponents.length,
      difficulty,
      projectType
    );

    // Assess component quality
    const componentQuality = await this.assessComponentQuality(componentIds);

    // Calculate budget adequacy
    const budgetAdequacy = budget 
      ? this.calculateBudgetAdequacy(budget, projectComponents)
      : 0.7; // Default to adequate if no budget specified

    return {
      componentCompatibility: compatibilityScore,
      userExperienceLevel,
      projectComplexity,
      componentQuality,
      historicalSuccessRate: userSuccessRate,
      budgetAdequacy
    };
  }

  private calculateSuccessProbability(factors: ProjectSuccessFactors): number {
    const weights = this.config.patternWeights;
    
    const weightedScore = 
      (factors.componentCompatibility * weights.componentCompatibility) +
      (factors.userExperienceLevel * weights.userExperience) +
      ((1 - factors.projectComplexity) * weights.projectComplexity) + // Lower complexity = higher success
      (factors.historicalSuccessRate * weights.historicalSuccess) +
      (factors.componentQuality * weights.componentQuality);

    // Apply budget factor
    const budgetAdjustment = factors.budgetAdequacy < 0.5 ? -0.1 : 0;
    
    return Math.max(0, Math.min(1, weightedScore + budgetAdjustment));
  }

  private async identifyRiskFactors(
    userId: string,
    projectComponents: ComponentUsage[],
    projectType: string,
    difficulty: string,
    factors: ProjectSuccessFactors
  ): Promise<RiskFactor[]> {
    const risks: RiskFactor[] = [];

    // Component compatibility risk
    if (factors.componentCompatibility < 0.6) {
      risks.push({
        type: 'compatibility',
        severity: factors.componentCompatibility < 0.3 ? 'critical' : 'high',
        description: 'Some components may not be compatible with each other',
        impact: 1 - factors.componentCompatibility,
        mitigation: 'Test component compatibility before assembly'
      });
    }

    // User experience risk
    if (factors.userExperienceLevel < 0.4 && difficulty !== 'beginner') {
      risks.push({
        type: 'experience',
        severity: difficulty === 'advanced' ? 'high' : 'medium',
        description: 'Project difficulty may exceed user experience level',
        impact: 0.3,
        mitigation: 'Consider starting with simpler projects or seeking guidance'
      });
    }

    // Project complexity risk
    if (factors.projectComplexity > 0.8) {
      risks.push({
        type: 'complexity',
        severity: 'high',
        description: 'Project is highly complex with many components',
        impact: factors.projectComplexity * 0.4,
        mitigation: 'Break project into smaller phases'
      });
    }

    // Budget risk
    if (factors.budgetAdequacy < 0.5) {
      risks.push({
        type: 'budget',
        severity: factors.budgetAdequacy < 0.3 ? 'critical' : 'medium',
        description: 'Budget may be insufficient for project completion',
        impact: (1 - factors.budgetAdequacy) * 0.3,
        mitigation: 'Consider alternative components or increase budget'
      });
    }

    // Component quality risk
    if (factors.componentQuality < 0.5) {
      risks.push({
        type: 'component',
        severity: 'medium',
        description: 'Some components may have quality issues',
        impact: (1 - factors.componentQuality) * 0.2,
        mitigation: 'Consider higher quality alternatives'
      });
    }

    return risks;
  }

  private async identifySuccessFactors(
    factors: ProjectSuccessFactors,
    projectComponents: ComponentUsage[],
    projectType: string
  ): Promise<SuccessFactor[]> {
    const successFactors: SuccessFactor[] = [];

    // High compatibility
    if (factors.componentCompatibility > 0.8) {
      successFactors.push({
        type: 'compatibility',
        strength: 'high',
        description: 'Components are highly compatible with each other',
        impact: factors.componentCompatibility * 0.3
      });
    }

    // Good user experience
    if (factors.userExperienceLevel > 0.7) {
      successFactors.push({
        type: 'experience',
        strength: 'high',
        description: 'User has strong experience with this project type',
        impact: factors.userExperienceLevel * 0.25
      });
    }

    // Manageable complexity
    if (factors.projectComplexity < 0.4) {
      successFactors.push({
        type: 'simplicity',
        strength: 'high',
        description: 'Project has manageable complexity',
        impact: (1 - factors.projectComplexity) * 0.2
      });
    }

    // Adequate budget
    if (factors.budgetAdequacy > 0.8) {
      successFactors.push({
        type: 'budget',
        strength: 'high',
        description: 'Budget is more than adequate for project needs',
        impact: factors.budgetAdequacy * 0.15
      });
    }

    // High quality components
    if (factors.componentQuality > 0.8) {
      successFactors.push({
        type: 'component',
        strength: 'high',
        description: 'Using high-quality, reliable components',
        impact: factors.componentQuality * 0.1
      });
    }

    return successFactors;
  }

  private async generateSuccessRecommendations(
    riskFactors: RiskFactor[],
    factors: ProjectSuccessFactors,
    components: ComponentUsage[]
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Add mitigation strategies for high-risk factors
    riskFactors
      .filter(risk => risk.severity === 'high' || risk.severity === 'critical')
      .forEach(risk => {
        recommendations.push(risk.mitigation);
      });

    // Add general recommendations based on factors
    if (factors.componentCompatibility < 0.7) {
      recommendations.push('Test component connections before final assembly');
    }

    if (factors.projectComplexity > 0.6) {
      recommendations.push('Create a detailed project plan with milestones');
    }

    if (factors.userExperienceLevel < 0.5) {
      recommendations.push('Consider following detailed tutorials or seeking help');
    }

    if (components.length > 10) {
      recommendations.push('Organize components and create a wiring diagram');
    }

    // Ensure we have at least some recommendations
    if (recommendations.length === 0) {
      recommendations.push('Follow best practices for component handling and assembly');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private estimateCompletionTime(
    projectType: string,
    difficulty: string,
    componentCount: number,
    userExperience: number
  ): number {
    // Base time estimates (in days)
    const baseTime = {
      'IoT': 3,
      'Robotics': 5,
      'Home Automation': 2,
      'Sensor Project': 1,
      'LED Project': 1,
      'Audio': 2
    };

    const difficultyMultiplier = {
      'beginner': 1.5,
      'intermediate': 1.0,
      'advanced': 0.8
    };

    const base = baseTime[projectType as keyof typeof baseTime] || 3;
    const diffMult = difficultyMultiplier[difficulty as keyof typeof difficultyMultiplier] || 1.0;
    const componentFactor = Math.log(componentCount + 1) * 0.5;
    const experienceFactor = 2 - userExperience; // Less experience = more time

    return Math.ceil(base * diffMult * (1 + componentFactor) * experienceFactor);
  }

  private assessBudgetRisk(
    budget: number | undefined,
    components: ComponentUsage[],
    factors: ProjectSuccessFactors
  ): 'low' | 'medium' | 'high' {
    if (!budget) return 'medium';
    
    if (factors.budgetAdequacy > 0.8) return 'low';
    if (factors.budgetAdequacy > 0.5) return 'medium';
    return 'high';
  }

  private assessTechnicalRisk(
    difficulty: string,
    factors: ProjectSuccessFactors
  ): 'low' | 'medium' | 'high' {
    const complexityRisk = factors.projectComplexity;
    const compatibilityRisk = 1 - factors.componentCompatibility;
    
    const overallRisk = (complexityRisk + compatibilityRisk) / 2;
    
    if (difficulty === 'advanced' && overallRisk > 0.6) return 'high';
    if (overallRisk > 0.7) return 'high';
    if (overallRisk > 0.4) return 'medium';
    return 'low';
  }

  private calculatePredictionConfidence(
    factors: ProjectSuccessFactors,
    componentCount: number
  ): number {
    // Base confidence on data quality and sample size
    const dataQuality = (factors.historicalSuccessRate > 0.1 && factors.historicalSuccessRate < 0.9) ? 0.8 : 0.5;
    const componentFactor = Math.min(1, componentCount / 10); // More components = more data points
    
    return Math.min(0.95, dataQuality * componentFactor);
  }

  // Placeholder methods for data access (would be implemented with real database queries)
  
  private async getProjectsWithComponents(componentIds: string[]): Promise<TrainingData[]> {
    // This would query the database for projects containing these components
    return [];
  }

  private async calculateComponentCompatibility(componentIds: string[]): Promise<number> {
    // This would analyze technical specifications for compatibility
    return 0.7; // Placeholder
  }

  private extractCommonIssues(projects: TrainingData[]): string[] {
    // This would analyze project modifications and failures to extract common issues
    return ['Wiring complexity', 'Power supply issues'];
  }

  private generateCombinationRecommendations(
    successRate: number,
    compatibilityScore: number,
    commonIssues: string[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (successRate < 0.6) {
      recommendations.push('This combination has a lower success rate - consider alternatives');
    }
    
    if (compatibilityScore < 0.7) {
      recommendations.push('Test compatibility thoroughly before implementation');
    }
    
    commonIssues.forEach(issue => {
      recommendations.push(`Watch out for: ${issue}`);
    });
    
    return recommendations;
  }

  private async getProjectsByType(projectType: string): Promise<TrainingData[]> {
    // This would query projects by type
    return [];
  }

  private identifyComponentPatterns(projects: TrainingData[]): ProjectPattern[] {
    // This would analyze projects to identify common component patterns
    return [];
  }

  private calculatePatternSuccessRate(pattern: ProjectPattern, projects: TrainingData[]): number {
    // This would calculate success rate for a specific pattern
    return 0.8; // Placeholder
  }

  private async findComponentAlternatives(componentId: string): Promise<InventoryItem[]> {
    // This would find alternative components
    return [];
  }

  private async getComponentSuccessRate(componentId: string, projectType: string): Promise<number> {
    // This would get historical success rate for a component in specific project types
    return 0.7; // Placeholder
  }

  private generateSubstitutionReasoning(
    originalId: string,
    alternativeId: string,
    improvement: number
  ): string {
    return `Alternative component shows ${Math.round(improvement * 100)}% better success rate in similar projects`;
  }

  private async getUserProjectsByType(userId: string, projectType: string): Promise<TrainingData[]> {
    // This would get user's historical projects of a specific type
    return [];
  }

  private assessUserExperience(userId: string, projectType: string, difficulty: string): number {
    // This would assess user's experience level based on historical data
    const difficultyScore = {
      'beginner': 0.3,
      'intermediate': 0.6,
      'advanced': 0.9
    };
    
    return difficultyScore[difficulty as keyof typeof difficultyScore] || 0.5;
  }

  private calculateProjectComplexity(
    componentCount: number,
    difficulty: string,
    projectType: string
  ): number {
    const baseComplexity = {
      'beginner': 0.2,
      'intermediate': 0.5,
      'advanced': 0.8
    };
    
    const typeComplexity = {
      'LED Project': 0.1,
      'Sensor Project': 0.3,
      'IoT': 0.6,
      'Robotics': 0.8,
      'Home Automation': 0.7
    };
    
    const base = baseComplexity[difficulty as keyof typeof baseComplexity] || 0.5;
    const type = typeComplexity[projectType as keyof typeof typeComplexity] || 0.5;
    const componentFactor = Math.min(0.3, componentCount / 20); // More components = more complexity
    
    return Math.min(1, base + type + componentFactor);
  }

  private async assessComponentQuality(componentIds: string[]): Promise<number> {
    // This would assess the quality of components based on historical data
    return 0.7; // Placeholder
  }

  private calculateBudgetAdequacy(budget: number, components: ComponentUsage[]): number {
    // This would calculate if budget is adequate based on component costs
    const estimatedCost = components.length * 15; // Rough estimate
    return Math.min(1, budget / estimatedCost);
  }

  /**
   * Get prediction statistics for monitoring
   */
  getPredictionStats(): {
    totalPredictions: number;
    averageAccuracy: number;
    lastPredictionTime: string;
  } {
    return {
      totalPredictions: 0,
      averageAccuracy: 0.75,
      lastPredictionTime: new Date().toISOString()
    };
  }
}

export default ProjectSuccessPredictionEngine;