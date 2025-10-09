import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, ItemStatus } from '../types';
import { generateDescription, suggestCategory } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { CameraIcon } from './icons/CameraIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  itemToEdit?: InventoryItem;
  inventory: InventoryItem[];
}

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onSave, itemToEdit, inventory }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [container, setContainer] = useState('');
  const [compartment, setCompartment] = useState('');
  const [status, setStatus] = useState<ItemStatus>(ItemStatus.HAVE);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);

  const uniqueContainers = useMemo(() => {
    const containers = new Set<string>();
    inventory.forEach(item => {
        const [containerName] = item.location.split(' - ');
        if (containerName) containers.add(containerName.trim());
    });
    return Array.from(containers);
  }, [inventory]);

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setQuantity(itemToEdit.quantity);
      const [cont, comp = ''] = itemToEdit.location.split(' - ').map(s => s.trim());
      setContainer(cont || '');
      setCompartment(comp || '');
      setStatus(itemToEdit.status);
      setCategory(itemToEdit.category || '');
      setDescription(itemToEdit.description || '');
      setSource(itemToEdit.source || '');
      setImageUrl(itemToEdit.imageUrl);
    } else {
      // Reset form
      setName('');
      setQuantity(1);
      setContainer('');
      setCompartment('');
      setStatus(ItemStatus.HAVE);
      setCategory('');
      setDescription('');
      setSource('');
      setImageUrl(undefined);
    }
  }, [itemToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const location = compartment ? `${container.trim()} - ${compartment.trim()}` : container.trim();
    onSave({
      id: itemToEdit?.id || '',
      name,
      quantity,
      location,
      status,
      category,
      description,
      source,
      imageUrl,
      createdAt: itemToEdit?.createdAt || new Date().toISOString(),
    });
    onClose();
  };
  
  const handleGenerateDescription = async () => {
    if (!name) {
        alert("Please enter an item name first.");
        return;
    }
    setIsGenerating(true);
    try {
        const generatedDesc = await generateDescription(name);
        setDescription(generatedDesc);
    } catch (error) {
        console.error("Failed to generate description:", error);
        alert("Sorry, there was an error generating the description.");
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleSuggestCategory = async () => {
    if (!name) {
        alert("Please enter an item name first.");
        return;
    }
    setIsSuggestingCategory(true);
    try {
        const suggestedCategory = await suggestCategory(name);
        setCategory(suggestedCategory);
    } catch (error) {
        console.error("Failed to suggest category:", error);
        alert("Sorry, there was an error suggesting a category.");
    } finally {
        setIsSuggestingCategory(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary rounded-lg shadow-xl w-full max-w-md border border-border-color transform transition-all duration-300 scale-95 animate-modal-enter">
        <div className="p-6">
          <div className="flex justify-between items-center pb-4 border-b border-border-color">
            <h3 className="text-lg font-medium leading-6 text-text-primary">
              {itemToEdit ? 'Edit Item' : 'Add New Item'}
            </h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium text-text-secondary">Quantity</label>
                  <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="0" required className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
                </div>
                 <div>
                  <label htmlFor="status" className="block text-sm font-medium text-text-secondary">Status</label>
                  <select id="status" value={status} onChange={(e) => setStatus(e.target.value as ItemStatus)} className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm">
                    {Object.values(ItemStatus).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
            </div>
             <div>
                <div className="flex justify-between items-center">
                    <label htmlFor="category" className="block text-sm font-medium text-text-secondary">Category</label>
                    <button type="button" onClick={handleSuggestCategory} disabled={isSuggestingCategory || !name} className="text-xs text-accent hover:text-blue-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSuggestingCategory ? <><SpinnerIcon /> <span className="ml-1">Suggesting...</span></> : <><SparklesIcon /> <span className="ml-1">Suggest with AI</span></>}
                    </button>
                </div>
                <input type="text" id="category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Sensor" className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="container" className="block text-sm font-medium text-text-secondary">Storage Container</label>
                  <input 
                    type="text" 
                    id="container" 
                    value={container} 
                    onChange={(e) => setContainer(e.target.value)} 
                    required 
                    list="containers-list"
                    placeholder="e.g. Component Box A"
                    className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
                    <datalist id="containers-list">
                        {uniqueContainers.map(c => <option key={c} value={c} />)}
                    </datalist>
                </div>
                 <div>
                  <label htmlFor="compartment" className="block text-sm font-medium text-text-secondary">Compartment / Slot</label>
                  <input type="text" id="compartment" value={compartment} onChange={(e) => setCompartment(e.target.value)} placeholder="e.g. B2" className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
                </div>
            </div>
             <div>
              <label htmlFor="source" className="block text-sm font-medium text-text-secondary">Source / Origin</label>
              <input type="text" id="source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Adafruit, Salvaged" className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
            </div>
             <div>
                <div className="flex justify-between items-center">
                    <label htmlFor="description" className="block text-sm font-medium text-text-secondary">Description</label>
                    <button type="button" onClick={handleGenerateDescription} disabled={isGenerating || !name} className="text-xs text-accent hover:text-blue-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {isGenerating ? <><SpinnerIcon /> <span className="ml-1">Generating...</span></> : <><SparklesIcon /> <span className="ml-1">Generate with AI</span></>}
                    </button>
                </div>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
            </div>
            <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Item Image</label>
                <div className="flex items-center space-x-4">
                     {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-border-color" />
                    ) : (
                        <div className="h-16 w-16 rounded-lg bg-primary border border-border-color flex items-center justify-center">
                            <CameraIcon className="h-8 w-8 text-text-secondary" />
                        </div>
                    )}
                    <label className="cursor-pointer bg-primary border border-border-color py-2 px-3 rounded-md text-sm font-medium text-text-primary hover:bg-secondary transition-colors">
                        Upload Image
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                </div>
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="bg-secondary border border-border-color py-2 px-4 rounded-md text-sm font-medium text-text-primary hover:bg-primary transition-colors">Cancel</button>
              <button type="submit" className="bg-accent hover:bg-blue-600 py-2 px-4 rounded-md text-sm font-medium text-white transition-colors">Save</button>
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

export default AddItemModal;