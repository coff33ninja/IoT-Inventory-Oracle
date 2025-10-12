import React from 'react';
import { InventoryItem } from '../types';
import { STATUS_CONFIG } from '../constants';
import { EditIcon } from './icons/EditIcon';
import { TrashIcon } from './icons/TrashIcon';
import { CameraIcon } from './icons/CameraIcon';
import { PriceCheckIcon } from './icons/PriceCheckIcon';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onItemClick: (item: InventoryItem) => void;
  onPriceCheck?: (item: InventoryItem) => void;
  selectable?: boolean;
  selectedItems?: Record<string, number>;
  onSelectionChange?: (itemId: string, quantity: number) => void;
  showDescriptions?: boolean;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
  showCategory?: boolean;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ 
    items, 
    onEdit, 
    onDelete, 
    onItemClick, 
    onPriceCheck,
    selectable = false, 
    selectedItems = {}, 
    onSelectionChange = (_itemId, _quantity) => {},
    showDescriptions = false,
    sortConfig,
    onSort = (_key: string) => {},
    showCategory = true,
}) => {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, item: InventoryItem) => {
    e.stopPropagation();
    const isChecked = e.target.checked;
    onSelectionChange(item.id, isChecked ? 1 : 0);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>, item: InventoryItem) => {
    e.stopPropagation();
    let quantity = parseInt(e.target.value, 10);
    if (isNaN(quantity) || quantity < 1) {
      quantity = 1;
    }
    if (quantity > item.quantity) {
      quantity = item.quantity;
    }
    onSelectionChange(item.id, quantity);
  };
  
  const renderSortArrow = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
        return <span className="ml-1 opacity-30 group-hover:opacity-100">↕</span>;
    }
    if (sortConfig.direction === 'asc') {
        return <span className="ml-1">▲</span>;
    }
    return <span className="ml-1">▼</span>;
  };

  return (
    <div className="overflow-x-auto bg-primary rounded-lg border border-border-color">
      <table className="min-w-full divide-y divide-border-color">
        <thead className="bg-secondary/50">
          <tr>
            {selectable && <th scope="col" className="px-4 py-3"><span className="sr-only">Select</span></th>}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Quantity</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">
               <button type="button" onClick={() => onSort('location')} className="group flex items-center uppercase font-medium" aria-label="Sort by location">
                    Location
                    {renderSortArrow('location')}
                </button>
            </th>
            {showCategory && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden md:table-cell">
               <button type="button" onClick={() => onSort('category')} className="group flex items-center uppercase font-medium" aria-label="Sort by category">
                    Category
                    {renderSortArrow('category')}
                </button>
            </th>}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider hidden lg:table-cell">
                <button type="button" onClick={() => onSort('source')} className="group flex items-center uppercase font-medium" aria-label="Sort by source">
                    Source
                    {renderSortArrow('source')}
                </button>
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-color">
          {items.map((item) => {
            const isSelected = item.id in selectedItems;
            return (
              <tr 
                key={item.id} 
                onClick={() => onItemClick(item)}
                className={`transition-colors cursor-pointer ${isSelected ? 'bg-accent/10' : 'hover:bg-primary'}`}
              >
                {selectable && (
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded bg-primary border-border-color text-accent focus:ring-accent"
                      checked={isSelected}
                      onChange={(e) => handleCheckboxChange(e, item)}
                      aria-label={`Select ${item.name}`}
                    />
                  </td>
                )}
                <td className="px-6 py-4 align-top">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 mt-0.5">
                      {item.imageUrl ? (
                        <img className="h-10 w-10 rounded-md object-cover" src={item.imageUrl} alt={item.name} />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-primary border border-border-color flex items-center justify-center">
                            <CameraIcon className="h-5 w-5 text-text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-text-primary">{item.name}</div>
                      {item.description && (
                        <div className={`text-sm text-text-secondary max-w-xs ${showDescriptions ? '' : 'lg:hidden truncate'}`}>
                            {item.description}
                        </div>
                      )}
                      {item.specs && (
                        <div className="text-xs text-text-secondary mt-1 max-w-xs">
                            {Object.entries(item.specs).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                    <span className="font-semibold">{key}:</span>
                                    <span>{value}</span>
                                </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {selectable && isSelected ? (
                      <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="number"
                          value={selectedItems[item.id]}
                          onChange={(e) => handleQuantityChange(e, item)}
                          min="1"
                          max={item.quantity}
                          className="w-16 bg-primary border border-border-color rounded-md py-1 px-2 text-sm focus:ring-accent focus:border-accent"
                          onClick={(e) => e.stopPropagation()} // Prevent row click from unchecking
                          aria-label={`Quantity for ${item.name}`}
                        />
                        <span className="text-sm text-text-secondary">/ {item.quantity}</span>
                      </div>
                  ) : (
                    <div className="text-sm text-text-primary">
                      {item.quantity}
                      {item.allocatedQuantity && item.allocatedQuantity > 0 && (
                        <div className="text-xs text-yellow-400">
                          {item.allocatedQuantity} allocated
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-text-secondary">{item.location}</div>
                </td>
                {showCategory && <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                  <div className="text-sm text-text-secondary">{item.category || 'N/A'}</div>
                </td>}
                <td className="px-6 py-4 whitespace-nowrap hidden lg:table-cell">
                   <div className="text-sm text-text-secondary">{item.source || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-4">
                    {onPriceCheck && (
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); onPriceCheck(item); }} 
                        className="text-yellow-500 hover:text-yellow-400 transition-colors" 
                        aria-label={`Check prices for ${item.name}`}
                        title="Check current prices"
                      >
                        <PriceCheckIcon />
                      </button>
                    )}
                    <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="text-accent hover:text-blue-400 transition-colors" aria-label={`Edit ${item.name}`}>
                      <EditIcon />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="text-danger hover:text-red-400 transition-colors" aria-label={`Delete ${item.name}`}>
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;