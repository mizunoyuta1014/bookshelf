import { useState, useMemo } from 'react';

export const useFilter = (items) => {
  const [filters, setFilters] = useState({
    category: '',
    bookPlace: '',
    isRead: 'all', // 'all', 'read', 'unread'
    isOwned: 'all', // 'all', 'owned', 'not-owned'
    dateRange: {
      start: '',
      end: ''
    }
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Category filter
      if (filters.category && item.category !== filters.category) {
        return false;
      }

      // Book place filter
      if (filters.bookPlace && item.bookPlace !== filters.bookPlace) {
        return false;
      }

      // Read status filter
      if (filters.isRead === 'read' && !item.isRead) {
        return false;
      }
      if (filters.isRead === 'unread' && item.isRead) {
        return false;
      }

      // Owned status filter
      if (filters.isOwned === 'owned' && !item.isOwned) {
        return false;
      }
      if (filters.isOwned === 'not-owned' && item.isOwned) {
        return false;
      }

      // Date range filter
      if (filters.dateRange.start || filters.dateRange.end) {
        if (!item.timestamp || !item.timestamp.toDate) {
          return false;
        }
        
        const itemDate = item.timestamp.toDate();
        
        if (filters.dateRange.start) {
          const startDate = new Date(filters.dateRange.start);
          if (itemDate < startDate) {
            return false;
          }
        }
        
        if (filters.dateRange.end) {
          const endDate = new Date(filters.dateRange.end);
          endDate.setHours(23, 59, 59, 999); // End of day
          if (itemDate > endDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [items, filters]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateDateRange = (start, end) => {
    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      bookPlace: '',
      isRead: 'all',
      isOwned: 'all',
      dateRange: {
        start: '',
        end: ''
      }
    });
  };

  const hasActiveFilters = () => {
    return filters.category !== '' ||
           filters.bookPlace !== '' ||
           filters.isRead !== 'all' ||
           filters.isOwned !== 'all' ||
           filters.dateRange.start !== '' ||
           filters.dateRange.end !== '';
  };

  return {
    filters,
    filteredItems,
    updateFilter,
    updateDateRange,
    clearFilters,
    hasActiveFilters
  };
};