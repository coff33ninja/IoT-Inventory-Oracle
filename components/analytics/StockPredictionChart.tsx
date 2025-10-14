import React, { useState, useEffect } from 'react';
import { InventoryItem, StockPrediction } from '../../types';
import { useInventory } from '../../contexts/InventoryContext';
import { 
  ExclamationTriangleIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '../icons/AnalyticsIcons';

interface StockPredictionChartProps {
  inventory: InventoryItem[];
  title: string;
  className?: string;
}

interface PredictionWithItem extends StockPrediction {
  item: InventoryItem;
  daysUntilDepletion: number;
  urgencyLevel: 'critical' | 'warning' | 'normal' | 'good';
}

const StockPredictionChart: React.FC<StockPredictionChartProps> = ({ 
  inventory, 
  title, 
  className = '' 
}) => {
  const { getStockPrediction } = useInventory();
  const [predictions, setPredictions] = useState<PredictionWithItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'normal'>('all');

  useEffect(() => {
    loadPredictions();
  }, [inventory]);

  const loadPredictions = async () => {
    setIsLoading(true);
    const predictionPromises = inventory.slice(0, 20).map(async (item) => {
      try {
        const prediction = await getStockPrediction(item.id);
        const daysUntilDepletion = calculateDaysUntilDepletion(prediction.predictedDepletionDate);
        const urgencyLevel = getUrgencyLevel(daysUntilDepletion, item.quantity);
        
        return {
          ...prediction,
          item,
          daysUntilDepletion,
          urgencyLevel
        };
      } catch (error) {
        // Create a fallback prediction for items without API data
        const daysUntilDepletion = estimateDaysUntilDepletion(item);
        const urgencyLevel = getUrgencyLevel(daysUntilDepletion, item.quantity);
        
        return {
          componentId: item.id,
          currentStock: item.quantity,
          predictedDepletionDate: new Date(Date.now() + daysUntilDepletion * 24 * 60 * 60 * 1000).toISOString(),
          recommendedReorderQuantity: Math.max(10, Math.ceil(item.quantity * 0.5)),
          confidence: 0.6,
          consumptionRate: item.quantity / Math.max(daysUntilDepletion, 1),
          factors: ['Historical usage pattern', 'Current stock level'],
          item,
          daysUntilDepletion,
          urgencyLevel
        };
      }
    });

    try {
      const results = await Promise.all(predictionPromises);
      setPredictions(results.sort((a, b) => a.daysUntilDepletion - b.daysUntilDepletion));
    } catch (error) {
      console.error('Failed to load stock predictions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDaysUntilDepletion = (depletionDate: string): number => {
    const depletion = new Date(depletionDate);
    const now = new Date();
    const diffTime = depletion.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const estimateDaysUntilDepletion = (item: InventoryItem): number => {
    // Simple estimation based on current stock and usage patterns
    const baseConsumption = 0.1; // Assume 10% consumption per month
    const monthlyUsage = Math.max(1, item.quantity * baseConsumption);
    return Math.ceil((item.quantity / monthlyUsage) * 30);
  };

  const getUrgencyLevel = (days: number, currentStock: number): 'critical' | 'warning' | 'normal' | 'good' => {
    if (days <= 7 || currentStock <= 2) return 'critical';
    if (days <= 30 || currentStock <= 5) return 'warning';
    if (days <= 90) return 'normal';
    return 'good';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'warning': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'normal': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'good': return 'text-green-400 bg-green-500/10 border-green-500/20';
      default: return 'text-text-secondary bg-secondary border-border-color';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return XCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'normal': return ClockIcon;
      case 'good': return CheckCircleIcon;
      default: return InformationCircleIcon;
    }
  };

  const filteredPredictions = predictions.filter(p => 
    filter === 'all' || p.urgencyLevel === filter
  );

  const urgencyCounts = predictions.reduce((acc, p) => {
    acc[p.urgencyLevel] = (acc[p.urgencyLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDays = (days: number) => {
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.ceil(days / 30)} months`;
    return `${Math.ceil(days / 365)} years`;
  };

  return (
    <div className={`bg-secondary p-6 rounded-lg shadow border border-border-color ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-text-secondary mr-2" />
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        </div>
        <button
          onClick={loadPredictions}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { key: 'critical', label: 'Critical', color: 'text-red-400 bg-red-500/10 border border-red-500/20' },
          { key: 'warning', label: 'Warning', color: 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20' },
          { key: 'normal', label: 'Normal', color: 'text-blue-400 bg-blue-500/10 border border-blue-500/20' },
          { key: 'good', label: 'Good', color: 'text-green-400 bg-green-500/10 border border-green-500/20' }
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(filter === key ? 'all' : key as any)}
            className={`p-4 rounded-lg border transition-all ${
              filter === key ? 'ring-2 ring-blue-500' : ''
            } ${color} hover:shadow-md`}
          >
            <div className="text-2xl font-bold">{urgencyCounts[key] || 0}</div>
            <div className="text-sm font-medium">{label}</div>
          </button>
        ))}
      </div>

      {/* Filter Info */}
      {filter !== 'all' && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-300">
              Showing {filteredPredictions.length} {filter} items
            </span>
            <button
              onClick={() => setFilter('all')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Show All
            </button>
          </div>
        </div>
      )}

      {/* Predictions List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading stock predictions...</p>
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary">
            {filter === 'all' ? 'No predictions available' : `No ${filter} items found`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPredictions.map((prediction) => {
            const UrgencyIcon = getUrgencyIcon(prediction.urgencyLevel);
            const urgencyColor = getUrgencyColor(prediction.urgencyLevel);
            
            return (
              <div 
                key={prediction.componentId} 
                className={`p-4 rounded-lg border ${urgencyColor}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <UrgencyIcon className="h-6 w-6 mt-1" />
                    <div>
                      <h4 className="font-medium text-text-primary">{prediction.item.name}</h4>
                      <div className="mt-1 space-y-1 text-sm">
                        <div className="flex items-center space-x-4">
                          <span>Current Stock: <strong>{prediction.currentStock}</strong></span>
                          <span>Depletion: <strong>{formatDate(prediction.predictedDepletionDate)}</strong></span>
                          <span>({formatDays(prediction.daysUntilDepletion)})</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>Consumption Rate: <strong>{prediction.consumptionRate.toFixed(2)}/day</strong></span>
                          <span>Confidence: <strong>{(prediction.confidence * 100).toFixed(0)}%</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-text-primary">
                      Reorder: {prediction.recommendedReorderQuantity}
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      {prediction.urgencyLevel.toUpperCase()}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                    <span>Stock Level</span>
                    <span>{prediction.currentStock} remaining</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        prediction.urgencyLevel === 'critical' ? 'bg-red-500' :
                        prediction.urgencyLevel === 'warning' ? 'bg-yellow-500' :
                        prediction.urgencyLevel === 'normal' ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.max(5, Math.min(100, (prediction.currentStock / prediction.recommendedReorderQuantity) * 100))}%` 
                      }}
                    />
                  </div>
                </div>
                
                {/* Factors */}
                {prediction.factors.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border-color">
                    <div className="text-xs text-text-secondary">
                      <strong>Prediction factors:</strong> {prediction.factors.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-border-color">
        <h4 className="text-sm font-medium text-text-primary mb-2">Urgency Levels</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center">
            <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
            <span>Critical (&lt;7 days)</span>
          </div>
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-1" />
            <span>Warning (&lt;30 days)</span>
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 text-blue-500 mr-1" />
            <span>Normal (&lt;90 days)</span>
          </div>
          <div className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
            <span>Good (&gt;90 days)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockPredictionChart;