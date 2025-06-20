// 統一されたエラーメッセージ規則

// エラーカテゴリ
export const ERROR_CATEGORIES = {
  BOOK: 'book',
  AUTH: 'auth',
  NETWORK: 'network',
  VALIDATION: 'validation',
  SYSTEM: 'system'
};

// 標準エラーメッセージ
export const ERROR_MESSAGES = {
  // 書籍関連
  BOOK: {
    ADD_FAILED: '本の追加に失敗しました',
    UPDATE_FAILED: '本の更新に失敗しました',
    DELETE_FAILED: '本の削除に失敗しました',
    FETCH_FAILED: '本の取得に失敗しました',
    SEARCH_FAILED: '本の検索に失敗しました',
    EXPORT_FAILED: 'データのエクスポートに失敗しました',
    IMPORT_FAILED: 'データのインポートに失敗しました',
    RATING_FAILED: '評価の更新に失敗しました',
    STATUS_UPDATE_FAILED: '読了状態の更新に失敗しました'
  },

  // 認証関連
  AUTH: {
    LOGIN_FAILED: 'ログインに失敗しました',
    LOGOUT_FAILED: 'ログアウトに失敗しました',
    SIGNUP_FAILED: 'アカウント作成に失敗しました',
    PASSWORD_RESET_FAILED: 'パスワードリセットに失敗しました',
    EMAIL_VERIFICATION_FAILED: 'メール認証に失敗しました',
    UNAUTHORIZED: '認証が必要です',
    TOKEN_EXPIRED: 'セッションが期限切れです。再度ログインしてください',
    PERMISSION_DENIED: 'この操作を実行する権限がありません'
  },

  // ネットワーク関連
  NETWORK: {
    CONNECTION_FAILED: 'インターネット接続を確認してください',
    TIMEOUT: 'リクエストがタイムアウトしました',
    SERVER_ERROR: 'サーバーエラーが発生しました',
    SERVICE_UNAVAILABLE: 'サービスが一時的に利用できません',
    API_LIMIT_EXCEEDED: 'API利用制限を超過しました'
  },

  // バリデーション関連
  VALIDATION: {
    REQUIRED_FIELD: '必須項目を入力してください',
    INVALID_EMAIL: '有効なメールアドレスを入力してください',
    INVALID_PASSWORD: 'パスワードは8文字以上で入力してください',
    TITLE_REQUIRED: '書名を入力してください',
    AUTHOR_REQUIRED: '著者名を入力してください',
    INVALID_RATING: '評価は1から5の間で選択してください',
    TEXT_TOO_LONG: '入力文字数が上限を超えています'
  },

  // システム関連
  SYSTEM: {
    UNKNOWN_ERROR: '予期しないエラーが発生しました',
    FILE_UPLOAD_FAILED: 'ファイルのアップロードに失敗しました',
    DATA_CORRUPTION: 'データが破損している可能性があります',
    STORAGE_FULL: 'ストレージ容量が不足しています',
    BROWSER_NOT_SUPPORTED: 'お使いのブラウザではこの機能をサポートしていません'
  }
};

// エラーコード→メッセージのマッピング
export const ERROR_CODE_MESSAGES = {
  // Supabase エラーコード
  'PGRST116': '認証が必要です',
  'PGRST301': 'この操作を実行する権限がありません',
  '23505': '既に存在するデータです',
  '23503': '関連するデータが存在しません',
  '42501': 'この操作を実行する権限がありません',

  // HTTP ステータスコード
  400: '必須項目を入力してください',
  401: '認証が必要です',
  403: 'この操作を実行する権限がありません',
  404: 'データが見つかりませんでした',
  408: 'リクエストがタイムアウトしました',
  429: 'API利用制限を超過しました',
  500: 'サーバーエラーが発生しました',
  502: 'サービスが一時的に利用できません',
  503: 'サービスが一時的に利用できません',

  // Firebase エラーコード（互換性）
  'auth/user-not-found': 'ユーザーが見つかりません',
  'auth/wrong-password': 'パスワードが間違っています',
  'auth/email-already-in-use': 'このメールアドレスは既に使用されています',
  'auth/weak-password': 'パスワードは8文字以上で入力してください',
  'auth/invalid-email': '有効なメールアドレスを入力してください'
};

/**
 * エラーメッセージを取得する
 * @param {Error|string|Object} error - エラーオブジェクト
 * @param {string} context - エラーコンテキスト（省略可能）
 * @returns {string} エラーメッセージ
 */
export const getErrorMessage = (error, context = '') => {
  // 文字列の場合はそのまま返す
  if (typeof error === 'string') {
    return error;
  }

  // エラーコードから取得
  if (error?.code && ERROR_CODE_MESSAGES[error.code]) {
    return ERROR_CODE_MESSAGES[error.code];
  }

  // HTTPステータスコードから取得
  if (error?.status && ERROR_CODE_MESSAGES[error.status]) {
    return ERROR_CODE_MESSAGES[error.status];
  }

  // Supabaseエラーの詳細メッセージ
  if (error?.message) {
    const message = error.message.toLowerCase();
    
    // 認証エラー
    if (message.includes('jwt') || message.includes('token')) {
      return ERROR_MESSAGES.AUTH.TOKEN_EXPIRED;
    }
    
    // ネットワークエラー
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK.CONNECTION_FAILED;
    }
    
    // バリデーションエラー
    if (message.includes('violates') || message.includes('constraint')) {
      return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
    }
    
    return error.message;
  }

  // コンテキストベースのデフォルトメッセージ
  if (context) {
    const contextLower = context.toLowerCase();
    
    if (contextLower.includes('login') || contextLower.includes('ログイン')) {
      return ERROR_MESSAGES.AUTH.LOGIN_FAILED;
    }
    if (contextLower.includes('add') || contextLower.includes('追加')) {
      return ERROR_MESSAGES.BOOK.ADD_FAILED;
    }
    if (contextLower.includes('update') || contextLower.includes('更新')) {
      return ERROR_MESSAGES.BOOK.UPDATE_FAILED;
    }
    if (contextLower.includes('delete') || contextLower.includes('削除')) {
      return ERROR_MESSAGES.BOOK.DELETE_FAILED;
    }
  }

  // デフォルトメッセージ
  return ERROR_MESSAGES.SYSTEM.UNKNOWN_ERROR;
};

/**
 * バリデーションエラーメッセージを取得する
 * @param {string} field - フィールド名
 * @param {*} value - 値
 * @returns {string|null} エラーメッセージ（エラーがない場合はnull）
 */
export const getValidationError = (field, value) => {
  switch (field) {
    case 'bookTitle': {
      return !value?.trim() ? ERROR_MESSAGES.VALIDATION.TITLE_REQUIRED : null;
    }
    
    case 'author': {
      return !value?.trim() ? ERROR_MESSAGES.VALIDATION.AUTHOR_REQUIRED : null;
    }
    
    case 'email': {
      if (!value?.trim()) return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !emailRegex.test(value) ? ERROR_MESSAGES.VALIDATION.INVALID_EMAIL : null;
    }
    
    case 'password': {
      if (!value) return ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
      return value.length < 8 ? ERROR_MESSAGES.VALIDATION.INVALID_PASSWORD : null;
    }
    
    case 'rating': {
      if (value !== null && value !== undefined) {
        return (value < 1 || value > 5) ? ERROR_MESSAGES.VALIDATION.INVALID_RATING : null;
      }
      return null;
    }
    
    case 'memo': {
      return value && value.length > 1000 ? ERROR_MESSAGES.VALIDATION.TEXT_TOO_LONG : null;
    }
    
    default:
      return null;
  }
};

/**
 * 成功メッセージを取得する
 * @param {string} action - 実行されたアクション
 * @returns {string} 成功メッセージ
 */
export const getSuccessMessage = (action) => {
  const SUCCESS_MESSAGES = {
    'add': '本を追加しました',
    'update': '本を更新しました',
    'delete': '本を削除しました',
    'login': 'ログインしました',
    'logout': 'ログアウトしました',
    'signup': 'アカウントを作成しました',
    'export': 'データをエクスポートしました',
    'import': 'データをインポートしました',
    'save': '保存しました'
  };
  
  return SUCCESS_MESSAGES[action] || '操作が完了しました';
};