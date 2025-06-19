import React, { useState } from 'react';
import { IoFilter, IoClose, IoChevronDown, IoChevronUp, IoCheckbox, IoSquareOutline } from 'react-icons/io5';
import './FilterPanel.css';

const FilterPanel = ({ 
  filters, 
  updateFilter, 
  updateDateRange, 
  clearFilters, 
  hasActiveFilters 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const categories = [
    'データ分析',
    'インフラ',
    'ビジネス',
    'コンサル',
    'その他'
  ];

  const bookPlaces = [
    '自宅',
    '電子書籍',
    'その他'
  ];

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.bookPlace) count++;
    if (filters.isRead !== 'all') count++;
    if (filters.isOwned !== 'all') count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    return count;
  };

  const activeCount = getActiveFilterCount();

  return (
    <div className={`filter-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="filter-header" onClick={toggleExpanded}>
        <div className="filter-title">
          <div className="filter-icon-container">
            <IoFilter className="filter-icon" />
            {activeCount > 0 && (
              <span className="filter-badge">{activeCount}</span>
            )}
          </div>
          <span className="filter-text">フィルター</span>
          {activeCount > 0 && (
            <span className="filter-status">適用中</span>
          )}
        </div>
        <div className="filter-toggle">
          {isExpanded ? <IoChevronUp /> : <IoChevronDown />}
        </div>
      </div>

      {isExpanded && (
        <div className="filter-content">
          {/* Quick Filter Chips */}
          <div className="quick-filters">
            <div className="quick-filter-section">
              <span className="quick-filter-label">クイックフィルター:</span>
              <div className="quick-filter-chips">
                <button 
                  className={`filter-chip ${filters.isRead === 'read' ? 'active' : ''}`}
                  onClick={() => updateFilter('isRead', filters.isRead === 'read' ? 'all' : 'read')}
                  type="button"
                >
                  {filters.isRead === 'read' ? <IoCheckbox /> : <IoSquareOutline />}
                  読了済み
                </button>
                <button 
                  className={`filter-chip ${filters.isRead === 'unread' ? 'active' : ''}`}
                  onClick={() => updateFilter('isRead', filters.isRead === 'unread' ? 'all' : 'unread')}
                  type="button"
                >
                  {filters.isRead === 'unread' ? <IoCheckbox /> : <IoSquareOutline />}
                  未読
                </button>
                <button 
                  className={`filter-chip ${filters.isOwned === 'owned' ? 'active' : ''}`}
                  onClick={() => updateFilter('isOwned', filters.isOwned === 'owned' ? 'all' : 'owned')}
                  type="button"
                >
                  {filters.isOwned === 'owned' ? <IoCheckbox /> : <IoSquareOutline />}
                  所有済み
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Filters */}
          <div className="filter-grid">
            <div className="filter-group">
              <label className="filter-label">カテゴリ</label>
              <div className="select-wrapper">
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="filter-select"
                >
                  <option value="">すべてのカテゴリ</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-group">
              <label className="filter-label">保管場所</label>
              <div className="select-wrapper">
                <select
                  value={filters.bookPlace}
                  onChange={(e) => updateFilter('bookPlace', e.target.value)}
                  className="filter-select"
                >
                  <option value="">すべての場所</option>
                  {bookPlaces.map(place => (
                    <option key={place} value={place}>
                      {place}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-group date-group">
              <label className="filter-label">日付範囲</label>
              <div className="date-range-inputs">
                <div className="date-input-wrapper">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => updateDateRange(e.target.value, filters.dateRange.end)}
                    className="date-input"
                    placeholder="開始日"
                  />
                </div>
                <span className="date-separator">〜</span>
                <div className="date-input-wrapper">
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => updateDateRange(filters.dateRange.start, e.target.value)}
                    className="date-input"
                    placeholder="終了日"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="filter-actions">
            <div className="filter-summary">
              {activeCount > 0 ? (
                <span className="active-filters-text">
                  {activeCount}件のフィルターが適用中
                </span>
              ) : (
                <span className="no-filters-text">
                  フィルターが適用されていません
                </span>
              )}
            </div>
            {activeCount > 0 && (
              <button
                onClick={clearFilters}
                className="clear-filters-button"
                type="button"
              >
                <IoClose />
                すべてクリア
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;