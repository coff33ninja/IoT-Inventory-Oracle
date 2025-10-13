import React, { useState, useEffect } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { PersonalizedRecommendation } from '../types';
import RecommendationCard from './recommendations/RecommendationCard';
import RecommendationFilters from './recommendations/RecommendationFilters';
import FeedbackModal from './recommendations/FeedbackModal';
import { 
  SparklesIcon, 
  AdjustmentsHorizontalIcon,
  InformationCircleIcon 
} from './icons/AnalyticsIcons';

interface PersonalizedRecommendationsProps {
  userId?: string;
  className?: string;
  maxRecommendations?: number;
  showFilters?: boolean;
}

export interface RecommendationFilters {
  type: 'all' | 'component' | 'project' | 'bundle';
  difficulty: 'all' | 'beginner' | 'intermediate' | 'advanced';
  priceRange: {
    min: number;
    max: number;
  };
  timeRange: 'all' | 'quick' | 'medium' | 'long';
  relevanceThreshold: number;
}

const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  userId = 'default-user',
  className = '',
  maxRecommendations = 10,
  showFilters = true
}) => {
  const { 
    personalizedRecommendations, 
    getPersonalizedRecommendations,
    subscribeToRecommendationUpdates 
  } = useInventory();

  const [filteredRecommendations, setFilteredRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<PersonalizedRecommendation | null>(null);
  const [filters, setFilters] = useState<RecommendationFilters>({
    type: 'all',
    difficulty: 'all',
    priceRange: { min: 0, max: 1000 },
    timeRange: 'all',
    relevanceThreshold: 0.5
  });

  useEffect(() => {
    loadRecommendations();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToRecommendationUpdates((data) => {
      if (data.type === 'personalized') {
        loadRecommendations();
      }
    });

    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [personalizedRecommendations, filters]);

  const loadRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await getPersonalizedRecommendations(userId);
    } catch (err) {
      setError('Failed to load personalized recommendations. Please try again.');
      console.error('Recommendation loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...personalizedRecommendations];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(rec => rec.type === filters.type);
    }

    // Filter by difficulty
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(rec => rec.difficulty === filters.difficulty);
    }

    // Filter by price range
    filtered = filtered.filter(rec => {
      if (!rec.estimatedCost) return true;
      return rec.estimatedCost >= filters.priceRange.min && rec.estimatedCost <= filters.priceRange.max;
    });

    // Filter by time range
    if (filters.timeRange !== 'all') {
      filtered = filtered.filter(rec => {
        if (!rec.estimatedTime) return true;
        const timeCategory = categorizeTime(rec.estimatedTime);
        return timeCategory === filters.timeRange;
      });
    }

    // Filter by relevance threshold
    filtered = filtered.filter(rec => rec.relevanceScore >= filters.relevanceThreshold);

    // Sort by relevance score
    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Limit results
    filtered = filtered.slice(0, maxRecommendations);

    setFilteredRecommendations(filtered);
  };

  const categorizeTime = (timeString: string): 'quick' | 'medium' | 'long' => {
    const time = timeString.toLowerCase();
    if (time.includes('minute') || time.includes('hour')) return 'quick';
    if (time.includes('day') || time.includes('week')) return 'medium';
    return 'long';
  };

  const handleRecommendationAction = (recommendation: PersonalizedRecommendation, action: 'accept' | 'dismiss' | 'feedback') => {
    switch (action) {
      case 'accept':
        // Handle accepting recommendation (e.g., add to cart, start project)
        console.log('Accepting recommendation:', recommendation);
        break;
      case 'dismiss':
        // Handle dismissing recommendation
        console.log('Dismissing recommendation:', recommendation);
        break;
      case 'feedback':
        setSelectedRecommendation(recommendation);
        setShowFeedbackModal(true);
        break;
    }
  };

  const handleFeedbackSubmit = (feedback: {
    rating: number;
    comment: string;
    helpful: boolean;
    reasons: string[];
  }) => {
    console.log('Feedback submitted for recommendation:', selectedRecommendation, feedback);
    // Here you would typically send the feedback to your analytics service
    setShowFeedbackModal(false);
    setSelectedRecommendation(null);
  };

  const getRecommendationStats = () => {
    const stats = {
      total: personalizedRecommendations.length,
      components: personalizedRecommendations.filter(r => r.type === 'component').length,
      projects: personalizedRecommendations.filter(r => r.type === 'project').length,
      bundles: personalizedRecommendations.filter(r => r.type === 'bundle').length,
      avgRelevance: personalizedRecommendations.length > 0 
        ? personalizedRecommendations.reduce((sum, r) => sum + r.relevanceScore, 0) / personalizedRecommendations.length 
        : 0
    };
    return stats;
  };

  const stats = getRecommendationStats();

  return (
    <div className={`personalized-recommendations ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <SparklesIcon className="h-6 w-6 text-purple-500 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Personalized Recommendations</h2>
              <p className="text-sm text-gray-600">
                Tailored suggestions based on your preferences and project history
              </p>
            </div>
          </div>
          <button
            onClick={loadRecommendations}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.components}</div>
          <div className="text-sm text-gray-500">Components</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border text-center">
          <div className="text-2xl font-bold text-green-600">{stats.projects}</div>
          <div className="text-sm text-gray-500">Projects</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.bundles}</div>
          <div className="text-sm text-gray-500">Bundles</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border text-center">
          <div className="text-2xl font-bold text-orange-600">{(stats.avgRelevance * 100).toFixed(0)}%</div>
          <div className="text-sm text-gray-500">Avg Relevance</div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6">
          <RecommendationFilters 
            filters={filters}
            onFiltersChange={setFilters}
            totalRecommendations={personalizedRecommendations.length}
            filteredCount={filteredRecommendations.length}
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <InformationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow border animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredRecommendations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow border">
          <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Found</h3>
          <p className="text-gray-500 mb-4">
            {personalizedRecommendations.length === 0 
              ? "We're still learning your preferences. Try using the system more to get personalized recommendations."
              : "No recommendations match your current filters. Try adjusting the filters above."
            }
          </p>
          {personalizedRecommendations.length === 0 && (
            <button
              onClick={loadRecommendations}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
            >
              Generate Recommendations
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((recommendation) => (
            <RecommendationCard
              key={`${recommendation.type}-${recommendation.itemId}`}
              recommendation={recommendation}
              onAction={handleRecommendationAction}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {filteredRecommendations.length > 0 && filteredRecommendations.length < personalizedRecommendations.length && (
        <div className="text-center mt-8">
          <button
            onClick={() => setFilters(prev => ({ ...prev, relevanceThreshold: prev.relevanceThreshold - 0.1 }))}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border"
          >
            Show More Recommendations
          </button>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && selectedRecommendation && (
        <FeedbackModal
          recommendation={selectedRecommendation}
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          onSubmit={handleFeedbackSubmit}
        />
      )}

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">How personalized recommendations work:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-600">
              <li>Based on your project history and component usage patterns</li>
              <li>Considers your skill level and preferred project types</li>
              <li>Learns from your feedback to improve future suggestions</li>
              <li>Updates automatically as you use the system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;