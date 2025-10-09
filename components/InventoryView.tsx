import React, { useState, useMemo } from 'react';
import { InventoryItem, ItemStatus } from '../types';
import InventoryTable from './InventoryTable';
import { useInventory } from '../contexts/InventoryContext';
import { STATUS_CONFIG } from '../constants';
import CheckoutModal from './CheckoutModal';
import { CheckoutIcon } from './icons/CheckoutIcon';
import ComponentDetailModal from './ComponentDetailModal';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface InventoryViewProps {
  onEdit: (item: InventoryItem) => void;
  onCheckoutComplete: (projectName: string, components: { id: string; name: string; quantity: number }[]) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ onEdit, onCheckoutComplete }) => {
  const { inventory, deleteItem, checkoutItems } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<ItemStatus>(ItemStatus.HAVE);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Core', 'Sensors']));


  const handleSort = (key: string) => {
    setSortConfig(prevConfig => {
        if (prevConfig?.key === key) {
            if (prevConfig.direction === 'asc') return { key, direction: 'desc' };
            return null; // Cycle from desc to unsorted
        }
        return { key, direction: 'asc' }; // Default to ascending
    });
  };

  const filteredInventory = useMemo(() =>
    inventory.filter(item =>
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.source?.toLowerCase().includes(searchTerm.toLowerCase())) &&
      item.status === activeTab
    ).sort((a, b) => {
        if (!sortConfig) return 0;
        
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortConfig.key === 'name') {
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        } else if (sortConfig.key === 'quantity') {
            valA = a.quantity;
            valB = b.quantity;
        } else if (sortConfig.key === 'location') {
            valA = a.location.toLowerCase();
            valB = b.location.toLowerCase();
        } else if (sortConfig.key === 'source') {
            valA = a.source?.toLowerCase() || '';
            valB = b.source?.toLowerCase() || '';
        } else {
             // Default to name sort if key is not recognized
            valA = a.name.toLowerCase();
            valB = b.name.toLowerCase();
        }
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    }), [inventory, searchTerm, activeTab, sortConfig]);

  // Fix: Refactored inventory grouping to use `reduce` for more stable type inference, resolving an issue on `items.length`.
  const groupedInventory = useMemo(() => {
    return filteredInventory.reduce((groups, item) => {
      const category = item.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as Record<string, InventoryItem[]>);
  }, [filteredInventory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const handleSelectionChange = (itemId: string, quantity: number) => {
    setSelectedItems(prev => {
      const newSelection = { ...prev };
      if (quantity > 0) {
        newSelection[itemId] = quantity;
      } else {
        delete newSelection[itemId];
      }
      return newSelection;
    });
  };

  const handleConfirmCheckout = (purpose: string) => {
    const itemsToCheckout = Object.keys(selectedItems).map(id => ({ id, quantity: selectedItems[id] }));
    checkoutItems(itemsToCheckout);
    
    const checkedOutComponents = itemsToCheckout.map(item => {
        const fullItem = inventory.find(i => i.id === item.id)!;
        return { id: fullItem.id, name: fullItem.name, quantity: item.quantity };
    });

    onCheckoutComplete(purpose, checkedOutComponents);
    
    setSelectedItems({});
    setIsCheckoutModalOpen(false);
  };
  
  const handleItemClick = (item: InventoryItem) => {
    setDetailItem(item);
  };

  const selectedCount = Object.keys(selectedItems).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-text-primary">My IoT Inventory</h1>
        <div className="relative">
          <input
            type="text"
            placeholder="Search current tab..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 bg-secondary border border-border-color rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="border-b border-border-color">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
              {Object.values(ItemStatus).map(status => (
                  <button
                      key={status}
                      onClick={() => {
                        setActiveTab(status);
                        setSelectedItems({}); // Clear selection when changing tabs
                        setSortConfig(null); // Reset sort when changing tabs
                      }}
                      className={`${
                          activeTab === status
                              ? 'border-accent text-accent'
                              : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-500'
                      } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                  >
                      {STATUS_CONFIG[status].label}
                  </button>
              ))}
          </nav>
      </div>

      <div>
        {Object.keys(groupedInventory).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedInventory)
              .sort(([catA], [catB]) => catA.localeCompare(catB))
              .map(([category, items]) => (
                <div key={category} className="bg-secondary rounded-lg border border-border-color overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex justify-between items-center p-4 bg-secondary hover:bg-primary/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent"
                    aria-expanded={expandedCategories.has(category)}
                    aria-controls={`category-panel-${category}`}
                  >
                    <h3 className="font-semibold text-lg text-text-primary">{category} <span className="text-sm font-normal text-text-secondary">({items.length})</span></h3>
                    <ChevronDownIcon className={`h-6 w-6 text-text-secondary transition-transform duration-300 ${expandedCategories.has(category) ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedCategories.has(category) && (
                    <div className="p-4 border-t border-border-color" id={`category-panel-${category}`}>
                       <InventoryTable
                          items={items}
                          onEdit={onEdit}
                          onDelete={deleteItem}
                          onItemClick={handleItemClick}
                          selectable={activeTab === ItemStatus.HAVE}
                          selectedItems={selectedItems}
                          onSelectionChange={handleSelectionChange}
                          showDescriptions={true}
                          sortConfig={sortConfig}
                          onSort={handleSort}
                          showCategory={false}
                        />
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        ) : (
          <div className="text-center py-16 bg-secondary rounded-lg">
            <h3 className="text-xl font-semibold text-text-primary">
              {searchTerm ? 'No Results Found' : `No items in "${STATUS_CONFIG[activeTab].label}"`}
            </h3>
            <p className="text-text-secondary mt-2">
              {searchTerm ? 'Try adjusting your search term.' : `Click the '+' button to add an item.`}
            </p>
          </div>
        )}
      </div>

       {activeTab === ItemStatus.HAVE && selectedCount > 0 && (
         <button
            onClick={() => setIsCheckoutModalOpen(true)}
            className="fixed bottom-6 right-24 bg-highlight hover:bg-green-700 text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-highlight z-20 flex items-center"
            aria-label="Checkout selected items"
        >
            <CheckoutIcon />
            <span className="ml-2 font-bold">{`Checkout ${selectedCount} Item${selectedCount > 1 ? 's' : ''}`}</span>
        </button>
       )}

       {isCheckoutModalOpen && (
        <CheckoutModal
            isOpen={isCheckoutModalOpen}
            onClose={() => setIsCheckoutModalOpen(false)}
            onConfirm={handleConfirmCheckout}
            selectedItems={Object.entries(selectedItems).map(([id, quantity]) => {
                const item = inventory.find(i => i.id === id);
                return { ...item!, quantity };
            })}
         />
       )}

       {detailItem && (
        <ComponentDetailModal 
            item={detailItem}
            isOpen={!!detailItem}
            onClose={() => setDetailItem(null)}
        />
       )}
    </div>
  );
};

export default InventoryView;