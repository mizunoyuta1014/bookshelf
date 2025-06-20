import { useEffect, useState } from "react";
import { useAuth } from "../contexts/SupabaseAuthContext.jsx";
import { supabaseService } from "../services/supabaseService";
import { useSearch } from "../hooks/useSearch";
import { useFilter } from "../hooks/useFilter";
import { useSort } from "../hooks/useSort";
import { useSimpleErrorHandler } from "./ErrorHandler.jsx";
import { getErrorMessage, getValidationError } from "../utils/errorMessages.js";
import SearchBar from "./SearchBar";
import FilterPanel from "./FilterPanel";
import { IoClose } from "react-icons/io5";
import YearSelector from "./YearSelector";
import ExportButton from "./ExportButton";
import BookCard from "./BookCard";
import RecommendationPanel from "./RecommendationPanel";
import { useRecommendations } from "../hooks/useRecommendations";
import "./Book.css";
import "./ExportButton.css";
import "./FilterPanel.css";
import "./BookCard.css";

const Books = () => {
  const { currentUser } = useAuth();
  const { showError, withErrorHandling } = useSimpleErrorHandler();
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [isEditPopupOpen, setEditPopupOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [bookPlace, setbookPlace] = useState("");
  const [category, setCategory] = useState("");
  const [isRead, setIsRead] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  const [rating, setRating] = useState(0);
  const [memo, setMemo] = useState('');

  const [postList, setPostList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isDbUpdated, setIsDbUpdated] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // 推薦機能
  const {
    recommendations,
    isLoading: isRecommendationLoading,
    refreshRecommendations,
    provideFeedback,
    addToWishlist
  } = useRecommendations(currentUser?.id, postList, {
    maxRecommendations: 5,
    excludeRead: true
  });

  // Filter functionality
  const { 
    filters, 
    filteredItems: filterResults, 
    updateFilter, 
    updateDateRange, 
    clearFilters, 
    hasActiveFilters 
  } = useFilter(postList);

  // Search functionality (applied to filtered results)
  const { searchQuery, setSearchQuery, filteredItems, highlightText } = useSearch(filterResults);

  // Sort functionality (applied to search and filter results)
  const { sortedItems, requestSort, getSortIcon, getSortClass } = useSort(filteredItems);

  const handleAddClick = () => {
    setPopupOpen(true);
  };

  const handleCloseClick = () => {
    setPopupOpen(false);
    setIsRead(false);
    setIsOwned(false);
    clearFormData();
  };

  const handleEditCloseClick = () => {
    setEditPopupOpen(false);
    setEditingPost(null);
    clearFormData();
  };

  const clearFormData = () => {
    setBookTitle("");
    setAuthor("");
    setbookPlace("");
    setCategory("");
    setIsRead(false);
    setIsOwned(false);
    setRating(0);
    setMemo('');
  };

  const selectBookPlace = (e) => {
    setbookPlace(e.target.value);
  };

  const selectCategory = (e) => {
    setCategory(e.target.value);
  };

  const createPost = async () => {
    const titleError = getValidationError('bookTitle', bookTitle);
    if (titleError) {
      showError(titleError, { context: '本の追加' });
      return;
    }

    if (!currentUser) {
      showError('ログインが必要です', { context: '認証' });
      return;
    }

    await withErrorHandling(async () => {
      await supabaseService.addBook({
        bookTitle: bookTitle || null,
        author: author || null,
        bookPlace: bookPlace || null,
        category: category || null,
        isRead: isRead,
        isOwned: isOwned,
        year: selectedYear,
        rating: rating,
        memo: memo || null
      });
      handleCloseClick();
      setIsDbUpdated(true);
    }, '本の追加');
  };

  // ユーザー別データを取得
  useEffect(() => {
    const getPosts = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const books = await supabaseService.getBooks({ year: selectedYear });
        setPostList(books);
        setError(null);
      } catch (error) {
        const errorMessage = getErrorMessage(error, 'データ取得');
        setError(errorMessage);
        showError(errorMessage, { context: 'データ取得' });
      } finally {
        setLoading(false);
      }
    };

    getPosts();
    setIsDbUpdated(false);
  }, [currentUser, selectedYear, isPopupOpen, isEditPopupOpen, isDbUpdated, showError]);

  const deletePost = async (id) => {
    if (!currentUser) return;
    
    await withErrorHandling(async () => {
      await supabaseService.deleteBook(id);
      setIsDbUpdated(true);
    }, '本の削除');
  };

  const updateOwned = async (id, isOwnedValue) => {
    if (!currentUser) return;
    
    await withErrorHandling(async () => {
      await supabaseService.updateBook(id, { isOwned: isOwnedValue });
      setIsDbUpdated(true);
    }, '所有状態の更新');
  };

  const updateRead = async (id, isReadValue) => {
    if (!currentUser) return;
    
    await withErrorHandling(async () => {
      await supabaseService.updateBook(id, { isRead: isReadValue });
      setIsDbUpdated(true);
    }, '読了状態の更新');
  };

  const handleEditClick = (post) => {
    setEditingPost(post);
    setBookTitle(post.bookTitle || "");
    setAuthor(post.author || "");
    setbookPlace(post.bookPlace || "");
    setCategory(post.category || "");
    setIsRead(post.isRead || false);
    setIsOwned(post.isOwned || false);
    setRating(post.rating || 0);
    setMemo(post.memo || '');
    setEditPopupOpen(true);
  };

  const updatePost = async () => {
    const titleError = getValidationError('bookTitle', bookTitle);
    if (titleError) {
      showError(titleError, { context: '本の更新' });
      return;
    }

    if (!editingPost || !currentUser) return;

    await withErrorHandling(async () => {
      await supabaseService.updateBook(editingPost.id, {
        bookTitle: bookTitle || null,
        author: author || null,
        bookPlace: bookPlace || null,
        category: category || null,
        isRead: isRead,
        isOwned: isOwned,
        rating: rating,
        memo: memo || null
      });
      
      handleEditCloseClick();
      setIsDbUpdated(true);
    }, '本の更新');
  };

  const formatDate = (timestamp) => {
    if (!timestamp) {
      return "日付不明";
    }
    
    let date;
    if (typeof timestamp === 'string') {
      // Supabase PostgreSQL timestamp
      date = new Date(timestamp);
    } else if (timestamp.toDate) {
      // Firebase timestamp
      date = timestamp.toDate();
    } else {
      return "日付不明";
    }
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const formattedMonth = month < 10 ? `0${month}` : month;
    return `${year}/${formattedMonth}`;
  };

  if (loading) {
    return (
      <div className="bookpage">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bookpage">
        <div className="error-message">
          <p>エラー: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bookpage">
      <div className="page-title">{selectedYear}年読書記録</div>
      <YearSelector 
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
      <div className="total-book-display">
        <p className="total-book-number">{postList.length}</p>
        <p>冊/40冊</p>
      </div>
      <div className="book-controls">
        <div className="add-book">
          <button onClick={handleAddClick} className="add-button">
            追加
          </button>
        </div>
        <div className="export-section">
          <span className="export-label">データエクスポート:</span>
          <ExportButton 
            books={postList} 
            year={selectedYear} 
            type="books" 
          />
        </div>
        <div className="recommendation-toggle">
          <button 
            onClick={() => setShowRecommendations(!showRecommendations)}
            className={`recommendation-toggle-button ${showRecommendations ? 'active' : ''}`}
          >
            💡 おすすめ
          </button>
        </div>
      </div>
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        placeholder="書名・著者で検索..."
      />
      <FilterPanel
        filters={filters}
        updateFilter={updateFilter}
        updateDateRange={updateDateRange}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Recommendation Panel */}
      {showRecommendations && (
        <RecommendationPanel
          recommendations={recommendations}
          isLoading={isRecommendationLoading}
          onRefresh={refreshRecommendations}
          onFeedback={provideFeedback}
          onAddToWishlist={addToWishlist}
        />
      )}

      {/* Sort Controls */}
      <div className="sort-controls">
        <div className="sort-options">
          <span className="sort-label">並び替え:</span>
          <div className="sort-buttons">
            <button 
              className={`sort-btn ${getSortClass('bookTitle')}`}
              onClick={() => requestSort('bookTitle')}
            >
              書名 {getSortIcon('bookTitle')}
            </button>
            <button 
              className={`sort-btn ${getSortClass('author')}`}
              onClick={() => requestSort('author')}
            >
              著者 {getSortIcon('author')}
            </button>
            <button 
              className={`sort-btn ${getSortClass('timestamp')}`}
              onClick={() => requestSort('timestamp')}
            >
              日付 {getSortIcon('timestamp')}
            </button>
            <button 
              className={`sort-btn ${getSortClass('category')}`}
              onClick={() => requestSort('category')}
            >
              カテゴリ {getSortIcon('category')}
            </button>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="books-grid">
        {sortedItems.length > 0 ? (
          sortedItems.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={handleEditClick}
              onDelete={deletePost}
              onUpdateOwned={updateOwned}
              onUpdateRead={updateRead}
              highlightText={highlightText}
              searchQuery={searchQuery}
              formatDate={formatDate}
            />
          ))
        ) : (
          <div className="no-books-message">
            <div className="no-books-content">
              <div className="no-books-icon">📚</div>
              <h3>まだ本が登録されていません</h3>
              <p>「追加」ボタンから最初の本を登録してみましょう</p>
            </div>
          </div>
        )}
      </div>

      {/* 追加モーダル */}
      {isPopupOpen && (
        <>
          <div className="overlay" onClick={handleCloseClick} />
          <div className="add-menu modern-modal">
            <div className="modal-header">
              <h2 className="modal-title">
                <span className="modal-icon">📚</span>
                新しい本を追加
              </h2>
              <button 
                className="modal-close-btn" 
                onClick={handleCloseClick}
                aria-label="モーダルを閉じる"
              >
                <IoClose />
              </button>
            </div>
            
            <div className="modal-body">
              <form className="book-form" onSubmit={(e) => { e.preventDefault(); createPost(); }}>
                <div className="form-section">
                  <h3 className="section-title">基本情報</h3>
                  
                  <div className="form-group">
                    <label htmlFor="book-title" className="form-label required">
                      書名
                    </label>
                    <input
                      id="book-title"
                      className="form-input"
                      type="text"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                      placeholder="本のタイトルを入力してください"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="book-author" className="form-label">
                      著者
                    </label>
                    <input
                      id="book-author"
                      className="form-input"
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="著者名を入力してください"
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group half-width">
                      <label htmlFor="book-place" className="form-label">
                        保管場所
                      </label>
                      <select
                        id="book-place"
                        className="form-select"
                        onChange={selectBookPlace}
                        value={bookPlace}
                      >
                        <option value="">選択してください</option>
                        <option value="自宅">🏠 自宅</option>
                        <option value="電子書籍">📱 電子書籍</option>
                        <option value="その他">📦 その他</option>
                      </select>
                    </div>
                    
                    <div className="form-group half-width">
                      <label htmlFor="book-category" className="form-label">
                        カテゴリ
                      </label>
                      <select
                        id="book-category"
                        className="form-select"
                        onChange={selectCategory}
                        value={category}
                      >
                        <option value="">選択してください</option>
                        <option value="データ分析">📊 データ分析</option>
                        <option value="インフラ">🔧 インフラ</option>
                        <option value="ビジネス">💼 ビジネス</option>
                        <option value="コンサル">🤝 コンサル</option>
                        <option value="プログラミング">💻 プログラミング</option>
                        <option value="小説">📖 小説</option>
                        <option value="実用書">📝 実用書</option>
                        <option value="その他">📚 その他</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3 className="section-title">読書状況</h3>
                  
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        name="readCheckbox"
                        checked={isRead}
                        onChange={() => setIsRead(!isRead)}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-text">
                        <span className="status-icon">✅</span>
                        読了済み
                      </span>
                    </label>
                    
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        name="ownedCheckbox"
                        checked={isOwned}
                        onChange={() => setIsOwned(!isOwned)}
                      />
                      <span className="checkbox-custom"></span>
                      <span className="checkbox-text">
                        <span className="status-icon">📖</span>
                        所有中
                      </span>
                    </label>
                  </div>
                </div>
                
                <div className="form-section">
                  <h3 className="section-title">評価・メモ</h3>
                  
                  <div className="form-group">
                    <label className="form-label">
                      評価
                    </label>
                    <div className="rating-group">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${rating >= star ? 'active' : ''}`}
                          onClick={() => setRating(rating === star ? 0 : star)}
                          aria-label={`${star}つ星`}
                        >
                          ⭐
                        </button>
                      ))}
                      <span className="rating-text">
                        {rating > 0 ? `${rating}/5` : '未評価'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="book-memo" className="form-label">
                      メモ・感想
                    </label>
                    <textarea
                      id="book-memo"
                      className="form-textarea"
                      value={memo || ''}
                      onChange={(e) => setMemo(e.target.value)}
                      placeholder="この本についてのメモや感想を入力してください（任意）"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseClick}
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!bookTitle.trim()}
                  >
                    <span className="btn-icon">📚</span>
                    本を追加
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* 編集モーダル */}
      {isEditPopupOpen && (
        <>
          <div className="overlay" onClick={handleEditCloseClick} />
          <div className="add-menu">
            <div className="add-menu-upper">
              <p className="add-title">編集</p>
              <button className="close-button" onClick={handleEditCloseClick}>
                <IoClose />
              </button>
            </div>
            <ul className="input-info">
              <li>
                <div>書名</div>
                <input
                  className="input-book-title"
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                />
              </li>
              <li>
                <div>著者</div>
                <input
                  className="input-author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </li>
              <li>
                <div>保管場所</div>
                <select
                  className="input-place"
                  name="genre"
                  id="genre-edit"
                  onChange={selectBookPlace}
                  value={bookPlace}
                >
                  <option value="" disabled>
                    選択してください
                  </option>
                  <option value="自宅">自宅</option>
                  <option value="電子書籍">電子書籍</option>
                  <option value="その他">その他</option>
                </select>
              </li>
              <li>
                <div>カテゴリ</div>
                <select
                  className="input-category"
                  name="genre"
                  onChange={selectCategory}
                  id="getcategorybox-edit"
                  value={category}
                >
                  <option value="" disabled>
                    選択してください
                  </option>
                  <option value="データ分析">データ分析</option>
                  <option value="インフラ">インフラ</option>
                  <option value="ビジネス">ビジネス</option>
                  <option value="コアコン">コンサル</option>
                  <option value="その他">その他</option>
                </select>
              </li>
            </ul>
            <form className="check-box" action="#" method="post">
              <label>
                <input
                  type="checkbox"
                  name="readCheckbox"
                  value="read"
                  checked={isRead}
                  onChange={() => setIsRead(!isRead)}
                />
                読了
              </label>
              <label>
                <input
                  type="checkbox"
                  name="ownedCheckbox"
                  value="owned"
                  checked={isOwned}
                  onChange={() => setIsOwned(!isOwned)}
                />
                所有
              </label>
              <label>
                評価:
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`star ${star <= rating ? 'filled' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </label>
              <label>
                メモ:
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="本の感想やメモを入力してください"
                  rows="3"
                />
              </label>
            </form>
            <button className="add-button" onClick={updatePost}>
              更新
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Books;