import { useState, useEffect } from "react";
import { useAuth } from "../contexts/SupabaseAuthContext.jsx";
import { supabaseService, wishlistService } from "../services/supabaseService";
import { useSimpleErrorHandler } from "./ErrorHandler.jsx";
import { getErrorMessage } from "../utils/errorMessages.js";
import { IoAdd, IoTrash, IoBookmark, IoCheckmark } from "react-icons/io5";
import "./Want.css"; // スタイルシートをインポート

const Want = () => {
  const { currentUser } = useAuth();
  const { showError, withErrorHandling } = useSimpleErrorHandler();
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'wishlist'
  const [selectedYear] = useState(new Date().getFullYear());

  const searchBooks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          query
        )}&maxResults=5`
      );
      if (!response.ok) {
        throw new Error("検索に失敗しました。");
      }
      const data = await response.json();
      setBooks(data.items || []);
      setSelectedBook(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
  };

  // Load wishlist from Firebase
  useEffect(() => {
    const loadWishlist = async () => {
      if (!currentUser) return;
      
      try {
        const wishlistData = await wishlistService.getWishlist(currentUser.id);
        setWishlist(wishlistData || []);
      } catch (error) {
        const errorMessage = getErrorMessage(error, 'ウィッシュリスト読み込み');
        showError(errorMessage, { context: 'ウィッシュリスト読み込み' });
      }
    };

    loadWishlist();
  }, [currentUser, showError]);

  // Add book to wishlist
  const addToWishlist = async (book) => {
    if (!currentUser) {
      showError('ログインが必要です', { context: '認証' });
      return;
    }

    await withErrorHandling(async () => {
      const wishlistItem = {
        googleBooksId: book.id,
        title: book.volumeInfo.title,
        authors: book.volumeInfo.authors || [],
        imageUrl: book.volumeInfo.imageLinks?.thumbnail || '',
        description: book.volumeInfo.description || '',
        publishedDate: book.volumeInfo.publishedDate || ''
      };

      const addedItem = await wishlistService.addToWishlist(currentUser.id, wishlistItem);
      setWishlist(prev => [...prev, addedItem]);
      // 成功メッセージをコンソールに表示
      console.log('ウィッシュリストに追加しました');
    }, 'ウィッシュリスト追加');
  };

  // Remove from wishlist
  const removeFromWishlist = async (wishlistId) => {
    if (!currentUser) return;

    await withErrorHandling(async () => {
      await wishlistService.removeFromWishlist(currentUser.id, wishlistId);
      setWishlist(prev => prev.filter(item => item.id !== wishlistId));
      // 成功メッセージをコンソールに表示
      console.log('ウィッシュリストから削除しました');
    }, 'ウィッシュリスト削除');
  };

  // Move from wishlist to reading records
  const moveToReadingRecord = async (wishlistItem) => {
    if (!currentUser) return;

    await withErrorHandling(async () => {
      // Add to reading records
      await supabaseService.addBook({
        bookTitle: wishlistItem.title,
        author: wishlistItem.authors.join(', '),
        bookPlace: '未設定',
        category: '未分類',
        isRead: false,
        isOwned: false,
        year: selectedYear
      });

      // Remove from wishlist
      await removeFromWishlist(wishlistItem.id);
      // 成功メッセージをコンソールに表示
      console.log('読書記録に移動しました');
    }, '読書記録移動');
  };

  // Check if book is already in wishlist
  const isInWishlist = (googleBooksId) => {
    return wishlist.some(item => item.google_books_id === googleBooksId);
  };

  return (
    <div className="container">
      <div className="tab-header">
        <button 
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          本を検索
        </button>
        <button 
          className={`tab-button ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          ウィッシュリスト ({wishlist.length})
        </button>
      </div>

      {activeTab === 'search' && (
        <>
          <div className="search-box">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="読みたい本を入力"
              className="search-input"
              onKeyPress={(e) => e.key === 'Enter' && searchBooks()}
            />
            <button
              onClick={searchBooks}
              disabled={isLoading}
              className="search-button"
            >
              検索
            </button>
          </div>
          {isLoading && <p className="loading">検索中...</p>}
          {error && <p className="error">エラー: {error}</p>}
          <div className="book-table">
            {books.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>カバー</th>
                    <th>タイトル</th>
                    <th>著者</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td>
                        <img
                          src={book.volumeInfo.imageLinks?.thumbnail}
                          alt={book.volumeInfo.title}
                          className="book-image"
                        />
                      </td>
                      <td
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelectBook(book);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <a href="#" className="book-title-link">
                          {book.volumeInfo.title}
                        </a>
                      </td>
                      <td>{book.volumeInfo.authors?.join(", ")}</td>
                      <td>
                        <button
                          onClick={() => addToWishlist(book)}
                          disabled={isInWishlist(book.id)}
                          className={`wishlist-button ${isInWishlist(book.id) ? 'added' : ''}`}
                        >
                          {isInWishlist(book.id) ? (
                            <>
                              <IoCheckmark /> 追加済み
                            </>
                          ) : (
                            <>
                              <IoAdd /> ウィッシュリストに追加
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>検索結果はありません。</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'wishlist' && (
        <div className="wishlist-section">
          <h2>ウィッシュリスト</h2>
          {wishlist.length > 0 ? (
            <div className="wishlist-grid">
              {wishlist.map((item) => (
                <div key={item.id} className="wishlist-item">
                  <div className="wishlist-item-image">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="book-image"
                    />
                  </div>
                  <div className="wishlist-item-details">
                    <h3 className="wishlist-item-title">{item.title}</h3>
                    <p className="wishlist-item-authors">
                      {item.authors.join(', ')}
                    </p>
                    {item.publishedDate && (
                      <p className="wishlist-item-date">
                        出版日: {item.publishedDate}
                      </p>
                    )}
                    <div className="wishlist-item-actions">
                      <button
                        onClick={() => moveToReadingRecord(item)}
                        className="move-to-records-button"
                      >
                        <IoBookmark /> 読書記録に移動
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.id)}
                        className="remove-button"
                      >
                        <IoTrash /> 削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-wishlist">
              <p>ウィッシュリストは空です。</p>
              <p>「本を検索」タブから気になる本を追加してください。</p>
            </div>
          )}
        </div>
      )}

      {selectedBook && (
        <div className="selected-book-details">
          <h2>{selectedBook.volumeInfo.title}</h2>
          <p>著者: {selectedBook.volumeInfo.authors?.join(", ")}</p>
          <img
            src={selectedBook.volumeInfo.imageLinks?.thumbnail}
            alt={selectedBook.volumeInfo.title}
          />
          <p>{selectedBook.volumeInfo.description}</p>
          <div className="selected-book-actions">
            <button
              onClick={() => addToWishlist(selectedBook)}
              disabled={isInWishlist(selectedBook.id)}
              className={`wishlist-button ${isInWishlist(selectedBook.id) ? 'added' : ''}`}
            >
              {isInWishlist(selectedBook.id) ? (
                <>
                  <IoCheckmark /> 追加済み
                </>
              ) : (
                <>
                  <IoAdd /> ウィッシュリストに追加
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Want;
