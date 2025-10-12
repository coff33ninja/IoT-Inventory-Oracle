import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { suggestProjectCategory, enhanceProjectDescription } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

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
  const [longDescription, setLongDescription] = useState('');
  const [componentsText, setComponentsText] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
  const [isEnhancingDescription, setIsEnhancingDescription] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setName('');
        setDescription('');
        setLongDescription('');
        setComponentsText('');
        setCategory('');
        setDifficulty('Intermediate');
        setEstimatedTime('');
    }
  }, [isOpen]);

  const handleSuggestCategory = async () => {
    if (!name.trim()) {
        alert("Please enter a project name first.");
        return;
    }
    setIsSuggestingCategory(true);
    try {
        const suggestedCategory = await suggestProjectCategory(name, description);
        setCategory(suggestedCategory);
    } catch (error) {
        console.error('Failed to suggest category:', error);
        alert('Failed to suggest category. Please try again.');
    } finally {
        setIsSuggestingCategory(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (!name.trim()) {
        alert("Please enter a project name first.");
        return;
    }
    setIsEnhancingDescription(true);
    try {
        const enhancedDescription = await enhanceProjectDescription(name, longDescription || description);
        setLongDescription(enhancedDescription);
    } catch (error) {
        console.error('Failed to enhance description:', error);
        alert('Failed to enhance description. Please try again.');
    } finally {
        setIsEnhancingDescription(false);
    }
  };

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
        longDescription: longDescription || description,
        category: category || undefined,
        difficulty,
        estimatedTime: estimatedTime || undefined,
        components,
        instructions: undefined,
        updatedAt: new Date().toISOString(),
        status: 'Planning',
        progress: 0,
        notes: `Manually created on ${new Date().toLocaleDateString()}. ${category ? `Category: ${category}` : ''}`,
        tags: category ? [category] : undefined,
    };

    onSave(newProject);
    onClose();
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border-color transform transition-all duration-300 scale-95 animate-modal-enter">
        <div className="p-6">
          <div className="flex justify-between items-center pb-4 border-b border-border-color">
            <h3 className="text-xl font-semibold leading-6 text-text-primary">
              Create New Project
            </h3>
            <p className="text-sm text-text-secondary mt-1">Set up your IoT project with AI assistance</p>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary transition-colors"
              title="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg">
            <p className="text-sm text-text-primary">
              <span className="font-medium">💡 Pro Tip:</span> Use the AI assistance buttons to automatically generate categories, enhance descriptions, and get project suggestions!
            </p>
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
                <div className="flex justify-between items-center">
                    <label htmlFor="project-description" className="block text-sm font-medium text-text-secondary">Description</label>
                    <button type="button" onClick={handleEnhanceDescription} disabled={isEnhancingDescription || !name} className="text-xs text-accent hover:text-blue-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {isEnhancingDescription ? <><SpinnerIcon /> <span className="ml-1">Enhancing...</span></> : <><SparklesIcon /> <span className="ml-1">Enhance with AI</span></>}
                    </button>
                </div>
                <textarea 
                  id="project-description" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2} 
                  placeholder="A short description of the project's goals."
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
            </div>
            <div>
                <div className="flex justify-between items-center">
                    <label htmlFor="project-category" className="block text-sm font-medium text-text-secondary">Category</label>
                    <button type="button" onClick={handleSuggestCategory} disabled={isSuggestingCategory || !name} className="text-xs text-accent hover:text-blue-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSuggestingCategory ? <><SpinnerIcon /> <span className="ml-1">Suggesting...</span></> : <><SparklesIcon /> <span className="ml-1">Suggest with AI</span></>}
                    </button>
                </div>
                <input 
                  type="text" 
                  id="project-category" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Home Automation, Robotics, Sensors & Monitoring"
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" 
                />
            </div>
            <div>
                <div className="flex justify-between items-center">
                    <label htmlFor="project-long-description" className="block text-sm font-medium text-text-secondary">Detailed Description</label>
                    <button type="button" onClick={handleEnhanceDescription} disabled={isEnhancingDescription || !name} className="text-xs text-accent hover:text-blue-400 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {isEnhancingDescription ? <><SpinnerIcon /> <span className="ml-1">Enhancing...</span></> : <><SparklesIcon /> <span className="ml-1">Enhance with AI</span></>}
                    </button>
                </div>
                <textarea 
                  id="project-long-description" 
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  rows={4} 
                  placeholder="Detailed project description with goals, features, and technical details..."
                  className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="project-difficulty" className="block text-sm font-medium text-text-secondary">Difficulty Level</label>
                    <select 
                      id="project-difficulty" 
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')}
                      className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm"
                    >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="project-time" className="block text-sm font-medium text-text-secondary">Estimated Time</label>
                    <input 
                      type="text" 
                      id="project-time" 
                      value={estimatedTime}
                      onChange={(e) => setEstimatedTime(e.target.value)}
                      placeholder="e.g., 2-3 hours, 1 weekend, 1 week"
                      className="mt-1 block w-full bg-primary border border-border-color rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-accent focus:border-accent sm:text-sm" 
                    />
                </div>
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
