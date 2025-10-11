import React, { useState, useEffect } from 'react';
import { Project } from '../types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'createdAt'>) => void;
}

const parseComponents = (text: string): { id: string, name: string; quantity: number, source: 'manual' }[] => {
    if (!text.trim()) return [];
    
    return text.split('\n')
        .map(line => line.trim())
        .filter(line => line)
        .map(line => {
            const match = line.match(/^(?:(\d+)\s*[xX]?\s*)?(.+)/);
            if (!match) return null;
            
            const quantity = parseInt(match[1] || '1', 10);
            const name = match[2].trim();
            
            return {
                id: `manual-${Date.now()}-${name.replace(/\s/g, "")}`,
                name,
                quantity: isNaN(quantity) ? 1 : quantity,
                source: 'manual' as const,
            };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null);
};

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [componentsText, setComponentsText] = useState('');

  useEffect(() => {
    if (isOpen) {
        setName('');
        setDescription('');
        setComponentsText('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        alert('Project Name is required.');
        return;
    }
    
    const components = parseComponents(componentsText);

    const newProject: Omit<Project, 'id' | 'createdAt'> = {
        name,
        description,
        components,
        status: 'In Progress',
        notes: `Manually created on ${new Date().toLocaleDateString()}.`,
    };

    onSave(newProject);
    onClose();
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary rounded-lg shadow-xl w-full max-w-lg border border-border-color transform transition-all duration-300 scale-95 animate-modal-enter">
        <div className="p-6">
          <div className="flex justify-between items-center pb-4 border-b border-border-color">
            <h3 className="text-lg font-medium leading-6 text-text-primary">
              Create New Project
            </h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-text-secondary">Project Name</label>
              <input 
                type="text" 
                id="project-name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Automated Plant Watering System"
                className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" 
              />
            </div>
             <div>
                <label htmlFor="project-description" className="block text-sm font-medium text-text-secondary">Description</label>
                <textarea 
                  id="project-description" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2} 
                  placeholder="A short description of the project's goals."
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
            </div>
             <div>
                <label htmlFor="project-components" className="block text-sm font-medium text-text-secondary">Initial Components</label>
                <textarea 
                  id="project-components" 
                  value={componentsText}
                  onChange={(e) => setComponentsText(e.target.value)}
                  rows={4} 
                  placeholder={"List one component per line.\ne.g.,\n2 x ESP32\n1 BME280 Sensor\nRed LED"}
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm font-mono" />
            </div>
            <div className="pt-4 flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="bg-secondary border border-border-color py-2 px-4 rounded-md text-sm font-medium text-text-primary hover:bg-primary transition-colors">Cancel</button>
              <button type="submit" className="bg-accent hover:bg-blue-600 py-2 px-4 rounded-md text-sm font-medium text-white transition-colors">Create Project</button>
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

export default AddProjectModal;
