import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import { 
  InventoryItem, 
  Project, 
  AiInsights, 
  MarketDataItem,
  ComponentAlternative,
  ComponentPrediction,
  ComponentSuggestion,
  PersonalizedRecommendation,
  CompatibilityAnalysis,
  UsageAnalytics,
  StockPrediction,
  SpendingAnalysis,
  ProjectPattern,
  UserPreferences,
  BudgetStatus,
  SpendingForecast,
  ProjectROI,
  BudgetOptimization,
  BudgetNotification,
  BudgetThreshold,
  BudgetMonitoringConfig,
  BudgetHealthSummary,
  ProjectCostBreakdown,
  ProjectBudgetPlan,
  CostOptimizationSuggestion
} from "../types";
import { RecommendationPreferences } from "../components/RecommendationSettingsPanel";
import apiClient from "../services/apiClient";
import AnalyticsService from "../services/analyticsService";
import BudgetService from "../services/budgetService";
import BudgetNotificationService from "../services/budgetNotificationService";
import ProjectCostService from "../services/projectCostService";

interface InventoryContextType {
  inventory: InventoryItem[];
  projects: Project[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  addItem: (item: Omit<InventoryItem, "id">) => Promise<void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  checkoutItems: (
    itemsToCheckout: { id: string; quantity: number }[]
  ) => Promise<void>;
  addProject: (project: Omit<Project, "id" | "createdAt">) => Promise<Project>;
  updateProject: (updatedProject: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  updateItemIntelligence: (
    itemId: string,
    aiInsights: AiInsights,
    marketData: MarketDataItem[]
  ) => Promise<void>;
  updateProjectComponents: (
    projectId: string,
    githubComponents: { name: string; quantity: number }[]
  ) => Promise<void>;
  allocateInventoryItems: (
    allocations: {
      inventoryItemId: string;
      quantity: number;
      projectId: string;
      projectName: string;
    }[]
  ) => Promise<void>;
  deallocateInventoryItems: (projectId: string) => Promise<void>;
  
  // Recommendation data and methods
  componentAlternatives: Map<string, ComponentAlternative[]>;
  componentPredictions: Map<string, ComponentPrediction[]>;
  personalizedRecommendations: PersonalizedRecommendation[];
  usageAnalytics: UsageAnalytics | null;
  stockPredictions: Map<string, StockPrediction>;
  spendingAnalysis: SpendingAnalysis | null;
  projectPatterns: ProjectPattern[];
  userPreferences: RecommendationPreferences | null;
  
  // Recommendation methods
  getComponentAlternatives: (
    componentId: string,
    context?: { projectId?: string; projectType?: string; budget?: number }
  ) => Promise<ComponentAlternative[]>;
  getComponentPredictions: (projectId: string) => Promise<ComponentPrediction[]>;
  getProjectSuggestions: (
    projectType: string,
    userPreferences?: RecommendationPreferences
  ) => Promise<ComponentSuggestion[]>;
  analyzeComponentCompatibility: (componentIds: string[]) => Promise<CompatibilityAnalysis>;
  getPersonalizedRecommendations: (userId: string) => Promise<PersonalizedRecommendation[]>;
  
  // Analytics methods
  getUsagePatterns: (timeframe?: string) => Promise<UsageAnalytics>;
  getStockPrediction: (componentId: string) => Promise<StockPrediction>;
  getSpendingInsights: (timeframe?: string) => Promise<SpendingAnalysis>;
  getProjectPatterns: (userId: string) => Promise<ProjectPattern[]>;
  
  // Budget tracking methods
  getBudgetStatus: (budgetLimits?: { [category: string]: number }, totalBudgetLimit?: number) => BudgetStatus;
  getSpendingForecast: (forecastPeriodDays?: number) => SpendingForecast;
  getProjectROI: (projectId: string) => ProjectROI | null;
  getBudgetOptimization: (budgetConstraints?: {
    totalBudget?: number;
    categoryLimits?: { [category: string]: number };
    timeframe?: number;
  }) => BudgetOptimization;
  
  // Budget notification methods
  getBudgetNotifications: () => BudgetNotification[];
  getUnreadNotificationCount: () => number;
  markNotificationAsRead: (notificationId: string) => void;
  dismissNotification: (notificationId: string) => void;
  setBudgetThreshold: (threshold: BudgetThreshold) => void;
  getBudgetThresholds: () => BudgetThreshold[];
  updateNotificationConfig: (config: Partial<BudgetMonitoringConfig>) => void;
  getNotificationConfig: () => BudgetMonitoringConfig;
  getBudgetHealthSummary: (budgetLimits?: { [category: string]: number }, totalBudgetLimit?: number) => BudgetHealthSummary;
  
  // Project cost calculation methods
  getProjectCostBreakdown: (projectId: string, budgetLimit?: number) => ProjectCostBreakdown | null;
  createProjectBudgetPlan: (projectId: string, plannedBudget: number, contingencyPercentage?: number) => ProjectBudgetPlan | null;
  getProjectOptimizationSuggestions: (projectId: string) => CostOptimizationSuggestion | null;
  calculateMultiProjectCosts: () => {
    totalCost: number;
    projectCosts: Array<{ projectId: string; projectName: string; cost: number }>;
    categoryBreakdown: Array<{ category: string; totalCost: number; projectCount: number }>;
    optimizationOpportunities: number;
  };
  
  // User preferences
  getUserPreferences: (userId: string) => Promise<RecommendationPreferences>;
  updateUserPreferences: (userId: string, preferences: RecommendationPreferences) => Promise<void>;
  
  // Real-time updates
  refreshRecommendations: (componentId?: string) => Promise<void>;
  subscribeToRecommendationUpdates: (callback: (data: any) => void) => () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(
  undefined
);

export const InventoryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Recommendation state
  const [componentAlternatives, setComponentAlternatives] = useState<Map<string, ComponentAlternative[]>>(new Map());
  const [componentPredictions, setComponentPredictions] = useState<Map<string, ComponentPrediction[]>>(new Map());
  const [personalizedRecommendations, setPersonalizedRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [usageAnalytics, setUsageAnalytics] = useState<UsageAnalytics | null>(null);
  const [stockPredictions, setStockPredictions] = useState<Map<string, StockPrediction>>(new Map());
  const [spendingAnalysis, setSpendingAnalysis] = useState<SpendingAnalysis | null>(null);
  const [projectPatterns, setProjectPatterns] = useState<ProjectPattern[]>([]);
  const [userPreferences, setUserPreferences] = useState<RecommendationPreferences | null>(null);
  
  // Real-time update subscribers
  const [updateSubscribers, setUpdateSubscribers] = useState<Set<(data: any) => void>>(new Set());

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

        // Load initial recommendation data
        await loadInitialRecommendationData();
      } catch (error) {
        console.error("Failed to load data from API:", error);
        // Fallback to localStorage if API is not available
        try {
          const savedInventory = localStorage.getItem("iot-inventory");
          if (savedInventory) {
            setInventory(JSON.parse(savedInventory));
          }

          const savedProjects = localStorage.getItem("iot-projects");
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

  // Load initial recommendation data
  const loadInitialRecommendationData = async () => {
    try {
      // Load usage analytics from real data
      const analytics = AnalyticsService.calculateUsageAnalytics(inventory, projects);
      setUsageAnalytics(analytics);

      // Load spending analysis from real data
      const spending = BudgetService.calculateSpendingAnalysis(inventory, projects);
      setSpendingAnalysis(spending);

      // Load project patterns (using a default user ID for now)
      const patterns = await apiClient.getProjectPatterns('default-user');
      setProjectPatterns(patterns);

      // Load user preferences (using a default user ID for now)
      try {
        const preferences = await apiClient.getUserPreferences('default-user');
        setUserPreferences(preferences);
      } catch (error) {
        // User preferences might not exist yet, which is fine
        console.log("No user preferences found, will use defaults");
      }
    } catch (error) {
      console.error("Failed to load recommendation data:", error);
    }
  };



  const addItem = async (item: Omit<InventoryItem, "id">) => {
    try {
      const newItem = await apiClient.addItem(item);
      setInventory((prev) => [
        newItem,
        ...prev.filter((i) => i.id !== newItem.id),
      ]);
      
      // Refresh recommendations for the new item
      await refreshRecommendations(newItem.id);
    } catch (error) {
      console.error("Failed to add item:", error);
      // Fallback to local state update
      const fallbackItem = { ...item, id: new Date().toISOString() };
      setInventory((prev) => [...prev, fallbackItem]);
      
      // Still try to refresh recommendations
      await refreshRecommendations(fallbackItem.id);
    }
  };

  const updateItem = async (updatedItem: InventoryItem) => {
    try {
      await apiClient.updateItem(updatedItem);
      setInventory((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
      
      // Refresh recommendations for the updated item
      await refreshRecommendations(updatedItem.id);
    } catch (error) {
      console.error("Failed to update item:", error);
      // Still update the UI state for better UX
      setInventory((prev) =>
        prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
      );
      
      // Still try to refresh recommendations
      await refreshRecommendations(updatedItem.id);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await apiClient.deleteItem(id);
      setInventory((prev) => prev.filter((item) => item.id !== id));
      
      // Clear recommendations for the deleted item
      setComponentAlternatives(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      setStockPredictions(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      
      // Notify subscribers
      notifySubscribers({ type: 'item_deleted', componentId: id });
    } catch (error) {
      console.error("Failed to delete item:", error);
      // Still update the UI state
      setInventory((prev) => prev.filter((item) => item.id !== id));
      
      // Still clear recommendations
      setComponentAlternatives(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      setStockPredictions(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      
      notifySubscribers({ type: 'item_deleted', componentId: id });
    }
  };

  const checkoutItems = async (
    itemsToCheckout: { id: string; quantity: number }[]
  ) => {
    try {
      await apiClient.checkoutItems(itemsToCheckout);
      setInventory((prev) => {
        const newInventory = [...prev];
        itemsToCheckout.forEach((checkoutItem) => {
          const itemIndex = newInventory.findIndex(
            (invItem) => invItem.id === checkoutItem.id
          );
          if (itemIndex > -1) {
            newInventory[itemIndex].quantity -= checkoutItem.quantity;
          }
        });
        return newInventory;
      });
    } catch (error) {
      console.error("Failed to checkout items:", error);
      // Fallback to UI-only update
      setInventory((prev) => {
        const newInventory = [...prev];
        itemsToCheckout.forEach((checkoutItem) => {
          const itemIndex = newInventory.findIndex(
            (invItem) => invItem.id === checkoutItem.id
          );
          if (itemIndex > -1) {
            newInventory[itemIndex].quantity -= checkoutItem.quantity;
          }
        });
        return newInventory;
      });
    }
  };

  const addProject = async (
    project: Omit<Project, "id" | "createdAt">
  ): Promise<Project> => {
    try {
      const newProject = await apiClient.addProject(project);
      setProjects((prev) => [newProject, ...prev]);
      
      // Refresh analytics and patterns after adding a project
      await loadInitialRecommendationData();
      
      return newProject;
    } catch (error) {
      console.error("Failed to add project:", error);
      // Fallback to local state
      const newProject: Project = {
        ...project,
        id: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        components: project.components.map((c) => ({
          ...c,
          source: c.source || "manual",
        })),
      };
      setProjects((prev) => [newProject, ...prev]);
      
      // Still try to refresh analytics
      await loadInitialRecommendationData();
      
      return newProject;
    }
  };

  const updateProject = async (updatedProject: Project) => {
    try {
      await apiClient.updateProject(updatedProject);
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
      );
      
      // Clear cached predictions for this project and refresh analytics
      setComponentPredictions(prev => {
        const newMap = new Map(prev);
        newMap.delete(updatedProject.id);
        return newMap;
      });
      
      // Refresh analytics if project status changed to completed
      if (updatedProject.status === 'Completed') {
        await loadInitialRecommendationData();
      }
      
      // Notify subscribers
      notifySubscribers({ type: 'project_updated', projectId: updatedProject.id, data: updatedProject });
    } catch (error) {
      console.error("Failed to update project:", error);
      // Still update UI state
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
      );
      
      // Still clear cached predictions
      setComponentPredictions(prev => {
        const newMap = new Map(prev);
        newMap.delete(updatedProject.id);
        return newMap;
      });
      
      notifySubscribers({ type: 'project_updated', projectId: updatedProject.id, data: updatedProject });
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await apiClient.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      
      // Clear cached predictions for this project
      setComponentPredictions(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      
      // Refresh analytics after project deletion
      await loadInitialRecommendationData();
      
      // Notify subscribers
      notifySubscribers({ type: 'project_deleted', projectId: id });
    } catch (error) {
      console.error("Failed to delete project:", error);
      // Still update UI state
      setProjects((prev) => prev.filter((p) => p.id !== id));
      
      // Still clear cached predictions
      setComponentPredictions(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });
      
      notifySubscribers({ type: 'project_deleted', projectId: id });
    }
  };

  const updateItemIntelligence = async (
    itemId: string,
    aiInsights: AiInsights,
    marketData: MarketDataItem[]
  ) => {
    const updatedItem = inventory.find((item) => item.id === itemId);
    if (updatedItem) {
      const itemWithIntelligence = {
        ...updatedItem,
        aiInsights,
        marketData,
        lastRefreshed: new Date().toISOString(),
      };
      await updateItem(itemWithIntelligence);
    }
  };

  const updateProjectComponents = async (
    projectId: string,
    githubComponents: { name: string; quantity: number }[]
  ) => {
    try {
      await apiClient.updateProjectComponents(projectId, githubComponents);
      // Refresh projects from API
      const updatedProjects = await apiClient.getAllProjects();
      setProjects(updatedProjects);
    } catch (error) {
      console.error("Failed to update project components:", error);
      // Fallback to local state update
      setProjects((prevProjects) => {
        return prevProjects.map((p) => {
          if (p.id === projectId) {
            const manualComponents = p.components.filter(
              (c) => c.source !== "github"
            );
            const newGithubComponents = githubComponents.map((gc) => ({
              id: `${p.id}-gh-${gc.name.replace(/\s+/g, "-")}`,
              name: gc.name,
              quantity: gc.quantity,
              source: "github" as const,
            }));
            return {
              ...p,
              components: [...manualComponents, ...newGithubComponents],
            };
          }
          return p;
        });
      });
    }
  };

  const allocateInventoryItems = async (
    allocations: {
      inventoryItemId: string;
      quantity: number;
      projectId: string;
      projectName: string;
    }[]
  ) => {
    try {
      // Update inventory items with allocation info
      setInventory((prevInventory) => {
        return prevInventory.map((item) => {
          const allocation = allocations.find(
            (a) => a.inventoryItemId === item.id
          );
          if (allocation) {
            const currentAllocated = item.allocatedQuantity || 0;
            const newAllocated = currentAllocated + allocation.quantity;
            const usedInProjects = item.usedInProjects || [];

            // Check if project already exists in usedInProjects
            const existingProjectIndex = usedInProjects.findIndex(
              (p) => p.projectId === allocation.projectId
            );
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
              updatedUsedInProjects = [
                ...usedInProjects,
                {
                  projectId: allocation.projectId,
                  projectName: allocation.projectName,
                  quantity: allocation.quantity,
                },
              ];
            }

            return {
              ...item,
              allocatedQuantity: newAllocated,
              availableQuantity: item.quantity - newAllocated,
              usedInProjects: updatedUsedInProjects,
            };
          }
          return item;
        });
      });
    } catch (error) {
      console.error("Failed to allocate inventory items:", error);
    }
  };

  const deallocateInventoryItems = async (projectId: string) => {
    try {
      // Remove allocations for the specified project
      setInventory((prevInventory) => {
        return prevInventory.map((item) => {
          if (item.usedInProjects) {
            const projectAllocation = item.usedInProjects.find(
              (p) => p.projectId === projectId
            );
            if (projectAllocation) {
              const newAllocated =
                (item.allocatedQuantity || 0) - projectAllocation.quantity;
              const updatedUsedInProjects = item.usedInProjects.filter(
                (p) => p.projectId !== projectId
              );

              return {
                ...item,
                allocatedQuantity: Math.max(0, newAllocated),
                availableQuantity: item.quantity - Math.max(0, newAllocated),
                usedInProjects: updatedUsedInProjects,
              };
            }
          }
          return item;
        });
      });
    } catch (error) {
      console.error("Failed to deallocate inventory items:", error);
    }
  };

  // Recommendation methods
  const getComponentAlternatives = async (
    componentId: string,
    context?: { projectId?: string; projectType?: string; budget?: number }
  ): Promise<ComponentAlternative[]> => {
    try {
      // Check cache first
      const cached = componentAlternatives.get(componentId);
      if (cached && cached.length > 0) {
        return cached;
      }

      // Fetch from API
      const alternatives = await apiClient.getComponentAlternatives(componentId, context);
      
      // Update cache
      setComponentAlternatives(prev => new Map(prev.set(componentId, alternatives)));
      
      // Notify subscribers
      notifySubscribers({ type: 'alternatives', componentId, data: alternatives });
      
      return alternatives;
    } catch (error) {
      console.error("Failed to get component alternatives:", error);
      return [];
    }
  };

  const getComponentPredictions = async (projectId: string): Promise<ComponentPrediction[]> => {
    try {
      // Check cache first
      const cached = componentPredictions.get(projectId);
      if (cached && cached.length > 0) {
        return cached;
      }

      // Fetch from API
      const predictions = await apiClient.getComponentPredictions(projectId);
      
      // Update cache
      setComponentPredictions(prev => new Map(prev.set(projectId, predictions)));
      
      // Notify subscribers
      notifySubscribers({ type: 'predictions', projectId, data: predictions });
      
      return predictions;
    } catch (error) {
      console.error("Failed to get component predictions:", error);
      return [];
    }
  };

  const getProjectSuggestions = async (
    projectType: string,
    userPrefs?: RecommendationPreferences
  ): Promise<ComponentSuggestion[]> => {
    try {
      const preferences = userPrefs || userPreferences || undefined;
      const suggestions = await apiClient.getProjectSuggestions(projectType, preferences);
      
      // Notify subscribers
      notifySubscribers({ type: 'project_suggestions', projectType, data: suggestions });
      
      return suggestions;
    } catch (error) {
      console.error("Failed to get project suggestions:", error);
      return [];
    }
  };

  const analyzeComponentCompatibility = async (componentIds: string[]): Promise<CompatibilityAnalysis> => {
    try {
      const analysis = await apiClient.analyzeComponentCompatibility(componentIds);
      
      // Notify subscribers
      notifySubscribers({ type: 'compatibility', componentIds, data: analysis });
      
      return analysis;
    } catch (error) {
      console.error("Failed to analyze component compatibility:", error);
      return {
        overallCompatibility: 0,
        issues: [],
        suggestions: [],
        requiredModifications: []
      };
    }
  };

  const getPersonalizedRecommendations = async (userId: string): Promise<PersonalizedRecommendation[]> => {
    try {
      const recommendations = await apiClient.getPersonalizedRecommendations(userId);
      setPersonalizedRecommendations(recommendations);
      
      // Notify subscribers
      notifySubscribers({ type: 'personalized', userId, data: recommendations });
      
      return recommendations;
    } catch (error) {
      console.error("Failed to get personalized recommendations:", error);
      return [];
    }
  };

  // Analytics methods
  const getUsagePatterns = async (timeframe: string = '30d'): Promise<UsageAnalytics> => {
    try {
      // Calculate real analytics from current inventory and projects
      const analytics = AnalyticsService.calculateUsageAnalytics(inventory, projects);
      setUsageAnalytics(analytics);
      
      // Notify subscribers
      notifySubscribers({ type: 'usage_analytics', timeframe, data: analytics });
      
      return analytics;
    } catch (error) {
      console.error("Failed to get usage patterns:", error);
      throw error;
    }
  };

  const getStockPrediction = async (componentId: string): Promise<StockPrediction> => {
    try {
      // Check cache first
      const cached = stockPredictions.get(componentId);
      if (cached) {
        return cached;
      }

      // Fetch from API
      const prediction = await apiClient.getStockPrediction(componentId);
      
      // Update cache
      setStockPredictions(prev => new Map(prev.set(componentId, prediction)));
      
      // Notify subscribers
      notifySubscribers({ type: 'stock_prediction', componentId, data: prediction });
      
      return prediction;
    } catch (error) {
      console.error("Failed to get stock prediction:", error);
      throw error;
    }
  };

  const getSpendingInsights = async (timeframe: string = '30d'): Promise<SpendingAnalysis> => {
    try {
      // Calculate real spending analysis from current inventory and projects
      const analysis = BudgetService.calculateSpendingAnalysis(inventory, projects);
      setSpendingAnalysis(analysis);
      
      // Notify subscribers
      notifySubscribers({ type: 'spending_analysis', timeframe, data: analysis });
      
      return analysis;
    } catch (error) {
      console.error("Failed to get spending insights:", error);
      throw error;
    }
  };

  const getProjectPatterns = async (userId: string): Promise<ProjectPattern[]> => {
    try {
      const patterns = await apiClient.getProjectPatterns(userId);
      setProjectPatterns(patterns);
      
      // Notify subscribers
      notifySubscribers({ type: 'project_patterns', userId, data: patterns });
      
      return patterns;
    } catch (error) {
      console.error("Failed to get project patterns:", error);
      return [];
    }
  };

  // User preferences methods
  const getUserPreferences = async (userId: string): Promise<RecommendationPreferences> => {
    try {
      const preferences = await apiClient.getUserPreferences(userId);
      setUserPreferences(preferences);
      return preferences;
    } catch (error) {
      console.error("Failed to get user preferences:", error);
      throw error;
    }
  };

  const updateUserPreferences = async (userId: string, preferences: RecommendationPreferences): Promise<void> => {
    try {
      await apiClient.updateUserPreferences(userId, preferences);
      setUserPreferences(preferences);
      
      // Notify subscribers
      notifySubscribers({ type: 'user_preferences', userId, data: preferences });
    } catch (error) {
      console.error("Failed to update user preferences:", error);
      throw error;
    }
  };

  // Real-time update methods
  const refreshRecommendations = async (componentId?: string): Promise<void> => {
    try {
      if (componentId) {
        // Refresh specific component recommendations
        setComponentAlternatives(prev => {
          const newMap = new Map(prev);
          newMap.delete(componentId);
          return newMap;
        });
        setStockPredictions(prev => {
          const newMap = new Map(prev);
          newMap.delete(componentId);
          return newMap;
        });
      } else {
        // Refresh all recommendation data
        setComponentAlternatives(new Map());
        setComponentPredictions(new Map());
        setStockPredictions(new Map());
        await loadInitialRecommendationData();
      }
      
      // Notify subscribers
      notifySubscribers({ type: 'refresh', componentId });
    } catch (error) {
      console.error("Failed to refresh recommendations:", error);
    }
  };

  const subscribeToRecommendationUpdates = (callback: (data: any) => void): (() => void) => {
    setUpdateSubscribers(prev => new Set(prev.add(callback)));
    
    // Return unsubscribe function
    return () => {
      setUpdateSubscribers(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  };

  const notifySubscribers = (data: any) => {
    updateSubscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in recommendation update subscriber:", error);
      }
    });
  };

  // Budget tracking methods
  const getBudgetStatus = (
    budgetLimits?: { [category: string]: number }, 
    totalBudgetLimit?: number
  ): BudgetStatus => {
    return BudgetService.calculateBudgetStatus(inventory, projects, budgetLimits, totalBudgetLimit);
  };

  const getSpendingForecast = (forecastPeriodDays: number = 30): SpendingForecast => {
    return BudgetService.generateSpendingForecast(inventory, projects, forecastPeriodDays);
  };

  const getProjectROI = (projectId: string): ProjectROI | null => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    
    return BudgetService.calculateProjectROI(project, inventory);
  };

  const getBudgetOptimization = (budgetConstraints?: {
    totalBudget?: number;
    categoryLimits?: { [category: string]: number };
    timeframe?: number;
  }): BudgetOptimization => {
    return BudgetService.generateBudgetOptimization(inventory, projects, budgetConstraints);
  };

  // Budget notification methods
  const getBudgetNotifications = (): BudgetNotification[] => {
    // Monitor budget and get notifications
    BudgetNotificationService.monitorBudgetStatus(inventory, projects);
    return BudgetNotificationService.getActiveNotifications();
  };

  const getUnreadNotificationCount = (): number => {
    return BudgetNotificationService.getUnreadCount();
  };

  const markNotificationAsRead = (notificationId: string): void => {
    BudgetNotificationService.markAsRead(notificationId);
    // Notify subscribers of notification changes
    notifySubscribers({ type: 'notification_read', notificationId });
  };

  const dismissNotification = (notificationId: string): void => {
    BudgetNotificationService.dismissNotification(notificationId);
    // Notify subscribers of notification changes
    notifySubscribers({ type: 'notification_dismissed', notificationId });
  };

  const setBudgetThreshold = (threshold: BudgetThreshold): void => {
    BudgetNotificationService.setBudgetThreshold(threshold);
    // Notify subscribers of threshold changes
    notifySubscribers({ type: 'threshold_updated', threshold });
  };

  const getBudgetThresholds = (): BudgetThreshold[] => {
    return BudgetNotificationService.getBudgetThresholds();
  };

  const updateNotificationConfig = (config: Partial<BudgetMonitoringConfig>): void => {
    BudgetNotificationService.updateConfig(config);
    // Notify subscribers of config changes
    notifySubscribers({ type: 'notification_config_updated', config });
  };

  const getNotificationConfig = (): BudgetMonitoringConfig => {
    return BudgetNotificationService.getConfig();
  };

  const getBudgetHealthSummary = (
    budgetLimits?: { [category: string]: number }, 
    totalBudgetLimit?: number
  ): BudgetHealthSummary => {
    return BudgetNotificationService.generateBudgetHealthSummary(
      inventory, 
      projects, 
      budgetLimits, 
      totalBudgetLimit
    );
  };

  // Project cost calculation methods
  const getProjectCostBreakdown = (projectId: string, budgetLimit?: number): ProjectCostBreakdown | null => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    
    return ProjectCostService.calculateProjectCostBreakdown(project, inventory, budgetLimit);
  };

  const createProjectBudgetPlan = (
    projectId: string, 
    plannedBudget: number, 
    contingencyPercentage: number = 15
  ): ProjectBudgetPlan | null => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    
    return ProjectCostService.createProjectBudgetPlan(project, inventory, plannedBudget, contingencyPercentage);
  };

  const getProjectOptimizationSuggestions = (projectId: string): CostOptimizationSuggestion | null => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return null;
    
    return ProjectCostService.generateCostOptimizationSuggestions(project, inventory);
  };

  const calculateMultiProjectCosts = () => {
    return ProjectCostService.calculateMultiProjectCosts(projects, inventory);
  };

  return (
    <InventoryContext.Provider
      value={{
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
        deallocateInventoryItems,
        
        // Recommendation data
        componentAlternatives,
        componentPredictions,
        personalizedRecommendations,
        usageAnalytics,
        stockPredictions,
        spendingAnalysis,
        projectPatterns,
        userPreferences,
        
        // Recommendation methods
        getComponentAlternatives,
        getComponentPredictions,
        getProjectSuggestions,
        analyzeComponentCompatibility,
        getPersonalizedRecommendations,
        
        // Analytics methods
        getUsagePatterns,
        getStockPrediction,
        getSpendingInsights,
        getProjectPatterns,
        
        // User preferences
        getUserPreferences,
        updateUserPreferences,
        
        // Real-time updates
        refreshRecommendations,
        subscribeToRecommendationUpdates,
        
        // Budget tracking methods
        getBudgetStatus,
        getSpendingForecast,
        getProjectROI,
        getBudgetOptimization,
        
        // Budget notification methods
        getBudgetNotifications,
        getUnreadNotificationCount,
        markNotificationAsRead,
        dismissNotification,
        setBudgetThreshold,
        getBudgetThresholds,
        updateNotificationConfig,
        getNotificationConfig,
        getBudgetHealthSummary,
        
        // Project cost calculation methods
        getProjectCostBreakdown,
        createProjectBudgetPlan,
        getProjectOptimizationSuggestions,
        calculateMultiProjectCosts,
      }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error("useInventory must be used within an InventoryProvider");
  }
  return context;
};
