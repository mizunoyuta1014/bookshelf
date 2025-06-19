// ========================================
// Security Validation Utilities
// ========================================

/**
 * データ検証エラークラス
 */
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * セキュリティ設定
 */
export const SECURITY_LIMITS = {
  BOOK_TITLE_MAX_LENGTH: 500,
  AUTHOR_MAX_LENGTH: 300,
  BOOK_PLACE_MAX_LENGTH: 100,
  CATEGORY_MAX_LENGTH: 100,
  MEMO_MAX_LENGTH: 2000,
  DISPLAY_NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 1000,
  DESCRIPTION_MAX_LENGTH: 5000,
  RATING_MIN: 0,
  RATING_MAX: 5,
  YEAR_MIN: 1900,
  YEAR_MAX: 2100,
  REQUESTS_PER_MINUTE: 100
};

/**
 * 文字列の基本検証
 */
export const validateString = (value, fieldName, maxLength, required = false) => {
  if (required && (!value || value.trim().length === 0)) {
    throw new ValidationError(`${fieldName}は必須です`, fieldName);
  }
  
  if (value && typeof value !== 'string') {
    throw new ValidationError(`${fieldName}は文字列である必要があります`, fieldName);
  }
  
  if (value && value.length > maxLength) {
    throw new ValidationError(`${fieldName}は${maxLength}文字以内で入力してください`, fieldName);
  }
  
  return true;
};

/**
 * 数値の基本検証
 */
export const validateNumber = (value, fieldName, min, max, required = false) => {
  if (required && (value === null || value === undefined)) {
    throw new ValidationError(`${fieldName}は必須です`, fieldName);
  }
  
  if (value !== null && value !== undefined) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new ValidationError(`${fieldName}は有効な数値である必要があります`, fieldName);
    }
    
    if (value < min || value > max) {
      throw new ValidationError(`${fieldName}は${min}から${max}の間で入力してください`, fieldName);
    }
  }
  
  return true;
};

/**
 * XSS攻撃対策 - HTMLタグとスクリプトの検出
 */
export const validateNoHTML = (value, fieldName) => {
  if (value && typeof value === 'string') {
    const htmlPattern = /<[^>]*>/g;
    const scriptPattern = /<script[\s\S]*?<\/script>/gi;
    
    if (htmlPattern.test(value) || scriptPattern.test(value)) {
      throw new ValidationError(`${fieldName}にHTMLタグは使用できません`, fieldName);
    }
  }
  return true;
};

/**
 * SQLインジェクション対策の基本チェック
 */
export const validateNoSQL = (value, fieldName) => {
  if (value && typeof value === 'string') {
    const sqlPattern = /('|(\')|(\-\-)|(;)|(\|)|(\*)|(%)|(\+)|(\\))/i;
    if (sqlPattern.test(value)) {
      throw new ValidationError(`${fieldName}に不正な文字が含まれています`, fieldName);
    }
  }
  return true;
};

/**
 * 書籍データの検証
 */
export const validateBookData = (bookData) => {
  try {
    // 必須フィールド
    validateString(bookData.bookTitle, '書名', SECURITY_LIMITS.BOOK_TITLE_MAX_LENGTH, true);
    validateNoHTML(bookData.bookTitle, '書名');
    validateNoSQL(bookData.bookTitle, '書名');
    
    // オプションフィールド
    if (bookData.author) {
      validateString(bookData.author, '著者名', SECURITY_LIMITS.AUTHOR_MAX_LENGTH);
      validateNoHTML(bookData.author, '著者名');
      validateNoSQL(bookData.author, '著者名');
    }
    
    if (bookData.bookPlace) {
      validateString(bookData.bookPlace, '保管場所', SECURITY_LIMITS.BOOK_PLACE_MAX_LENGTH);
      validateNoHTML(bookData.bookPlace, '保管場所');
    }
    
    if (bookData.category) {
      validateString(bookData.category, 'カテゴリ', SECURITY_LIMITS.CATEGORY_MAX_LENGTH);
      validateNoHTML(bookData.category, 'カテゴリ');
    }
    
    if (bookData.memo) {
      validateString(bookData.memo, 'メモ', SECURITY_LIMITS.MEMO_MAX_LENGTH);
      validateNoHTML(bookData.memo, 'メモ');
    }
    
    // 数値フィールド
    if (bookData.rating !== null && bookData.rating !== undefined) {
      validateNumber(bookData.rating, '評価', SECURITY_LIMITS.RATING_MIN, SECURITY_LIMITS.RATING_MAX);
    }
    
    // ブール値フィールド
    if (bookData.isRead !== undefined && typeof bookData.isRead !== 'boolean') {
      throw new ValidationError('読了状態は真偽値である必要があります', 'isRead');
    }
    
    if (bookData.isOwned !== undefined && typeof bookData.isOwned !== 'boolean') {
      throw new ValidationError('所有状態は真偽値である必要があります', 'isOwned');
    }
    
    return true;
  } catch (error) {
    console.error('書籍データ検証エラー:', error.message);
    throw error;
  }
};

/**
 * ウィッシュリストデータの検証
 */
export const validateWishlistData = (wishlistData) => {
  try {
    // 必須フィールド
    validateString(wishlistData.title, 'タイトル', SECURITY_LIMITS.BOOK_TITLE_MAX_LENGTH, true);
    validateNoHTML(wishlistData.title, 'タイトル');
    validateNoSQL(wishlistData.title, 'タイトル');
    
    // オプションフィールド
    if (wishlistData.authors && !Array.isArray(wishlistData.authors)) {
      throw new ValidationError('著者は配列である必要があります', 'authors');
    }
    
    if (wishlistData.description) {
      validateString(wishlistData.description, '説明', SECURITY_LIMITS.DESCRIPTION_MAX_LENGTH);
      validateNoHTML(wishlistData.description, '説明');
    }
    
    if (wishlistData.googleBooksId) {
      validateString(wishlistData.googleBooksId, 'Google Books ID', 100);
      validateNoSQL(wishlistData.googleBooksId, 'Google Books ID');
    }
    
    return true;
  } catch (error) {
    console.error('ウィッシュリストデータ検証エラー:', error.message);
    throw error;
  }
};

/**
 * ユーザープロフィールデータの検証
 */
export const validateUserProfileData = (profileData) => {
  try {
    if (profileData.displayName) {
      validateString(profileData.displayName, '表示名', SECURITY_LIMITS.DISPLAY_NAME_MAX_LENGTH);
      validateNoHTML(profileData.displayName, '表示名');
      validateNoSQL(profileData.displayName, '表示名');
    }
    
    if (profileData.bio) {
      validateString(profileData.bio, '自己紹介', SECURITY_LIMITS.BIO_MAX_LENGTH);
      validateNoHTML(profileData.bio, '自己紹介');
    }
    
    if (profileData.photoURL) {
      validateString(profileData.photoURL, 'プロフィール画像URL', 500);
      // URL形式の簡易チェック
      if (!profileData.photoURL.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i)) {
        throw new ValidationError('プロフィール画像URLが無効です', 'photoURL');
      }
    }
    
    return true;
  } catch (error) {
    console.error('プロフィールデータ検証エラー:', error.message);
    throw error;
  }
};

/**
 * 年度の検証
 */
export const validateYear = (year) => {
  const yearNum = parseInt(year);
  if (isNaN(yearNum) || yearNum < SECURITY_LIMITS.YEAR_MIN || yearNum > SECURITY_LIMITS.YEAR_MAX) {
    throw new ValidationError(`年度は${SECURITY_LIMITS.YEAR_MIN}年から${SECURITY_LIMITS.YEAR_MAX}年の間で指定してください`, 'year');
  }
  return true;
};

/**
 * ファイルアップロードの検証
 */
export const validateFileUpload = (file) => {
  // ファイルサイズ制限 (5MB)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError('ファイルサイズは5MB以下にしてください', 'file');
  }
  
  // 許可された画像形式
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ValidationError('JPG、PNG、GIF、WebP形式の画像のみアップロード可能です', 'file');
  }
  
  return true;
};

/**
 * レート制限チェック (シンプル版)
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }
  
  checkLimit(userId, limit = SECURITY_LIMITS.REQUESTS_PER_MINUTE) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${userId}-${minute}`;
    
    const count = this.requests.get(key) || 0;
    if (count >= limit) {
      throw new ValidationError('リクエスト制限に達しました。しばらくお待ちください。');
    }
    
    this.requests.set(key, count + 1);
    
    // 古いエントリをクリーンアップ
    for (const [k] of this.requests) {
      const [, keyMinute] = k.split('-');
      if (parseInt(keyMinute) < minute - 5) {
        this.requests.delete(k);
      }
    }
    
    return true;
  }
}

export const rateLimiter = new RateLimiter();

/**
 * 総合的なセキュリティ検証
 */
export const performSecurityCheck = (data, type, userId = null) => {
  try {
    // レート制限チェック
    if (userId) {
      rateLimiter.checkLimit(userId);
    }
    
    // データ型別検証
    switch (type) {
      case 'book':
        return validateBookData(data);
      case 'wishlist':
        return validateWishlistData(data);
      case 'profile':
        return validateUserProfileData(data);
      default:
        throw new ValidationError('未知のデータ型です');
    }
  } catch (error) {
    // セキュリティログ記録（本番環境では外部ログサービスに送信）
    console.warn('セキュリティ検証失敗:', {
      type,
      userId,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};