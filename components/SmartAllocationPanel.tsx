import React, { useState, useEffect } from 'react';
import { Project, InventoryItem } from '../types';
import { useInventory } from '../contexts/InventoryContext';
import { SmartAllocationService, AllocationResult, AllocationOptions } from '../services/smartAllocationService';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { CheckIcon } from './icons/CheckIcon';

interface SmartAllocationPanelProps {
  project: Project;
  onAllocationComplete: (allocatedComponents: Project['components']) => void;
  onClose: () => void;
}

const SmartAllocationPanel: React.FC<SmartAllocationPanelProps> = ({
  project,
  onAllocationComplete,
  onClose
}) => {
  const { inventory } = useInventory();
  const [allocationResult, setAllocationResult] = useState<AllocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<AllocationOptions>({
    allowAlternatives: true,
    preferLowerCost: false,
    preferHigherQuantity: false,
    maxAlternativeDistance: 80
  });

  useEffect(() => {
    performSmartAllocation();
  }, [project.components, options]);

  const performSmartAllocation = async () => {
    setLoading(true);
    try {
      const result = await SmartAllocationService.allocateProjectComponents(
        project,
        inventory,
        options
      );
      setAllocationResult(result);
    } catch (error) {
      console.error('Smart allocation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAllocation = () => {
    if (!allocationResult) return;

    // Update project components with allocation results
    const updatedComponents = project.components.map(component => {
      const allocation = allocationResult.allocations.find(a => a.componentId === component.id);
      
      if (allocation) {
        const inventoryItem = inventory.find(item => item.id === allocation.inventoryItemId);
        return {
          ...component,
          name: allocation.isAlternative ? inventoryItem?.name || component.name : component.name,
          inventoryItemId: allocation.inventoryItemId,
          source: 'inventory' as const,
          isAllocated: true
        };
      }
      
      return component;
    });

    onAllocationComplete(updatedComponents);
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-primary rounded-lg border border-border-color p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <SpinnerIcon className="mr-3" />
            <h3 className="text-lg font-semibold text-text-primary">Smart Allocation</h3>
          </div>
          <p className="text-center text-text-secondary">
            Analyzing inventory and finding optimal component allocations...
          </p>
        </div>
      </div>
    );
  }

  if (!allocationResult) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary rounded-lg border border-border-color max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-color">
          <div className="flex items-center">
            <SparklesIcon className="w-6 h-6 mr-3 text-accent" />
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Smart Component Allocation</h2>
              <p className="text-sm text-text-secondary mt-1">
                Optimized inventory allocation for "{project.name}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
            title="Close smart allocation panel"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Allocation Options */}
        <div className="p-6 border-b border-border-color bg-secondary/30">
          <h3 className="text-sm font-medium text-text-primary mb-3">Allocation Options</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.allowAlternatives}
                onChange={(e) => setOptions(prev => ({ ...prev, allowAlternatives: e.target.checked }))}
                className="rounded border-border-color text-accent focus:ring-accent"
              />
              <span className="text-sm text-text-primary">Allow alternatives</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.preferLowerCost}
                onChange={(e) => setOptions(prev => ({ ...prev, preferLowerCost: e.target.checked }))}
                className="rounded border-border-color text-accent focus:ring-accent"
              />
              <span className="text-sm text-text-primary">Prefer lower cost</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.preferHigherQuantity}
                onChange={(e) => setOptions(prev => ({ ...prev, preferHigherQuantity: e.target.checked }))}
                className="rounded border-border-color text-accent focus:ring-accent"
              />
              <span className="text-sm text-text-primary">Prefer higher quantity</span>
            </label>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-text-primary">Max alternative distance:</label>
              <input
                type="range"
                min="50"
                max="100"
                value={options.maxAlternativeDistance}
                onChange={(e) => setOptions(prev => ({ ...prev, maxAlternativeDistance: parseInt(e.target.value) }))}
                className="flex-1"
                title="Maximum alternative distance percentage"
                aria-label="Maximum alternative distance"
              />
              <span className="text-xs text-text-secondary w-8">{options.maxAlternativeDistance}%</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overall Status */}
          <div className={`mb-6 p-4 rounded-lg border ${
            allocationResult.success 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">{getStatusIcon(allocationResult.success)}</span>
              <h3 className={`font-medium ${getStatusColor(allocationResult.success)}`}>
                {allocationResult.success ? 'Allocation Successful' : 'Allocation Issues Found'}
              </h3>
            </div>
            <p className="text-sm text-text-secondary">
              {allocationResult.success 
                ? `Successfully allocated ${allocationResult.allocations.length} components from inventory.`
                : 'Some components could not be allocated. See details below.'
              }
            </p>
          </div>

          {/* Allocations */}
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-text-primary">Component Allocations</h3>
            {allocationResult.allocations.map((allocation, index) => {
              const inventoryItem = inventory.find(item => item.id === allocation.inventoryItemId);
              const originalComponent = project.components.find(c => c.id === allocation.componentId);
              
              return (
                <div key={index} className="bg-secondary/30 border border-border-color rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckIcon className="w-4 h-4 text-green-400" />
                        <h4 className="font-medium text-text-primary">
                          {originalComponent?.name}
                        </h4>
                        {allocation.isAlternative && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            Alternative
                          </span>
                        )}
                      </div>
                      
                      {allocation.isAlternative && (
                        <p className="text-sm text-text-secondary mb-2">
                          Using <strong>{inventoryItem?.name}</strong> instead of {allocation.originalComponent}
                        </p>
                      )}
                      
                      <p className="text-xs text-text-secondary mb-2">{allocation.reasoning}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-text-secondary">
                        <span>Quantity: {allocation.quantity}</span>
                        <span>Location: {inventoryItem?.location}</span>
                        {inventoryItem?.purchasePrice && (
                          <span>Cost: ${(inventoryItem.purchasePrice * allocation.quantity).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warnings */}
          {allocationResult.warnings.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
                <span className="text-yellow-400 mr-2">⚠️</span>
                Warnings
              </h3>
              <div className="space-y-2">
                {allocationResult.warnings.map((warning, index) => (
                  <div key={index} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-sm text-yellow-400">{warning}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {allocationResult.suggestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
                <span className="text-blue-400 mr-2">💡</span>
                Suggestions
              </h3>
              <div className="space-y-2">
                {allocationResult.suggestions.map((suggestion, index) => (
                  <div key={index} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                    <p className="text-sm text-blue-400">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-color flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={performSmartAllocation}
            className="px-4 py-2 bg-secondary hover:bg-gray-600 text-text-primary rounded-md transition-colors"
          >
            Recalculate
          </button>
          <button
            onClick={handleAcceptAllocation}
            disabled={!allocationResult.success}
            className="px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Accept Allocation
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartAllocationPanel;