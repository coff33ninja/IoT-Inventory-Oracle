import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RecommendationPreferences } from '../components/RecommendationSettingsPanel';

interface RecommendationPreferencesContextType {
  preferences: RecommendationPreferences;
  updatePreferences: (newPreferences: RecommendationPreferences) => Promise<void>;
  isLoading: boolean;
  resetToDefaults: () => Promise<void>;
}

const RecommendationPreferencesContext = createContext<RecommendationPreferencesContextType | undefined>(undefined);

const defaultPreferences: RecommendationPreferences = {
  budgetLimits: {
    enabled: false,
    maxProjectBudget: 500,
    maxComponentCost: 100,
    currency: 'USD',
    alertThreshold: 80
  },
  preferredSuppliers: {
    suppliers: [],
    avoidSuppliers: [],
    prioritizeLocal: false,
    maxShippingTime: 14
  },
  categoryPreferences: {
    preferredCategories: [],
    avoidCategories: [],
    qualityOverPrice: true,
    brandLoyalty: 'moderate'
  },
  recommendationSettings: {
    sensitivity: 'balanced',
    frequency: 'normal',
    showAlternatives: true,
    showPredictions: true,
    showOptimizations: true,
    autoApplyLowRisk: false,
    confidenceThreshold: 70
  },
  notifications: {
    lowStockAlerts: true,
    priceDropAlerts: true,
    newAlternativeAlerts: false,
    budgetWarnings: true,
    emailNotifications: false,
    pushNotifications: true
  }
};

export const RecommendationPreferencesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<RecommendationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      const stored = localStorage.getItem('recommendation-preferences');
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        setPreferences({ ...defaultPreferences, ...parsedPreferences });
      }
    } catch (error) {
      console.error('Failed to load recommendation preferences:', error);
      setPreferences(defaultPreferences);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: RecommendationPreferences) => {
    try {
      // Save to localStorage
      localStorage.setItem('recommendation-preferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
      
      // In a real application, you might also want to sync with a backend API
      // await apiClient.updateUserPreferences(newPreferences);
      
      console.log('Recommendation preferences updated successfully');
    } catch (error) {
      console.error('Failed to save recommendation preferences:', error);
      throw error;
    }
  };

  const resetToDefaults = async () => {
    try {
      localStorage.removeItem('recommendation-preferences');
      setPreferences(defaultPreferences);
      console.log('Recommendation preferences reset to defaults');
    } catch (error) {
      console.error('Failed to reset recommendation preferences:', error);
      throw error;
    }
  };

  const contextValue: RecommendationPreferencesContextType = {
    preferences,
    updatePreferences,
    isLoading,
    resetToDefaults
  };

  return (
    <RecommendationPreferencesContext.Provider value={contextValue}>
      {children}
    </RecommendationPreferencesContext.Provider>
  );
};

export const useRecommendationPreferences = (): RecommendationPreferencesContextType => {
  const context = useContext(RecommendationPreferencesContext);
  if (context === undefined) {
    throw new Error('useRecommendationPreferences must be used within a RecommendationPreferencesProvider');
  }
  return context;
};

// Helper functions to check preferences
export const shouldShowRecommendationType = (
  preferences: RecommendationPreferences,
  type: 'alternatives' | 'predictions' | 'optimizations'
): boolean => {
  switch (type) {
    case 'alternatives':
      return preferences.recommendationSettings.showAlternatives;
    case 'predictions':
      return preferences.recommendationSettings.showPredictions;
    case 'optimizations':
      return preferences.recommendationSettings.showOptimizations;
    default:
      return true;
  }
};

export const isWithinBudgetLimits = (
  preferences: RecommendationPreferences,
  cost: number,
  isProjectTotal: boolean = false
): boolean => {
  if (!preferences.budgetLimits.enabled) return true;
  
  const limit = isProjectTotal 
    ? preferences.budgetLimits.maxProjectBudget 
    : preferences.budgetLimits.maxComponentCost;
    
  return cost <= limit;
};

export const isPreferredSupplier = (
  preferences: RecommendationPreferences,
  supplier: string
): boolean => {
  // If no preferred suppliers are set, all are acceptable
  if (preferences.preferredSuppliers.suppliers.length === 0) {
    return !preferences.preferredSuppliers.avoidSuppliers.includes(supplier);
  }
  
  // Check if supplier is in preferred list and not in avoid list
  return preferences.preferredSuppliers.suppliers.includes(supplier) &&
         !preferences.preferredSuppliers.avoidSuppliers.includes(supplier);
};

export const isPreferredCategory = (
  preferences: RecommendationPreferences,
  category: string
): boolean => {
  // If no preferred categories are set, all are acceptable (except avoided ones)
  if (preferences.categoryPreferences.preferredCategories.length === 0) {
    return !preferences.categoryPreferences.avoidCategories.includes(category);
  }
  
  // Check if category is in preferred list and not in avoid list
  return preferences.categoryPreferences.preferredCategories.includes(category) &&
         !preferences.categoryPreferences.avoidCategories.includes(category);
};

export const getConfidenceThreshold = (preferences: RecommendationPreferences): number => {
  return preferences.recommendationSettings.confidenceThreshold / 100;
};

export const shouldAutoApply = (
  preferences: RecommendationPreferences,
  confidence: number,
  riskLevel: 'low' | 'medium' | 'high'
): boolean => {
  return preferences.recommendationSettings.autoApplyLowRisk &&
         riskLevel === 'low' &&
         confidence >= getConfidenceThreshold(preferences);
};