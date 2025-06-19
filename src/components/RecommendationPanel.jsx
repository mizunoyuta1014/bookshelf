import { useState } from 'react';
import { IoThumbsUp, IoThumbsDown, IoRefresh, IoBookOutline, IoBulb } from 'react-icons/io5';
import './RecommendationPanel.css';

const RecommendationPanel = ({ 
  recommendations, 
  isLoading, 
  onRefresh, 
  onFeedback,
  onAddToWishlist 
}) => {
  const [expandedReasons, setExpandedReasons] = useState({});
  const [feedbackGiven, setFeedbackGiven] = useState({});

  const toggleReasons = (index) => {
    setExpandedReasons(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleFeedback = (book, type) => {
    setFeedbackGiven(prev => ({
      ...prev,
      [book.title]: type
    }));
    onFeedback(book, type);
  };

  if (isLoading) {
    return (
      <div className="recommendation-panel loading">
        <div className="recommendation-header">
          <IoBulb className="recommendation-icon" />
          <h3>おすすめの本を探しています...</h3>
        </div>
        <div className="loading-skeleton">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-author"></div>
              <div className="skeleton-line skeleton-reason"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="recommendation-panel empty">
        <div className="recommendation-header">
          <IoBulb className="recommendation-icon" />
          <h3>おすすめの本</h3>
          <button 
            className="refresh-button" 
            onClick={onRefresh}
            title="推薦を更新"
          >
            <IoRefresh />
          </button>
        </div>
        <div className="empty-state">
          <IoBookOutline className="empty-icon" />
          <p>まだ推薦できる本がありません</p>
          <p className="empty-subtitle">読書記録を追加すると、あなたに合った本をおすすめします</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendation-panel">
      <div className="recommendation-header">
        <IoBulb className="recommendation-icon" />
        <h3>あなたにおすすめの本</h3>
        <button 
          className="refresh-button" 
          onClick={onRefresh}
          title="推薦を更新"
        >
          <IoRefresh />
        </button>
      </div>

      <div className="recommendations-list">
        {recommendations.map((book, index) => (
          <div key={`${book.title}-${index}`} className="recommendation-card">
            <div className="book-info">
              <h4 className="book-title">{book.title}</h4>
              <p className="book-author">{book.author}</p>
              
              {book.category && (
                <span className="book-category">{book.category}</span>
              )}
              
              <div className="recommendation-score">
                推薦度: {Math.round(book.recommendationScore * 100)}%
              </div>
            </div>

            <div className="recommendation-reasons">
              <button 
                className="reasons-toggle"
                onClick={() => toggleReasons(index)}
              >
                推薦理由 {expandedReasons[index] ? '▲' : '▼'}
              </button>
              
              {expandedReasons[index] && book.reasons && (
                <ul className="reasons-list">
                  {book.reasons.map((reason, reasonIndex) => (
                    <li key={reasonIndex} className="reason-item">
                      {reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="recommendation-actions">
              <button
                className="add-to-wishlist-button"
                onClick={() => onAddToWishlist(book)}
                title="読みたい本リストに追加"
              >
                <IoBookOutline />
                リストに追加
              </button>

              <div className="feedback-buttons">
                <button
                  className={`feedback-button positive ${
                    feedbackGiven[book.title] === 'positive' ? 'active' : ''
                  }`}
                  onClick={() => handleFeedback(book, 'positive')}
                  disabled={feedbackGiven[book.title]}
                  title="良い推薦"
                >
                  <IoThumbsUp />
                </button>
                <button
                  className={`feedback-button negative ${
                    feedbackGiven[book.title] === 'negative' ? 'active' : ''
                  }`}
                  onClick={() => handleFeedback(book, 'negative')}
                  disabled={feedbackGiven[book.title]}
                  title="適切でない推薦"
                >
                  <IoThumbsDown />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="recommendation-footer">
        <p className="footer-text">
          推薦は読書履歴とカテゴリ分析に基づいています
        </p>
      </div>
    </div>
  );
};

export default RecommendationPanel;