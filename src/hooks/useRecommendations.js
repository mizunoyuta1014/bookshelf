import { useState, useEffect, useCallback } from 'react';
import { recommendationEngine } from '../utils/recommendationEngine';

export const useRecommendations = (userId, userBooks = [], options = {}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const {
    maxRecommendations = 5,
    excludeRead = true,
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000 // 5分
  } = options;

  const generateRecommendations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newRecommendations = recommendationEngine.generateRecommendations(
        userBooks,
        [],
        {
          maxRecommendations,
          excludeRead,
          userId
        }
      );

      setRecommendations(newRecommendations);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      setError('推薦の生成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [userId, userBooks, maxRecommendations, excludeRead]);

  const refreshRecommendations = useCallback(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  const provideFeedback = useCallback((book, feedbackType) => {
    if (!userId || !book?.title) return;

    try {
      recommendationEngine.updateRecommendationFeedback(
        userId,
        book.title,
        feedbackType
      );

      setRecommendations(prev => 
        prev.map(rec => 
          rec.title === book.title 
            ? { ...rec, userFeedback: feedbackType }
            : rec
        )
      );

      if (feedbackType === 'negative') {
        setTimeout(() => {
          refreshRecommendations();
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to save feedback:', err);
    }
  }, [userId, refreshRecommendations]);

  const addToWishlist = useCallback(async (book) => {
    if (!book) return false;

    try {
      const wishlistItem = {
        title: book.title,
        author: book.author,
        category: book.category || 'その他',
        source: 'recommendation',
        addedAt: new Date().toISOString()
      };

      const existingWishlist = localStorage.getItem(`wishlist_${userId}`);
      const wishlist = existingWishlist ? JSON.parse(existingWishlist) : [];
      
      const alreadyExists = wishlist.some(item => 
        item.title?.toLowerCase() === book.title?.toLowerCase()
      );

      if (alreadyExists) {
        return false;
      }

      wishlist.push(wishlistItem);
      localStorage.setItem(`wishlist_${userId}`, JSON.stringify(wishlist));

      setRecommendations(prev => 
        prev.map(rec => 
          rec.title === book.title 
            ? { ...rec, addedToWishlist: true }
            : rec
        )
      );

      return true;
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      return false;
    }
  }, [userId]);

  const getRecommendationHistory = useCallback(() => {
    if (!userId) return [];
    return recommendationEngine.getUserBehaviorHistory(userId);
  }, [userId]);

  const clearRecommendations = useCallback(() => {
    setRecommendations([]);
    setLastUpdated(null);
  }, []);

  useEffect(() => {
    if (userId && userBooks && autoRefresh) {
      generateRecommendations();
    }
  }, [userId, userBooks, autoRefresh, generateRecommendations]);

  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(() => {
      if (recommendations.length > 0) {
        generateRecommendations();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, recommendations.length, generateRecommendations]);

  const stats = {
    totalRecommendations: recommendations.length,
    lastUpdated,
    hasPositiveFeedback: recommendations.some(rec => rec.userFeedback === 'positive'),
    hasNegativeFeedback: recommendations.some(rec => rec.userFeedback === 'negative'),
    averageScore: recommendations.length > 0
      ? recommendations.reduce((sum, rec) => sum + rec.recommendationScore, 0) / recommendations.length
      : 0
  };

  return {
    recommendations,
    isLoading,
    error,
    refreshRecommendations,
    provideFeedback,
    addToWishlist,
    getRecommendationHistory,
    clearRecommendations,
    stats
  };
};