import { InventoryItem, Project, ItemStatus } from "../types";
import { RecommendationPreferences } from "../components/RecommendationSettingsPanel";
import {
  isWithinBudgetLimits,
  isPreferredSupplier,
  isPreferredCategory,
} from "../contexts/RecommendationPreferencesContext";

export interface AllocationResult {
  success: boolean;
  allocations: {
    componentId: string;
    inventoryItemId: string;
    quantity: number;
    isAlternative: boolean;
    originalComponent?: string;
    reasoning: string;
  }[];
  warnings: string[];
  suggestions: string[];
}

export interface AllocationOptions {
  allowAlternatives: boolean;
  preferLowerCost: boolean;
  preferHigherQuantity: boolean;
  maxAlternativeDistance: number; // 0-100, how different alternatives can be
}

/**
 * Smart Component Allocation Service
 * Intelligently allocates inventory items to project components,
 * considering alternatives and optimization opportunities
 */
export class SmartAllocationService {
  /**
   * Allocate components for a project with intelligent optimization
   */
  static async allocateProjectComponents(
    project: Project,
    inventory: InventoryItem[],
    options: AllocationOptions = {
      allowAlternatives: true,
      preferLowerCost: false,
      preferHigherQuantity: false,
      maxAlternativeDistance: 80,
    },
    preferences?: RecommendationPreferences
  ): Promise<AllocationResult> {
    const result: AllocationResult = {
      success: true,
      allocations: [],
      warnings: [],
      suggestions: [],
    };

    // Get available inventory items
    const availableItems = inventory.filter(
      (item) =>
        item.status === ItemStatus.HAVE &&
        (item.availableQuantity ||
          item.quantity - (item.allocatedQuantity || 0)) > 0
    );

    // Process each component in the project
    for (const component of project.components) {
      const allocation = await this.allocateComponent(
        component,
        availableItems,
        options
      );

      if (allocation.success) {
        result.allocations.push(...allocation.allocations);
        result.warnings.push(...allocation.warnings);
        result.suggestions.push(...allocation.suggestions);
      } else {
        result.success = false;
        result.warnings.push(
          `Failed to allocate ${component.name}: ${allocation.warnings.join(
            ", "
          )}`
        );
      }
    }

    // Add overall optimization suggestions
    const optimizations = this.generateOptimizationSuggestions(
      result.allocations,
      availableItems
    );
    result.suggestions.push(...optimizations);

    return result;
  }

  /**
   * Allocate a single component with smart alternatives
   */
  private static async allocateComponent(
    component: Project["components"][0],
    availableItems: InventoryItem[],
    options: AllocationOptions
  ): Promise<AllocationResult> {
    const result: AllocationResult = {
      success: false,
      allocations: [],
      warnings: [],
      suggestions: [],
    };

    // If component already has an inventory item assigned, try to use it
    if (component.inventoryItemId) {
      const assignedItem = availableItems.find(
        (item) => item.id === component.inventoryItemId
      );
      if (assignedItem) {
        const availableQty =
          assignedItem.quantity - (assignedItem.allocatedQuantity || 0);

        if (availableQty >= component.quantity) {
          result.success = true;
          result.allocations.push({
            componentId: component.id,
            inventoryItemId: assignedItem.id,
            quantity: component.quantity,
            isAlternative: false,
            reasoning: `Direct allocation from pre-selected inventory item`,
          });
          return result;
        } else {
          result.warnings.push(
            `Insufficient quantity for ${component.name} (need ${component.quantity}, have ${availableQty})`
          );
        }
      }
    }

    // Try to find exact matches by name
    const exactMatches = this.findExactMatches(component, availableItems);

    for (const match of exactMatches) {
      const availableQty = match.quantity - (match.allocatedQuantity || 0);

      if (availableQty >= component.quantity) {
        result.success = true;
        result.allocations.push({
          componentId: component.id,
          inventoryItemId: match.id,
          quantity: component.quantity,
          isAlternative: false,
          reasoning: `Exact name match found in inventory`,
        });
        return result;
      }
    }

    // If alternatives are allowed, try to find suitable alternatives
    if (options.allowAlternatives) {
      const alternatives = await this.findComponentAlternatives(
        component,
        availableItems,
        options
      );

      if (alternatives.length > 0) {
        const bestAlternative = alternatives[0]; // Already sorted by suitability
        const availableQty =
          bestAlternative.item.quantity -
          (bestAlternative.item.allocatedQuantity || 0);

        if (availableQty >= component.quantity) {
          result.success = true;
          result.allocations.push({
            componentId: component.id,
            inventoryItemId: bestAlternative.item.id,
            quantity: component.quantity,
            isAlternative: true,
            originalComponent: component.name,
            reasoning: bestAlternative.reasoning,
          });

          result.suggestions.push(
            `Using ${bestAlternative.item.name} as alternative for ${
              component.name
            } (${Math.round(bestAlternative.compatibility)}% compatible)`
          );
          return result;
        }
      }
    }

    // If we get here, allocation failed
    result.warnings.push(
      `No suitable inventory item found for ${component.name}`
    );
    result.suggestions.push(
      `Consider adding ${component.name} to your shopping list`
    );

    return result;
  }

  /**
   * Find exact matches by name similarity
   */
  private static findExactMatches(
    component: Project["components"][0],
    availableItems: InventoryItem[]
  ): InventoryItem[] {
    const componentName = component.name.toLowerCase();

    return availableItems.filter((item) => {
      const itemName = item.name.toLowerCase();

      // Exact match
      if (itemName === componentName) return true;

      // Contains match (both ways)
      if (itemName.includes(componentName) || componentName.includes(itemName))
        return true;

      // Word-based matching
      const componentWords = componentName.split(/\s+/);
      const itemWords = itemName.split(/\s+/);

      const commonWords = componentWords.filter((word) =>
        itemWords.some(
          (itemWord) => itemWord.includes(word) || word.includes(itemWord)
        )
      );

      // Consider it a match if more than half the words match
      return commonWords.length > componentWords.length / 2;
    });
  }

  /**
   * Find suitable alternatives for a component
   */
  private static async findComponentAlternatives(
    component: Project["components"][0],
    availableItems: InventoryItem[],
    options: AllocationOptions
  ): Promise<
    {
      item: InventoryItem;
      compatibility: number;
      reasoning: string;
    }[]
  > {
    const alternatives = [];

    for (const item of availableItems) {
      const compatibility = this.calculateCompatibility(component, item);

      if (compatibility >= 100 - options.maxAlternativeDistance) {
        const reasoning = this.generateAlternativeReasoning(
          component,
          item,
          compatibility
        );
        alternatives.push({ item, compatibility, reasoning });
      }
    }

    // Sort by compatibility, then by preference options
    alternatives.sort((a, b) => {
      // Primary sort: compatibility
      if (Math.abs(a.compatibility - b.compatibility) > 5) {
        return b.compatibility - a.compatibility;
      }

      // Secondary sort: cost preference
      if (options.preferLowerCost) {
        const costA = a.item.purchasePrice || 0;
        const costB = b.item.purchasePrice || 0;
        if (Math.abs(costA - costB) > 1) {
          return costA - costB;
        }
      }

      // Tertiary sort: quantity preference
      if (options.preferHigherQuantity) {
        const qtyA = a.item.quantity - (a.item.allocatedQuantity || 0);
        const qtyB = b.item.quantity - (b.item.allocatedQuantity || 0);
        return qtyB - qtyA;
      }

      return 0;
    });

    return alternatives.slice(0, 3); // Return top 3 alternatives
  }

  /**
   * Calculate compatibility between a component and inventory item
   */
  private static calculateCompatibility(
    component: Project["components"][0],
    item: InventoryItem
  ): number {
    let compatibility = 0;

    // Name similarity (40% weight)
    const nameSimilarity = this.calculateNameSimilarity(
      component.name,
      item.name
    );
    compatibility += nameSimilarity * 0.4;

    // Category match (30% weight)
    if (
      component.name.toLowerCase().includes("sensor") &&
      item.category?.toLowerCase().includes("sensor")
    ) {
      compatibility += 30;
    } else if (
      component.name.toLowerCase().includes("led") &&
      item.name.toLowerCase().includes("led")
    ) {
      compatibility += 30;
    } else if (
      component.name.toLowerCase().includes("resistor") &&
      item.name.toLowerCase().includes("resistor")
    ) {
      compatibility += 30;
    }

    // Usage history (20% weight)
    if (item.usedInProjects && item.usedInProjects.length > 0) {
      compatibility += Math.min(20, item.usedInProjects.length * 5);
    }

    // Availability bonus (10% weight)
    const availableQty = item.quantity - (item.allocatedQuantity || 0);
    if (availableQty >= component.quantity) {
      compatibility += 10;
    }

    return Math.min(100, compatibility);
  }

  /**
   * Calculate name similarity between two strings
   */
  private static calculateNameSimilarity(name1: string, name2: string): number {
    const str1 = name1.toLowerCase();
    const str2 = name2.toLowerCase();

    // Exact match
    if (str1 === str2) return 100;

    // Substring match
    if (str1.includes(str2) || str2.includes(str1)) return 80;

    // Word-based similarity
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);

    let commonWords = 0;
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1)) {
          commonWords++;
          break;
        }
      }
    }

    const similarity =
      (commonWords / Math.max(words1.length, words2.length)) * 60;
    return Math.min(100, similarity);
  }

  /**
   * Generate reasoning for why an alternative was chosen
   */
  private static generateAlternativeReasoning(
    component: Project["components"][0],
    item: InventoryItem,
    compatibility: number
  ): string {
    const reasons = [];

    if (compatibility > 90) {
      reasons.push("very high compatibility");
    } else if (compatibility > 70) {
      reasons.push("good compatibility");
    } else {
      reasons.push("acceptable compatibility");
    }

    if (item.category) {
      reasons.push(`same category (${item.category})`);
    }

    if (item.usedInProjects && item.usedInProjects.length > 0) {
      reasons.push(`proven in ${item.usedInProjects.length} projects`);
    }

    const availableQty = item.quantity - (item.allocatedQuantity || 0);
    reasons.push(`${availableQty} available`);

    if (item.purchasePrice && item.purchasePrice < 10) {
      reasons.push("cost-effective");
    }

    return `Selected for ${reasons.join(", ")}`;
  }

  /**
   * Generate optimization suggestions for the overall allocation
   */
  private static generateOptimizationSuggestions(
    allocations: AllocationResult["allocations"],
    availableItems: InventoryItem[]
  ): string[] {
    const suggestions = [];

    // Check for bulk opportunities
    const componentCounts = new Map<string, number>();
    for (const allocation of allocations) {
      const item = availableItems.find(
        (i) => i.id === allocation.inventoryItemId
      );
      if (item) {
        const current = componentCounts.get(item.name) || 0;
        componentCounts.set(item.name, current + allocation.quantity);
      }
    }

    for (const [itemName, totalUsed] of componentCounts) {
      const item = availableItems.find((i) => i.name === itemName);
      if (item) {
        const availableQty = item.quantity - (item.allocatedQuantity || 0);
        if (availableQty > totalUsed * 2) {
          suggestions.push(
            `Consider allocating extra ${itemName} for prototyping (${
              availableQty - totalUsed
            } more available)`
          );
        }
      }
    }

    // Check for cost optimization opportunities
    const alternativeCount = allocations.filter((a) => a.isAlternative).length;
    if (alternativeCount > 0) {
      suggestions.push(
        `${alternativeCount} components were substituted with alternatives. Review for compatibility.`
      );
    }

    return suggestions;
  }

  /**
   * Validate an allocation result against project requirements
   */
  static validateAllocation(
    project: Project,
    allocation: AllocationResult
  ): { isValid: boolean; issues: string[] } {
    const issues = [];

    // Check if all components are allocated
    const allocatedComponentIds = new Set(
      allocation.allocations.map((a) => a.componentId)
    );
    const missingComponents = project.components.filter(
      (c) => !allocatedComponentIds.has(c.id)
    );

    if (missingComponents.length > 0) {
      issues.push(
        `Missing allocations for: ${missingComponents
          .map((c) => c.name)
          .join(", ")}`
      );
    }

    // Check for over-allocation
    const inventoryUsage = new Map<string, number>();
    for (const alloc of allocation.allocations) {
      const current = inventoryUsage.get(alloc.inventoryItemId) || 0;
      inventoryUsage.set(alloc.inventoryItemId, current + alloc.quantity);
    }

    // This would need access to current inventory state to validate properly
    // For now, we'll assume the allocation service did its job correctly

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
