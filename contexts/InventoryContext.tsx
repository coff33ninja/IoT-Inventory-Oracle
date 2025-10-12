import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { InventoryItem, Project, AiInsights, MarketDataItem } from '../types';
import apiClient from '../services/apiClient';

interface InventoryContextType {
  inventory: InventoryItem[];
  projects: Project[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addItem: (item: InventoryItem) => Promise<void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  checkoutItems: (itemsToCheckout: {id: string; quantity: number}[]) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (updatedProject: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateItemIntelligence: (itemId: string, aiInsights: AiInsights, marketData: MarketDataItem[]) => Promise<void>;
  updateProjectComponents: (projectId: string, githubComponents: { name: string; quantity: number }[]) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load data from API on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load inventory from database via API
        const inventoryItems = await apiClient.getAllItems();
        setInventory(inventoryItems);
        
        // Load projects from markdown files via API
        const projectItems = await apiClient.getAllProjects();
        setProjects(projectItems);
        
      } catch (error) {
        console.error("Failed to load data from API:", error);
        // Fallback to localStorage if API is not available
        try {
          const savedInventory = localStorage.getItem('iot-inventory');
          if (savedInventory) {
            setInventory(JSON.parse(savedInventory));
          }

          const savedProjects = localStorage.getItem('iot-projects');
          if (savedProjects) {
            setProjects(JSON.parse(savedProjects));
          }
        } catch (fallbackError) {
          console.error("Fallback loading also failed:", fallbackError);
          setInventory([]);
          setProjects([]);
        }
      }
    };

    loadData();
  }, []);

  const addItem = async (item: InventoryItem) => {
    try {
      const newItem = await apiClient.addItem(item);
      setInventory(prev => [newItem, ...prev.filter(i => i.id !== newItem.id)]);
    } catch (error) {
      console.error('Failed to add item:', error);
      // Fallback to local state update
      setInventory(prev => [...prev, { ...item, id: new Date().toISOString() }]);
    }
  };

  const updateItem = async (updatedItem: InventoryItem) => {
    try {
      await apiClient.updateItem(updatedItem);
      setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    } catch (error) {
      console.error('Failed to update item:', error);
      // Still update the UI state for better UX
      setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await apiClient.deleteItem(id);
      setInventory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
      // Still update the UI state
      setInventory(prev => prev.filter(item => item.id !== id));
    }
  };

  const checkoutItems = async (itemsToCheckout: {id: string, quantity: number}[]) => {
    try {
      await apiClient.checkoutItems(itemsToCheckout);
      setInventory(prev => {
        const newInventory = [...prev];
        itemsToCheckout.forEach(checkoutItem => {
          const itemIndex = newInventory.findIndex(invItem => invItem.id === checkoutItem.id);
          if(itemIndex > -1) {
            newInventory[itemIndex].quantity -= checkoutItem.quantity;
          }
        });
        return newInventory;
      });
    } catch (error) {
      console.error('Failed to checkout items:', error);
      // Fallback to UI-only update
      setInventory(prev => {
        const newInventory = [...prev];
        itemsToCheckout.forEach(checkoutItem => {
          const itemIndex = newInventory.findIndex(invItem => invItem.id === checkoutItem.id);
          if(itemIndex > -1) {
            newInventory[itemIndex].quantity -= checkoutItem.quantity;
          }
        });
        return newInventory;
      });
    }
  };

  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const newProject = await apiClient.addProject(project);
      setProjects(prev => [newProject, ...prev]);
    } catch (error) {
      console.error('Failed to add project:', error);
      // Fallback to local state
      const newProject: Project = {
        ...project,
        id: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        components: project.components.map(c => ({ ...c, source: c.source || 'manual' })),
      };
      setProjects(prev => [newProject, ...prev]);
    }
  };

  const updateProject = async (updatedProject: Project) => {
    try {
      await apiClient.updateProject(updatedProject);
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    } catch (error) {
      console.error('Failed to update project:', error);
      // Still update UI state
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await apiClient.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete project:', error);
      // Still update UI state
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };
  
  const updateItemIntelligence = async (itemId: string, aiInsights: AiInsights, marketData: MarketDataItem[]) => {
    const updatedItem = inventory.find(item => item.id === itemId);
    if (updatedItem) {
      const itemWithIntelligence = {
        ...updatedItem,
        aiInsights,
        marketData,
        lastRefreshed: new Date().toISOString()
      };
      await updateItem(itemWithIntelligence);
    }
  };

  const updateProjectComponents = async (projectId: string, githubComponents: { name: string; quantity: number }[]) => {
    try {
      await apiClient.updateProjectComponents(projectId, githubComponents);
      // Refresh projects from API
      const updatedProjects = await apiClient.getAllProjects();
      setProjects(updatedProjects);
    } catch (error) {
      console.error('Failed to update project components:', error);
      // Fallback to local state update
      setProjects(prevProjects => {
        return prevProjects.map(p => {
          if (p.id === projectId) {
            const manualComponents = p.components.filter(c => c.source !== 'github');
            const newGithubComponents = githubComponents.map(gc => ({
              id: `${p.id}-gh-${gc.name.replace(/\s+/g, '-')}`,
              name: gc.name,
              quantity: gc.quantity,
              source: 'github' as const,
            }));
            return { ...p, components: [...manualComponents, ...newGithubComponents] };
          }
          return p;
        });
      });
    }
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
      deleteProject,
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