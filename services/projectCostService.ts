import { Project, InventoryItem, BudgetOptimization } from '../types';
import BudgetService from './budgetService';

export interface ProjectCostBreakdown {
  projectId: string;
  projectName: string;
  totalCost: number;
  componentCosts: Array<{
    componentId: string;
    componentName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category: string;
    supplier?: string;
    availability: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown';
  }>;
  categoryBreakdown: Array<{
    category: string;
    totalCost: number;
    percentage: number;
    componentCount: number;
  }>;
  costOptimizations: Array<{
    type: 'alternative_component' | 'bulk_discount' | 'supplier_change' | 'timing_optimization';
    description: string;
    potentialSavings: number;
    effort: 'low' | 'medium' | 'high';
    componentId?: string;
  }>;
  budgetStatus: {
    isOverBudget: boolean;
    budgetLimit?: number;
    utilizationPercentage?: number;
    remainingBudget?: number;
  };
}

export interface ProjectBudgetPlan {
  projectId: string;
  plannedBudget: number;
  currentCost: number;
  projectedCost: number;
  contingencyPercentage: number;
  milestones: Array<{
    id: string;
    name: string;
    plannedCost: number;
    actualCost: number;
    completionDate?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  }>;
  riskFactors: Array<{
    type: 'price_volatility' | 'availability' | 'scope_creep' | 'timeline_delay';
    description: string;
    impact: 'low' | 'medium' | 'high';
    probability: number; // 0-100
    mitigation: string;
  }>;
}

export interface CostOptimizationSuggestion {
  projectId: string;
  suggestions: Array<{
    id: string;
    type: 'component_substitution' | 'bulk_purchasing' | 'supplier_negotiation' | 'design_optimization';
    title: string;
    description: string;
    potentialSavings: number;
    implementationEffort: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
    affectedComponents: string[];
    steps: string[];
    estimatedTimeToImplement: string;
  }>;
  totalPotentialSavings: number;
  recommendedPriority: Array<{
    suggestionId: string;
    priority: number; // 1-10
    reasoning: string;
  }>;
}

/**
 * Service for calculating and managing project costs
 */
export class ProjectCostService {
  
  /**
   * Calculate comprehensive cost breakdown for a project
   */
  static calculateProjectCostBreakdown(
    project: Project,
    inventory: InventoryItem[],
    budgetLimit?: number
  ): ProjectCostBreakdown {
    const componentCosts = project.components.map(component => {
      const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
      const unitPrice = inventoryItem?.purchasePrice || 0;
      const totalPrice = unitPrice * component.quantity;
      
      // Determine availability status
      let availability: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown' = 'unknown';
      if (inventoryItem) {
        const availableQuantity = inventoryItem.quantity - (inventoryItem.allocatedQuantity || 0);
        if (availableQuantity >= component.quantity) {
          availability = 'in_stock';
        } else if (availableQuantity > 0) {
          availability = 'low_stock';
        } else {
          availability = 'out_of_stock';
        }
      }

      return {
        componentId: component.inventoryItemId || component.id,
        componentName: inventoryItem?.name || component.name,
        quantity: component.quantity,
        unitPrice,
        totalPrice,
        category: inventoryItem?.category || 'Uncategorized',
        supplier: inventoryItem?.supplier,
        availability
      };
    });

    const totalCost = componentCosts.reduce((sum, cost) => sum + cost.totalPrice, 0);

    // Calculate category breakdown
    const categoryMap = new Map<string, { totalCost: number; componentCount: number }>();
    componentCosts.forEach(cost => {
      const existing = categoryMap.get(cost.category) || { totalCost: 0, componentCount: 0 };
      existing.totalCost += cost.totalPrice;
      existing.componentCount += 1;
      categoryMap.set(cost.category, existing);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalCost: data.totalCost,
      percentage: totalCost > 0 ? (data.totalCost / totalCost) * 100 : 0,
      componentCount: data.componentCount
    })).sort((a, b) => b.totalCost - a.totalCost);

    // Generate cost optimizations
    const costOptimizations = this.generateCostOptimizations(project, inventory, componentCosts);

    // Calculate budget status
    const budgetStatus = {
      isOverBudget: budgetLimit ? totalCost > budgetLimit : false,
      budgetLimit,
      utilizationPercentage: budgetLimit ? (totalCost / budgetLimit) * 100 : undefined,
      remainingBudget: budgetLimit ? budgetLimit - totalCost : undefined
    };

    return {
      projectId: project.id,
      projectName: project.name,
      totalCost,
      componentCosts,
      categoryBreakdown,
      costOptimizations,
      budgetStatus
    };
  }

  /**
   * Generate cost optimization suggestions for a project
   */
  private static generateCostOptimizations(
    project: Project,
    inventory: InventoryItem[],
    componentCosts: Array<{
      componentId: string;
      componentName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      category: string;
      supplier?: string;
      availability: string;
    }>
  ): Array<{
    type: 'alternative_component' | 'bulk_discount' | 'supplier_change' | 'timing_optimization';
    description: string;
    potentialSavings: number;
    effort: 'low' | 'medium' | 'high';
    componentId?: string;
  }> {
    const optimizations: Array<{
      type: 'alternative_component' | 'bulk_discount' | 'supplier_change' | 'timing_optimization';
      description: string;
      potentialSavings: number;
      effort: 'low' | 'medium' | 'high';
      componentId?: string;
    }> = [];

    // Check for expensive components that might have alternatives
    const expensiveComponents = componentCosts.filter(cost => cost.unitPrice > 20);
    expensiveComponents.forEach(component => {
      // Look for similar components in same category with lower prices
      const alternatives = inventory.filter(item => 
        item.category === component.category &&
        item.id !== component.componentId &&
        (item.purchasePrice || 0) < component.unitPrice &&
        (item.purchasePrice || 0) > 0
      );

      if (alternatives.length > 0) {
        const bestAlternative = alternatives.reduce((best, current) => 
          (current.purchasePrice || 0) < (best.purchasePrice || 0) ? current : best
        );
        
        const savings = (component.unitPrice - (bestAlternative.purchasePrice || 0)) * component.quantity;
        if (savings > 5) { // Only suggest if savings > $5
          optimizations.push({
            type: 'alternative_component',
            description: `Replace ${component.componentName} with ${bestAlternative.name} to save ${savings.toFixed(2)}`,
            potentialSavings: savings,
            effort: 'medium',
            componentId: component.componentId
          });
        }
      }
    });

    // Check for bulk discount opportunities
    const highQuantityComponents = componentCosts.filter(cost => cost.quantity >= 10);
    highQuantityComponents.forEach(component => {
      const bulkSavings = component.totalPrice * 0.1; // Assume 10% bulk discount
      if (bulkSavings > 10) {
        optimizations.push({
          type: 'bulk_discount',
          description: `Negotiate bulk discount for ${component.componentName} (${component.quantity} units)`,
          potentialSavings: bulkSavings,
          effort: 'low',
          componentId: component.componentId
        });
      }
    });

    // Check for supplier optimization
    const supplierGroups = new Map<string, Array<typeof componentCosts[0]>>();
    componentCosts.forEach(cost => {
      if (cost.supplier) {
        const existing = supplierGroups.get(cost.supplier) || [];
        existing.push(cost);
        supplierGroups.set(cost.supplier, existing);
      }
    });

    // Suggest consolidating suppliers if there are many small orders
    if (supplierGroups.size > 3) {
      const totalShippingCosts = supplierGroups.size * 15; // Assume $15 shipping per supplier
      optimizations.push({
        type: 'supplier_change',
        description: `Consolidate suppliers to reduce shipping costs (currently ${supplierGroups.size} suppliers)`,
        potentialSavings: totalShippingCosts * 0.6, // Save 60% of shipping
        effort: 'medium'
      });
    }

    // Check for timing optimization
    const outOfStockComponents = componentCosts.filter(cost => cost.availability === 'out_of_stock');
    if (outOfStockComponents.length > 0) {
      const rushOrderCosts = outOfStockComponents.reduce((sum, cost) => sum + cost.totalPrice * 0.2, 0);
      optimizations.push({
        type: 'timing_optimization',
        description: `Delay project start to avoid rush order costs for ${outOfStockComponents.length} components`,
        potentialSavings: rushOrderCosts,
        effort: 'low'
      });
    }

    return optimizations.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  /**
   * Create a budget plan for a project
   */
  static createProjectBudgetPlan(
    project: Project,
    inventory: InventoryItem[],
    plannedBudget: number,
    contingencyPercentage: number = 15
  ): ProjectBudgetPlan {
    const costBreakdown = this.calculateProjectCostBreakdown(project, inventory, plannedBudget);
    const currentCost = costBreakdown.totalCost;
    const projectedCost = currentCost * (1 + contingencyPercentage / 100);

    // Generate sample milestones based on project complexity
    const componentCount = project.components.length;
    const milestones = this.generateProjectMilestones(project, costBreakdown, componentCount);

    // Assess risk factors
    const riskFactors = this.assessProjectRiskFactors(project, inventory, costBreakdown);

    return {
      projectId: project.id,
      plannedBudget,
      currentCost,
      projectedCost,
      contingencyPercentage,
      milestones,
      riskFactors
    };
  }

  /**
   * Generate project milestones based on complexity
   */
  private static generateProjectMilestones(
    project: Project,
    costBreakdown: ProjectCostBreakdown,
    componentCount: number
  ): Array<{
    id: string;
    name: string;
    plannedCost: number;
    actualCost: number;
    completionDate?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  }> {
    const milestones = [];
    const totalCost = costBreakdown.totalCost;

    if (componentCount > 20) {
      // Complex project - multiple phases
      milestones.push(
        {
          id: 'planning',
          name: 'Planning & Design',
          plannedCost: totalCost * 0.1,
          actualCost: project.status === 'Planning' ? totalCost * 0.1 : 0,
          status: project.status === 'Planning' ? 'in_progress' as const : 'pending' as const
        },
        {
          id: 'procurement',
          name: 'Component Procurement',
          plannedCost: totalCost * 0.6,
          actualCost: 0,
          status: 'pending' as const
        },
        {
          id: 'assembly',
          name: 'Assembly & Testing',
          plannedCost: totalCost * 0.25,
          actualCost: 0,
          status: 'pending' as const
        },
        {
          id: 'finalization',
          name: 'Final Testing & Documentation',
          plannedCost: totalCost * 0.05,
          actualCost: 0,
          status: 'pending' as const
        }
      );
    } else if (componentCount > 10) {
      // Medium project - simplified phases
      milestones.push(
        {
          id: 'procurement',
          name: 'Component Procurement',
          plannedCost: totalCost * 0.7,
          actualCost: 0,
          status: 'pending' as const
        },
        {
          id: 'build',
          name: 'Build & Test',
          plannedCost: totalCost * 0.3,
          actualCost: 0,
          status: 'pending' as const
        }
      );
    } else {
      // Simple project - single milestone
      milestones.push({
        id: 'completion',
        name: 'Project Completion',
        plannedCost: totalCost,
        actualCost: project.status === 'Completed' ? totalCost : 0,
        status: project.status === 'Completed' ? 'completed' as const : 'in_progress' as const
      });
    }

    return milestones;
  }

  /**
   * Assess risk factors for a project
   */
  private static assessProjectRiskFactors(
    project: Project,
    inventory: InventoryItem[],
    costBreakdown: ProjectCostBreakdown
  ): Array<{
    type: 'price_volatility' | 'availability' | 'scope_creep' | 'timeline_delay';
    description: string;
    impact: 'low' | 'medium' | 'high';
    probability: number;
    mitigation: string;
  }> {
    const risks = [];

    // Check for price volatility risk
    const expensiveComponents = costBreakdown.componentCosts.filter(c => c.unitPrice > 50);
    if (expensiveComponents.length > 0) {
      risks.push({
        type: 'price_volatility' as const,
        description: `${expensiveComponents.length} high-value components may experience price fluctuations`,
        impact: expensiveComponents.length > 3 ? 'high' as const : 'medium' as const,
        probability: 30,
        mitigation: 'Lock in prices with suppliers or purchase components early'
      });
    }

    // Check for availability risk
    const unavailableComponents = costBreakdown.componentCosts.filter(c => 
      c.availability === 'out_of_stock' || c.availability === 'low_stock'
    );
    if (unavailableComponents.length > 0) {
      risks.push({
        type: 'availability' as const,
        description: `${unavailableComponents.length} components have limited availability`,
        impact: unavailableComponents.length > 2 ? 'high' as const : 'medium' as const,
        probability: 60,
        mitigation: 'Identify alternative components or adjust project timeline'
      });
    }

    // Check for scope creep risk based on project complexity
    const componentCount = project.components.length;
    if (componentCount > 15) {
      risks.push({
        type: 'scope_creep' as const,
        description: 'Complex project with high potential for scope expansion',
        impact: 'medium' as const,
        probability: 40,
        mitigation: 'Define clear project boundaries and change control process'
      });
    }

    // Check for timeline delay risk
    if (project.status === 'In Progress' && unavailableComponents.length > 0) {
      risks.push({
        type: 'timeline_delay' as const,
        description: 'Component availability issues may delay project completion',
        impact: 'medium' as const,
        probability: 50,
        mitigation: 'Develop contingency timeline and alternative sourcing plan'
      });
    }

    return risks;
  }

  /**
   * Generate detailed cost optimization suggestions
   */
  static generateCostOptimizationSuggestions(
    project: Project,
    inventory: InventoryItem[]
  ): CostOptimizationSuggestion {
    const costBreakdown = this.calculateProjectCostBreakdown(project, inventory);
    const suggestions: CostOptimizationSuggestion['suggestions'] = [];

    // Component substitution suggestions
    costBreakdown.componentCosts.forEach(component => {
      if (component.unitPrice > 15) {
        const alternatives = inventory.filter(item => 
          item.category === component.category &&
          item.id !== component.componentId &&
          (item.purchasePrice || 0) < component.unitPrice * 0.8 &&
          (item.purchasePrice || 0) > 0
        );

        if (alternatives.length > 0) {
          const bestAlternative = alternatives[0];
          const savings = (component.unitPrice - (bestAlternative.purchasePrice || 0)) * component.quantity;
          
          suggestions.push({
            id: `subst-${component.componentId}`,
            type: 'component_substitution',
            title: `Substitute ${component.componentName}`,
            description: `Replace with ${bestAlternative.name} for similar functionality at lower cost`,
            potentialSavings: savings,
            implementationEffort: 'medium',
            riskLevel: 'low',
            affectedComponents: [component.componentId],
            steps: [
              'Review technical specifications for compatibility',
              'Update project documentation',
              'Test alternative component in prototype',
              'Update bill of materials'
            ],
            estimatedTimeToImplement: '2-3 days'
          });
        }
      }
    });

    // Bulk purchasing suggestions
    const categoryTotals = new Map<string, { components: string[], totalCost: number, totalQuantity: number }>();
    costBreakdown.componentCosts.forEach(component => {
      const existing = categoryTotals.get(component.category) || { components: [], totalCost: 0, totalQuantity: 0 };
      existing.components.push(component.componentId);
      existing.totalCost += component.totalPrice;
      existing.totalQuantity += component.quantity;
      categoryTotals.set(component.category, existing);
    });

    categoryTotals.forEach((data, category) => {
      if (data.totalCost > 100 && data.totalQuantity > 20) {
        suggestions.push({
          id: `bulk-${category}`,
          type: 'bulk_purchasing',
          title: `Bulk Purchase ${category} Components`,
          description: `Negotiate volume discounts for ${data.components.length} ${category} components`,
          potentialSavings: data.totalCost * 0.15, // 15% bulk discount
          implementationEffort: 'low',
          riskLevel: 'low',
          affectedComponents: data.components,
          steps: [
            'Contact suppliers for volume pricing',
            'Compare bulk vs individual pricing',
            'Negotiate payment terms',
            'Place consolidated order'
          ],
          estimatedTimeToImplement: '1 week'
        });
      }
    });

    // Design optimization suggestions
    if (costBreakdown.totalCost > 500) {
      suggestions.push({
        id: 'design-opt',
        type: 'design_optimization',
        title: 'Optimize Project Design',
        description: 'Review project design to eliminate unnecessary components and reduce complexity',
        potentialSavings: costBreakdown.totalCost * 0.1, // 10% through design optimization
        implementationEffort: 'high',
        riskLevel: 'medium',
        affectedComponents: costBreakdown.componentCosts.map(c => c.componentId),
        steps: [
          'Conduct design review session',
          'Identify redundant or over-specified components',
          'Simplify circuit design where possible',
          'Update project specifications',
          'Validate optimized design'
        ],
        estimatedTimeToImplement: '1-2 weeks'
      });
    }

    const totalPotentialSavings = suggestions.reduce((sum, s) => sum + s.potentialSavings, 0);

    // Generate priority recommendations
    const recommendedPriority = suggestions.map((suggestion, index) => ({
      suggestionId: suggestion.id,
      priority: this.calculateSuggestionPriority(suggestion),
      reasoning: this.generatePriorityReasoning(suggestion)
    })).sort((a, b) => b.priority - a.priority);

    return {
      projectId: project.id,
      suggestions,
      totalPotentialSavings,
      recommendedPriority
    };
  }

  /**
   * Calculate priority score for optimization suggestions
   */
  private static calculateSuggestionPriority(suggestion: CostOptimizationSuggestion['suggestions'][0]): number {
    let score = 0;
    
    // Savings impact (40% of score)
    score += (suggestion.potentialSavings / 100) * 4;
    
    // Implementation effort (30% of score, inverted)
    const effortScore = suggestion.implementationEffort === 'low' ? 3 : 
                       suggestion.implementationEffort === 'medium' ? 2 : 1;
    score += effortScore * 3;
    
    // Risk level (30% of score, inverted)
    const riskScore = suggestion.riskLevel === 'low' ? 3 : 
                     suggestion.riskLevel === 'medium' ? 2 : 1;
    score += riskScore * 3;
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }

  /**
   * Generate reasoning for priority score
   */
  private static generatePriorityReasoning(suggestion: CostOptimizationSuggestion['suggestions'][0]): string {
    const savings = suggestion.potentialSavings;
    const effort = suggestion.implementationEffort;
    const risk = suggestion.riskLevel;
    
    if (savings > 100 && effort === 'low' && risk === 'low') {
      return 'High savings with minimal effort and risk - implement immediately';
    } else if (savings > 50 && effort !== 'high') {
      return 'Good savings potential with reasonable implementation requirements';
    } else if (effort === 'high' || risk === 'high') {
      return 'Requires careful evaluation due to implementation complexity or risk';
    } else {
      return 'Moderate impact - consider after higher priority optimizations';
    }
  }

  /**
   * Calculate total cost for multiple projects
   */
  static calculateMultiProjectCosts(
    projects: Project[],
    inventory: InventoryItem[]
  ): {
    totalCost: number;
    projectCosts: Array<{ projectId: string; projectName: string; cost: number }>;
    categoryBreakdown: Array<{ category: string; totalCost: number; projectCount: number }>;
    optimizationOpportunities: number;
  } {
    const projectCosts = projects.map(project => {
      const breakdown = this.calculateProjectCostBreakdown(project, inventory);
      return {
        projectId: project.id,
        projectName: project.name,
        cost: breakdown.totalCost
      };
    });

    const totalCost = projectCosts.reduce((sum, p) => sum + p.cost, 0);

    // Calculate category breakdown across all projects
    const categoryMap = new Map<string, { totalCost: number; projectCount: number }>();
    projects.forEach(project => {
      const breakdown = this.calculateProjectCostBreakdown(project, inventory);
      breakdown.categoryBreakdown.forEach(cat => {
        const existing = categoryMap.get(cat.category) || { totalCost: 0, projectCount: 0 };
        existing.totalCost += cat.totalCost;
        existing.projectCount += 1;
        categoryMap.set(cat.category, existing);
      });
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalCost: data.totalCost,
      projectCount: data.projectCount
    }));

    // Count total optimization opportunities
    const optimizationOpportunities = projects.reduce((sum, project) => {
      const breakdown = this.calculateProjectCostBreakdown(project, inventory);
      return sum + breakdown.costOptimizations.length;
    }, 0);

    return {
      totalCost,
      projectCosts,
      categoryBreakdown,
      optimizationOpportunities
    };
  }
}

export default ProjectCostService;