import React, { useState, useMemo } from 'react';
import { HomeAssistantEntity, InventoryItem } from '../types';
import { useInventory } from '../contexts/InventoryContext';
import { useHomeAssistant } from '../contexts/HomeAssistantContext';
import { useToast } from '../contexts/ToastContext';

interface LinkInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: HomeAssistantEntity | null;
}

const LinkInventoryModal: React.FC<LinkInventoryModalProps> = ({ isOpen, onClose, entity }) => {
  const { inventory } = useInventory();
  const { addLink } = useHomeAssistant();
  const { addToast } = useToast();
  const [selectedItemId, setSelectedItemId] = useState('');

  const availableInventory = useMemo(() => {
    return inventory.filter(item => item.status === 'I Have').sort((a,b) => a.name.localeCompare(b.name));
  }, [inventory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (entity && selectedItemId) {
      addLink({ entityId: entity.entity_id, inventoryId: selectedItemId });
      const itemName = inventory.find(i => i.id === selectedItemId)?.name;
      addToast(`Linked ${entity.attributes.friendly_name} to ${itemName}`, 'success');
      onClose();
    }
  };

  if (!isOpen || !entity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary rounded-lg shadow-xl w-full max-w-lg border border-border-color transform transition-all duration-300 scale-95 animate-modal-enter">
        <div className="p-6">
          <div className="flex justify-between items-center pb-4 border-b border-border-color">
            <div>
                <h3 className="text-lg font-medium leading-6 text-text-primary">
                    Link Inventory Item
                </h3>
                 <p className="text-sm text-text-secondary">to {entity.attributes.friendly_name || entity.entity_id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="inventory-item" className="block text-sm font-medium text-text-secondary">Select an item from your inventory</label>
              <select 
                id="inventory-item" 
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                required
                className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
              >
                <option value="" disabled>-- Select a component --</option>
                {availableInventory.map(item => (
                    <option key={item.id} value={item.id}>
                        {item.name} (In Stock: {item.quantity})
                    </option>
                ))}
              </select>
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="bg-secondary border border-border-color py-2 px-4 rounded-md text-sm font-medium text-text-primary hover:bg-primary transition-colors">Cancel</button>
              <button type="submit" className="bg-accent hover:bg-blue-600 py-2 px-4 rounded-md text-sm font-medium text-white transition-colors">Create Link</button>
            </div>
          </form>
        </div>
      </div>
       <style>{`
        @keyframes modal-enter {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-modal-enter {
          animation: modal-enter 0.3s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default LinkInventoryModal;
