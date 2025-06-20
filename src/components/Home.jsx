import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/SupabaseAuthContext.jsx";
import { supabaseService } from "../services/supabaseService";
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

  const loadDashboardData = async () => {
    if (!currentUser) {
      console.log('認証されたユーザーが見つかりません');
      setLoading(false);
      setError(null);
      return;
    }

    let timeoutId;
    try {
      setLoading(true);
      setError(null);
      
      // 60秒でタイムアウトさせる
      timeoutId = setTimeout(() => {
        setError('データの読み込みがタイムアウトしました。ページを再読み込みしてください。');
        setLoading(false);
      }, 60000);
      
      console.log('ダッシュボードデータを読み込み開始', { 
        selectedYear, 
        userId: currentUser.id,
        timestamp: new Date().toISOString()
      });
      
      // Get books for the selected year
      const books = await supabaseService.getBooks({ year: selectedYear, userId: currentUser.id });
      console.log('取得した書籍データ:', books);
      
      clearTimeout(timeoutId);
      
      // Calculate statistics
      const totalBooks = books.length;
      const readBooks = books.filter(book => book.is_read).length;
      const ownedBooks = books.filter(book => book.is_owned).length;
      
      // Get recent books (last 5)
      const recentBooks = books
        .sort((a, b) => {
          let aTime, bTime;
          
          if (a.created_at) {
            if (typeof a.created_at === 'string') {
              aTime = new Date(a.created_at);
            } else if (a.created_at.toDate) {
              aTime = a.created_at.toDate();
            }
          }
          aTime = aTime || new Date(0);
          
          if (b.created_at) {
            if (typeof b.created_at === 'string') {
              bTime = new Date(b.created_at);
            } else if (b.created_at.toDate) {
              bTime = b.created_at.toDate();
            }
          }
          bTime = bTime || new Date(0);
          
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
      
      console.log('ダッシュボードデータ更新完了:', { 
        totalBooks, 
        readBooks, 
        ownedBooks,
        timestamp: new Date().toISOString()
      });
      setError(null);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('ダッシュボードデータ取得エラー:', {
        error: error.message,
        stack: error.stack,
        selectedYear,
        userId: currentUser?.id,
        timestamp: new Date().toISOString()
      });
      setError(`データの取得に失敗しました: ${error.message}`);
      setLoading(false);
    } finally {
      clearTimeout(timeoutId);
      console.log('ダッシュボードデータ読み込み完了', {
        timestamp: new Date().toISOString()
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let loadingTimeout;
    
    const loadData = async () => {
      if (!mounted) return;
      
      // 5秒でローディング状態をリセットするフェイルセーフ
      loadingTimeout = setTimeout(() => {
        if (mounted) {
          console.warn('ローディングのフェイルセーフが作動しました');
          setLoading(false);
          setError('データの読み込みに時間がかかっています。しばらくお待ちください。');
        }
      }, 5000);
      
      try {
        await loadDashboardData();
        clearTimeout(loadingTimeout);
      } catch (error) {
        clearTimeout(loadingTimeout);
        if (mounted) {
          console.error('useEffect内でのエラー:', error);
          setError('データの読み込み中にエラーが発生しました。');
          setLoading(false);
        }
      }
    };
    
    if (currentUser) {
      loadData();
    } else {
      setLoading(false);
      setError(null);
    }
    
    return () => {
      mounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [currentUser, selectedYear]);

  const calculateMonthlyProgress = (books) => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(2024, i).toLocaleDateString('ja-JP', { month: 'short' }),
      total: 0,
      read: 0
    }));

    books.forEach(book => {
      let date;
      if (book.created_at) {
        if (typeof book.created_at === 'string') {
          // Supabase PostgreSQL timestamp
          date = new Date(book.created_at);
        } else if (book.created_at.toDate) {
          // Firebase timestamp
          date = book.created_at.toDate();
        }
        
        if (date && !isNaN(date.getTime())) {
          const month = date.getMonth();
          months[month].total += 1;
          if (book.is_read) {
            months[month].read += 1;
          }
        }
      }
    });

    return months;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return '日付不明';
    }
    
    let date;
    if (typeof timestamp === 'string') {
      // Supabase PostgreSQL timestamp
      date = new Date(timestamp);
    } else if (timestamp.toDate) {
      // Firebase timestamp
      date = timestamp.toDate();
    } else {
      return '日付不明';
    }
    
    if (isNaN(date.getTime())) {
      return '日付不明';
    }
    
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
          <h3>データの読み込みに問題があります</h3>
          <p>エラー: {error}</p>
          <div className="error-actions">
            <button 
              className="retry-button"
              onClick={() => {
                setError(null);
                setLoading(true);
                loadDashboardData();
              }}
            >
              🔄 再試行
            </button>
            <button 
              className="fallback-button"
              onClick={() => {
                setError(null);
                setDashboardData({
                  totalBooks: 0,
                  readBooks: 0,
                  ownedBooks: 0,
                  recentBooks: [],
                  monthlyProgress: [],
                  categories: {},
                  readingGoal: 40
                });
              }}
            >
              📊 空のダッシュボードを表示
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">📊 読書ダッシュボード</h1>
          <p className="dashboard-subtitle">Welcome back, {currentUser.user_metadata?.full_name || currentUser.displayName || currentUser.email}!</p>
        </div>
        <div className="header-controls">
          <YearSelector 
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
          />
          <button 
            className="refresh-button"
            onClick={() => {
              setLoading(true);
              loadDashboardData();
            }}
            disabled={loading}
            title="データを再読み込み"
          >
            {loading ? '🔄' : '🔄'}
          </button>
        </div>
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
                    <h4 className="recent-title">{book.book_title || '無題'}</h4>
                    <p className="recent-author">{book.author || '著者不明'}</p>
                    <span className="recent-date">{formatDate(book.created_at)}</span>
                  </div>
                  <div className="recent-status">
                    {book.is_read && <span className="status-badge read">読了</span>}
                    {book.is_owned && <span className="status-badge owned">所有</span>}
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
