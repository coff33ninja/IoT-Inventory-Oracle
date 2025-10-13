import React, { useState, useEffect } from 'react';
import { Project, InventoryItem, ComponentSuggestion, ComponentAlternative } from '../types';
import { useInventory } from '../contexts/InventoryContext';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import RecommendationBadge from './recommendations/RecommendationBadge';
import QuickActionButton from './recommendations/QuickActionButton';

interface ProjectRecommendationsPanelProps {
  project: Project;
  onUpdateProject: (updatedProject: Project) => void;
}

interface ComponentRecommendation {
  type: 'alternative' | 'optimization' | 'missing' | 'upgrade';
  componentId: string;
  componentName: string;
  suggestion: ComponentSuggestion | ComponentAlternative;
  reasoning: string;
  priority: 'high' | 'medium' | 'low';
  estimatedSavings?: number;
}

const ProjectRecommendationsPanel: React.FC<ProjectRecommendationsPanelProps> = ({
  project,
  onUpdateProject
}) => {
  const { inventory, addItem } = useInventory();
  const [recommendations, setRecommendations] = useState<ComponentRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'alternatives' | 'optimizations' | 'missing'>('alternatives');

  useEffect(() => {
    loadProjectRecommendations();
  }, [project.id, project.components]);

  const loadProjectRecommendations = async () => {
    setLoading(true);
    try {
      const { ClientRecommendationService } = await import('../services/clientRecommendationService');
      
      const allRecommendations: ComponentRecommendation[] = [];

      // Analyze each component in the project
      for (const component of project.components) {
        // Find alternatives for components sourced from inventory
        if (component.inventoryItemId) {
          const inventoryItem = inventory.find(item => item.id === component.inventoryItemId);
          if (inventoryItem) {
            const alternatives = ClientRecommendationService.findComponentAlternatives(inventoryItem, inventory);
            
            for (const alternative of alternatives.slice(0, 2)) { // Limit to top 2 alternatives
              const altItem = inventory.find(item => item.id === alternative.componentId);
              if (altItem && altItem.id !== inventoryItem.id) {
                allRecommendations.push({
                  type: 'alternative',
                  componentId: component.id,
                  componentName: component.name,
                  suggestion: alternative,
                  reasoning: alternative.explanation,
                  priority: alternative.compatibilityScore > 85 ? 'high' : alternative.compatibilityScore > 70 ? 'medium' : 'low',
                  estimatedSavings: alternative.priceComparison.savings > 0 ? alternative.priceComparison.savings : undefined
                });
              }
            }
          }
        }

        // Check for optimization opportunities
        const optimizations = await analyzeComponentOptimizations(component, inventory);
        allRecommendations.push(...optimizations);
      }

      // Check for missing components that could enhance the project
      const missingComponents = await suggestMissingComponents(project, inventory);
      allRecommendations.push(...missingComponents);

      setRecommendations(allRecommendations);
    } catch (error) {
      console.error('Failed to load project recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeComponentOptimizations = async (
    component: Project['components'][0],
    availableItems: InventoryItem[]
  ): Promise<ComponentRecommendation[]> => {
    const optimizations: ComponentRecommendation[] = [];

    // Look for quantity optimizations
    if (component.inventoryItemId) {
      const inventoryItem = availableItems.find(item => item.id === component.inventoryItemId);
      if (inventoryItem) {
        const availableQty = inventoryItem.quantity - (inventoryItem.allocatedQuantity || 0);
        
        // Suggest using more if significantly more is available and it's commonly used in bulk
        if (availableQty > component.quantity * 3 && component.quantity === 1) {
          optimizations.push({
            type: 'optimization',
            componentId: component.id,
            componentName: component.name,
            suggestion: {
              componentId: inventoryItem.id,
              name: inventoryItem.name,
              category: inventoryItem.category || 'General',
              quantity: Math.min(availableQty, component.quantity + 2),
              confidence: 0.7,
              reasoning: `Consider using ${Math.min(availableQty, component.quantity + 2)} units for redundancy and future modifications`,
              priority: 'medium',
              estimatedCost: (inventoryItem.purchasePrice || 0) * 2,
              alternatives: []
            },
            reasoning: `You have ${availableQty} available. Consider allocating extras for prototyping and backup.`,
            priority: 'medium'
          });
        }
      }
    }

    return optimizations;
  };

  const suggestMissingComponents = async (
    currentProject: Project,
    availableItems: InventoryItem[]
  ): Promise<ComponentRecommendation[]> => {
    const missing: ComponentRecommendation[] = [];

    // Common component combinations and missing pieces
    const componentNames = currentProject.components.map(c => c.name.toLowerCase());
    
    // If project has microcontroller but no basic components
    const hasMicrocontroller = componentNames.some(name => 
      name.includes('arduino') || name.includes('esp32') || name.includes('esp8266')
    );
    
    if (hasMicrocontroller) {
      const hasLED = componentNames.some(name => name.includes('led'));
      const hasResistor = componentNames.some(name => name.includes('resistor'));
      const hasBreadboard = componentNames.some(name => name.includes('breadboard'));
      
      if (!hasLED) {
        const ledItems = availableItems.filter(item => 
          item.name.toLowerCase().includes('led') && 
          item.status === 'I Have' &&
          (item.availableQuantity || item.quantity - (item.allocatedQuantity || 0)) > 0
        );
        
        if (ledItems.length > 0) {
          const ledItem = ledItems[0];
          missing.push({
            type: 'missing',
            componentId: 'missing-led',
            componentName: 'LED Indicator',
            suggestion: {
              componentId: ledItem.id,
              name: ledItem.name,
              category: ledItem.category || 'Electronics',
              quantity: 1,
              confidence: 0.8,
              reasoning: 'LEDs are essential for visual feedback and debugging in microcontroller projects',
              priority: 'high',
              estimatedCost: ledItem.purchasePrice || 0.5,
              alternatives: []
            },
            reasoning: 'Most microcontroller projects benefit from LED indicators for status and debugging.',
            priority: 'high'
          });
        }
      }
      
      if (!hasResistor) {
        const resistorItems = availableItems.filter(item => 
          item.name.toLowerCase().includes('resistor') && 
          item.status === 'I Have' &&
          (item.availableQuantity || item.quantity - (item.allocatedQuantity || 0)) > 0
        );
        
        if (resistorItems.length > 0) {
          const resistorItem = resistorItems[0];
          missing.push({
            type: 'missing',
            componentId: 'missing-resistor',
            componentName: 'Current Limiting Resistor',
            suggestion: {
              componentId: resistorItem.id,
              name: resistorItem.name,
              category: resistorItem.category || 'Electronics',
              quantity: 2,
              confidence: 0.9,
              reasoning: 'Resistors are needed for current limiting and pull-up/pull-down configurations',
              priority: 'high',
              estimatedCost: (resistorItem.purchasePrice || 0.1) * 2,
              alternatives: []
            },
            reasoning: 'Resistors are essential for protecting components and proper circuit operation.',
            priority: 'high'
          });
        }
      }
      
      if (!hasBreadboard) {
        const breadboardItems = availableItems.filter(item => 
          item.name.toLowerCase().includes('breadboard') && 
          item.status === 'I Have' &&
          (item.availableQuantity || item.quantity - (item.allocatedQuantity || 0)) > 0
        );
        
        if (breadboardItems.length > 0) {
          const breadboardItem = breadboardItems[0];
          missing.push({
            type: 'missing',
            componentId: 'missing-breadboard',
            componentName: 'Prototyping Breadboard',
            suggestion: {
              componentId: breadboardItem.id,
              name: breadboardItem.name,
              category: breadboardItem.category || 'Tools',
              quantity: 1,
              confidence: 0.85,
              reasoning: 'Breadboards enable rapid prototyping and circuit testing without soldering',
              priority: 'medium',
              estimatedCost: breadboardItem.purchasePrice || 5,
              alternatives: []
            },
            reasoning: 'A breadboard will make prototyping and testing much easier.',
            priority: 'medium'
          });
        }
      }
    }

    return missing;
  };

  const handleAcceptRecommendation = async (recommendation: ComponentRecommendation) => {
    try {
      if (recommendation.type === 'alternative') {
        // Replace the existing component with the alternative
        const updatedComponents = project.components.map(comp => {
          if (comp.id === recommendation.componentId) {
            return {
              ...comp,
              name: recommendation.suggestion.name,
              inventoryItemId: recommendation.suggestion.componentId,
              source: 'inventory' as const,
              isAllocated: true
            };
          }
          return comp;
        });

        const updatedProject = { ...project, components: updatedComponents };
        onUpdateProject(updatedProject);
      } else if (recommendation.type === 'missing' || recommendation.type === 'optimization') {
        // Add the suggested component to the project
        const newComponent = {
          id: `rec-${Date.now()}`,
          name: recommendation.suggestion.name,
          quantity: 'quantity' in recommendation.suggestion ? recommendation.suggestion.quantity : 1,
          source: 'inventory' as const,
          inventoryItemId: recommendation.suggestion.componentId,
          isAllocated: true
        };

        const updatedProject = {
          ...project,
          components: [...project.components, newComponent]
        };
        onUpdateProject(updatedProject);
      }

      // Remove the recommendation from the list
      setRecommendations(prev => prev.filter(r => r !== recommendation));
    } catch (error) {
      console.error('Failed to accept recommendation:', error);
    }
  };

  const handleDismissRecommendation = (recommendation: ComponentRecommendation) => {
    setRecommendations(prev => prev.filter(r => r !== recommendation));
  };

  const getRecommendationsByType = (type: typeof activeTab) => {
    const typeMap = {
      'alternatives': ['alternative'],
      'optimizations': ['optimization', 'upgrade'],
      'missing': ['missing']
    };
    
    return recommendations.filter(rec => typeMap[type].includes(rec.type));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-green-400 bg-green-500/10 border-green-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alternative': return '🔄';
      case 'optimization': return '⚡';
      case 'missing': return '➕';
      case 'upgrade': return '⬆️';
      default: return '💡';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text-primary flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2" />
          Project Recommendations
        </h3>
        <button
          type="button"
          onClick={loadProjectRecommendations}
          disabled={loading}
          className="text-sm bg-accent hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center disabled:opacity-50"
        >
          {loading ? <SpinnerIcon className="mr-1" /> : <SparklesIcon className="mr-1" />}
          {loading ? 'Analyzing...' : 'Refresh'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-color">
        {[
          { id: 'alternatives', label: 'Alternatives', count: getRecommendationsByType('alternatives').length },
          { id: 'optimizations', label: 'Optimizations', count: getRecommendationsByType('optimizations').length },
          { id: 'missing', label: 'Missing Components', count: getRecommendationsByType('missing').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-1 bg-secondary rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Recommendations Content */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <SpinnerIcon className="mr-2" />
            <span className="text-text-secondary">Analyzing project components...</span>
          </div>
        ) : (
          <>
            {getRecommendationsByType(activeTab).length > 0 ? (
              getRecommendationsByType(activeTab).map((recommendation, index) => (
                <div key={index} className="bg-primary border border-border-color rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getTypeIcon(recommendation.type)}</span>
                      <div>
                        <h4 className="font-medium text-text-primary flex items-center">
                          {recommendation.suggestion.name}
                          <span className={`ml-2 px-2 py-1 rounded text-xs border ${getPriorityColor(recommendation.priority)}`}>
                            {recommendation.priority} priority
                          </span>
                        </h4>
                        <p className="text-sm text-text-secondary mt-1">
                          For: {recommendation.componentName}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <QuickActionButton
                        action="add-alternative"
                        label="Accept"
                        onClick={() => handleAcceptRecommendation(recommendation)}
                        className="text-xs px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleDismissRecommendation(recommendation)}
                        className="text-xs text-text-secondary hover:text-text-primary px-2 py-1"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-text-primary mb-3">{recommendation.reasoning}</p>

                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <div className="flex space-x-4">
                      <span>Quantity: {'quantity' in recommendation.suggestion ? recommendation.suggestion.quantity : 1}</span>
                      <span>Confidence: {Math.round(recommendation.suggestion.confidence * 100)}%</span>
                      {'estimatedCost' in recommendation.suggestion && recommendation.suggestion.estimatedCost > 0 && (
                        <span>Cost: ${recommendation.suggestion.estimatedCost.toFixed(2)}</span>
                      )}
                    </div>
                    {recommendation.estimatedSavings && recommendation.estimatedSavings > 0 && (
                      <span className="text-green-400">
                        Save ${recommendation.estimatedSavings.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-text-secondary">
                <p className="text-sm">
                  {activeTab === 'alternatives' && 'No alternative components found.'}
                  {activeTab === 'optimizations' && 'No optimization opportunities identified.'}
                  {activeTab === 'missing' && 'No missing components detected.'}
                </p>
                <p className="text-xs mt-1">
                  Your project components look well-optimized!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectRecommendationsPanel;