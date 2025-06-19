import { useState, useMemo } from 'react';

export const useSearch = (items) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase();
    
    return items.filter(item => {
      return (
        (item.bookTitle && item.bookTitle.toLowerCase().includes(query)) ||
        (item.author && item.author.toLowerCase().includes(query))
      );
    });
  }, [items, searchQuery]);

  const highlightText = (text, query) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
    highlightText
  };
};