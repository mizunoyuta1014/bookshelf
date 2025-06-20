import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { 
  performSecurityCheck, 
  validateYear
} from "../utils/securityValidation.js";

export const bookService = {
  // ユーザー別の本コレクションへの参照を取得
  getUserBooksCollection: (userId, year = new Date().getFullYear()) => {
    return collection(db, "users", userId, "years", year.toString(), "books");
  },

  // 本を追加
  addBook: async (userId, bookData, year = new Date().getFullYear()) => {
    try {
      // セキュリティ検証
      validateYear(year);
      performSecurityCheck(bookData, 'book', userId);
      
      const booksRef = bookService.getUserBooksCollection(userId, year);
      const docRef = await addDoc(booksRef, {
        ...bookData,
        timestamp: serverTimestamp(),
      });
      return docRef;
    } catch (error) {
      reportSecurityIncident({
        type: 'book_add_validation_failed',
        description: `書籍追加時のバリデーションエラー: ${error.message}`,
        userId,
        severity: 'medium'
      });
      throw error;
    }
  },

  // 本一覧を取得
  getBooks: async (userId, year = new Date().getFullYear()) => {
    const booksRef = bookService.getUserBooksCollection(userId, year);
    const q = query(booksRef, orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  },

  // 本を更新
  updateBook: async (userId, bookId, updates, year = new Date().getFullYear()) => {
    try {
      // セキュリティ検証
      validateYear(year);
      performSecurityCheck(updates, 'book', userId);
      
      const bookRef = doc(db, "users", userId, "years", year.toString(), "books", bookId);
      await updateDoc(bookRef, updates);
    } catch (error) {
      reportSecurityIncident({
        type: 'book_update_validation_failed',
        description: `書籍更新時のバリデーションエラー: ${error.message}`,
        userId,
        severity: 'medium'
      });
      throw error;
    }
  },

  // 本を削除
  deleteBook: async (userId, bookId, year = new Date().getFullYear()) => {
    const bookRef = doc(db, "users", userId, "years", year.toString(), "books", bookId);
    await deleteDoc(bookRef);
  },

  // 読了状態を更新
  updateIsRead: async (userId, bookId, isRead, year = new Date().getFullYear()) => {
    await bookService.updateBook(userId, bookId, { isRead }, year);
  },

  // 所有状態を更新
  updateIsOwned: async (userId, bookId, isOwned, year = new Date().getFullYear()) => {
    await bookService.updateBook(userId, bookId, { isOwned }, year);
  },

  // 統計データを取得（Team C向け）
  getStatistics: async (userId, year = new Date().getFullYear()) => {
    const books = await bookService.getBooks(userId, year);
    
    const totalBooks = books.length;
    const readBooks = books.filter(book => book.isRead).length;
    const ownedBooks = books.filter(book => book.isOwned).length;
    
    // カテゴリ別集計
    const categoryStats = books.reduce((acc, book) => {
      const category = book.category || 'その他';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return {
      totalBooks,
      readBooks,
      ownedBooks,
      categoryStats,
      books
    };
  },

  // 検索機能（Team D向け）
  searchBooks: async (userId, query, year = new Date().getFullYear()) => {
    const books = await bookService.getBooks(userId, year);
    const lowercaseQuery = query.toLowerCase();
    
    return books.filter(book => 
      (book.bookTitle && book.bookTitle.toLowerCase().includes(lowercaseQuery)) ||
      (book.author && book.author.toLowerCase().includes(lowercaseQuery))
    );
  },

  // フィルタリング機能（Team D向け）
  filterBooks: async (userId, filters, year = new Date().getFullYear()) => {
    let books = await bookService.getBooks(userId, year);
    
    if (filters.category && filters.category !== 'all') {
      books = books.filter(book => book.category === filters.category);
    }
    
    if (filters.isRead !== undefined) {
      books = books.filter(book => book.isRead === filters.isRead);
    }
    
    if (filters.isOwned !== undefined) {
      books = books.filter(book => book.isOwned === filters.isOwned);
    }
    
    return books;
  }
};