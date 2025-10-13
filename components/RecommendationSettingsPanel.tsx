import React, { useState, useEffect } from "react";
import { useInventory } from "../contexts/InventoryContext";
import { useCurrency } from "../contexts/CurrencyContext";
import { SparklesIcon } from "./icons/SparklesIcon";
import { SpinnerIcon } from "./icons/SpinnerIcon";

export interface RecommendationPreferences {
  // Budget Settings
  budgetLimits: {
    enabled: boolean;
    maxProjectBudget: number;
    maxComponentCost: number;
    currency: string;
    alertThreshold: number; // percentage
  };

  // Supplier Preferences
  preferredSuppliers: {
    suppliers: string[];
    avoidSuppliers: string[];
    prioritizeLocal: boolean;
    maxShippingTime: number; // days
  };

  // Component Categories
  categoryPreferences: {
    preferredCategories: string[];
    avoidCategories: string[];
    qualityOverPrice: boolean;
    brandLoyalty: "strict" | "moderate" | "flexible";
  };

  // Recommendation Behavior
  recommendationSettings: {
    sensitivity: "conservative" | "balanced" | "aggressive";
    frequency: "minimal" | "normal" | "frequent";
    showAlternatives: boolean;
    showPredictions: boolean;
    showOptimizations: boolean;
    autoApplyLowRisk: boolean;
    confidenceThreshold: number; // 0-100
  };

  // Notification Preferences
  notifications: {
    lowStockAlerts: boolean;
    priceDropAlerts: boolean;
    newAlternativeAlerts: boolean;
    budgetWarnings: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
}

interface RecommendationSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: RecommendationPreferences) => void;
  initialPreferences?: RecommendationPreferences;
}

const defaultPreferences: RecommendationPreferences = {
  budgetLimits: {
    enabled: false,
    maxProjectBudget: 500,
    maxComponentCost: 100,
    currency: "USD",
    alertThreshold: 80,
  },
  preferredSuppliers: {
    suppliers: [],
    avoidSuppliers: [],
    prioritizeLocal: false,
    maxShippingTime: 14,
  },
  categoryPreferences: {
    preferredCategories: [],
    avoidCategories: [],
    qualityOverPrice: true,
    brandLoyalty: "moderate",
  },
  recommendationSettings: {
    sensitivity: "balanced",
    frequency: "normal",
    showAlternatives: true,
    showPredictions: true,
    showOptimizations: true,
    autoApplyLowRisk: false,
    confidenceThreshold: 70,
  },
  notifications: {
    lowStockAlerts: true,
    priceDropAlerts: true,
    newAlternativeAlerts: false,
    budgetWarnings: true,
    emailNotifications: false,
    pushNotifications: true,
  },
};

const RecommendationSettingsPanel: React.FC<
  RecommendationSettingsPanelProps
> = ({ isOpen, onClose, onSave, initialPreferences }) => {
  const { inventory } = useInventory();
  const { currentCurrency, getCurrency } = useCurrency();
  const [preferences, setPreferences] = useState<RecommendationPreferences>(
    initialPreferences || defaultPreferences
  );
  const [activeTab, setActiveTab] = useState<
    "budget" | "suppliers" | "categories" | "behavior" | "notifications"
  >("budget");
  const [saving, setSaving] = useState(false);

  // Get unique categories and suppliers from inventory
  const availableCategories = Array.from(
    new Set(inventory.map((item) => item.category).filter(Boolean))
  );

  const availableSuppliers = Array.from(
    new Set(inventory.map((item) => item.source).filter(Boolean))
  );

  useEffect(() => {
    if (initialPreferences) {
      setPreferences(initialPreferences);
    }
  }, [initialPreferences]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(preferences);
      onClose();
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(defaultPreferences);
  };

  const updatePreferences = (
    section: keyof RecommendationPreferences,
    updates: any
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
  };

  const addToList = (
    section: keyof RecommendationPreferences,
    field: string,
    value: string
  ) => {
    if (!value.trim()) return;

    setPreferences((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...((prev[section] as any)[field] as string[]), value.trim()],
      },
    }));
  };

  const removeFromList = (
    section: keyof RecommendationPreferences,
    field: string,
    index: number
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: ((prev[section] as any)[field] as string[]).filter(
          (_, i: number) => i !== index
        ),
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary rounded-lg border border-border-color max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-color">
          <div className="flex items-center">
            <SparklesIcon className="w-6 h-6 mr-3 text-accent" />
            <div>
              <h2 className="text-xl font-semibold text-text-primary">
                Recommendation Settings
              </h2>
              <p className="text-sm text-text-secondary mt-1">
                Configure your intelligent recommendation preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
            title="Close settings"
            aria-label="Close">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-color overflow-x-auto">
          {[
            { id: "budget", label: "Budget", icon: "💰" },
            { id: "suppliers", label: "Suppliers", icon: "🏪" },
            { id: "categories", label: "Categories", icon: "📂" },
            { id: "behavior", label: "Behavior", icon: "⚙️" },
            { id: "notifications", label: "Notifications", icon: "🔔" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "text-accent border-b-2 border-accent bg-accent/5"
                  : "text-text-secondary hover:text-text-primary"
              }`}>
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Budget Settings */}
          {activeTab === "budget" && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="budget-enabled"
                  checked={preferences.budgetLimits.enabled}
                  onChange={(e) =>
                    updatePreferences("budgetLimits", {
                      enabled: e.target.checked,
                    })
                  }
                  className="rounded border-border-color text-accent focus:ring-accent"
                />
                <label
                  htmlFor="budget-enabled"
                  className="text-sm font-medium text-text-primary">
                  Enable budget limits and tracking
                </label>
              </div>

              {preferences.budgetLimits.enabled && (
                <div className="space-y-4 pl-6 border-l-2 border-accent/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Maximum Project Budget
                      </label>
                      <div className="flex">
                        <div className="bg-gray-50 border border-border-color rounded-l-md px-3 py-2 text-text-secondary text-sm flex items-center">
                          {getCurrency().flag} {currentCurrency}
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="10"
                          value={preferences.budgetLimits.maxProjectBudget}
                          onChange={(e) =>
                            updatePreferences("budgetLimits", {
                              maxProjectBudget: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="flex-1 bg-primary border border-l-0 border-border-color rounded-r-md px-3 py-2 text-text-primary"
                          placeholder="500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Maximum Component Cost
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="5"
                        value={preferences.budgetLimits.maxComponentCost}
                        onChange={(e) =>
                          updatePreferences("budgetLimits", {
                            maxComponentCost: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-text-primary"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Budget Alert Threshold:{" "}
                      {preferences.budgetLimits.alertThreshold}%
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={preferences.budgetLimits.alertThreshold}
                      onChange={(e) =>
                        updatePreferences("budgetLimits", {
                          alertThreshold: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                      title="Budget alert threshold"
                      aria-label="Budget alert threshold percentage"
                    />
                    <div className="flex justify-between text-xs text-text-secondary mt-1">
                      <span>50%</span>
                      <span>
                        Alert when {preferences.budgetLimits.alertThreshold}% of
                        budget is used
                      </span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Supplier Settings */}
          {activeTab === "suppliers" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">
                  Preferred Suppliers
                </h3>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <select
                      className="flex-1 bg-primary border border-border-color rounded-md px-3 py-2 text-text-primary"
                      onChange={(e) => {
                        if (e.target.value) {
                          addToList(
                            "preferredSuppliers",
                            "suppliers",
                            e.target.value
                          );
                          e.target.value = "";
                        }
                      }}
                      title="Select preferred supplier"
                      aria-label="Select preferred supplier from existing list">
                      <option value="">
                        Select from existing suppliers...
                      </option>
                      {availableSuppliers.map((supplier) => (
                        <option key={supplier} value={supplier}>
                          {supplier}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Or add custom supplier"
                      className="flex-1 bg-primary border border-border-color rounded-md px-3 py-2 text-text-primary"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          addToList(
                            "preferredSuppliers",
                            "suppliers",
                            e.currentTarget.value
                          );
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {preferences.preferredSuppliers.suppliers.map(
                      (supplier, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm">
                          {supplier}
                          <button
                            onClick={() =>
                              removeFromList(
                                "preferredSuppliers",
                                "suppliers",
                                index
                              )
                            }
                            className="ml-2 text-green-300 hover:text-green-100">
                            ×
                          </button>
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">
                  Suppliers to Avoid
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Add supplier to avoid list"
                    className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-text-primary"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addToList(
                          "preferredSuppliers",
                          "avoidSuppliers",
                          e.currentTarget.value
                        );
                        e.currentTarget.value = "";
                      }
                    }}
                  />

                  <div className="flex flex-wrap gap-2">
                    {preferences.preferredSuppliers.avoidSuppliers.map(
                      (supplier, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                          {supplier}
                          <button
                            onClick={() =>
                              removeFromList(
                                "preferredSuppliers",
                                "avoidSuppliers",
                                index
                              )
                            }
                            className="ml-2 text-red-300 hover:text-red-100">
                            ×
                          </button>
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="prioritize-local"
                    checked={preferences.preferredSuppliers.prioritizeLocal}
                    onChange={(e) =>
                      updatePreferences("preferredSuppliers", {
                        prioritizeLocal: e.target.checked,
                      })
                    }
                    className="rounded border-border-color text-accent focus:ring-accent"
                  />
                  <label
                    htmlFor="prioritize-local"
                    className="text-sm text-text-primary">
                    Prioritize local suppliers
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Maximum Shipping Time (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={preferences.preferredSuppliers.maxShippingTime}
                    onChange={(e) =>
                      updatePreferences("preferredSuppliers", {
                        maxShippingTime: parseInt(e.target.value) || 14,
                      })
                    }
                    className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-text-primary"
                    title="Maximum shipping time in days"
                    aria-label="Maximum shipping time in days"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Category Settings */}
          {activeTab === "categories" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">
                  Preferred Categories
                </h3>
                <div className="space-y-3">
                  <select
                    className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-text-primary"
                    onChange={(e) => {
                      if (e.target.value) {
                        addToList(
                          "categoryPreferences",
                          "preferredCategories",
                          e.target.value
                        );
                        e.target.value = "";
                      }
                    }}
                    title="Select preferred category"
                    aria-label="Select category to add to preferred list">
                    <option value="">Select category to prefer...</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-2">
                    {preferences.categoryPreferences.preferredCategories.map(
                      (category, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                          {category}
                          <button
                            onClick={() =>
                              removeFromList(
                                "categoryPreferences",
                                "preferredCategories",
                                index
                              )
                            }
                            className="ml-2 text-blue-300 hover:text-blue-100">
                            ×
                          </button>
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">
                  Categories to Avoid
                </h3>
                <div className="space-y-3">
                  <select
                    className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-text-primary"
                    onChange={(e) => {
                      if (e.target.value) {
                        addToList(
                          "categoryPreferences",
                          "avoidCategories",
                          e.target.value
                        );
                        e.target.value = "";
                      }
                    }}
                    title="Select category to avoid"
                    aria-label="Select category to add to avoid list">
                    <option value="">Select category to avoid...</option>
                    {availableCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-2">
                    {preferences.categoryPreferences.avoidCategories.map(
                      (category, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                          {category}
                          <button
                            onClick={() =>
                              removeFromList(
                                "categoryPreferences",
                                "avoidCategories",
                                index
                              )
                            }
                            className="ml-2 text-red-300 hover:text-red-100">
                            ×
                          </button>
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="quality-over-price"
                    checked={preferences.categoryPreferences.qualityOverPrice}
                    onChange={(e) =>
                      updatePreferences("categoryPreferences", {
                        qualityOverPrice: e.target.checked,
                      })
                    }
                    className="rounded border-border-color text-accent focus:ring-accent"
                  />
                  <label
                    htmlFor="quality-over-price"
                    className="text-sm text-text-primary">
                    Prioritize quality over price
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Brand Loyalty Level
                  </label>
                  <select
                    value={preferences.categoryPreferences.brandLoyalty}
                    onChange={(e) =>
                      updatePreferences("categoryPreferences", {
                        brandLoyalty: e.target.value as any,
                      })
                    }
                    className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-text-primary"
                    title="Brand loyalty level"
                    aria-label="Select brand loyalty preference level">
                    <option value="strict">
                      Strict - Only suggest same brands
                    </option>
                    <option value="moderate">
                      Moderate - Prefer same brands but allow alternatives
                    </option>
                    <option value="flexible">
                      Flexible - Consider all brands equally
                    </option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Behavior Settings */}
          {activeTab === "behavior" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Recommendation Sensitivity
                </label>
                <select
                  value={preferences.recommendationSettings.sensitivity}
                  onChange={(e) =>
                    updatePreferences("recommendationSettings", {
                      sensitivity: e.target.value as any,
                    })
                  }
                  className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-text-primary"
                  title="Recommendation sensitivity level"
                  aria-label="Select recommendation sensitivity level">
                  <option value="conservative">
                    Conservative - Only high-confidence suggestions
                  </option>
                  <option value="balanced">
                    Balanced - Mix of safe and exploratory suggestions
                  </option>
                  <option value="aggressive">
                    Aggressive - Show all potential alternatives
                  </option>
                </select>
                <p className="text-xs text-text-secondary mt-1">
                  {preferences.recommendationSettings.sensitivity ===
                    "conservative" && "Fewer but more reliable recommendations"}
                  {preferences.recommendationSettings.sensitivity ===
                    "balanced" && "Good balance of safety and discovery"}
                  {preferences.recommendationSettings.sensitivity ===
                    "aggressive" &&
                    "More experimental suggestions for exploration"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Recommendation Frequency
                </label>
                <select
                  value={preferences.recommendationSettings.frequency}
                  onChange={(e) =>
                    updatePreferences("recommendationSettings", {
                      frequency: e.target.value as any,
                    })
                  }
                  className="w-full bg-primary border border-border-color rounded-md px-3 py-2 text-text-primary"
                  title="Recommendation frequency"
                  aria-label="Select how often to show recommendations">
                  <option value="minimal">
                    Minimal - Only when explicitly requested
                  </option>
                  <option value="normal">
                    Normal - Regular suggestions during workflow
                  </option>
                  <option value="frequent">
                    Frequent - Proactive suggestions and tips
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Confidence Threshold:{" "}
                  {preferences.recommendationSettings.confidenceThreshold}%
                </label>
                <input
                  type="range"
                  min="30"
                  max="95"
                  value={preferences.recommendationSettings.confidenceThreshold}
                  onChange={(e) =>
                    updatePreferences("recommendationSettings", {
                      confidenceThreshold: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                  title="Confidence threshold percentage"
                  aria-label="Minimum confidence threshold for recommendations"
                />
                <div className="flex justify-between text-xs text-text-secondary mt-1">
                  <span>30% (More suggestions)</span>
                  <span>
                    Only show recommendations above{" "}
                    {preferences.recommendationSettings.confidenceThreshold}%
                    confidence
                  </span>
                  <span>95% (Fewer, high-quality suggestions)</span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-text-primary">
                  Recommendation Types
                </h3>

                {[
                  {
                    key: "showAlternatives",
                    label: "Component Alternatives",
                    desc: "Show alternative components and substitutions",
                  },
                  {
                    key: "showPredictions",
                    label: "Stock Predictions",
                    desc: "Predict when components will run out",
                  },
                  {
                    key: "showOptimizations",
                    label: "Cost Optimizations",
                    desc: "Suggest ways to reduce project costs",
                  },
                  {
                    key: "autoApplyLowRisk",
                    label: "Auto-apply Low Risk Changes",
                    desc: "Automatically apply very safe optimizations",
                  },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={setting.key}
                      checked={
                        preferences.recommendationSettings[
                          setting.key as keyof typeof preferences.recommendationSettings
                        ] as boolean
                      }
                      onChange={(e) =>
                        updatePreferences("recommendationSettings", {
                          [setting.key]: e.target.checked,
                        })
                      }
                      className="rounded border-border-color text-accent focus:ring-accent mt-1"
                    />
                    <div>
                      <label
                        htmlFor={setting.key}
                        className="text-sm font-medium text-text-primary">
                        {setting.label}
                      </label>
                      <p className="text-xs text-text-secondary">
                        {setting.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-text-primary">
                  Alert Types
                </h3>

                {[
                  {
                    key: "lowStockAlerts",
                    label: "Low Stock Alerts",
                    desc: "Notify when components are running low",
                  },
                  {
                    key: "priceDropAlerts",
                    label: "Price Drop Alerts",
                    desc: "Notify when wanted components go on sale",
                  },
                  {
                    key: "newAlternativeAlerts",
                    label: "New Alternative Alerts",
                    desc: "Notify when better alternatives become available",
                  },
                  {
                    key: "budgetWarnings",
                    label: "Budget Warnings",
                    desc: "Warn when approaching budget limits",
                  },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id={setting.key}
                      checked={
                        preferences.notifications[
                          setting.key as keyof typeof preferences.notifications
                        ] as boolean
                      }
                      onChange={(e) =>
                        updatePreferences("notifications", {
                          [setting.key]: e.target.checked,
                        })
                      }
                      className="rounded border-border-color text-accent focus:ring-accent mt-1"
                    />
                    <div>
                      <label
                        htmlFor={setting.key}
                        className="text-sm font-medium text-text-primary">
                        {setting.label}
                      </label>
                      <p className="text-xs text-text-secondary">
                        {setting.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-color pt-6">
                <h3 className="text-lg font-medium text-text-primary mb-4">
                  Delivery Methods
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="push-notifications"
                      checked={preferences.notifications.pushNotifications}
                      onChange={(e) =>
                        updatePreferences("notifications", {
                          pushNotifications: e.target.checked,
                        })
                      }
                      className="rounded border-border-color text-accent focus:ring-accent mt-1"
                    />
                    <div>
                      <label
                        htmlFor="push-notifications"
                        className="text-sm font-medium text-text-primary">
                        Browser Notifications
                      </label>
                      <p className="text-xs text-text-secondary">
                        Show notifications in your browser
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="email-notifications"
                      checked={preferences.notifications.emailNotifications}
                      onChange={(e) =>
                        updatePreferences("notifications", {
                          emailNotifications: e.target.checked,
                        })
                      }
                      className="rounded border-border-color text-accent focus:ring-accent mt-1"
                    />
                    <div>
                      <label
                        htmlFor="email-notifications"
                        className="text-sm font-medium text-text-primary">
                        Email Notifications
                      </label>
                      <p className="text-xs text-text-secondary">
                        Send notifications to your email address
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-color flex justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors">
            Reset to Defaults
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-accent hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 flex items-center">
              {saving ? (
                <>
                  <SpinnerIcon className="mr-2" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecommendationSettingsPanel;
