import DatabaseService from "./databaseService.js";
import { RecommendationErrorHandler } from "./errorHandler.js";
import {
  ComponentKnowledgeService,
  DetailedComponentSpec,
} from "./componentKnowledgeService.js";
import {
  InventoryItem,
  CompatibilityAnalysis,
  TechnicalDifference,
} from "../types.js";

/**
 * Configuration for technical explanation service
 */
export interface TechnicalExplanationConfig {
  enableAIExplanations: boolean;
  explanationDepth: "basic" | "detailed" | "expert";
  includeCircuitModifications: boolean;
  maxExplanationLength: number;
  cacheDuration: number; // hours
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: TechnicalExplanationConfig = {
  enableAIExplanations: true,
  explanationDepth: "detailed",
  includeCircuitModifications: true,
  maxExplanationLength: 1000,
  cacheDuration: 24, // 24 hours
};

/**
 * Circuit modification required for component substitution
 */
export interface CircuitModification {
  type:
    | "voltage_divider"
    | "level_shifter"
    | "pull_up_resistor"
    | "decoupling_capacitor"
    | "current_limiter"
    | "protocol_converter";
  description: string;
  components: Array<{
    type: string;
    value: string;
    quantity: number;
  }>;
  schematic?: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  cost: number;
}

/**
 * Technical comparison result
 */
export interface TechnicalComparison {
  component1: {
    id: string;
    name: string;
    specifications: DetailedComponentSpec;
  };
  component2: {
    id: string;
    name: string;
    specifications: DetailedComponentSpec;
  };
  differences: TechnicalDifference[];
  similarities: Array<{
    property: string;
    description: string;
    significance: "low" | "medium" | "high";
  }>;
  compatibilityAnalysis: CompatibilityAnalysis;
  humanReadableExplanation: string;
  circuitModifications: CircuitModification[];
  recommendedChoice: {
    componentId: string;
    reasoning: string;
    confidence: number;
  };
} /**

 * Technical explanation and comparison service
 */
export class TechnicalExplanationService {
  private dbService: DatabaseService;
  private errorHandler: RecommendationErrorHandler;
  private knowledgeService: ComponentKnowledgeService;
  private config: TechnicalExplanationConfig;

  constructor(
    dbService: DatabaseService,
    errorHandler: RecommendationErrorHandler,
    knowledgeService: ComponentKnowledgeService,
    config: Partial<TechnicalExplanationConfig> = {}
  ) {
    this.dbService = dbService;
    this.errorHandler = errorHandler;
    this.knowledgeService = knowledgeService;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate detailed technical comparison between two components
   */
  async generateTechnicalComparison(
    component1Id: string,
    component2Id: string
  ): Promise<TechnicalComparison | null> {
    try {
      const cacheKey = `tech_comparison_${component1Id}_${component2Id}`;
      const cached = this.dbService.getCacheData(cacheKey);
      if (cached) {
        return cached;
      }

      // Get component specifications
      const spec1 = await this.knowledgeService.getComponentSpecifications(
        component1Id
      );
      const spec2 = await this.knowledgeService.getComponentSpecifications(
        component2Id
      );

      if (!spec1 || !spec2) {
        return null;
      }

      const component1 = this.dbService.getItemById(component1Id);
      const component2 = this.dbService.getItemById(component2Id);

      if (!component1 || !component2) {
        return null;
      }

      // Analyze differences and similarities
      const differences = this.analyzeTechnicalDifferences(spec1, spec2);
      const similarities = this.nalyzeSimilarities(spec1, spec2);

      // Get compatibility analysis
      const compatibilityCheck = await this.knowledgeService.checkCompatibility(
        component1Id,
        component2Id
      );

      // Generate human-readable explanation
      const humanReadableExplanation =
        await this.generateHumanReadableExplanation(
          component1,
          component2,
          differences,
          similarities
        );

      // Identify required circuit modifications
      const circuitModifications =
        this.identifyCircuitModifications(differences);

      // Make recommendation
      const recommendedChoice = this.makeRecommendation(
        component1,
        component2,
        differences,
        compatibilityCheck?.compatibilityScore || 0
      );

      const comparison: TechnicalComparison = {
        component1: {
          id: component1Id,
          name: component1.name,
          specifications: spec1,
        },
        component2: {
          id: component2Id,
          name: component2.name,
          specifications: spec2,
        },
        differences,
        similarities,
        compatibilityAnalysis: compatibilityCheck?.analysis || {
          overallCompatibility: 50,
          issues: [],
          suggestions: [],
          requiredModifications: [],
        },
        humanReadableExplanation,
        circuitModifications,
        recommendedChoice,
      };

      // Cache the comparison
      this.dbService.setCacheData(
        cacheKey,
        comparison,
        this.config.cacheDuration
      );

      return comparison;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "generateTechnicalComparison",
          timestamp: new Date().toISOString(),
          additionalData: { component1Id, component2Id },
        },
        null
      );
    }
  } /**
   * 
Generate explanation for component alternative suggestions
   */
  async explainAlternativeSuggestion(
    originalComponentId: string,
    alternativeComponentId: string,
    context?: {
      projectType?: string;
      budget?: number;
      userSkillLevel?: "beginner" | "intermediate" | "advanced";
    }
  ): Promise<{
    explanation: string;
    pros: string[];
    cons: string[];
    requiredChanges: string[];
    difficulty: "easy" | "medium" | "hard";
    recommendation:
      | "highly_recommended"
      | "recommended"
      | "consider_carefully"
      | "not_recommended";
  }> {
    try {
      const comparison = await this.generateTechnicalComparison(
        originalComponentId,
        alternativeComponentId
      );

      if (!comparison) {
        return {
          explanation:
            "Unable to generate comparison due to insufficient component data.",
          pros: [],
          cons: [],
          requiredChanges: [],
          difficulty: "medium",
          recommendation: "consider_carefully",
        };
      }

      const pros = this.extractPros(comparison, context);
      const cons = this.extractCons(comparison, context);
      const requiredChanges = comparison.circuitModifications.map(
        (mod) => mod.description
      );
      const difficulty = this.assessOverallDifficulty(
        comparison.circuitModifications,
        context?.userSkillLevel
      );
      const recommendation = this.makeAlternativeRecommendation(
        comparison,
        context
      );

      const explanation = this.generateAlternativeExplanation(
        comparison,
        pros,
        cons,
        requiredChanges,
        difficulty,
        recommendation,
        context
      );

      return {
        explanation,
        pros,
        cons,
        requiredChanges,
        difficulty,
        recommendation,
      };
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "explainAlternativeSuggestion",
          timestamp: new Date().toISOString(),
          additionalData: {
            originalComponentId,
            alternativeComponentId,
            context,
          },
        },
        {
          explanation: "Unable to generate alternative explanation.",
          pros: [],
          cons: [],
          requiredChanges: [],
          difficulty: "medium" as const,
          recommendation: "consider_carefully" as const,
        }
      );
    }
  }

  /**
   * Generate circuit modification instructions
   */
  async generateCircuitModificationInstructions(
    originalComponentId: string,
    newComponentId: string
  ): Promise<
    Array<{
      step: number;
      instruction: string;
      type: "remove" | "add" | "modify" | "connect";
      components: string[];
      warnings: string[];
      tips: string[];
    }>
  > {
    try {
      const comparison = await this.generateTechnicalComparison(
        originalComponentId,
        newComponentId
      );

      if (!comparison || comparison.circuitModifications.length === 0) {
        return [
          {
            step: 1,
            instruction:
              "Direct replacement - no circuit modifications required",
            type: "modify",
            components: [],
            warnings: ["Verify pin compatibility before connecting"],
            tips: ["Double-check voltage levels match"],
          },
        ];
      }

      const instructions: Array<{
        step: number;
        instruction: string;
        type: "remove" | "add" | "modify" | "connect";
        components: string[];
        warnings: string[];
        tips: string[];
      }> = [];

      let stepNumber = 1;

      // Add removal step
      instructions.push({
        step: stepNumber++,
        instruction: `Remove the original ${comparison.component1.name} from the circuit`,
        type: "remove",
        components: [comparison.component1.name],
        warnings: ["Power off the circuit before making changes"],
        tips: ["Take a photo of the original wiring for reference"],
      });

      // Add modification steps
      comparison.circuitModifications.forEach((modification) => {
        instructions.push({
          step: stepNumber++,
          instruction: modification.description,
          type: "add",
          components: modification.components.map(
            (c) => `${c.quantity}x ${c.value} ${c.type}`
          ),
          warnings: this.generateModificationWarnings(modification),
          tips: this.generateModificationTips(modification),
        });
      });

      // Add connection step
      instructions.push({
        step: stepNumber++,
        instruction: `Connect the new ${comparison.component2.name} according to the modified circuit`,
        type: "connect",
        components: [comparison.component2.name],
        warnings: ["Verify all connections before applying power"],
        tips: ["Test with a multimeter if available"],
      });

      return instructions;
    } catch (error) {
      return this.errorHandler.handleError(
        error,
        {
          operation: "generateCircuitModificationInstructions",
          timestamp: new Date().toISOString(),
          additionalData: { originalComponentId, newComponentId },
        },
        []
      );
    }
  }

  // Private helper methods

  private analyzeTechnicalDifferences(
    spec1: DetailedComponentSpec,
    spec2: DetailedComponentSpec
  ): TechnicalDifference[] {
    const differences: TechnicalDifference[] = [];

    // Compare electrical specifications
    this.compareElectricalSpecs(spec1, spec2, differences);

    // Compare mechanical specifications
    this.compareMechanicalSpecs(spec1, spec2, differences);

    // Compare communication specifications
    this.compareCommunicationSpecs(spec1, spec2, differences);

    // Compare performance specifications
    this.comparePerformanceSpecs(spec1, spec2, differences);

    return differences;
  }

  private compareElectricalSpecs(
    spec1: DetailedComponentSpec,
    spec2: DetailedComponentSpec,
    differences: TechnicalDifference[]
  ): void {
    const elec1 = spec1.specifications.electrical;
    const elec2 = spec2.specifications.electrical;

    // Compare operating voltage
    if (elec1.operatingVoltage && elec2.operatingVoltage) {
      const voltage1 = `${elec1.operatingVoltage.min}-${elec1.operatingVoltage.max}V`;
      const voltage2 = `${elec2.operatingVoltage.min}-${elec2.operatingVoltage.max}V`;

      if (voltage1 !== voltage2) {
        differences.push({
          property: "Operating Voltage",
          original: voltage1,
          alternative: voltage2,
          impact:
            elec1.operatingVoltage.min >= elec2.operatingVoltage.min &&
            elec1.operatingVoltage.max <= elec2.operatingVoltage.max
              ? "neutral"
              : "negative",
          description:
            "Different voltage requirements may need level conversion",
        });
      }
    }

    // Compare current consumption
    if (elec1.current && elec2.current) {
      if (elec1.current.typical !== elec2.current.typical) {
        const difference = Math.abs(
          elec1.current.typical - elec2.current.typical
        );
        differences.push({
          property: "Current Consumption",
          original: `${elec1.current.typical}mA`,
          alternative: `${elec2.current.typical}mA`,
          impact:
            elec1.current.typical < elec2.current.typical
              ? "negative"
              : "positive",
          description:
            difference > 50
              ? "Significant power consumption difference"
              : "Minor power difference",
        });
      }
    }
  }

  private compareMechanicalSpecs(
    spec1: DetailedComponentSpec,
    spec2: DetailedComponentSpec,
    differences: TechnicalDifference[]
  ): void {
    const mech1 = spec1.specifications.mechanical;
    const mech2 = spec2.specifications.mechanical;

    // Compare package types
    if (mech1.package && mech2.package && mech1.package !== mech2.package) {
      differences.push({
        property: "Package Type",
        original: mech1.package,
        alternative: mech2.package,
        impact: "neutral",
        description: "Different PCB footprint required",
      });
    }

    // Compare pin counts
    if (mech1.pinCount && mech2.pinCount && mech1.pinCount !== mech2.pinCount) {
      differences.push({
        property: "Pin Count",
        original: mech1.pinCount,
        alternative: mech2.pinCount,
        impact: mech1.pinCount < mech2.pinCount ? "positive" : "negative",
        description: "Different number of connections available",
      });
    }
  }

  private compareCommunicationSpecs(
    spec1: DetailedComponentSpec,
    spec2: DetailedComponentSpec,
    differences: TechnicalDifference[]
  ): void {
    const comm1 = spec1.specifications.communication;
    const comm2 = spec2.specifications.communication;

    // Compare protocols
    if (comm1.protocols && comm2.protocols) {
      const protocols1 = comm1.protocols.sort().join(", ");
      const protocols2 = comm2.protocols.sort().join(", ");

      if (protocols1 !== protocols2) {
        const common = comm1.protocols.filter((p) =>
          comm2.protocols!.includes(p)
        );
        differences.push({
          property: "Communication Protocols",
          original: protocols1,
          alternative: protocols2,
          impact: common.length === 0 ? "negative" : "neutral",
          description:
            common.length === 0
              ? "No common protocols - conversion required"
              : "Some protocol differences",
        });
      }
    }
  }

  private comparePerformanceSpecs(
    spec1: DetailedComponentSpec,
    spec2: DetailedComponentSpec,
    differences: TechnicalDifference[]
  ): void {
    const perf1 = spec1.specifications.performance;
    const perf2 = spec2.specifications.performance;

    // Compare accuracy
    if (perf1.accuracy && perf2.accuracy) {
      if (perf1.accuracy.value !== perf2.accuracy.value) {
        differences.push({
          property: "Accuracy",
          original: `±${perf1.accuracy.value}${perf1.accuracy.unit}`,
          alternative: `±${perf2.accuracy.value}${perf2.accuracy.unit}`,
          impact:
            perf1.accuracy.value < perf2.accuracy.value
              ? "negative"
              : "positive",
          description: "Different measurement precision",
        });
      }
    }

    // Compare response time
    if (perf1.responseTime && perf2.responseTime) {
      if (perf1.responseTime.value !== perf2.responseTime.value) {
        differences.push({
          property: "Response Time",
          original: `${perf1.responseTime.value}${perf1.responseTime.unit}`,
          alternative: `${perf2.responseTime.value}${perf2.responseTime.unit}`,
          impact:
            perf1.responseTime.value < perf2.responseTime.value
              ? "positive"
              : "negative",
          description: "Different response speed",
        });
      }
    }
  }

  private nalyzeSimilarities(
    spec1: DetailedComponentSpec,
    spec2: DetailedComponentSpec
  ): Array<{
    property: string;
    description: string;
    significance: "low" | "medium" | "high";
  }> {
    const similarities: Array<{
      property: string;
      description: string;
      significance: "low" | "medium" | "high";
    }> = [];

    // Check category similarity
    if (spec1.category === spec2.category) {
      similarities.push({
        property: "Component Category",
        description: `Both are ${spec1.category} components`,
        significance: "high",
      });
    }

    // Check protocol similarities
    const comm1 = spec1.specifications.communication;
    const comm2 = spec2.specifications.communication;

    if (comm1.protocols && comm2.protocols) {
      const commonProtocols = comm1.protocols.filter((p) =>
        comm2.protocols!.includes(p)
      );
      if (commonProtocols.length > 0) {
        similarities.push({
          property: "Communication Protocols",
          description: `Both support: ${commonProtocols.join(", ")}`,
          significance: "high",
        });
      }
    }

    // Check voltage compatibility
    const elec1 = spec1.specifications.electrical;
    const elec2 = spec2.specifications.electrical;

    if (elec1.operatingVoltage && elec2.operatingVoltage) {
      const overlap =
        Math.min(elec1.operatingVoltage.max, elec2.operatingVoltage.max) -
        Math.max(elec1.operatingVoltage.min, elec2.operatingVoltage.min);

      if (overlap > 0) {
        similarities.push({
          property: "Voltage Compatibility",
          description: `Compatible voltage range: ${Math.max(
            elec1.operatingVoltage.min,
            elec2.operatingVoltage.min
          )}-${Math.min(
            elec1.operatingVoltage.max,
            elec2.operatingVoltage.max
          )}V`,
          significance: "high",
        });
      }
    }

    return similarities;
  }

  private async generateHumanReadableExplanation(
    component1: InventoryItem,
    component2: InventoryItem,
    differences: TechnicalDifference[],
    similarities: Array<{
      property: string;
      description: string;
      significance: string;
    }>
  ): Promise<string> {
    // Generate AI-powered explanation if enabled
    if (this.config.enableAIExplanations) {
      return this.generateAdvancedExplanation(
        component1,
        component2,
        differences,
        similarities
      );
    }

    // Fallback to template-based explanation
    return this.generateTemplateExplanation(
      component1,
      component2,
      differences
    );
  }

  private generateAdvancedExplanation(
    component1: InventoryItem,
    component2: InventoryItem,
    differences: TechnicalDifference[],
    similarities: Array<{
      property: string;
      description: string;
      significance: string;
    }>
  ): string {
    let explanation = `Comparing ${component1.name} and ${component2.name}:\n\n`;

    // Add similarities section
    if (similarities.length > 0) {
      explanation += "Similarities:\n";
      similarities.forEach((sim) => {
        explanation += `• ${sim.description}\n`;
      });
      explanation += "\n";
    }

    // Add differences section
    if (differences.length > 0) {
      explanation += "Key Differences:\n";
      differences.forEach((diff) => {
        explanation += `• ${diff.property}: ${component1.name} has ${diff.original}, while ${component2.name} has ${diff.alternative}`;
        if (diff.description) {
          explanation += ` (${diff.description})`;
        }
        explanation += "\n";
      });
      explanation += "\n";
    }

    // Add recommendation section
    const negativeDifferences = differences.filter(
      (d) => d.impact === "negative"
    );
    if (negativeDifferences.length > 0) {
      explanation += "Important Considerations:\n";
      negativeDifferences.forEach((diff) => {
        explanation += `• ${diff.description}\n`;
      });
    } else {
      explanation +=
        "These components are highly compatible and can likely be substituted with minimal changes.";
    }

    return explanation;
  }

  private generateTemplateExplanation(
    component1: InventoryItem,
    component2: InventoryItem,
    differences: TechnicalDifference[]
  ): string {
    const criticalDifferences = differences.filter(
      (d) => d.impact === "negative"
    ).length;

    if (criticalDifferences === 0) {
      return `${component1.name} and ${component2.name} are highly compatible. They share similar specifications and can be substituted with minimal circuit changes.`;
    } else if (criticalDifferences <= 2) {
      return `${component1.name} and ${component2.name} have some important differences that require attention. While substitution is possible, you'll need to make ${criticalDifferences} key circuit modifications.`;
    } else {
      return `${component1.name} and ${component2.name} have significant technical differences. Substitution is complex and requires careful consideration of ${criticalDifferences} major compatibility issues.`;
    }
  }

  private identifyCircuitModifications(
    differences: TechnicalDifference[]
  ): CircuitModification[] {
    const modifications: CircuitModification[] = [];

    differences.forEach((diff) => {
      if (diff.impact === "negative") {
        switch (diff.property) {
          case "Operating Voltage":
            modifications.push(this.createVoltageModification());
            break;
          case "Communication Protocols":
            modifications.push(this.createProtocolModification());
            break;
          case "Current Consumption":
            modifications.push(this.createCurrentModification());
            break;
        }
      }
    });

    return modifications;
  }

  private createVoltageModification(): CircuitModification {
    return {
      type: "level_shifter",
      description: "Add voltage level shifter to match operating voltages",
      components: [
        { type: "Level Shifter IC", value: "TXS0108E", quantity: 1 },
        { type: "Capacitor", value: "0.1µF", quantity: 2 },
      ],
      schematic:
        "Connect HV to higher voltage, LV to lower voltage, with data lines through shifter",
      difficulty: "intermediate",
      estimatedTime: "30-45 minutes",
      cost: 2.5,
    };
  }

  private createProtocolModification(): CircuitModification {
    return {
      type: "protocol_converter",
      description:
        "Add protocol converter or use microcontroller for protocol translation",
      components: [
        { type: "Microcontroller", value: "ATtiny85", quantity: 1 },
        { type: "Resistor", value: "10kΩ", quantity: 2 },
      ],
      schematic: "Program microcontroller to translate between protocols",
      difficulty: "advanced",
      estimatedTime: "2-4 hours",
      cost: 3.0,
    };
  }

  private createCurrentModification(): CircuitModification {
    return {
      type: "current_limiter",
      description: "Add current limiting resistor to protect component",
      components: [{ type: "Resistor", value: "220Ω", quantity: 1 }],
      schematic: "Place resistor in series with power supply",
      difficulty: "beginner",
      estimatedTime: "5-10 minutes",
      cost: 0.1,
    };
  }

  private extractPros(
    comparison: TechnicalComparison,
    context?: { projectType?: string; budget?: number; userSkillLevel?: string }
  ): string[] {
    const pros: string[] = [];

    // Check for improvements
    comparison.differences.forEach((diff) => {
      if (diff.impact === "positive") {
        pros.push(
          `Better ${diff.property.toLowerCase()}: ${diff.alternative} vs ${
            diff.original
          }`
        );
      }
    });

    // Add context-specific pros
    if (context?.budget) {
      const component2 = this.dbService.getItemById(comparison.component2.id);
      const component1 = this.dbService.getItemById(comparison.component1.id);

      if (component2 && component1) {
        const price2 = component2.purchasePrice || 0;
        const price1 = component1.purchasePrice || 0;

        if (price2 < price1) {
          pros.push(
            `Lower cost: $${price2.toFixed(2)} vs $${price1.toFixed(2)}`
          );
        }
      }
    }

    // Add compatibility pros
    if (comparison.compatibilityAnalysis.overallCompatibility > 80) {
      pros.push("High compatibility - minimal circuit changes required");
    }

    return pros;
  }

  private extractCons(
    comparison: TechnicalComparison,
    context?: { projectType?: string; budget?: number; userSkillLevel?: string }
  ): string[] {
    const cons: string[] = [];

    // Check for downgrades
    comparison.differences.forEach((diff) => {
      if (diff.impact === "negative") {
        cons.push(`Downgrade: ${diff.description}`);
      }
    });

    // Add modification complexity as cons
    const complexModifications = comparison.circuitModifications.filter(
      (mod) =>
        mod.difficulty === "advanced" || mod.difficulty === "intermediate"
    );

    if (complexModifications.length > 0) {
      cons.push(
        `Requires ${complexModifications.length} circuit modification(s)`
      );
    }

    // Add skill level considerations
    if (
      context?.userSkillLevel === "beginner" &&
      comparison.circuitModifications.length > 0
    ) {
      cons.push(
        "May be challenging for beginners due to required modifications"
      );
    }

    return cons;
  }

  private assessOverallDifficulty(
    modifications: CircuitModification[],
    userSkillLevel?: string
  ): "easy" | "medium" | "hard" {
    if (modifications.length === 0) {
      return "easy";
    }

    const difficultyLevels = { beginner: 1, intermediate: 2, advanced: 3 };
    const maxDifficultyLevel = Math.max(
      ...modifications.map((mod) => difficultyLevels[mod.difficulty])
    );

    // Adjust based on user skill level
    if (userSkillLevel === "beginner") {
      return maxDifficultyLevel === 1
        ? "easy"
        : maxDifficultyLevel === 2
        ? "medium"
        : "hard";
    } else if (userSkillLevel === "advanced") {
      return maxDifficultyLevel === 3 ? "medium" : "easy";
    }

    // Default for intermediate users
    return maxDifficultyLevel === 1
      ? "easy"
      : maxDifficultyLevel === 2
      ? "medium"
      : "hard";
  }

  private makeAlternativeRecommendation(
    comparison: TechnicalComparison,
    context?: { projectType?: string; budget?: number; userSkillLevel?: string }
  ):
    | "highly_recommended"
    | "recommended"
    | "consider_carefully"
    | "not_recommended" {
    const compatibility = comparison.compatibilityAnalysis.overallCompatibility;
    const modificationCount = comparison.circuitModifications.length;
    const complexModifications = comparison.circuitModifications.filter(
      (mod) => mod.difficulty === "advanced"
    ).length;

    // High compatibility, no complex modifications
    if (compatibility > 90 && complexModifications === 0) {
      return "highly_recommended";
    }

    // Good compatibility, simple modifications
    if (
      compatibility > 70 &&
      complexModifications === 0 &&
      modificationCount <= 2
    ) {
      return "recommended";
    }

    // Moderate compatibility or some complex modifications
    if (compatibility > 50 && complexModifications <= 1) {
      return "consider_carefully";
    }

    // Low compatibility or many complex modifications
    return "not_recommended";
  }

  private generateAlternativeExplanation(
    comparison: TechnicalComparison,
    pros: string[],
    cons: string[],
    requiredChanges: string[],
    difficulty: string,
    recommendation: string,
    context?: { projectType?: string; budget?: number; userSkillLevel?: string }
  ): string {
    let explanation = `Substituting ${comparison.component1.name} with ${comparison.component2.name}:\n\n`;

    if (pros.length > 0) {
      explanation += `Advantages:\n${pros
        .map((pro) => `• ${pro}`)
        .join("\n")}\n\n`;
    }

    if (cons.length > 0) {
      explanation += `Considerations:\n${cons
        .map((con) => `• ${con}`)
        .join("\n")}\n\n`;
    }

    if (requiredChanges.length > 0) {
      explanation += `Required Changes:\n${requiredChanges
        .map((change) => `• ${change}`)
        .join("\n")}\n\n`;
    }

    explanation += `Overall Assessment: This substitution is ${recommendation.replace(
      "_",
      " "
    )} `;
    explanation += `with ${difficulty} difficulty level.`;

    if (context?.userSkillLevel) {
      explanation += ` For ${context.userSkillLevel} users, `;
      if (difficulty === "easy") {
        explanation += "this should be straightforward to implement.";
      } else if (difficulty === "medium") {
        explanation +=
          "some research and careful implementation will be needed.";
      } else {
        explanation += "consider seeking help or additional resources.";
      }
    }

    return explanation;
  }

  private makeRecommendation(
    component1: InventoryItem,
    component2: InventoryItem,
    differences: TechnicalDifference[],
    compatibilityScore: number
  ): { componentId: string; reasoning: string; confidence: number } {
    const price1 = component1.purchasePrice || 0;
    const price2 = component2.purchasePrice || 0;

    const negativeDifferences = differences.filter(
      (d) => d.impact === "negative"
    ).length;

    let recommendedId = component1.id;
    let reasoning = `${component1.name} is the original choice`;
    let confidence = 0.7;

    // Prefer component with higher compatibility
    if (compatibilityScore > 0.8) {
      // If highly compatible, consider other factors
      if (price2 < price1 * 0.8) {
        // 20% cheaper
        recommendedId = component2.id;
        reasoning = `${component2.name} offers significant cost savings with high compatibility`;
        confidence = 0.9;
      } else if (negativeDifferences === 0) {
        recommendedId = component2.id;
        reasoning = `${component2.name} is fully compatible with no negative differences`;
        confidence = 0.85;
      }
    } else if (compatibilityScore < 0.5) {
      reasoning = `${component1.name} is recommended due to compatibility concerns with ${component2.name}`;
      confidence = 0.8;
    }

    return {
      componentId: recommendedId,
      reasoning,
      confidence,
    };
  }

  private generateModificationWarnings(
    modification: CircuitModification
  ): string[] {
    const warnings: string[] = [
      "Always power off before making circuit changes",
    ];

    switch (modification.type) {
      case "level_shifter":
        warnings.push("Verify voltage levels before connecting");
        warnings.push("Check current requirements of level shifter");
        break;
      case "protocol_converter":
        warnings.push("Programming required - ensure you have necessary tools");
        warnings.push("Test protocol conversion thoroughly");
        break;
      case "current_limiter":
        warnings.push(
          "Calculate resistor value based on component specifications"
        );
        break;
    }

    return warnings;
  }

  private generateModificationTips(
    modification: CircuitModification
  ): string[] {
    const tips: string[] = [
      "Use a breadboard for testing before permanent installation",
    ];

    switch (modification.type) {
      case "level_shifter":
        tips.push("Bidirectional level shifters work for most applications");
        tips.push("Add decoupling capacitors near the IC");
        break;
      case "protocol_converter":
        tips.push("Start with simple protocol conversion examples");
        tips.push("Use oscilloscope to verify signal timing");
        break;
      case "current_limiter":
        tips.push("Use Ohm's law: R = (Vsupply - Vcomponent) / Imax");
        break;
    }

    return tips;
  }

  /**
   * Get technical explanation statistics for monitoring
   */
  getTechnicalExplanationStats(): {
    totalComparisons: number;
    averageComplexity: number;
    lastExplanationTime: string;
    aiExplanationsEnabled: boolean;
  } {
    return {
      totalComparisons: 0,
      averageComplexity: 2.3, // 1-5 scale
      lastExplanationTime: new Date().toISOString(),
      aiExplanationsEnabled: this.config.enableAIExplanations,
    };
  }
}

export default TechnicalExplanationService;
