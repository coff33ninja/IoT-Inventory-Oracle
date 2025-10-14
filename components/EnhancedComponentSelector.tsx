import React, { useState, useEffect } from 'react';
import { InventoryItem, ItemStatus, ComponentSuggestion } from '../types';
import { useInventory } from '../contexts/InventoryContext';
import { useRecommendationPreferences, shouldShowRecommendationType, getConfidenceThreshold } from '../contexts/RecommendationPreferencesContext';
import { useCurrencyFormat } from '../hooks/useCurrencyFormat';
import { PlusIcon } from './icons/PlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import RecommendationBadge from './recommendations/RecommendationBadge';

interface EnhancedComponentSelectorProps {
  onComponentsChange: (components: {
    id: string;
    name: string;
    quantity: number;
    source: 'manual' | 'inventory' | 'ai-suggested' | 'github';
    inventoryItemId?: string;
    isAllocated?: boolean;
    confidence?: number;
    reasoning?: string;
  }[]) => void;
  initialComponents?: string;
  projectType?: string;
  projectDescription?: string;
  enableRecommendations?: boolean;
}

interface SelectedComponent {
  id: string;
  name: string;
  quantity: number;
  source: 'manual' | 'inventory' | 'ai-suggested' | 'github';
  inventoryItemId?: string;
  isAllocated?: boolean;
  confidence?: number;
  reasoning?: string;
}

const EnhancedComponentSelector: React.FC<EnhancedComponentSelectorProps> = ({ 
  onComponentsChange, 
  initialComponents,
  projectType,
  projectDescription,
  enableRecommendations = true
}) => {
  const { inventory, addItem } = useInventory();
  const { preferences } = useRecommendationPreferences();
  const { formatCurrency } = useCurrencyFormat();
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [manualComponentText, setManualComponentText] = useState(initialComponents || '');
  const [showInventorySelector, setShowInventorySelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentQuantity, setNewComponentQuantity] = useState(1);
  const [suggestions, setSuggestions] = useState<ComponentSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filter available inventory items
  const availableInventoryItems = inventory.filter(item => 
    item.status === ItemStatus.HAVE && 
    (item.availableQuantity || item.quantity - (item.allocatedQuantity || 0)) > 0 &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (initialComponents) {
      const parsedComponents = parseManualComponents(initialComponents);
      setSelectedComponents(parsedComponents);
    }
  }, [initialComponents]);

  useEffect(() => {
    onComponentsChange(selectedComponents);
  }, [selectedComponents, onComponentsChange]);

  // Load AI suggestions when project details are available
  useEffect(() => {
    if (enableRecommendations && 
        shouldShowRecommendationType(preferences, 'alternatives') &&
        (projectType || projectDescription)) {
      loadComponentSuggestions();
    }
  }, [projectType, projectDescription, enableRecommendations, preferences]);

  const parseManualComponents = (text: string): SelectedComponent[] => {
    if (!text.trim()) return [];
    
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .map((line, index) => {
        const match = line.match(/^(?:(\d+)\s*[xX]?\s*)?(.+)/);
        if (!match) return null;
        
        const quantity = parseInt(match[1] || '1', 10);
        const name = match[2].trim();
        
        return {
          id: `manual-${Date.now()}-${index}`,
          name,
          quantity: isNaN(quantity) ? 1 : quantity,
          source: 'manual' as const,
        };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  };

  const loadComponentSuggestions = async () => {
    if (!projectType && !projectDescription) return;
    
    setLoadingSuggestions(true);
    try {
      // Import the client-side recommendation service
      const { ClientRecommendationService } = await import('../services/clientRecommendationService');
      
      // Generate project-based component suggestions
      const projectSuggestions = await generateProjectSuggestions(
        projectType || 'General',
        projectDescription || '',
        inventory
      );
      
      setSuggestions(projectSuggestions);
    } catch (error) {
      console.error('Failed to load component suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const generateProjectSuggestions = async (
    type: string,
    description: string,
    availableItems: InventoryItem[]
  ): Promise<ComponentSuggestion[]> => {
    // This is a simplified suggestion engine based on project type and available inventory
    const suggestions: ComponentSuggestion[] = [];
    
    // Common component patterns based on project type
    const projectPatterns: Record<string, string[]> = {
      'Home Automation': ['ESP32', 'ESP8266', 'Relay', 'Sensor', 'LED', 'Resistor'],
      'Robotics': ['Arduino', 'Motor', 'Servo', 'Ultrasonic', 'Wheel', 'Battery'],
      'Sensors & Monitoring': ['Sensor', 'Display', 'Arduino', 'ESP32', 'Breadboard'],
      'IoT': ['ESP32', 'ESP8266', 'Sensor', 'WiFi', 'MQTT', 'LED'],
      'General': ['Arduino', 'ESP32', 'LED', 'Resistor', 'Breadboard', 'Jumper']
    };

    const relevantKeywords = projectPatterns[type] || projectPatterns['General'];
    
    // Find matching components in inventory
    for (const keyword of relevantKeywords) {
      const matchingItems = availableItems.filter(item => 
        item.name.toLowerCase().includes(keyword.toLowerCase()) &&
        item.status === ItemStatus.HAVE &&
        (item.availableQuantity || item.quantity - (item.allocatedQuantity || 0)) > 0
      );

      for (const item of matchingItems.slice(0, 2)) { // Limit to 2 per keyword
        const confidence = calculateSuggestionConfidence(item, type, description);
        
        if (confidence > getConfidenceThreshold(preferences)) { // Use user's confidence threshold
          suggestions.push({
            componentId: item.id,
            name: item.name,
            category: item.category || 'General',
            quantity: 1,
            confidence,
            reasoning: generateSuggestionReasoning(item, type, keyword),
            priority: confidence > 0.7 ? 'high' : confidence > 0.5 ? 'medium' : 'low',
            estimatedCost: item.purchasePrice || 0,
            alternatives: []
          });
        }
      }
    }

    // Sort by confidence and limit results
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 8); // Limit to top 8 suggestions
  };

  const calculateSuggestionConfidence = (
    item: InventoryItem,
    projectType: string,
    description: string
  ): number => {
    let confidence = 0.4; // Base confidence
    
    // Boost confidence based on project type match
    if (item.category && projectType.toLowerCase().includes(item.category.toLowerCase())) {
      confidence += 0.3;
    }
    
    // Boost confidence based on description keywords
    const descriptionWords = description.toLowerCase().split(/\s+/);
    const itemWords = item.name.toLowerCase().split(/\s+/);
    
    for (const word of itemWords) {
      if (descriptionWords.includes(word)) {
        confidence += 0.1;
      }
    }
    
    // Boost confidence for frequently used items
    if (item.usedInProjects && item.usedInProjects.length > 2) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  };

  const generateSuggestionReasoning = (
    item: InventoryItem,
    projectType: string,
    keyword: string
  ): string => {
    const reasons = [];
    
    if (item.category && projectType.toLowerCase().includes(item.category.toLowerCase())) {
      reasons.push(`matches ${projectType} category`);
    }
    
    if (item.name.toLowerCase().includes(keyword.toLowerCase())) {
      reasons.push(`commonly used in ${projectType} projects`);
    }
    
    if (item.usedInProjects && item.usedInProjects.length > 0) {
      reasons.push(`successfully used in ${item.usedInProjects.length} previous projects`);
    }
    
    const availableQty = item.quantity - (item.allocatedQuantity || 0);
    reasons.push(`${availableQty} available in inventory`);
    
    return `Suggested because it ${reasons.join(', ')}.`;
  };

  const handleManualComponentsChange = (text: string) => {
    setManualComponentText(text);
    const parsedComponents = parseManualComponents(text);
    
    // Keep inventory and AI components, add manual components
    const nonManualComponents = selectedComponents.filter(c => c.source !== 'manual');
    setSelectedComponents([...nonManualComponents, ...parsedComponents]);
  };

  const addInventoryComponent = (item: InventoryItem, quantity: number) => {
    const availableQty = item.quantity - (item.allocatedQuantity || 0);
    const actualQuantity = Math.min(quantity, availableQty);
    
    const newComponent: SelectedComponent = {
      id: `inventory-${item.id}-${Date.now()}`,
      name: item.name,
      quantity: actualQuantity,
      source: 'inventory',
      inventoryItemId: item.id,
      isAllocated: true
    };

    setSelectedComponents(prev => [...prev, newComponent]);
    setSearchTerm('');
  };

  const addSuggestedComponent = (suggestion: ComponentSuggestion) => {
    const inventoryItem = inventory.find(item => item.id === suggestion.componentId);
    if (!inventoryItem) return;

    const newComponent: SelectedComponent = {
      id: `ai-${suggestion.componentId}-${Date.now()}`,
      name: suggestion.name,
      quantity: suggestion.quantity,
      source: 'ai-suggested',
      inventoryItemId: suggestion.componentId,
      isAllocated: true,
      confidence: suggestion.confidence,
      reasoning: suggestion.reasoning
    };

    setSelectedComponents(prev => [...prev, newComponent]);
    
    // Remove from suggestions
    setSuggestions(prev => prev.filter(s => s.componentId !== suggestion.componentId));
  };

  const removeComponent = (componentId: string) => {
    setSelectedComponents(prev => prev.filter(c => c.id !== componentId));
    
    // If it was a manual component, update the text
    const remainingManualComponents = selectedComponents
      .filter(c => c.source === 'manual' && c.id !== componentId);
    
    const manualText = remainingManualComponents
      .map(c => `${c.quantity} x ${c.name}`)
      .join('\n');
    
    setManualComponentText(manualText);
  };

  const addNewInventoryItem = async () => {
    if (!newComponentName.trim()) return;

    const newItem = {
      name: newComponentName,
      quantity: newComponentQuantity,
      location: 'To be purchased',
      status: ItemStatus.NEED,
      description: 'Added from project creation',
      createdAt: new Date().toISOString(),
    };

    try {
      await addItem(newItem);
      setNewComponentName('');
      setNewComponentQuantity(1);
      setShowInventorySelector(false);
    } catch (error) {
      console.error('Failed to add inventory item:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-text-secondary">Project Components</label>
        <div className="flex space-x-2">
          {enableRecommendations && (
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-xs text-accent hover:text-blue-400 flex items-center"
            >
              <SparklesIcon className="w-4 h-4 mr-1" />
              AI Suggestions ({suggestions.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowInventorySelector(!showInventorySelector)}
            className="text-xs text-accent hover:text-blue-400 flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Use Inventory Items
          </button>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {enableRecommendations && showSuggestions && (
        <div className="bg-primary border border-border-color rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-text-primary flex items-center">
              <SparklesIcon className="w-4 h-4 mr-2" />
              AI Component Suggestions
            </h4>
            <button
              type="button"
              onClick={() => setShowSuggestions(false)}
              className="text-text-secondary hover:text-text-primary"
            >
              ×
            </button>
          </div>

          {loadingSuggestions ? (
            <div className="flex items-center justify-center py-4">
              <SpinnerIcon className="mr-2" />
              <span className="text-text-secondary">Analyzing project requirements...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.componentId} className="bg-secondary border border-border-color rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h5 className="text-sm font-medium text-text-primary">{suggestion.name}</h5>
                        <RecommendationBadge
                          type="compatible"
                          onClick={() => {}}
                        />
                        <span className={`text-xs ${getPriorityColor(suggestion.priority)}`}>
                          {suggestion.priority} priority
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">{suggestion.reasoning}</p>
                      <div className="flex items-center space-x-4 text-xs text-text-secondary">
                        <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                        <span>Qty: {suggestion.quantity}</span>
                        {suggestion.estimatedCost > 0 && (
                          <span>Cost: {formatCurrency(suggestion.estimatedCost)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => addSuggestedComponent(suggestion)}
                      className="text-xs bg-accent hover:bg-blue-600 text-white px-3 py-1 rounded ml-3"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-text-secondary">
              <p className="text-sm">No AI suggestions available.</p>
              <p className="text-xs mt-1">Add more project details to get better suggestions.</p>
            </div>
          )}
        </div>
      )}

      {/* Selected Components Display */}
      {selectedComponents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-primary">Selected Components:</h4>
          <div className="grid grid-cols-1 gap-2">
            {selectedComponents.map((component) => (
              <div key={component.id} className="flex items-center justify-between bg-primary p-2 rounded border border-border-color">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    component.source === 'inventory' ? 'bg-green-400' : 
                    component.source === 'ai-suggested' ? 'bg-purple-400' : 'bg-blue-400'
                  }`} />
                  <span className="text-sm text-text-primary">
                    {component.quantity} × {component.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    component.source === 'inventory' ? 'bg-green-500/20 text-green-400' : 
                    component.source === 'ai-suggested' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {component.source === 'inventory' ? 'From Inventory' : 
                     component.source === 'ai-suggested' ? 'AI Suggested' : 'Manual'}
                  </span>
                  {component.confidence && (
                    <span className="text-xs text-text-secondary">
                      {Math.round(component.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeComponent(component.id)}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inventory Selector */}
      {showInventorySelector && (
        <div className="bg-primary border border-border-color rounded-lg p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-text-primary">Select from Inventory</h4>
            <button
              type="button"
              onClick={() => setShowInventorySelector(false)}
              className="text-text-secondary hover:text-text-primary"
            >
              ×
            </button>
          </div>

          <input
            type="text"
            placeholder="Search inventory items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary border border-border-color rounded-md p-2 text-text-primary"
          />

          <div className="max-h-48 overflow-y-auto space-y-2">
            {availableInventoryItems.length > 0 ? (
              availableInventoryItems.map((item) => {
                const availableQty = item.quantity - (item.allocatedQuantity || 0);
                return (
                  <div key={item.id} className="flex items-center justify-between bg-secondary p-3 rounded border border-border-color">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{item.name}</p>
                      <p className="text-xs text-text-secondary">
                        Available: {availableQty} | Location: {item.location}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="1"
                        max={availableQty}
                        defaultValue="1"
                        className="w-16 bg-primary border border-border-color rounded p-1 text-xs text-text-primary"
                        id={`qty-${item.id}`}
                        title="Quantity to allocate"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const qtyInput = document.getElementById(`qty-${item.id}`) as HTMLInputElement;
                          const quantity = parseInt(qtyInput.value) || 1;
                          addInventoryComponent(item, quantity);
                        }}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-text-secondary">
                <p className="text-sm">No available inventory items found.</p>
                <p className="text-xs mt-1">Items must have "I Have" status and available quantity.</p>
              </div>
            )}
          </div>

          {/* Quick Add New Item */}
          <div className="border-t border-border-color pt-4">
            <h5 className="text-sm font-medium text-text-primary mb-2">Quick Add to Inventory</h5>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Component name"
                value={newComponentName}
                onChange={(e) => setNewComponentName(e.target.value)}
                className="flex-1 bg-secondary border border-border-color rounded p-2 text-sm text-text-primary"
              />
              <input
                type="number"
                min="1"
                value={newComponentQuantity}
                onChange={(e) => setNewComponentQuantity(parseInt(e.target.value) || 1)}
                className="w-20 bg-secondary border border-border-color rounded p-2 text-sm text-text-primary"
                title="Quantity"
              />
              <button
                type="button"
                onClick={addNewInventoryItem}
                className="text-sm bg-accent hover:bg-blue-600 text-white px-3 py-2 rounded"
              >
                Add to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Components Input */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Manual Components (one per line)
        </label>
        <textarea
          value={manualComponentText}
          onChange={(e) => handleManualComponentsChange(e.target.value)}
          rows={4}
          placeholder="2 x ESP32&#10;1 BME280 Sensor&#10;Red LED"
          className="w-full bg-primary border border-border-color rounded-md p-3 text-text-primary font-mono text-sm"
        />
        <p className="text-xs text-text-secondary mt-1">
          Format: "quantity x component name" or just "component name" (defaults to 1)
        </p>
      </div>
    </div>
  );
};

export default EnhancedComponentSelector;