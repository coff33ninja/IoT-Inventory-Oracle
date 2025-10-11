import React, { useState, useMemo } from 'react';
import { InventoryItem, Project } from '../types';

interface SmartSearchProps {
  inventory: InventoryItem[];
  projects: Project[];
  onItemSelect: (item: InventoryItem) => void;
  onProjectSelect: (project: Project) => void;
}

const SmartSearch: React.FC<SmartSearchProps> = ({ 
  inventory, 
  projects, 
  onItemSelect, 
  onProjectSelect 
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!query.trim()) return { items: [], projects: [] };

    const lowerQuery = query.toLowerCase();
    
    const items = inventory.filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.category?.toLowerCase().includes(lowerQuery) ||
      item.description?.toLowerCase().includes(lowerQuery)
    ).slice(0, 5);

    const matchingProjects = projects.filter(project =>
      project.name.toLowerCase().includes(lowerQuery) ||
      project.description.toLowerCase().includes(lowerQuery) ||
      project.components.some(comp => comp.name.toLowerCase().includes(lowerQuery))
    ).slice(0, 3);

    return { items, projects: matchingProjects };
  }, [query, inventory, projects]);

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder="Search components, projects, or categories..."
        className="w-full px-4 py-2 bg-secondary border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
      />
      
      {isOpen && (searchResults.items.length > 0 || searchResults.projects.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-secondary border border-border-color rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {searchResults.items.length > 0 && (
            <div className="p-2">
              <h3 className="text-sm font-semibold text-text-secondary mb-2">Components</h3>
              {searchResults.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onItemSelect(item);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-left p-2 hover:bg-primary rounded flex items-center gap-3"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-text-secondary">
                      {item.category} • {item.status} • Qty: {item.quantity}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {searchResults.projects.length > 0 && (
            <div className="p-2 border-t border-border-color">
              <h3 className="text-sm font-semibold text-text-secondary mb-2">Projects</h3>
              {searchResults.projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectSelect(project);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full text-left p-2 hover:bg-primary rounded"
                >
                  <div className="font-medium">{project.name}</div>
                  <div className="text-sm text-text-secondary">
                    {project.status} • {project.components.length} components
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;