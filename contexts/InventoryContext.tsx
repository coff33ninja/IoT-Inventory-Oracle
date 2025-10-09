import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { InventoryItem, Project, AiInsights, MarketDataItem } from '../types';

interface InventoryContextType {
  inventory: InventoryItem[];
  projects: Project[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addItem: (item: InventoryItem) => void;
  updateItem: (item: InventoryItem) => void;
  deleteItem: (id: string) => void;
  checkoutItems: (itemsToCheckout: {id: string; quantity: number}[]) => void;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (updatedProject: Project) => void;
  updateItemIntelligence: (itemId: string, aiInsights: AiInsights, marketData: MarketDataItem[]) => void;
  updateProjectComponents: (projectId: string, githubComponents: { name: string; quantity: number }[]) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load data from localStorage or mock JSON on initial render
  useEffect(() => {
    const loadData = async () => {
      // Load Inventory
      try {
        const savedInventory = localStorage.getItem('iot-inventory');
        if (savedInventory) {
          setInventory(JSON.parse(savedInventory));
        } else {
          // Fetch from mock JSON file if localStorage is empty
          const response = await fetch('/mock-inventory.json');
          if (!response.ok) throw new Error('Network response was not ok');
          const mockData = await response.json();
          setInventory(mockData);
        }
      } catch (error) {
        console.error("Failed to load inventory data:", error);
        setInventory([]); // Fallback to empty array on error
      }

      // Load Projects
      try {
        const savedProjects = localStorage.getItem('iot-projects');
        if (savedProjects) {
          setProjects(JSON.parse(savedProjects));
        }
      } catch (error) {
        console.error("Failed to parse projects from localStorage", error);
        setProjects([]);
      }
    };

    loadData();
  }, []);

  // Save inventory to localStorage whenever it changes
  useEffect(() => {
    // Do not save the initial empty array before data is loaded
    if (inventory.length > 0) {
      localStorage.setItem('iot-inventory', JSON.stringify(inventory));
    }
  }, [inventory]);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
        localStorage.setItem('iot-projects', JSON.stringify(projects));
    }
  }, [projects]);


  const addItem = (item: InventoryItem) => {
    setInventory(prev => [...prev, { ...item, id: new Date().toISOString() }]);
  };

  const updateItem = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const deleteItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
  };

  const checkoutItems = (itemsToCheckout: {id: string, quantity: number}[]) => {
    setInventory(prev => {
        const newInventory = [...prev];
        itemsToCheckout.forEach(checkoutItem => {
            const itemIndex = newInventory.findIndex(invItem => invItem.id === checkoutItem.id);
            if(itemIndex > -1) {
                newInventory[itemIndex].quantity -= checkoutItem.quantity;
            }
        });
        return newInventory;
    })
  };

  const addProject = (project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      components: project.components.map(c => ({ ...c, source: 'manual' })),
    };
    setProjects(prev => [newProject, ...prev]);
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
  };
  
  const updateItemIntelligence = (itemId: string, aiInsights: AiInsights, marketData: MarketDataItem[]) => {
    setInventory(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, aiInsights, marketData, lastRefreshed: new Date().toISOString() } 
        : item
    ));
  };

  const updateProjectComponents = (projectId: string, githubComponents: { name: string; quantity: number }[]) => {
    setProjects(prevProjects => {
        return prevProjects.map(p => {
            if (p.id === projectId) {
                // Filter out old github components
                const manualComponents = p.components.filter(c => c.source !== 'github');
                // Create new github components
                const newGithubComponents = githubComponents.map(gc => ({
                    id: `${p.id}-gh-${gc.name.replace(/\s+/g, '-')}`, // generate a semi-stable ID
                    name: gc.name,
                    quantity: gc.quantity,
                    source: 'github' as const,
                }));
                return { ...p, components: [...manualComponents, ...newGithubComponents] };
            }
            return p;
        });
    });
  };

  return (
    <InventoryContext.Provider value={{ 
      inventory, 
      projects, 
      setInventory, 
      addItem, 
      updateItem, 
      deleteItem, 
      checkoutItems,
      addProject,
      updateProject,
      updateItemIntelligence,
      updateProjectComponents
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
