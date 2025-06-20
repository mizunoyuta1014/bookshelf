import { useMemo } from 'react';
import {
  calculateCategoryStats,
  calculateReadingProgress,
  calculateMonthlyStats,
  calculateReadingPace,
  getTopCategories,
  calculateCompletionRate,
  getRecentBooks
} from '../utils/statistics';

export const useStatistics = (books, targetBooks = 40) => {
  const statistics = useMemo(() => {
    if (!books || books.length === 0) {
      return {
        categoryStats: {},
        readingProgress: {
          totalBooks: 0,
          readBooks: 0,
          unreadBooks: 0,
          ownedBooks: 0,
          progressPercentage: 0,
          targetBooks,
          remainingBooks: targetBooks
        },
        monthlyStats: {},
        readingPace: 0,
        topCategories: [],
        completionRate: 0,
        recentBooks: []
      };
    }

    return {
      categoryStats: calculateCategoryStats(books),
      readingProgress: calculateReadingProgress(books, targetBooks),
      monthlyStats: calculateMonthlyStats(books),
      readingPace: calculateReadingPace(books),
      topCategories: getTopCategories(books),
      completionRate: calculateCompletionRate(books),
      recentBooks: getRecentBooks(books)
    };
  }, [books, targetBooks]);

  return statistics;
};