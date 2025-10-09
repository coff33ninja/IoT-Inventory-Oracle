import React, { useState } from 'react';
import { InventoryItem } from '../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (purpose: string) => void;
  selectedItems: (InventoryItem & { quantity: number })[];
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onConfirm, selectedItems }) => {
  const [purpose, setPurpose] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (purpose.trim()) {
      onConfirm(purpose);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary rounded-lg shadow-xl w-full max-w-lg border border-border-color transform transition-all duration-300 scale-95 animate-modal-enter">
        <div className="p-6">
          <div className="flex justify-between items-center pb-4 border-b border-border-color">
            <h3 className="text-lg font-medium leading-6 text-text-primary">
              Start New Project
            </h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="mt-6">
            <h4 className="font-semibold text-text-primary mb-2">Components to be used:</h4>
            <div className="max-h-40 overflow-y-auto bg-primary rounded-md border border-border-color p-2 space-y-2 mb-4">
              {selectedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-text-primary">{item.name}</span>
                  <span className="font-mono bg-secondary px-2 py-1 rounded-md text-text-secondary">Qty: {item.quantity}</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="purpose" className="block text-sm font-medium text-text-secondary">What is the project's name or goal?</label>
                <textarea 
                  id="purpose" 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={3} 
                  required
                  placeholder="e.g., Automated Plant Watering System"
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
              </div>
              <div className="pt-6 flex justify-end space-x-3">
                <button type="button" onClick={onClose} className="bg-secondary border border-border-color py-2 px-4 rounded-md text-sm font-medium text-text-primary hover:bg-primary transition-colors">Cancel</button>
                <button type="submit" className="bg-accent hover:bg-blue-600 py-2 px-4 rounded-md text-sm font-medium text-white transition-colors">Create Project</button>
              </div>
            </form>
          </div>
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

export default CheckoutModal;
