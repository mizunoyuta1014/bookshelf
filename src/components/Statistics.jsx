import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useStatistics } from '../hooks/useStatistics';
import { bookService } from '../services/bookService';
import BookCategoryPieChart from './Charts/PieChart';
import MonthlyProgressChart from './Charts/LineChart';
import ReadingProgressBars from './Charts/ProgressBar';
import YearSelector from './YearSelector';
import ExportButton from './ExportButton';
import './Charts/Charts.css';
import './Statistics.css';
import './ExportButton.css';

const Statistics = () => {
  const { currentUser } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [targetBooks, setTargetBooks] = useState(40);

  const statistics = useStatistics(books, targetBooks);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedBooks = await bookService.getBooks(currentUser.uid, selectedYear);
        setBooks(fetchedBooks);
        setError(null);
      } catch (error) {
        console.error('統計データ取得エラー:', error);
        setError('統計データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [currentUser, selectedYear]);

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  const handleTargetChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setTargetBooks(value);
    }
  };

  if (loading) {
    return (
      <div className="statistics-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>統計データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-page">
        <div className="error-message">
          <p>エラー: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="statistics-page">
      <div className="statistics-header">
        <h1 className="page-title">読書統計</h1>
        
        <div className="controls">
          <YearSelector 
            selectedYear={selectedYear} 
            onYearChange={handleYearChange} 
          />
          
          <div className="target-setter">
            <label htmlFor="target-books">年間目標:</label>
            <input
              id="target-books"
              type="number"
              value={targetBooks}
              onChange={handleTargetChange}
              min="1"
              max="365"
              className="target-input"
            />
            <span>冊</span>
          </div>
          
          <div className="export-section">
            <span className="export-label">統計エクスポート:</span>
            <ExportButton 
              books={books}
              statistics={statistics} 
              year={selectedYear} 
              type="statistics" 
            />
          </div>
        </div>
      </div>

      {books.length === 0 ? (
        <div className="no-data-container">
          <p className="no-data-message">
            {selectedYear}年のデータがありません。
          </p>
        </div>
      ) : (
        <div className="statistics-content">
          <div className="summary-section">
            <h2 className="section-title">概要</h2>
            <div className="summary-grid">
              <div className="summary-card">
                <h3>登録済み</h3>
                <p className="summary-number">{statistics.readingProgress.totalBooks}</p>
                <span className="summary-label">冊</span>
              </div>
              <div className="summary-card">
                <h3>読了済み</h3>
                <p className="summary-number">{statistics.readingProgress.readBooks}</p>
                <span className="summary-label">冊</span>
              </div>
              <div className="summary-card">
                <h3>所有済み</h3>
                <p className="summary-number">{statistics.readingProgress.ownedBooks}</p>
                <span className="summary-label">冊</span>
              </div>
              <div className="summary-card">
                <h3>読了率</h3>
                <p className="summary-number">{statistics.completionRate}</p>
                <span className="summary-label">%</span>
              </div>
              <div className="summary-card">
                <h3>月平均</h3>
                <p className="summary-number">{statistics.readingPace}</p>
                <span className="summary-label">冊/月</span>
              </div>
            </div>
          </div>

          <ReadingProgressBars readingProgress={statistics.readingProgress} />

          <div className="charts-section">
            <div className="charts-grid">
              <BookCategoryPieChart data={statistics.categoryStats} />
              <MonthlyProgressChart data={statistics.monthlyStats} />
            </div>
          </div>

          <div className="recent-books-section">
            <h2 className="section-title">最近の登録</h2>
            <div className="recent-books-list">
              {statistics.recentBooks.map((book, index) => (
                <div key={book.id} className="recent-book-item">
                  <div className="book-info">
                    <h4 className="book-title">{book.bookTitle}</h4>
                    <p className="book-author">{book.author}</p>
                    <p className="book-category">{book.category}</p>
                  </div>
                  <div className="book-status">
                    <span className={`status ${book.isRead ? 'read' : 'unread'}`}>
                      {book.isRead ? '読了' : '未読'}
                    </span>
                    <span className={`status ${book.isOwned ? 'owned' : 'not-owned'}`}>
                      {book.isOwned ? '所有' : '未所有'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="top-categories-section">
            <h2 className="section-title">カテゴリランキング</h2>
            <div className="top-categories-list">
              {statistics.topCategories.map((item, index) => (
                <div key={item.category} className="category-item">
                  <div className="category-rank">{index + 1}</div>
                  <div className="category-name">{item.category}</div>
                  <div className="category-count">{item.count}冊</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;