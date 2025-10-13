import React, { useState } from 'react';
import { PersonalizedRecommendation } from '../../types';
import { 
  XMarkIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  StarIcon,
  ChatBubbleLeftIcon
} from '../icons/AnalyticsIcons';

interface FeedbackModalProps {
  recommendation: PersonalizedRecommendation;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    rating: number;
    comment: string;
    helpful: boolean;
    reasons: string[];
  }) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  recommendation,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackReasons = [
    'Relevant to my projects',
    'Good price point',
    'Appropriate difficulty level',
    'Clear explanation',
    'Matches my preferences',
    'Not relevant to me',
    'Too expensive',
    'Wrong difficulty level',
    'Poor explanation',
    'Already have this',
    'Not interested in this type',
    'Recommendation seems random'
  ];

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (helpful === null || rating === 0) {
      return; // Don't submit if required fields are missing
    }

    setIsSubmitting(true);
    
    try {
      await onSubmit({
        rating,
        comment,
        helpful,
        reasons: selectedReasons
      });
      
      // Reset form
      setRating(0);
      setHoveredRating(0);
      setComment('');
      setHelpful(null);
      setSelectedReasons([]);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setHelpful(null);
    setSelectedReasons([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <ChatBubbleLeftIcon className="h-6 w-6 text-blue-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Recommendation Feedback</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Recommendation Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{recommendation.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{recommendation.description}</p>
              <div className="mt-2 flex items-center space-x-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {recommendation.type}
                </span>
                <span className="text-xs text-gray-500">
                  {(recommendation.relevanceScore * 100).toFixed(0)}% relevance
                </span>
              </div>
            </div>

            {/* Helpful Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Was this recommendation helpful?
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setHelpful(true)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    helpful === true
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <HandThumbUpIcon className="h-4 w-4 mr-2" />
                  Yes, helpful
                </button>
                <button
                  type="button"
                  onClick={() => setHelpful(false)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    helpful === false
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <HandThumbDownIcon className="h-4 w-4 mr-2" />
                  No, not helpful
                </button>
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Rate this recommendation (1-5 stars)
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="text-2xl transition-colors focus:outline-none"
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                  >
                    <StarIcon 
                      className={`h-8 w-8 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-gray-600">
                    {rating} star{rating !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Reasons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Why do you feel this way? (Select all that apply)
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                {feedbackReasons.map((reason) => (
                  <label key={reason} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedReasons.includes(reason)}
                      onChange={() => handleReasonToggle(reason)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional comments (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Tell us more about your experience with this recommendation..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={helpful === null || rating === 0 || isSubmitting}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            <p className="text-xs text-gray-500 text-center">
              Your feedback helps us improve our recommendation system. Thank you!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;