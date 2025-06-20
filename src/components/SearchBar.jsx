import React, { useState, useRef, useEffect } from 'react';
import { IoSearch, IoClose, IoTrendingUp } from 'react-icons/io5';
import './SearchBar.css';

const SearchBar = ({ 
  searchQuery, 
  setSearchQuery, 
  placeholder = "書名・著者で検索...",
  suggestions = [],
  onSuggestionClick,
  showTrending = true
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const recentSearches = [
    'プログラミング',
    'データ分析',
    'AI',
    'ビジネス',
    'マネジメント'
  ];

  const trendingSearches = [
    '機械学習',
    'React',
    'AWS',
    'データサイエンス',
    'アジャイル'
  ];

  const handleClear = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
  };

  const handleBlur = (e) => {
    // Don't blur if clicking on suggestions
    if (suggestionsRef.current && suggestionsRef.current.contains(e.relatedTarget)) {
      return;
    }
    setIsFocused(false);
    setTimeout(() => setShowSuggestions(false), 150);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    inputRef.current?.blur();
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="search-bar">
      <div className={`search-input-container ${isFocused ? 'focused' : ''}`}>
        <IoSearch className="search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {searchQuery && (
          <button className="clear-button" onClick={handleClear} type="button">
            <IoClose />
          </button>
        )}
        
        {showSuggestions && (isFocused || searchQuery) && (
          <div ref={suggestionsRef} className="suggestions-dropdown">
            {searchQuery && filteredSuggestions.length > 0 && (
              <div className="suggestions-section">
                <div className="suggestions-header">
                  <span className="suggestions-title">推奨</span>
                </div>
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={`suggestion-${index}`}
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                    type="button"
                  >
                    <IoSearch className="suggestion-icon" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
            
            {!searchQuery && (
              <>
                {recentSearches.length > 0 && (
                  <div className="suggestions-section">
                    <div className="suggestions-header">
                      <span className="suggestions-title">最近の検索</span>
                    </div>
                    {recentSearches.slice(0, 3).map((search, index) => (
                      <button
                        key={`recent-${index}`}
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(search)}
                        type="button"
                      >
                        <IoSearch className="suggestion-icon" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                )}
                
                {showTrending && trendingSearches.length > 0 && (
                  <div className="suggestions-section">
                    <div className="suggestions-header">
                      <IoTrendingUp className="trending-icon" />
                      <span className="suggestions-title">トレンド</span>
                    </div>
                    {trendingSearches.slice(0, 3).map((trend, index) => (
                      <button
                        key={`trend-${index}`}
                        className="suggestion-item trending"
                        onClick={() => handleSuggestionClick(trend)}
                        type="button"
                      >
                        <IoTrendingUp className="suggestion-icon trending" />
                        <span>{trend}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            
            {searchQuery && filteredSuggestions.length === 0 && (
              <div className="no-suggestions">
                <span>"検索結果がありません</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;