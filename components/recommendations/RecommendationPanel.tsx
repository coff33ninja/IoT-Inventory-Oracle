import React, { useState, useEffect } from 'react';
import { InventoryItem, ComponentAlternative, ComponentPrediction } from '../../types';

interface RecommendationPanelProps {
  item: InventoryItem;
  allItems: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onAcceptAlternative?: (alternativeId: string) => void;
  onAddToWishlist?: (alternativeId: string) => void;
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  item,
  allItems,
  isOpen,
  onClose,
  onAcceptAlternative,
  onAddToWishlist
}) => {
  const [alternatives, setAlternatives] = useState<ComponentAlternative[]>([]);
  const [predictions, setPredictions] = useState<ComponentPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'alternatives' | 'predictions' | 'insights'>('alternatives');

  useEffect(() => {
    if (isOpen && item) {
      loadRecommendations();
    }
  }, [isOpen, item]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Import the client-side recommendation service
      const { ClientRecommendationService } = await import('../../services/clientRecommendationService');
      
      // Load alternatives using client-side analysis with all available items
      const actualAlternatives = ClientRecommendationService.findComponentAlternatives(item, allItems);
      
      // Generate stock predictions
      const actualPredictions = ClientRecommendationService.generateStockPredictions(item);

      setAlternatives(actualAlternatives);
      setPredictions(actualPredictions);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      // Fallback to empty arrays
      setAlternatives([]);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAlternative = (alternativeId: string) => {
    onAcceptAlternative?.(alternativeId);
    onClose();
  };

  const handleAddToWishlist = (alternativeId: string) => {
    onAddToWishlist?.(alternativeId);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-primary rounded-lg border border-border-color max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-color">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Recommendations for {item.name}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              Current stock: {item.quantity} • Available: {item.availableQuantity || item.quantity}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close recommendations"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-color">
          {[
            { id: 'alternatives', label: 'Alternatives', count: alternatives.length },
            { id: 'predictions', label: 'Predictions', count: predictions.length },
            { id: 'insights', label: 'Insights', count: 0 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-1 bg-secondary rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              <span className="ml-3 text-text-secondary">Loading recommendations...</span>
            </div>
          ) : (
            <>
              {/* Alternatives Tab */}
              {activeTab === 'alternatives' && (
                <div className="space-y-4">
                  {alternatives.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      No alternatives found for this component.
                    </div>
                  ) : (
                    alternatives.map((alt) => (
                      <div key={alt.componentId} className="bg-secondary/30 rounded-lg p-4 border border-border-color">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-text-primary">{alt.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-green-400">
                                {alt.compatibilityScore}% compatible
                              </span>
                              <span className="text-sm text-text-secondary">
                                • {Math.round(alt.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-text-primary">
                              {formatPrice(alt.priceComparison.alternative)}
                            </div>
                            <div className={`text-xs ${
                              alt.priceComparison.percentageDifference < 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {alt.priceComparison.percentageDifference > 0 ? '+' : ''}
                              {alt.priceComparison.percentageDifference}%
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-text-secondary mb-3">{alt.explanation}</p>

                        {alt.technicalDifferences.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-text-primary mb-2">Technical Differences:</h4>
                            <div className="space-y-1">
                              {alt.technicalDifferences.map((diff, index) => (
                                <div key={index} className="text-xs">
                                  <span className="text-text-secondary">{diff.property}: </span>
                                  <span className={getImpactColor(diff.impact)}>
                                    {diff.original} → {diff.alternative}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {alt.requiredModifications && alt.requiredModifications.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-text-primary mb-2">Required Changes:</h4>
                            <ul className="text-xs text-yellow-400 space-y-1">
                              {alt.requiredModifications.map((mod, index) => (
                                <li key={index}>• {mod}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptAlternative(alt.componentId)}
                            className="px-3 py-1 bg-accent text-white rounded text-sm hover:bg-blue-600 transition-colors"
                          >
                            Add to Inventory
                          </button>
                          <button
                            onClick={() => handleAddToWishlist(alt.componentId)}
                            className="px-3 py-1 bg-secondary text-text-primary rounded text-sm hover:bg-gray-600 transition-colors"
                          >
                            Add to Wishlist
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Predictions Tab */}
              {activeTab === 'predictions' && (
                <div className="space-y-4">
                  {predictions.length === 0 ? (
                    <div className="text-center py-8 text-text-secondary">
                      No predictions available for this component.
                    </div>
                  ) : (
                    predictions.map((pred) => (
                      <div key={pred.componentId} className="bg-secondary/30 rounded-lg p-4 border border-border-color">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-text-primary">Stock Prediction</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-sm ${getUrgencyColor(pred.urgency)}`}>
                                {pred.urgency.toUpperCase()} priority
                              </span>
                              <span className="text-sm text-text-secondary">
                                • {Math.round(pred.confidence * 100)}% confidence
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-text-primary">
                              Need {pred.quantity} more
                            </div>
                            <div className="text-xs text-text-secondary">
                              by {new Date(pred.predictedNeedDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-text-secondary mb-3">{pred.reasoning}</p>

                        {pred.basedOnProjects.length > 0 && (
                          <div className="mb-3">
                            <h4 className="text-xs font-medium text-text-primary mb-2">Based on projects:</h4>
                            <div className="flex flex-wrap gap-1">
                              {pred.basedOnProjects.map((projectId) => (
                                <span key={projectId} className="px-2 py-1 bg-secondary rounded text-xs text-text-secondary">
                                  {projectId}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <button className="px-3 py-1 bg-accent text-white rounded text-sm hover:bg-blue-600 transition-colors">
                          Add to Shopping List
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <div className="space-y-4">
                  <div className="bg-secondary/30 rounded-lg p-4 border border-border-color">
                    <h3 className="font-medium text-text-primary mb-3">Usage Insights</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-text-secondary">Total Used:</span>
                        <span className="ml-2 text-text-primary font-medium">
                          {item.usedInProjects?.reduce((sum, p) => sum + p.quantity, 0) || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Projects:</span>
                        <span className="ml-2 text-text-primary font-medium">
                          {item.usedInProjects?.length || 0}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Last Used:</span>
                        <span className="ml-2 text-text-primary font-medium">
                          {item.usedInProjects?.length ? 'Recently' : 'Never'}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Category:</span>
                        <span className="ml-2 text-text-primary font-medium">
                          {item.category || 'Uncategorized'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-secondary/30 rounded-lg p-4 border border-border-color">
                    <h3 className="font-medium text-text-primary mb-3">Market Insights</h3>
                    {item.marketData && item.marketData.length > 0 ? (
                      <div className="space-y-2">
                        {item.marketData.slice(0, 3).map((market, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-text-secondary">{market.supplier}</span>
                            <span className="text-text-primary font-medium">{market.price}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary">No market data available</p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecommendationPanel;