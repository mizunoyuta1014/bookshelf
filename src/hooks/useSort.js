import { useState, useMemo } from 'react';

export const useSort = (items) => {
  const [sortConfig, setSortConfig] = useState({
    key: 'timestamp',
    direction: 'desc'
  });

  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return items;

    return [...items].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle timestamp sorting
      if (sortConfig.key === 'timestamp') {
        if (!aValue || !aValue.toDate) return 1;
        if (!bValue || !bValue.toDate) return -1;
        aValue = aValue.toDate();
        bValue = bValue.toDate();
      }

      // Handle string sorting (case insensitive)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      // Handle boolean sorting
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Compare values
      let result = 0;
      if (aValue < bValue) {
        result = -1;
      } else if (aValue > bValue) {
        result = 1;
      }

      return sortConfig.direction === 'asc' ? result : -result;
    });
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const getSortClass = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return 'sortable';
    }
    return `sortable sorted-${sortConfig.direction}`;
  };

  return {
    sortedItems,
    requestSort,
    getSortIcon,
    getSortClass,
    sortConfig
  };
};