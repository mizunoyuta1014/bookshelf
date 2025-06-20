import { supabase } from '../lib/supabase'

// デバッグ用のシンプルなラッパー
const withDebugLog = async (fn, operation = 'operation') => {
  console.log(`🔄 ${operation} 開始`);
  try {
    const result = await fn();
    console.log(`✅ ${operation} 成功`);
    return result;
  } catch (error) {
    console.error(`❌ ${operation} 失敗:`, error);
    throw error;
  }
};

export const supabaseService = {
  // ============================================
  // 書籍CRUD操作
  // ============================================

  /**
   * 指定年度の書籍一覧を取得
   * @param {Object|string} params - パラメータオブジェクトまたはユーザーID
   * @param {number} year - 年度（従来の形式用）
   * @param {string} contextUserId - コンテキストからのユーザーID（オプション）
   * @returns {Promise<Array>} 書籍配列
   */
  async getBooks(params, year, contextUserId = null) {
    try {
      let userId, searchYear;
      
      // パラメータの形式を判定
      if (typeof params === 'object' && params !== null) {
        // 新形式: { year: 2024, userId?: "..." }
        searchYear = params.year;
        userId = params.userId || contextUserId;
        
        // userIdが指定されていない場合のみ認証チェック
        if (!userId) {
          const { data: { user }, error: authError } = await withDebugLog(
        () => supabase.auth.getUser(),
        'ユーザー認証情報取得'
      );
          if (authError) throw authError;
          userId = user?.id;
        }
      } else {
        // 従来形式: getBooks(userId, year)
        userId = params;
        searchYear = year;
      }

      if (!userId) {
        throw new Error('ユーザーIDが取得できません');
      }

      const { data, error } = await withDebugLog(
        () => supabase
          .from('books')
          .select('*')
          .eq('user_id', userId)
          .eq('year', searchYear)
          .order('created_at', { ascending: false }),
        `書籍取得 (userId: ${userId?.slice(0,8)}..., year: ${searchYear})`
      )
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('書籍取得エラー:', error)
      throw new Error(`書籍の取得に失敗しました: ${error.message}`)
    }
  },

  /**
   * 書籍を追加
   * @param {Object|string} params - 書籍データまたはユーザーID
   * @param {Object} bookData - 書籍データ（従来形式用）
   * @param {number} year - 年度（従来形式用）
   * @returns {Promise<Object>} 追加された書籍
   */
  async addBook(params, bookData, year) {
    try {
      let userId, insertData;
      
      // パラメータの形式を判定
      if (typeof params === 'object' && params !== null && !bookData) {
        // 新形式: addBook({ bookTitle: "...", year: 2024 })
        insertData = params;
        // 現在の認証済みユーザーIDを取得
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        userId = user?.id;
      } else {
        // 従来形式: addBook(userId, bookData, year)
        userId = params;
        insertData = { ...bookData, year };
      }

      if (!userId) {
        throw new Error('ユーザーIDが取得できません');
      }

      const { data, error } = await supabase
        .from('books')
        .insert([{
          user_id: userId,
          year: insertData.year,
          book_title: insertData.bookTitle,
          author: insertData.author,
          book_place: insertData.bookPlace,
          category: insertData.category,
          is_read: insertData.isRead || false,
          is_owned: insertData.isOwned || false,
          memo: insertData.memo,
          rating: insertData.rating,
          created_at: new Date().toISOString()
        }])
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('書籍追加エラー:', error)
      throw new Error(`書籍の追加に失敗しました: ${error.message}`)
    }
  },

  /**
   * 書籍を更新
   * @param {string} bookId - 書籍ID
   * @param {Object} updates - 更新データ
   * @returns {Promise<Object>} 更新された書籍
   */
  async updateBook(bookId, updates) {
    try {
      // 現在の認証済みユーザーIDを取得
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = user?.id;
      
      if (!userId) {
        throw new Error('ユーザーIDが取得できません');
      }

      const updateData = {
        updated_at: new Date().toISOString()
      }

      // フィールド名の変換
      if (updates.bookTitle !== undefined) updateData.book_title = updates.bookTitle
      if (updates.author !== undefined) updateData.author = updates.author
      if (updates.bookPlace !== undefined) updateData.book_place = updates.bookPlace
      if (updates.category !== undefined) updateData.category = updates.category
      if (updates.isRead !== undefined) updateData.is_read = updates.isRead
      if (updates.isOwned !== undefined) updateData.is_owned = updates.isOwned
      if (updates.memo !== undefined) updateData.memo = updates.memo
      if (updates.rating !== undefined) updateData.rating = updates.rating

      const { data, error } = await supabase
        .from('books')
        .update(updateData)
        .eq('id', bookId)
        .eq('user_id', userId)
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('書籍更新エラー:', error)
      throw new Error(`書籍の更新に失敗しました: ${error.message}`)
    }
  },

  /**
   * 書籍を削除
   * @param {string} bookId - 書籍ID
   * @returns {Promise<void>}
   */
  async deleteBook(bookId) {
    try {
      // 現在の認証済みユーザーIDを取得
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      const userId = user?.id;
      
      if (!userId) {
        throw new Error('ユーザーIDが取得できません');
      }

      const { error } = await supabase
        .from('books')
        .delete()
        .eq('id', bookId)
        .eq('user_id', userId)
      
      if (error) throw error
    } catch (error) {
      console.error('書籍削除エラー:', error)
      throw new Error(`書籍の削除に失敗しました: ${error.message}`)
    }
  },

  /**
   * 読了状態を更新
   * @param {string} bookId - 書籍ID
   * @param {boolean} isRead - 読了状態
   * @returns {Promise<Object>} 更新された書籍
   */
  async updateIsRead(bookId, isRead) {
    return this.updateBook(bookId, { isRead })
  },

  /**
   * 所有状態を更新
   * @param {string} bookId - 書籍ID
   * @param {boolean} isOwned - 所有状態
   * @returns {Promise<Object>} 更新された書籍
   */
  async updateIsOwned(bookId, isOwned) {
    return this.updateBook(bookId, { isOwned })
  },

  // ============================================
  // 検索・フィルタリング
  // ============================================

  /**
   * 書籍を検索
   * @param {string} userId - ユーザーID
   * @param {string} query - 検索クエリ
   * @param {number} year - 年度
   * @returns {Promise<Array>} 検索結果
   */
  async searchBooks(userId, query, year) {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .or(`book_title.ilike.%${query}%,author.ilike.%${query}%`)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('書籍検索エラー:', error)
      throw new Error(`書籍の検索に失敗しました: ${error.message}`)
    }
  },

  /**
   * 書籍をフィルタリング
   * @param {string} userId - ユーザーID
   * @param {Object} filters - フィルター条件
   * @param {number} year - 年度
   * @returns {Promise<Array>} フィルター結果
   */
  async filterBooks(userId, filters, year) {
    try {
      let query = supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)

      // カテゴリフィルター
      if (filters.category && filters.category !== '') {
        query = query.eq('category', filters.category)
      }

      // 読了状態フィルター
      if (filters.isRead !== undefined && filters.isRead !== '') {
        query = query.eq('is_read', filters.isRead)
      }

      // 所有状態フィルター
      if (filters.isOwned !== undefined && filters.isOwned !== '') {
        query = query.eq('is_owned', filters.isOwned)
      }

      // 保管場所フィルター
      if (filters.bookPlace && filters.bookPlace !== '') {
        query = query.eq('book_place', filters.bookPlace)
      }

      // 日付範囲フィルター
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('書籍フィルタリングエラー:', error)
      throw new Error(`書籍のフィルタリングに失敗しました: ${error.message}`)
    }
  },

  // ============================================
  // 統計・分析
  // ============================================

  /**
   * 統計データを取得
   * @param {string} userId - ユーザーID
   * @param {number} year - 年度
   * @returns {Promise<Object>} 統計データ
   */
  async getStatistics(userId, year) {
    try {
      const { data: books, error } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
      
      if (error) throw error

      const totalBooks = books.length
      const readBooks = books.filter(book => book.is_read).length
      const ownedBooks = books.filter(book => book.is_owned).length

      // カテゴリ別統計
      const categoryStats = {}
      books.forEach(book => {
        if (book.category) {
          if (!categoryStats[book.category]) {
            categoryStats[book.category] = { total: 0, read: 0 }
          }
          categoryStats[book.category].total++
          if (book.is_read) {
            categoryStats[book.category].read++
          }
        }
      })

      // 月別統計
      const monthlyStats = {}
      books.forEach(book => {
        const month = new Date(book.created_at).getMonth() + 1
        if (!monthlyStats[month]) {
          monthlyStats[month] = { total: 0, read: 0 }
        }
        monthlyStats[month].total++
        if (book.is_read) {
          monthlyStats[month].read++
        }
      })

      return {
        totalBooks,
        readBooks,
        ownedBooks,
        categoryStats,
        monthlyStats,
        books: books.map(book => ({
          id: book.id,
          bookTitle: book.book_title,
          author: book.author,
          bookPlace: book.book_place,
          category: book.category,
          isRead: book.is_read,
          isOwned: book.is_owned,
          memo: book.memo,
          rating: book.rating,
          timestamp: book.created_at
        }))
      }
    } catch (error) {
      console.error('統計取得エラー:', error)
      throw new Error(`統計の取得に失敗しました: ${error.message}`)
    }
  },

  // ============================================
  // データ変換ヘルパー
  // ============================================

  /**
   * Supabaseデータをアプリ形式に変換
   * @param {Object} supabaseBook - Supabaseの書籍データ
   * @returns {Object} アプリ形式の書籍データ
   */
  convertFromSupabase(supabaseBook) {
    return {
      id: supabaseBook.id,
      bookTitle: supabaseBook.book_title,
      author: supabaseBook.author,
      bookPlace: supabaseBook.book_place,
      category: supabaseBook.category,
      isRead: supabaseBook.is_read,
      isOwned: supabaseBook.is_owned,
      memo: supabaseBook.memo,
      rating: supabaseBook.rating,
      timestamp: new Date(supabaseBook.created_at)
    }
  },

  /**
   * アプリデータをSupabase形式に変換
   * @param {Object} appBook - アプリ形式の書籍データ
   * @returns {Object} Supabase形式の書籍データ
   */
  convertToSupabase(appBook) {
    return {
      book_title: appBook.bookTitle,
      author: appBook.author,
      book_place: appBook.bookPlace,
      category: appBook.category,
      is_read: appBook.isRead,
      is_owned: appBook.isOwned,
      memo: appBook.memo,
      rating: appBook.rating
    }
  }
}

// ============================================
// ウィッシュリストサービス
// ============================================

export const wishlistService = {
  /**
   * ウィッシュリストを取得
   * @param {string} userId - ユーザーID
   * @returns {Promise<Array>} ウィッシュリスト
   */
  async getWishlist(userId) {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('ウィッシュリスト取得エラー:', error)
      throw new Error(`ウィッシュリストの取得に失敗しました: ${error.message}`)
    }
  },

  /**
   * ウィッシュリストに追加
   * @param {string} userId - ユーザーID
   * @param {Object} item - アイテムデータ
   * @returns {Promise<Object>} 追加されたアイテム
   */
  async addToWishlist(userId, item) {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .insert([{
          user_id: userId,
          title: item.title,
          authors: item.authors,
          description: item.description,
          google_books_id: item.googleBooksId,
          image_url: item.imageUrl,
          created_at: new Date().toISOString()
        }])
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('ウィッシュリスト追加エラー:', error)
      throw new Error(`ウィッシュリストへの追加に失敗しました: ${error.message}`)
    }
  },

  /**
   * ウィッシュリストから削除
   * @param {string} userId - ユーザーID
   * @param {string} itemId - アイテムID
   * @returns {Promise<void>}
   */
  async removeFromWishlist(userId, itemId) {
    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId)
      
      if (error) throw error
    } catch (error) {
      console.error('ウィッシュリスト削除エラー:', error)
      throw new Error(`ウィッシュリストからの削除に失敗しました: ${error.message}`)
    }
  }
}

// ============================================
// ユーザー設定サービス
// ============================================

export const userPreferencesService = {
  /**
   * ユーザー設定を取得
   * @param {string} userId - ユーザーID
   * @returns {Promise<Object>} ユーザー設定
   */
  async getPreferences(userId) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('ユーザー設定取得エラー:', error)
      throw new Error(`ユーザー設定の取得に失敗しました: ${error.message}`)
    }
  },

  /**
   * ユーザー設定を更新
   * @param {string} userId - ユーザーID
   * @param {Object} preferences - 設定データ
   * @returns {Promise<Object>} 更新された設定
   */
  async updatePreferences(userId, preferences) {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('ユーザー設定更新エラー:', error)
      throw new Error(`ユーザー設定の更新に失敗しました: ${error.message}`)
    }
  }
}