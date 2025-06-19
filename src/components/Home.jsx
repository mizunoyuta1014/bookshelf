import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { bookService } from "../services/bookService";
import YearSelector from "./YearSelector";
import "./Home.css";

const Home = () => {
  const { currentUser } = useAuth();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState({
    totalBooks: 0,
    readBooks: 0,
    ownedBooks: 0,
    recentBooks: [],
    monthlyProgress: [],
    categories: {},
    readingGoal: 40
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get books for the selected year
        const books = await bookService.getBooks(currentUser.uid, selectedYear);
        
        // Calculate statistics
        const totalBooks = books.length;
        const readBooks = books.filter(book => book.isRead).length;
        const ownedBooks = books.filter(book => book.isOwned).length;
        
        // Get recent books (last 5)
        const recentBooks = books
          .sort((a, b) => {
            const aTime = a.timestamp?.toDate?.() || new Date(0);
            const bTime = b.timestamp?.toDate?.() || new Date(0);
            return bTime - aTime;
          })
          .slice(0, 5);
        
        // Calculate monthly progress
        const monthlyProgress = calculateMonthlyProgress(books);
        
        // Calculate category distribution
        const categories = books.reduce((acc, book) => {
          const category = book.category || 'その他';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});
        
        setDashboardData({
          totalBooks,
          readBooks,
          ownedBooks,
          recentBooks,
          monthlyProgress,
          categories,
          readingGoal: 40
        });
        
        setError(null);
      } catch (error) {
        console.error('ダッシュボードデータ取得エラー:', error);
        setError('データの取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser, selectedYear]);

  const calculateMonthlyProgress = (books) => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(2024, i).toLocaleDateString('ja-JP', { month: 'short' }),
      total: 0,
      read: 0
    }));

    books.forEach(book => {
      if (book.timestamp && book.timestamp.toDate) {
        const date = book.timestamp.toDate();
        const month = date.getMonth();
        months[month].total += 1;
        if (book.isRead) {
          months[month].read += 1;
        }
      }
    });

    return months;
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return '日付不明';
    }
    const date = timestamp.toDate();
    return date.toLocaleDateString('ja-JP', {
      month: 'numeric',
      day: 'numeric'
    });
  };

  const getProgressPercentage = () => {
    return Math.min((dashboardData.readBooks / dashboardData.readingGoal) * 100, 100);
  };

  const getRemainingBooks = () => {
    return Math.max(dashboardData.readingGoal - dashboardData.readBooks, 0);
  };

  if (!currentUser) {
    return (
      <div className="home-container">
        <div className="auth-prompt">
          <div className="auth-content">
            <div className="auth-icon">📚</div>
            <h2>ログインが必要です</h2>
            <p>ダッシュボードを表示するにはログインしてください。</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>ダッシュボードを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <p>エラー: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">📊 読書ダッシュボード</h1>
          <p className="dashboard-subtitle">Welcome back, {currentUser.displayName || currentUser.email}!</p>
        </div>
        <YearSelector 
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3 className="stat-number">{dashboardData.totalBooks}</h3>
            <p className="stat-label">総冊数</p>
          </div>
        </div>
        
        <div className="stat-card success">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <h3 className="stat-number">{dashboardData.readBooks}</h3>
            <p className="stat-label">読了済み</p>
          </div>
        </div>
        
        <div className="stat-card info">
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <h3 className="stat-number">{dashboardData.ownedBooks}</h3>
            <p className="stat-label">所有済み</p>
          </div>
        </div>
        
        <div className="stat-card warning">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3 className="stat-number">{getRemainingBooks()}</h3>
            <p className="stat-label">目標まで</p>
          </div>
        </div>
      </div>

      {/* Reading Goal Progress */}
      <div className="progress-section">
        <div className="section-header">
          <h2>🎯 年間読書目標</h2>
          <span className="goal-text">{dashboardData.readBooks} / {dashboardData.readingGoal} 冊</span>
        </div>
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="progress-stats">
            <span className="progress-percentage">{Math.round(getProgressPercentage())}%</span>
            {getRemainingBooks() > 0 && (
              <span className="progress-remaining">あと{getRemainingBooks()}冊で目標達成!</span>
            )}
            {getRemainingBooks() === 0 && (
              <span className="progress-achieved">🎉 目標達成おめでとうございます!</span>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Recent Books */}
        <div className="recent-books">
          <div className="section-header">
            <h2>🕰️ 最近の記録</h2>
          </div>
          <div className="recent-list">
            {dashboardData.recentBooks.length > 0 ? (
              dashboardData.recentBooks.map((book, index) => (
                <div key={book.id || index} className="recent-item">
                  <div className="recent-info">
                    <h4 className="recent-title">{book.bookTitle || '無題'}</h4>
                    <p className="recent-author">{book.author || '著者不明'}</p>
                    <span className="recent-date">{formatDate(book.timestamp)}</span>
                  </div>
                  <div className="recent-status">
                    {book.isRead && <span className="status-badge read">読了</span>}
                    {book.isOwned && <span className="status-badge owned">所有</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>まだ本が登録されていません。</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Progress Chart */}
        <div className="monthly-progress">
          <div className="section-header">
            <h2>📈 月別進捗</h2>
          </div>
          <div className="chart-container">
            {dashboardData.monthlyProgress.map((month, index) => (
              <div key={index} className="month-bar">
                <div className="bar-container">
                  <div 
                    className="bar total"
                    style={{ height: `${(month.total / Math.max(...dashboardData.monthlyProgress.map(m => m.total), 1)) * 100}%` }}
                  >
                    <div 
                      className="bar read"
                      style={{ height: month.total > 0 ? `${(month.read / month.total) * 100}%` : '0%' }}
                    ></div>
                  </div>
                  <div className="bar-label">{month.monthName}</div>
                  <div className="bar-count">{month.read}/{month.total}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="category-distribution">
          <div className="section-header">
            <h2>🏷️ カテゴリ分布</h2>
          </div>
          <div className="category-list">
            {Object.entries(dashboardData.categories).length > 0 ? (
              Object.entries(dashboardData.categories)
                .sort(([,a], [,b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="category-item">
                    <div className="category-info">
                      <span className="category-name">{category}</span>
                      <span className="category-count">{count}冊</span>
                    </div>
                    <div className="category-bar">
                      <div 
                        className="category-fill"
                        style={{ 
                          width: `${(count / dashboardData.totalBooks) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="empty-state">
                <p>カテゴリデータがありません。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
