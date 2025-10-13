import { InventoryItem, ComponentAlternative, ComponentPrediction } from '../types';

/**
 * Client-side recommendation service that analyzes existing inventory data
 * This is a lightweight version that works without server-side services
 */
export class ClientRecommendationService {
  
  /**
   * Analyze inventory items to find alternatives based on existing data
   */
  static findComponentAlternatives(
    targetItem: InventoryItem, 
    allItems: InventoryItem[]
  ): ComponentAlternative[] {
    const alternatives: ComponentAlternative[] = [];
    
    for (const candidate of allItems) {
      if (candidate.id === targetItem.id) continue;
      
      const alternative = this.evaluateAlternative(targetItem, candidate);
      if (alternative && alternative.compatibilityScore >= 60) {
        alternatives.push(alternative);
      }
    }
    
    return alternatives
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 5); // Limit to top 5 alternatives
  }
  
  /**
   * Evaluate if a component is a suitable alternative
   */
  private static evaluateAlternative(
    original: InventoryItem,
    candidate: InventoryItem
  ): ComponentAlternative | null {
    let compatibilityScore = 0;
    const technicalDifferences = [];
    
    // Same category bonus (highest weight)
    if (original.category === candidate.category) {
      compatibilityScore += 40;
    }
    
    // Same manufacturer bonus
    if (original.manufacturer === candidate.manufacturer) {
      compatibilityScore += 20;
      technicalDifferences.push({
        property: 'Manufacturer',
        original: original.manufacturer || 'Unknown',
        alternative: candidate.manufacturer || 'Unknown',
        impact: 'positive' as const,
        description: 'Same manufacturer ensures consistent quality and compatibility'
      });
    }
    
    // Availability check
    if (candidate.quantity > 0) {
      compatibilityScore += 20;
    }
    
    // Similar specifications (if available)
    if (original.specs && candidate.specs) {
      const commonSpecs = Object.keys(original.specs).filter(key => 
        key in candidate.specs!
      );
      
      if (commonSpecs.length > 0) {
        compatibilityScore += 10;
        
        // Check for matching specifications
        commonSpecs.forEach(spec => {
          if (original.specs![spec] === candidate.specs![spec]) {
            compatibilityScore += 5;
            technicalDifferences.push({
              property: spec,
              original: String(original.specs![spec]),
              alternative: String(candidate.specs![spec]),
              impact: 'neutral' as const,
              description: 'Identical specification'
            });
          }
        });
      }
    }
    
    // Price comparison
    const priceComparison = this.calculatePriceComparison(original, candidate);
    if (priceComparison.percentageDifference <= 30) {
      compatibilityScore += 10;
    }
    
    // Only return if meets minimum threshold
    if (compatibilityScore < 60) {
      return null;
    }
    
    return {
      componentId: candidate.id,
      name: candidate.name,
      compatibilityScore,
      priceComparison,
      technicalDifferences,
      usabilityImpact: compatibilityScore > 80 ? 'minimal' : 'moderate',
      explanation: this.generateExplanation(original, candidate, compatibilityScore),
      confidence: Math.min(compatibilityScore / 100, 0.95),
      requiredModifications: this.getRequiredModifications(original, candidate)
    };
  }
  
  /**
   * Calculate price comparison between components
   */
  private static calculatePriceComparison(original: InventoryItem, alternative: InventoryItem) {
    const originalPrice = original.purchasePrice || 0;
    const alternativePrice = alternative.purchasePrice || 0;
    
    const savings = originalPrice - alternativePrice;
    const percentageDifference = originalPrice > 0 
      ? (savings / originalPrice) * 100 
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
  private static generateExplanation(
    original: InventoryItem, 
    alternative: InventoryItem, 
    score: number
  ): string {
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
    } else if (priceComp.savings < 0) {
      reasons.push(`premium option ($${Math.abs(priceComp.savings).toFixed(2)} more)`);
    }
    
    return `This component is suggested because it has ${reasons.join(', ')}. Compatibility score: ${score}%`;
  }
  
  /**
   * Get required modifications for using the alternative
   */
  private static getRequiredModifications(
    original: InventoryItem, 
    alternative: InventoryItem
  ): string[] {
    const modifications = [];
    
    // Different manufacturer might require different connections
    if (original.manufacturer !== alternative.manufacturer) {
      modifications.push('Verify pin compatibility and connections');
    }
    
    // Different specifications might require circuit changes
    if (original.specs && alternative.specs) {
      const originalVoltage = original.specs['voltage'] || original.specs['Voltage'];
      const altVoltage = alternative.specs['voltage'] || alternative.specs['Voltage'];
      
      if (originalVoltage && altVoltage && originalVoltage !== altVoltage) {
        modifications.push(`Adjust circuit for ${altVoltage} instead of ${originalVoltage}`);
      }
    }
    
    return modifications;
  }
  
  /**
   * Generate stock predictions based on usage patterns
   */
  static generateStockPredictions(item: InventoryItem): ComponentPrediction[] {
    const predictions: ComponentPrediction[] = [];
    
    // Only generate predictions for low stock items
    if (item.quantity <= 10) {
      const usageRate = this.estimateUsageRate(item);
      const daysUntilDepletion = Math.max(7, Math.floor(item.quantity / usageRate));
      
      predictions.push({
        componentId: item.id,
        predictedNeedDate: new Date(Date.now() + daysUntilDepletion * 24 * 60 * 60 * 1000).toISOString(),
        confidence: item.quantity <= 5 ? 0.9 : 0.7,
        quantity: Math.max(5, Math.ceil(item.quantity * 1.5)),
        reasoning: this.generatePredictionReasoning(item, usageRate, daysUntilDepletion),
        basedOnProjects: item.usedInProjects?.map(p => p.projectId) || [],
        urgency: item.quantity <= 3 ? 'high' : item.quantity <= 7 ? 'medium' : 'low'
      });
    }
    
    return predictions;
  }
  
  /**
   * Estimate usage rate based on project history
   */
  private static estimateUsageRate(item: InventoryItem): number {
    if (!item.usedInProjects || item.usedInProjects.length === 0) {
      return 0.5; // Default low usage rate
    }
    
    const totalUsed = item.usedInProjects.reduce((sum, p) => sum + p.quantity, 0);
    const projectCount = item.usedInProjects.length;
    
    // Estimate usage per week based on project frequency
    return Math.max(0.1, totalUsed / (projectCount * 7));
  }
  
  /**
   * Generate reasoning for stock prediction
   */
  private static generatePredictionReasoning(
    item: InventoryItem, 
    usageRate: number, 
    daysUntilDepletion: number
  ): string {
    const projectCount = item.usedInProjects?.length || 0;
    
    if (projectCount === 0) {
      return `Based on current stock level (${item.quantity}) and typical component usage patterns`;
    }
    
    const totalUsed = item.usedInProjects!.reduce((sum, p) => sum + p.quantity, 0);
    return `Based on usage in ${projectCount} projects (${totalUsed} total used) and estimated consumption rate of ${usageRate.toFixed(1)} per week`;
  }
  
  /**
   * Analyze item characteristics for recommendation badges
   */
  static analyzeItemCharacteristics(item: InventoryItem, allItems: InventoryItem[]) {
    const alternatives = this.findComponentAlternatives(item, allItems);
    
    return {
      hasAlternatives: alternatives.length > 0,
      alternativeCount: alternatives.length,
      isLowStock: item.quantity <= 5,
      isTrending: (item.usedInProjects?.length || 0) > 2,
      isBudgetFriendly: (item.purchasePrice || 0) < 20,
      compatibleCount: alternatives.filter(alt => alt.compatibilityScore > 80).length
    };
  }
}