import React, { useState } from 'react';
import { useRecommendationPreferences } from '../contexts/RecommendationPreferencesContext';
import RecommendationSettingsPanel from './RecommendationSettingsPanel';
import { SparklesIcon } from './icons/SparklesIcon';

interface RecommendationSettingsMenuProps {
  className?: string;
}

const RecommendationSettingsMenu: React.FC<RecommendationSettingsMenuProps> = ({ className = '' }) => {
  const { preferences, updatePreferences } = useRecommendationPreferences();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const getStatusSummary = () => {
    const enabled = [];
    const disabled = [];

    if (preferences.budgetLimits.enabled) {
      enabled.push('Budget Limits');
    } else {
      disabled.push('Budget Limits');
    }

    if (preferences.recommendationSettings.showAlternatives) {
      enabled.push('Alternatives');
    } else {
      disabled.push('Alternatives');
    }

    if (preferences.recommendationSettings.showPredictions) {
      enabled.push('Predictions');
    } else {
      disabled.push('Predictions');
    }

    if (preferences.notifications.lowStockAlerts) {
      enabled.push('Stock Alerts');
    } else {
      disabled.push('Stock Alerts');
    }

    return { enabled, disabled };
  };

  const status = getStatusSummary();

  return (
    <div className={`relative ${className}`}>
      {/* Settings Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-3 py-2 text-text-secondary hover:text-text-primary transition-colors rounded-md hover:bg-secondary/50"
        title="Recommendation Settings"
      >
        <SparklesIcon className="w-5 h-5" />
        <span className="text-sm font-medium">AI Settings</span>
        <svg 
          className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-primary border border-border-color rounded-lg shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">Recommendation Status</h3>
              <button
                onClick={() => {
                  setIsSettingsOpen(true);
                  setShowDropdown(false);
                }}
                className="text-xs text-accent hover:text-blue-400 transition-colors"
              >
                Configure
              </button>
            </div>

            {/* Quick Status Overview */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-text-secondary mb-2">Active Features</h4>
                <div className="flex flex-wrap gap-1">
                  {status.enabled.length > 0 ? (
                    status.enabled.map(feature => (
                      <span
                        key={feature}
                        className="inline-block px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs"
                      >
                        {feature}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-text-secondary italic">No features enabled</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-text-secondary mb-2">Settings Summary</h4>
                <div className="space-y-1 text-xs text-text-secondary">
                  <div className="flex justify-between">
                    <span>Sensitivity:</span>
                    <span className="text-text-primary capitalize">{preferences.recommendationSettings.sensitivity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Confidence:</span>
                    <span className="text-text-primary">{preferences.recommendationSettings.confidenceThreshold}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Budget Limits:</span>
                    <span className={preferences.budgetLimits.enabled ? 'text-green-400' : 'text-red-400'}>
                      {preferences.budgetLimits.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Preferred Suppliers:</span>
                    <span className="text-text-primary">{preferences.preferredSuppliers.suppliers.length || 'None'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="pt-3 border-t border-border-color">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      updatePreferences({
                        ...preferences,
                        recommendationSettings: {
                          ...preferences.recommendationSettings,
                          sensitivity: preferences.recommendationSettings.sensitivity === 'conservative' ? 'balanced' : 'conservative'
                        }
                      });
                    }}
                    className="text-xs px-2 py-1 bg-secondary hover:bg-gray-600 text-text-primary rounded transition-colors"
                  >
                    Toggle Sensitivity
                  </button>
                  <button
                    onClick={() => {
                      updatePreferences({
                        ...preferences,
                        budgetLimits: {
                          ...preferences.budgetLimits,
                          enabled: !preferences.budgetLimits.enabled
                        }
                      });
                    }}
                    className="text-xs px-2 py-1 bg-secondary hover:bg-gray-600 text-text-primary rounded transition-colors"
                  >
                    Toggle Budget
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border-color p-3">
            <button
              onClick={() => {
                setIsSettingsOpen(true);
                setShowDropdown(false);
              }}
              className="w-full text-sm bg-accent hover:bg-blue-600 text-white py-2 rounded transition-colors"
            >
              Open Full Settings
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Settings Panel */}
      <RecommendationSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSave={updatePreferences}
        initialPreferences={preferences}
      />
    </div>
  );
};

export default RecommendationSettingsMenu;