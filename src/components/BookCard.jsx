import React, { useState } from "react";
import { IoPencil, IoTrash } from "react-icons/io5";
import { MdMenuBook, MdLibraryBooks, MdDateRange } from "react-icons/md";
import { FaUser, FaHome, FaTag } from "react-icons/fa";
import "./BookCard.css";

const BookCard = ({ 
  book, 
  onEdit, 
  onDelete, 
  onUpdateOwned, 
  onUpdateRead,
  highlightText,
  searchQuery,
  formatDate
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getBookCoverUrl = (title, author) => {
    if (!title) return null;
    
    // Use Google Books API for book covers
    const query = encodeURIComponent(`${title} ${author || ''}`.trim());
    return `https://books.google.com/books/content?id=${btoa(query).substring(0, 12)}&printsec=frontcover&img=1&zoom=1&source=gbs_api`;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'データ分析': '📊',
      'インフラ': '🔧',
      'ビジネス': '💼',
      'コンサル': '🤝',
      'その他': '📖'
    };
    return icons[category] || '📖';
  };

  const getPlaceIcon = (place) => {
    const icons = {
      '自宅': '🏠',
      '電子書籍': '📱',
      'その他': '📍'
    };
    return icons[place] || '📍';
  };

  return (
    <div className={`book-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="book-card-header">
        <div className="book-cover-container">
          <div className="book-cover">
            <img 
              src={getBookCoverUrl(book.bookTitle, book.author)}
              alt={book.bookTitle || '本のカバー'}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="book-cover-placeholder" style={{ display: 'none' }}>
              <MdMenuBook />
              <span>{book.bookTitle?.substring(0, 2) || '本'}</span>
            </div>
          </div>
        </div>
        
        <div className="book-info-main">
          <h3 
            className="book-title"
            dangerouslySetInnerHTML={{
              __html: highlightText(book.bookTitle || '無題', searchQuery)
            }}
          />
          <div className="book-author">
            <FaUser className="info-icon" />
            <span 
              dangerouslySetInnerHTML={{
                __html: highlightText(book.author || '著者不明', searchQuery)
              }}
            />
          </div>
          <div className="book-meta">
            <span className="book-date">
              <MdDateRange className="info-icon" />
              {formatDate(book.timestamp)}
            </span>
          </div>
        </div>

        <div className="book-actions">
          <div className="book-status">
            <label className="status-toggle owned">
              <input
                type="checkbox"
                checked={book.isOwned || false}
                onChange={(e) => onUpdateOwned(book.id, e.target.checked)}
              />
              <span className="toggle-label">所有</span>
              <div className="toggle-switch"></div>
            </label>
            <label className="status-toggle read">
              <input
                type="checkbox"
                checked={book.isRead || false}
                onChange={(e) => onUpdateRead(book.id, e.target.checked)}
              />
              <span className="toggle-label">読了</span>
              <div className="toggle-switch"></div>
            </label>
          </div>
          
          <div className="action-buttons">
            <button 
              className="action-btn edit-btn"
              onClick={() => onEdit(book)}
              title="編集"
            >
              <IoPencil />
            </button>
            <button 
              className="action-btn delete-btn"
              onClick={() => onDelete(book.id)}
              title="削除"
            >
              <IoTrash />
            </button>
            <button 
              className="action-btn expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? '折りたたむ' : '詳細を表示'}
            >
              {isExpanded ? '−' : '+'}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="book-card-details">
          <div className="detail-item">
            <FaHome className="detail-icon" />
            <span className="detail-label">保管場所:</span>
            <span className="detail-value">
              {getPlaceIcon(book.bookPlace)} {book.bookPlace || '未設定'}
            </span>
          </div>
          <div className="detail-item">
            <FaTag className="detail-icon" />
            <span className="detail-label">カテゴリ:</span>
            <span className="detail-value">
              {getCategoryIcon(book.category)} {book.category || '未設定'}
            </span>
          </div>
          <div className="reading-progress">
            <MdLibraryBooks className="detail-icon" />
            <span className="detail-label">読書状況:</span>
            <div className="progress-indicators">
              <span className={`progress-item ${book.isOwned ? 'active' : ''}`}>
                📚 所有済み
              </span>
              <span className={`progress-item ${book.isRead ? 'active' : ''}`}>
                ✅ 読了済み
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookCard;