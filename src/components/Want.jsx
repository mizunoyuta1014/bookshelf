import React, { useState } from "react";
import "./Want.css"; // スタイルシートをインポート

const Want = () => {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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

  return (
    <div className="container">
      <div className="search-box">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="読みたい本を入力"
          className="search-input"
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
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>検索結果はありません。</p>
        )}
      </div>
      {selectedBook && (
        <div className="selected-book-details">
          <h2>{selectedBook.volumeInfo.title}</h2>
          <p>著者: {selectedBook.volumeInfo.authors?.join(", ")}</p>
          <img
            src={selectedBook.volumeInfo.imageLinks?.thumbnail}
            alt={selectedBook.volumeInfo.title}
          />
          <p>{selectedBook.volumeInfo.description}</p>
        </div>
      )}
    </div>
  );
};

export default Want;
