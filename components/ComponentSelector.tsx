import React, { useState, useEffect } from 'react';
import { InventoryItem, ItemStatus } from '../types';
import { useInventory } from '../contexts/InventoryContext';
import { PlusIcon } from './icons/PlusIcon';
// CheckIcon component inline
const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

interface ComponentSelectorProps {
  onComponentsChange: (components: {
    id: string;
    name: string;
    quantity: number;
    source: 'manual' | 'inventory';
    inventoryItemId?: string;
    isAllocated?: boolean;
  }[]) => void;
  initialComponents?: string; // Text format for backward compatibility
}

interface SelectedComponent {
  id: string;
  name: string;
  quantity: number;
  source: 'manual' | 'inventory';
  inventoryItemId?: string;
  isAllocated?: boolean;
}

const ComponentSelector: React.FC<ComponentSelectorProps> = ({ onComponentsChange, initialComponents }) => {
  const { inventory, addItem } = useInventory();
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponent[]>([]);
  const [manualComponentText, setManualComponentText] = useState(initialComponents || '');
  const [showInventorySelector, setShowInventorySelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newComponentName, setNewComponentName] = useState('');
  const [newComponentQuantity, setNewComponentQuantity] = useState(1);

  // Filter available inventory items (only "I Have" status with available quantity)
  const availableInventoryItems = inventory.filter(item => 
    item.status === ItemStatus.HAVE && 
    (item.availableQuantity || item.quantity - (item.allocatedQuantity || 0)) > 0 &&
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Parse initial components from text format
    if (initialComponents) {
      const parsedComponents = parseManualComponents(initialComponents);
      setSelectedComponents(parsedComponents);
    }
  }, [initialComponents]);

  useEffect(() => {
    // Notify parent of component changes
    onComponentsChange(selectedComponents);
  }, [selectedComponents, onComponentsChange]);

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

  const handleManualComponentsChange = (text: string) => {
    setManualComponentText(text);
    const parsedComponents = parseManualComponents(text);
    
    // Keep inventory components and add manual components
    const inventoryComponents = selectedComponents.filter(c => c.source === 'inventory');
    setSelectedComponents([...inventoryComponents, ...parsedComponents]);
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
      id: '',
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-text-secondary">Project Components</label>
        <button
          type="button"
          onClick={() => setShowInventorySelector(!showInventorySelector)}
          className="text-xs text-accent hover:text-blue-400 flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Use Inventory Items
        </button>
      </div>

      {/* Selected Components Display */}
      {selectedComponents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-text-primary">Selected Components:</h4>
          <div className="grid grid-cols-1 gap-2">
            {selectedComponents.map((component) => (
              <div key={component.id} className="flex items-center justify-between bg-primary p-2 rounded border border-border-color">
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    component.source === 'inventory' ? 'bg-green-400' : 'bg-blue-400'
                  }`} />
                  <span className="text-sm text-text-primary">
                    {component.quantity} × {component.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    component.source === 'inventory' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {component.source === 'inventory' ? 'From Inventory' : 'Manual'}
                  </span>
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

export default ComponentSelector;