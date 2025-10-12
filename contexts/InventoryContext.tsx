import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { InventoryItem, Project, AiInsights, MarketDataItem } from '../types';
import apiClient from '../services/apiClient';

interface InventoryContextType {
  inventory: InventoryItem[];
  projects: Project[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  checkoutItems: (itemsToCheckout: {id: string; quantity: number}[]) => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>;
  updateProject: (updatedProject: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateItemIntelligence: (itemId: string, aiInsights: AiInsights, marketData: MarketDataItem[]) => Promise<void>;
  updateProjectComponents: (projectId: string, githubComponents: { name: string; quantity: number }[]) => Promise<void>;
  allocateInventoryItems: (allocations: { inventoryItemId: string; quantity: number; projectId: string; projectName: string }[]) => Promise<void>;
  deallocateInventoryItems: (projectId: string) => Promise<void>;
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

  const addItem = async (item: Omit<InventoryItem, 'id'>) => {
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

  const addProject = async (project: Omit<Project, 'id' | 'createdAt'>): Promise<Project> => {
    try {
      const newProject = await apiClient.addProject(project);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
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
      return newProject;
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

  const allocateInventoryItems = async (allocations: { inventoryItemId: string; quantity: number; projectId: string; projectName: string }[]) => {
    try {
      // Update inventory items with allocation info
      setInventory(prevInventory => {
        return prevInventory.map(item => {
          const allocation = allocations.find(a => a.inventoryItemId === item.id);
          if (allocation) {
            const currentAllocated = item.allocatedQuantity || 0;
            const newAllocated = currentAllocated + allocation.quantity;
            const usedInProjects = item.usedInProjects || [];
            
            // Check if project already exists in usedInProjects
            const existingProjectIndex = usedInProjects.findIndex(p => p.projectId === allocation.projectId);
            let updatedUsedInProjects;
            
            if (existingProjectIndex >= 0) {
              // Update existing project allocation
              updatedUsedInProjects = usedInProjects.map((p, index) => 
                index === existingProjectIndex 
                  ? { ...p, quantity: p.quantity + allocation.quantity }
                  : p
              );
            } else {
              // Add new project allocation
              updatedUsedInProjects = [...usedInProjects, {
                projectId: allocation.projectId,
                projectName: allocation.projectName,
                quantity: allocation.quantity
              }];
            }

            return {
              ...item,
              allocatedQuantity: newAllocated,
              availableQuantity: item.quantity - newAllocated,
              usedInProjects: updatedUsedInProjects
            };
          }
          return item;
        });
      });
    } catch (error) {
      console.error('Failed to allocate inventory items:', error);
    }
  };

  const deallocateInventoryItems = async (projectId: string) => {
    try {
      // Remove allocations for the specified project
      setInventory(prevInventory => {
        return prevInventory.map(item => {
          if (item.usedInProjects) {
            const projectAllocation = item.usedInProjects.find(p => p.projectId === projectId);
            if (projectAllocation) {
              const newAllocated = (item.allocatedQuantity || 0) - projectAllocation.quantity;
              const updatedUsedInProjects = item.usedInProjects.filter(p => p.projectId !== projectId);
              
              return {
                ...item,
                allocatedQuantity: Math.max(0, newAllocated),
                availableQuantity: item.quantity - Math.max(0, newAllocated),
                usedInProjects: updatedUsedInProjects
              };
            }
          }
          return item;
        });
      });
    } catch (error) {
      console.error('Failed to deallocate inventory items:', error);
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
      updateProjectComponents,
      allocateInventoryItems,
      deallocateInventoryItems
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