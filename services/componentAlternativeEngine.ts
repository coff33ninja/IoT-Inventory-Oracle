import DatabaseService from "./databaseService.js";
import { RecommendationErrorHandler } from "./errorHandler.js";
import {
  ComponentAlternative,
  ComponentSpecification,
  InventoryItem,
  ProjectContext,
  TechnicalDifference,
  CompatibilityIssue,
  CompatibilitySuggestion,
} from "../types.js";

/**
 * Configuration for the alternative suggestion engine
 */
export interface AlternativeEngineConfig {
  maxAlternatives: number;
  minCompatibilityScore: number;
  enableAIAnalysis: boolean;
  weightings: {
    category: number;
    manufacturer: number;
    availability: number;
    price: number;
    specifications: number;
    userPreference: number;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AlternativeEngineConfig = {
  maxAlternatives: 5,
  minCompatibilityScore: 50,
  enableAIAnalysis: true,
  weightings: {
    category: 0.25,
    manufacturer: 0.15,
    availability: 0.2,
    price: 0.15,
    specifications: 0.2,
    userPreference: 0.05,
  },
};

/**
 * Component matching strategy interface
 */
interface MatchingStrategy {
  name: string;
  weight: number;
  execute(
    original: InventoryItem,
    candidate: InventoryItem,
    specs?: ComponentSpecification
  ): Promise<number>;
}

/**
 * Enhanced component alternative suggestion engine
 */
export class ComponentAlternativeEngine {
  private dbService: DatabaseService;
  private errorHandler: RecommendationErrorHandler;
  private config: AlternativeEngineConfig;
  private geminiService?: any;
  private strategies: MatchingStrategy[];

  constructor(
    dbService: DatabaseService,
    errorHandler: RecommendationErrorHandler,
    config: Partial<AlternativeEngineConfig> = {},
    geminiService?: any
  ) {
    this.dbService = dbService;
    this.errorHandler = errorHandler;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.geminiService = geminiService;
    this.strategies = this.initializeStrategies();
  }

  /**
   * Find component alternatives using multiple strategies
   */
  async findAlternatives(
    component: InventoryItem,
    specs: ComponentSpecification | null,
    context?: ProjectContext
  ): Promise<ComponentAlternative[]> {
    try {
      const alternatives: ComponentAlternative[] = [];
      const candidates = await this.getCandidateComponents(component);

      console.log(
        `Found ${candidates.length} candidate components for ${component.name}`
      );

      // Evaluate each candidate using all strategies
      for (const candidate of candidates) {
        if (candidate.id === component.id) continue;

        const alternative = await this.evaluateCandidate(
          component,
          candidate,
          specs,
          context
        );
        if (
          alternative &&
          alternative.compatibilityScore >= this.config.minCompatibilityScore
        ) {
          alternatives.push(alternative);
        }
      }

      // Sort by compatibility score and limit results
      const sortedAlternatives = alternatives
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, this.config.maxAlternatives);

      // Enhance with AI analysis if available
      if (
        this.config.enableAIAnalysis &&
        this.geminiService &&
        sortedAlternatives.length > 0
      ) {
        return await this.enhanceWithAIAnalysis(
          component,
          sortedAlternatives,
          specs,
          context
        );
      }

      return sortedAlternatives;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        { operation: "findAlternatives", componentId: component.id },
        []
      );
    }
  }

  /**
   * Get candidate components for evaluation
   */
  private async getCandidateComponents(
    component: InventoryItem
  ): Promise<InventoryItem[]> {
    const candidates: InventoryItem[] = [];

    // Strategy 1: Same category components
    if (component.category) {
      const categoryComponents = this.dbService.getItemsByCategory(
        component.category
      );
      candidates.push(...categoryComponents);
    }

    // Strategy 2: Same manufacturer components
    if (component.manufacturer) {
      const allItems = this.dbService.getAllItems();
      const manufacturerComponents = allItems.filter(
        (item) =>
          item.manufacturer === component.manufacturer &&
          item.id !== component.id
      );
      candidates.push(...manufacturerComponents);
    }

    // Strategy 3: Components with similar names (fuzzy matching)
    const similarNameComponents = await this.findSimilarNameComponents(
      component
    );
    candidates.push(...similarNameComponents);

    // Strategy 4: Related components from relationships
    if (component.relatedComponents) {
      for (const relationship of component.relatedComponents) {
        const relatedComponent = this.dbService.getItemById(
          relationship.relatedComponentId
        );
        if (relatedComponent) {
          candidates.push(relatedComponent);
        }
      }
    }

    // Remove duplicates
    const uniqueCandidates = candidates.filter(
      (candidate, index, self) =>
        index === self.findIndex((c) => c.id === candidate.id)
    );

    return uniqueCandidates;
  }

  /**
   * Find components with similar names using fuzzy matching
   */
  private async findSimilarNameComponents(
    component: InventoryItem
  ): Promise<InventoryItem[]> {
    const allItems = this.dbService.getAllItems();
    const similarComponents: InventoryItem[] = [];

    // Extract key terms from component name
    const keyTerms = this.extractKeyTerms(component.name);

    for (const item of allItems) {
      if (item.id === component.id) continue;

      const similarity = this.calculateNameSimilarity(
        component.name,
        item.name,
        keyTerms
      );
      if (similarity > 0.3) {
        // 30% similarity threshold
        similarComponents.push(item);
      }
    }

    return similarComponents;
  }

  /**
   * Extract key terms from component name for matching
   */
  private extractKeyTerms(name: string): string[] {
    // Remove common words and extract meaningful terms
    const commonWords = [
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ];
    const terms = name
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Remove special characters
      .split(/\s+/)
      .filter((term) => term.length > 2 && !commonWords.includes(term));

    return terms;
  }

  /**
   * Calculate name similarity between components
   */
  private calculateNameSimilarity(
    name1: string,
    name2: string,
    keyTerms: string[]
  ): number {
    const name2Lower = name2.toLowerCase();
    let matchCount = 0;

    for (const term of keyTerms) {
      if (name2Lower.includes(term)) {
        matchCount++;
      }
    }

    return keyTerms.length > 0 ? matchCount / keyTerms.length : 0;
  }

  /**
   * Evaluate a candidate component using all strategies
   */
  private async evaluateCandidate(
    original: InventoryItem,
    candidate: InventoryItem,
    specs: ComponentSpecification | null,
    context?: ProjectContext
  ): Promise<ComponentAlternative | null> {
    try {
      let totalScore = 0;
      let totalWeight = 0;

      // Execute all matching strategies
      for (const strategy of this.strategies) {
        const score = await strategy.execute(
          original,
          candidate,
          specs || undefined
        );
        totalScore += score * strategy.weight;
        totalWeight += strategy.weight;
      }

      // Calculate weighted average
      const compatibilityScore =
        totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

      // Skip if below minimum threshold
      if (compatibilityScore < this.config.minCompatibilityScore) {
        return null;
      }

      // Calculate price comparison
      const priceComparison = this.calculatePriceComparison(
        original,
        candidate
      );

      // Analyze technical differences
      const technicalDifferences = await this.analyzeTechnicalDifferences(
        original,
        candidate,
        specs || undefined
      );

      // Determine usability impact
      const usabilityImpact = this.determineUsabilityImpact(
        compatibilityScore,
        technicalDifferences
      );

      // Generate explanation
      const explanation = this.generateDetailedExplanation(
        original,
        candidate,
        compatibilityScore,
        technicalDifferences
      );

      // Identify required modifications
      const requiredModifications =
        this.identifyRequiredModifications(technicalDifferences);

      return {
        componentId: candidate.id,
        name: candidate.name,
        compatibilityScore,
        priceComparison,
        technicalDifferences,
        usabilityImpact,
        explanation,
        confidence: Math.min(compatibilityScore, 95), // Cap confidence at 95%
        requiredModifications:
          requiredModifications.length > 0 ? requiredModifications : undefined,
      };
    } catch (error) {
      console.error("Error evaluating candidate:", error);
      return null;
    }
  }

  /**
   * Initialize matching strategies
   */
  private initializeStrategies(): MatchingStrategy[] {
    return [
      {
        name: "category",
        weight: this.config.weightings.category,
        execute: async (original, candidate) => {
          return original.category === candidate.category ? 100 : 0;
        },
      },
      {
        name: "manufacturer",
        weight: this.config.weightings.manufacturer,
        execute: async (original, candidate) => {
          return original.manufacturer === candidate.manufacturer ? 100 : 0;
        },
      },
      {
        name: "availability",
        weight: this.config.weightings.availability,
        execute: async (original, candidate) => {
          if (candidate.quantity <= 0) return 0;
          if (candidate.quantity >= 5) return 100;
          return candidate.quantity * 20; // Scale 1-5 to 20-100
        },
      },
      {
        name: "price",
        weight: this.config.weightings.price,
        execute: async (original, candidate) => {
          const originalPrice = original.purchasePrice || 0;
          const candidatePrice = candidate.purchasePrice || 0;

          if (originalPrice === 0 || candidatePrice === 0) return 50; // Neutral if no price data

          const priceDiff =
            Math.abs(originalPrice - candidatePrice) / originalPrice;
          return Math.max(0, 100 - priceDiff * 100);
        },
      },
      {
        name: "specifications",
        weight: this.config.weightings.specifications,
        execute: async (original, candidate, specs) => {
          return await this.compareSpecifications(
            original,
            candidate,
            specs || undefined
          );
        },
      },
      {
        name: "userPreference",
        weight: this.config.weightings.userPreference,
        execute: async (original, candidate) => {
          // Check usage metrics to determine user preference
          const candidateMetrics = this.dbService.getUsageMetrics(candidate.id);
          if (!candidateMetrics) return 50; // Neutral if no usage data

          // Higher usage frequency indicates user preference
          const frequencyScore =
            candidateMetrics.usageFrequency === "high"
              ? 100
              : candidateMetrics.usageFrequency === "medium"
              ? 75
              : candidateMetrics.usageFrequency === "low"
              ? 25
              : 50;

          return frequencyScore;
        },
      },
    ];
  }

  /**
   * Compare specifications between components
   */
  private async compareSpecifications(
    original: InventoryItem,
    candidate: InventoryItem,
    specs: ComponentSpecification | undefined
  ): Promise<number> {
    if (!specs) return 50; // Neutral if no specs available

    const candidateSpecs = this.dbService.getComponentSpecifications(
      candidate.id
    );
    if (!candidateSpecs) return 25; // Lower score if candidate has no specs

    let compatibilityScore = 0;
    let comparisons = 0;

    // Compare voltage requirements
    if (specs.voltage && candidateSpecs.voltage) {
      const voltageCompatible = this.isVoltageCompatible(
        specs.voltage,
        candidateSpecs.voltage
      );
      compatibilityScore += voltageCompatible ? 100 : 0;
      comparisons++;
    }

    // Compare current requirements
    if (specs.current && candidateSpecs.current) {
      const currentCompatible =
        candidateSpecs.current.max >= specs.current.max * 0.8; // 80% tolerance
      compatibilityScore += currentCompatible ? 100 : 0;
      comparisons++;
    }

    // Compare protocols
    if (specs.protocols && candidateSpecs.protocols) {
      const commonProtocols = specs.protocols.filter((p) =>
        candidateSpecs.protocols!.includes(p)
      );
      const protocolScore =
        commonProtocols.length > 0
          ? (commonProtocols.length / specs.protocols.length) * 100
          : 0;
      compatibilityScore += protocolScore;
      comparisons++;
    }

    // Compare compatibility platforms
    if (specs.compatibility && candidateSpecs.compatibility) {
      const commonPlatforms = specs.compatibility.filter((p) =>
        candidateSpecs.compatibility!.includes(p)
      );
      const platformScore =
        commonPlatforms.length > 0
          ? (commonPlatforms.length / specs.compatibility.length) * 100
          : 0;
      compatibilityScore += platformScore;
      comparisons++;
    }

    return comparisons > 0 ? compatibilityScore / comparisons : 50;
  }

  /**
   * Check if voltage ranges are compatible
   */
  private isVoltageCompatible(
    required: { min: number; max: number; unit: string },
    available: { min: number; max: number; unit: string }
  ): boolean {
    if (required.unit !== available.unit) return false; // Different units

    // Check if ranges overlap
    return !(required.max < available.min || required.min > available.max);
  }

  /**
   * Calculate price comparison between components
   */
  private calculatePriceComparison(
    original: InventoryItem,
    alternative: InventoryItem
  ) {
    const originalPrice = original.purchasePrice || 0;
    const alternativePrice = alternative.purchasePrice || 0;

    const savings = originalPrice - alternativePrice;
    const percentageDifference =
      originalPrice > 0 ? Math.abs(savings / originalPrice) * 100 : 0;

    return {
      original: originalPrice,
      alternative: alternativePrice,
      savings,
      percentageDifference,
    };
  }

  /**
   * Analyze technical differences between components
   */
  private async analyzeTechnicalDifferences(
    original: InventoryItem,
    candidate: InventoryItem,
    specs: ComponentSpecification | undefined
  ): Promise<TechnicalDifference[]> {
    const differences: TechnicalDifference[] = [];

    // Compare basic properties
    if (original.manufacturer !== candidate.manufacturer) {
      differences.push({
        property: "manufacturer",
        original: original.manufacturer || "Unknown",
        alternative: candidate.manufacturer || "Unknown",
        impact: "neutral",
        description:
          "Different manufacturer may affect compatibility or quality",
      });
    }

    if (original.condition !== candidate.condition) {
      differences.push({
        property: "condition",
        original: original.condition || "Unknown",
        alternative: candidate.condition || "Unknown",
        impact: this.compareConditions(original.condition, candidate.condition),
        description: "Different component condition may affect reliability",
      });
    }

    // Compare specifications if available
    if (specs) {
      const candidateSpecs = this.dbService.getComponentSpecifications(
        candidate.id
      );
      if (candidateSpecs) {
        differences.push(
          ...(await this.compareDetailedSpecs(specs, candidateSpecs))
        );
      }
    }

    return differences;
  }

  /**
   * Compare component conditions
   */
  private compareConditions(
    originalCondition?: string,
    candidateCondition?: string
  ): "positive" | "negative" | "neutral" {
    const conditionRanking = {
      New: 5,
      Refurbished: 4,
      Used: 3,
      Damaged: 1,
      Unknown: 2,
    };

    const originalRank =
      conditionRanking[originalCondition as keyof typeof conditionRanking] || 2;
    const candidateRank =
      conditionRanking[candidateCondition as keyof typeof conditionRanking] ||
      2;

    if (candidateRank > originalRank) return "positive";
    if (candidateRank < originalRank) return "negative";
    return "neutral";
  }

  /**
   * Compare detailed specifications
   */
  private async compareDetailedSpecs(
    originalSpecs: ComponentSpecification,
    candidateSpecs: ComponentSpecification
  ): Promise<TechnicalDifference[]> {
    const differences: TechnicalDifference[] = [];

    // Compare voltage
    if (originalSpecs.voltage && candidateSpecs.voltage) {
      if (
        originalSpecs.voltage.min !== candidateSpecs.voltage.min ||
        originalSpecs.voltage.max !== candidateSpecs.voltage.max
      ) {
        differences.push({
          property: "voltage",
          original: `${originalSpecs.voltage.min}-${originalSpecs.voltage.max}${originalSpecs.voltage.unit}`,
          alternative: `${candidateSpecs.voltage.min}-${candidateSpecs.voltage.max}${candidateSpecs.voltage.unit}`,
          impact: this.isVoltageCompatible(
            originalSpecs.voltage,
            candidateSpecs.voltage
          )
            ? "neutral"
            : "negative",
          description:
            "Different voltage requirements may require circuit modifications",
        });
      }
    }

    // Compare current
    if (originalSpecs.current && candidateSpecs.current) {
      if (originalSpecs.current.max !== candidateSpecs.current.max) {
        differences.push({
          property: "current",
          original: `${originalSpecs.current.max}${originalSpecs.current.unit}`,
          alternative: `${candidateSpecs.current.max}${candidateSpecs.current.unit}`,
          impact:
            candidateSpecs.current.max >= originalSpecs.current.max
              ? "positive"
              : "negative",
          description:
            "Different current capacity may affect power supply requirements",
        });
      }
    }

    return differences;
  }

  /**
   * Determine usability impact based on compatibility score and differences
   */
  private determineUsabilityImpact(
    compatibilityScore: number,
    technicalDifferences: TechnicalDifference[]
  ): "none" | "minimal" | "moderate" | "significant" {
    const negativeImpacts = technicalDifferences.filter(
      (diff) => diff.impact === "negative"
    ).length;

    if (compatibilityScore >= 90 && negativeImpacts === 0) return "none";
    if (compatibilityScore >= 80 && negativeImpacts <= 1) return "minimal";
    if (compatibilityScore >= 60 && negativeImpacts <= 2) return "moderate";
    return "significant";
  }

  /**
   * Generate detailed explanation for the alternative
   */
  private generateDetailedExplanation(
    original: InventoryItem,
    candidate: InventoryItem,
    compatibilityScore: number,
    technicalDifferences: TechnicalDifference[]
  ): string {
    const reasons = [];

    // Positive aspects
    if (original.category === candidate.category) {
      reasons.push(`same category (${original.category})`);
    }

    if (original.manufacturer === candidate.manufacturer) {
      reasons.push(`same manufacturer (${original.manufacturer})`);
    }

    if (candidate.quantity > 0) {
      reasons.push(`in stock (${candidate.quantity} available)`);
    }

    const priceComp = this.calculatePriceComparison(original, candidate);
    if (priceComp.savings > 0) {
      reasons.push(`costs less ($${priceComp.savings.toFixed(2)} savings)`);
    }

    // Technical considerations
    const negativeImpacts = technicalDifferences.filter(
      (diff) => diff.impact === "negative"
    );
    if (negativeImpacts.length > 0) {
      reasons.push(
        `${negativeImpacts.length} technical difference(s) to consider`
      );
    }

    let explanation = `This component is suggested because it has ${reasons.join(
      ", "
    )}. `;
    explanation += `Compatibility score: ${compatibilityScore}%.`;

    if (negativeImpacts.length > 0) {
      explanation += ` Note: Review technical differences before substituting.`;
    }

    return explanation;
  }

  /**
   * Identify required modifications based on technical differences
   */
  private identifyRequiredModifications(
    technicalDifferences: TechnicalDifference[]
  ): string[] {
    const modifications: string[] = [];

    for (const diff of technicalDifferences) {
      if (diff.impact === "negative") {
        switch (diff.property) {
          case "voltage":
            modifications.push(
              "Adjust power supply voltage or add voltage regulator"
            );
            break;
          case "current":
            modifications.push(
              "Upgrade power supply to handle higher current requirements"
            );
            break;
          case "protocols":
            modifications.push("Update communication protocol in software");
            break;
          default:
            modifications.push(
              `Review ${diff.property} compatibility and adjust as needed`
            );
        }
      }
    }

    return modifications;
  }

  /**
   * Enhance alternatives with AI analysis
   */
  private async enhanceWithAIAnalysis(
    original: InventoryItem,
    alternatives: ComponentAlternative[],
    specs: ComponentSpecification | null,
    context?: ProjectContext
  ): Promise<ComponentAlternative[]> {
    try {
      // This would integrate with Gemini AI service for advanced analysis
      // For now, return the alternatives as-is
      console.log(
        `AI analysis would enhance ${alternatives.length} alternatives for ${original.name}`
      );
      return alternatives;
    } catch (error) {
      console.warn(
        "AI analysis failed, returning rule-based alternatives:",
        error
      );
      return alternatives;
    }
  }
}

export default ComponentAlternativeEngine;
