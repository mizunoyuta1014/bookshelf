// ========================================
// Security Testing Suite
// ========================================

import { 
  validateBookData, 
  validateWishlistData, 
  validateUserProfileData,
  validateYear,
  ValidationError,
  performSecurityCheck
} from './securityValidation.js';

/**
 * テスト結果記録
 */
class TestResult {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.results = [];
  }
  
  addResult(testName, passed, error = null) {
    this.results.push({
      testName,
      passed,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    });
    
    if (passed) {
      this.passed++;
    } else {
      this.failed++;
    }
  }
  
  getReport() {
    return {
      summary: {
        total: this.passed + this.failed,
        passed: this.passed,
        failed: this.failed,
        passRate: ((this.passed / (this.passed + this.failed)) * 100).toFixed(2) + '%'
      },
      details: this.results
    };
  }
}

/**
 * テストヘルパー関数
 */
const runTest = (testName, testFn, testResult) => {
  try {
    testFn();
    testResult.addResult(testName, true);
    console.log(`✅ ${testName}`);
  } catch (error) {
    testResult.addResult(testName, false, error);
    console.error(`❌ ${testName}: ${error.message}`);
  }
};

/**
 * 書籍データのセキュリティテスト
 */
export const testBookDataSecurity = () => {
  const testResult = new TestResult();
  console.log('\n📚 書籍データセキュリティテスト開始');
  
  // 正常なデータ
  runTest('正常な書籍データ', () => {
    const validBook = {
      bookTitle: '有効な書籍タイトル',
      author: '著者名',
      bookPlace: '自宅',
      category: 'プログラミング',
      isRead: true,
      isOwned: false,
      memo: '読書メモ',
      rating: 4
    };
    validateBookData(validBook);
  }, testResult);
  
  // XSS攻撃テスト
  runTest('XSS攻撃防止テスト', () => {
    const xssBook = {
      bookTitle: '<script>alert("XSS")</script>悪意のあるタイトル',
      author: '正常な著者'
    };
    try {
      validateBookData(xssBook);
      throw new Error('XSS攻撃が検出されませんでした');
    } catch (error) {
      if (error instanceof ValidationError) {
        // 正しくValidationErrorが投げられた
        return;
      }
      throw error;
    }
  }, testResult);
  
  // SQLインジェクション防止テスト
  runTest('SQLインジェクション防止テスト', () => {
    const sqlBook = {
      bookTitle: "'; DROP TABLE books; --",
      author: '正常な著者'
    };
    try {
      validateBookData(sqlBook);
      throw new Error('SQLインジェクションが検出されませんでした');
    } catch (error) {
      if (error instanceof ValidationError) {
        return;
      }
      throw error;
    }
  }, testResult);
  
  // 文字数制限テスト
  runTest('文字数制限テスト', () => {
    const longTitleBook = {
      bookTitle: 'あ'.repeat(501), // 制限500文字を超過
      author: '正常な著者'
    };
    try {
      validateBookData(longTitleBook);
      throw new Error('文字数制限が働いていません');
    } catch (error) {
      if (error instanceof ValidationError) {
        return;
      }
      throw error;
    }
  }, testResult);
  
  // 必須フィールドテスト
  runTest('必須フィールドテスト', () => {
    const emptyBook = {
      author: '著者名のみ'
    };
    try {
      validateBookData(emptyBook);
      throw new Error('必須フィールドチェックが働いていません');
    } catch (error) {
      if (error instanceof ValidationError) {
        return;
      }
      throw error;
    }
  }, testResult);
  
  // 評価値範囲テスト
  runTest('評価値範囲テスト', () => {
    const invalidRatingBook = {
      bookTitle: '正常なタイトル',
      rating: 10 // 範囲外 (0-5)
    };
    try {
      validateBookData(invalidRatingBook);
      throw new Error('評価値範囲チェックが働いていません');
    } catch (error) {
      if (error instanceof ValidationError) {
        return;
      }
      throw error;
    }
  }, testResult);
  
  return testResult.getReport();
};

/**
 * ウィッシュリストデータのセキュリティテスト
 */
export const testWishlistDataSecurity = () => {
  const testResult = new TestResult();
  console.log('\n📋 ウィッシュリストセキュリティテスト開始');
  
  // 正常なデータ
  runTest('正常なウィッシュリストデータ', () => {
    const validWishlist = {
      title: '読みたい本のタイトル',
      authors: ['著者1', '著者2'],
      googleBooksId: 'abc123',
      description: '本の説明',
      thumbnail: 'https://example.com/image.jpg'
    };
    validateWishlistData(validWishlist);
  }, testResult);
  
  // HTML注入テスト
  runTest('HTML注入防止テスト', () => {
    const htmlWishlist = {
      title: '正常なタイトル',
      description: '<img src="x" onerror="alert(1)">'
    };
    try {
      validateWishlistData(htmlWishlist);
      throw new Error('HTML注入が検出されませんでした');
    } catch (error) {
      if (error instanceof ValidationError) {
        return;
      }
      throw error;
    }
  }, testResult);
  
  // 配列型チェック
  runTest('配列型チェックテスト', () => {
    const invalidAuthorsWishlist = {
      title: '正常なタイトル',
      authors: '文字列（配列ではない）'
    };
    try {
      validateWishlistData(invalidAuthorsWishlist);
      throw new Error('配列型チェックが働いていません');
    } catch (error) {
      if (error instanceof ValidationError) {
        return;
      }
      throw error;
    }
  }, testResult);
  
  return testResult.getReport();
};

/**
 * ユーザープロフィールのセキュリティテスト
 */
export const testUserProfileSecurity = () => {
  const testResult = new TestResult();
  console.log('\n👤 ユーザープロフィールセキュリティテスト開始');
  
  // 正常なデータ
  runTest('正常なプロフィールデータ', () => {
    const validProfile = {
      displayName: '正常なユーザー名',
      bio: '自己紹介文',
      photoURL: 'https://example.com/avatar.jpg'
    };
    validateUserProfileData(validProfile);
  }, testResult);
  
  // URL検証テスト
  runTest('不正URL検証テスト', () => {
    const invalidUrlProfile = {
      displayName: '正常なユーザー名',
      photoURL: 'javascript:alert(1)'
    };
    try {
      validateUserProfileData(invalidUrlProfile);
      throw new Error('不正URLが検出されませんでした');
    } catch (error) {
      if (error instanceof ValidationError) {
        return;
      }
      throw error;
    }
  }, testResult);
  
  return testResult.getReport();
};

/**
 * 年度検証のセキュリティテスト
 */
export const testYearValidation = () => {
  const testResult = new TestResult();
  console.log('\n📅 年度検証セキュリティテスト開始');
  
  // 正常な年度
  runTest('正常な年度', () => {
    validateYear(2024);
    validateYear('2023');
  }, testResult);
  
  // 範囲外年度
  runTest('範囲外年度テスト', () => {
    try {
      validateYear(1800); // 範囲外
      throw new Error('範囲外年度が通りました');
    } catch (error) {
      if (error instanceof ValidationError) {
        return;
      }
      throw error;
    }
  }, testResult);
  
  // 不正な年度形式
  runTest('不正年度形式テスト', () => {
    try {
      validateYear('abc');
      throw new Error('不正な年度形式が通りました');
    } catch (error) {
      if (error instanceof ValidationError) {
        return;
      }
      throw error;
    }
  }, testResult);
  
  return testResult.getReport();
};

/**
 * 統合セキュリティテスト実行
 */
export const runAllSecurityTests = () => {
  console.log('🔒 セキュリティテスト開始');
  console.log('=====================================');
  
  const bookResults = testBookDataSecurity();
  const wishlistResults = testWishlistDataSecurity();
  const profileResults = testUserProfileSecurity();
  const yearResults = testYearValidation();
  
  const totalResults = {
    summary: {
      total: bookResults.summary.total + wishlistResults.summary.total + 
             profileResults.summary.total + yearResults.summary.total,
      passed: bookResults.summary.passed + wishlistResults.summary.passed + 
              profileResults.summary.passed + yearResults.summary.passed,
      failed: bookResults.summary.failed + wishlistResults.summary.failed + 
              profileResults.summary.failed + yearResults.summary.failed
    },
    details: {
      books: bookResults,
      wishlist: wishlistResults,
      profile: profileResults,
      year: yearResults
    }
  };
  
  totalResults.summary.passRate = 
    ((totalResults.summary.passed / totalResults.summary.total) * 100).toFixed(2) + '%';
  
  console.log('\n📊 総合テスト結果');
  console.log('=====================================');
  console.log(`合計テスト数: ${totalResults.summary.total}`);
  console.log(`成功: ${totalResults.summary.passed}`);
  console.log(`失敗: ${totalResults.summary.failed}`);
  console.log(`成功率: ${totalResults.summary.passRate}`);
  
  if (totalResults.summary.failed > 0) {
    console.warn('⚠️  一部のセキュリティテストが失敗しました。詳細を確認してください。');
  } else {
    console.log('✅ すべてのセキュリティテストが成功しました！');
  }
  
  return totalResults;
};

/**
 * 本番環境用セキュリティモニタリング
 */
export const setupSecurityMonitoring = () => {
  // 定期的なセキュリティチェック（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 開発環境でのセキュリティモニタリングを開始');
    
    // 定期実行を無効化（パフォーマンス改善）
    // setInterval(() => {
    //   console.log('⏰ 定期セキュリティチェック実行中...');
    //   runAllSecurityTests();
    // }, 3600000); // 1時間 = 3,600,000ms
  }
};

/**
 * セキュリティインシデント報告
 */
export const reportSecurityIncident = (incident) => {
  const report = {
    timestamp: new Date().toISOString(),
    severity: incident.severity || 'medium',
    type: incident.type,
    description: incident.description,
    userId: incident.userId,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // 本番環境では外部ログサービスに送信
  if (process.env.NODE_ENV === 'production') {
    // TODO: 外部ログサービス（DataDog、Sentry等）に送信
    console.warn('🚨 セキュリティインシデント:', report);
  } else {
    console.warn('🚨 セキュリティインシデント（開発環境）:', report);
  }
  
  return report;
};