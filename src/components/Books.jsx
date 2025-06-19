import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { bookService } from "../services/bookService";
import { useSearch } from "../hooks/useSearch";
import { useFilter } from "../hooks/useFilter";
import { useSort } from "../hooks/useSort";
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
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [isEditPopupOpen, setEditPopupOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const [bookTitle, setBookTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [bookPlace, setbookPlace] = useState("");
  const [category, setCategory] = useState("");
  const [isRead, setIsRead] = useState(false);
  const [isOwned, setIsOwned] = useState(false);

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
  } = useRecommendations(currentUser?.uid, postList, {
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
  };

  const selectBookPlace = (e) => {
    setbookPlace(e.target.value);
  };

  const selectCategory = (e) => {
    setCategory(e.target.value);
  };

  const createPost = async () => {
    if (!bookTitle) {
      alert("書名を入力してください。");
      return;
    }

    if (!currentUser) {
      alert("ログインが必要です。");
      return;
    }

    try {
      await bookService.addBook(currentUser.uid, {
        bookTitle: bookTitle || null,
        author: author || null,
        bookPlace: bookPlace || null,
        category: category || null,
        isRead: isRead,
        isOwned: isOwned,
      }, selectedYear);
      handleCloseClick();
      setIsDbUpdated(true);
    } catch (error) {
      console.error("本の追加エラー:", error);
      alert("本の追加に失敗しました。");
    }
  };

  // ユーザー別データを取得
  useEffect(() => {
    const getPosts = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const books = await bookService.getBooks(currentUser.uid, selectedYear);
        setPostList(books);
        setError(null);
      } catch (error) {
        console.error("データ取得エラー:", error);
        setError("データの取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    };

    getPosts();
    setIsDbUpdated(false);
  }, [currentUser, selectedYear, isPopupOpen, isEditPopupOpen, isDbUpdated]);

  const deletePost = async (id) => {
    if (!currentUser) return;
    
    try {
      await bookService.deleteBook(currentUser.uid, id, selectedYear);
      setIsDbUpdated(true);
    } catch (error) {
      console.error("削除エラー:", error);
      alert("削除に失敗しました。");
    }
  };

  const updateOwned = async (id, isOwnedValue) => {
    if (!currentUser) return;
    
    try {
      await bookService.updateBook(currentUser.uid, id, { isOwned: isOwnedValue }, selectedYear);
      setIsDbUpdated(true);
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました。");
    }
  };

  const updateRead = async (id, isReadValue) => {
    if (!currentUser) return;
    
    try {
      await bookService.updateBook(currentUser.uid, id, { isRead: isReadValue }, selectedYear);
      setIsDbUpdated(true);
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました。");
    }
  };

  const handleEditClick = (post) => {
    setEditingPost(post);
    setBookTitle(post.bookTitle || "");
    setAuthor(post.author || "");
    setbookPlace(post.bookPlace || "");
    setCategory(post.category || "");
    setIsRead(post.isRead || false);
    setIsOwned(post.isOwned || false);
    setEditPopupOpen(true);
  };

  const updatePost = async () => {
    if (!bookTitle) {
      alert("書名を入力してください。");
      return;
    }

    if (!editingPost || !currentUser) return;

    try {
      await bookService.updateBook(currentUser.uid, editingPost.id, {
        bookTitle: bookTitle || null,
        author: author || null,
        bookPlace: bookPlace || null,
        category: category || null,
        isRead: isRead,
        isOwned: isOwned,
      }, selectedYear);
      
      handleEditCloseClick();
      setIsDbUpdated(true);
    } catch (error) {
      console.error("更新エラー:", error);
      alert("更新に失敗しました。");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp.toDate) {
      return "日付不明";
    }
    const date = timestamp.toDate();
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
          <div className="add-menu">
            <div className="add-menu-upper">
              <p className="add-title">追加</p>
              <button className="close-button" onClick={handleCloseClick}>
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
                  id="genre"
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
                  id="getcategorybox"
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
            </form>
            <button className="add-button" onClick={createPost}>
              追加
            </button>
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