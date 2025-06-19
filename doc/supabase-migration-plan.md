# 🔄 Firebase → Supabase 移行計画書
作成日時: 2025年6月19日

---

## 📋 移行概要

### 🎯 移行目的
- **コスト最適化**: Supabaseの競争力のある価格体系
- **PostgreSQL活用**: より柔軟なリレーショナルデータベース
- **開発効率向上**: 統合された開発環境
- **オープンソース**: ベンダーロックイン回避

### 📊 現在のFirebase使用状況
- **Firestore**: ユーザー別書籍データ管理
- **Firebase Auth**: Google認証
- **Firebase Storage**: ファイルアップロード（将来的）

---

## 🗃️ データベース設計移行

### **現在のFirestore構造**
```
users/{userId}/
  years/{year}/
    books/{bookId}/
      - bookTitle: string
      - author: string
      - bookPlace: string
      - category: string
      - isRead: boolean
      - isOwned: boolean
      - timestamp: timestamp
```

### **新しいSupabase (PostgreSQL) 構造**
```sql
-- Users テーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books テーブル
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_title VARCHAR(500) NOT NULL,
  author VARCHAR(300),
  book_place VARCHAR(100),
  category VARCHAR(100),
  is_read BOOLEAN DEFAULT FALSE,
  is_owned BOOLEAN DEFAULT FALSE,
  year INTEGER NOT NULL,
  memo TEXT,
  rating INTEGER CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wishlist テーブル
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  authors TEXT[],
  description TEXT,
  google_books_id VARCHAR(100),
  image_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Preferences テーブル
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'ja',
  export_format VARCHAR(10) DEFAULT 'csv',
  reading_goal_yearly INTEGER DEFAULT 40,
  reading_goal_monthly INTEGER DEFAULT 3,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_books_user_year ON books(user_id, year);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_created_at ON books(created_at);
CREATE INDEX idx_wishlist_user ON wishlist(user_id);
```

---

## 🔐 認証システム移行

### **Supabase Auth設定**
```javascript
// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### **認証フロー変更**
```javascript
// AuthContext.jsx の変更
import { supabase } from '../supabase'

// Google認証
const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/callback`
    }
  })
  return { data, error }
}

// ログアウト
const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// セッション管理
const [session, setSession] = useState(null)

useEffect(() => {
  // 現在のセッション取得
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
  })

  // セッション変更監視
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session)
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

---

## 🔄 データサービス層移行

### **新しいSupabaseService**
```javascript
// services/supabaseService.js
import { supabase } from '../supabase'

export const bookService = {
  // 書籍一覧取得
  async getBooks(userId, year) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 書籍追加
  async addBook(userId, bookData, year) {
    const { data, error } = await supabase
      .from('books')
      .insert([{
        user_id: userId,
        year: year,
        ...bookData,
        created_at: new Date().toISOString()
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 書籍更新
  async updateBook(userId, bookId, updates, year) {
    const { data, error } = await supabase
      .from('books')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .eq('user_id', userId)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // 書籍削除
  async deleteBook(userId, bookId, year) {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // 統計取得
  async getStatistics(userId, year) {
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
    
    if (error) throw error
    
    return {
      totalBooks: books.length,
      readBooks: books.filter(book => book.is_read).length,
      ownedBooks: books.filter(book => book.is_owned).length,
      categoryStats: this.calculateCategoryStats(books),
      books
    }
  },

  // 検索
  async searchBooks(userId, query, year) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .or(`book_title.ilike.%${query}%,author.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// ウィッシュリストサービス
export const wishlistService = {
  async getWishlist(userId) {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async addToWishlist(userId, item) {
    const { data, error } = await supabase
      .from('wishlist')
      .insert([{
        user_id: userId,
        ...item
      }])
      .select()
    
    if (error) throw error
    return data[0]
  }
}
```

---

## 🛡️ セキュリティ設定 (RLS)

### **Row Level Security ポリシー**
```sql
-- Users テーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Books テーブルのRLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own books" ON books
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own books" ON books
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own books" ON books
  FOR DELETE USING (auth.uid() = user_id);

-- Wishlist テーブルのRLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist" ON wishlist
  FOR ALL USING (auth.uid() = user_id);

-- User Preferences テーブルのRLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);
```

---

## 📦 依存関係の変更

### **package.json 更新**
```json
{
  "dependencies": {
    // 削除
    // "firebase": "^10.x.x",
    
    // 追加
    "@supabase/supabase-js": "^2.39.0",
    
    // 既存維持
    "react": "^18.2.0",
    "react-router-dom": "^6.x.x",
    "recharts": "^2.x.x"
  }
}
```

### **環境変数 (.env)**
```env
# Supabase設定
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# 削除予定（Firebase）
# REACT_APP_FIREBASE_API_KEY=
# REACT_APP_FIREBASE_AUTH_DOMAIN=
# REACT_APP_FIREBASE_PROJECT_ID=
# REACT_APP_FIREBASE_STORAGE_BUCKET=
# REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
# REACT_APP_FIREBASE_APP_ID=
```

---

## 🔄 移行手順

### **Phase 1: 環境準備**（1-2日）
1. ✅ Supabaseプロジェクト作成
2. ✅ データベーススキーマ設定
3. ✅ RLSポリシー設定
4. ✅ Google OAuth設定

### **Phase 2: 認証システム移行**（2-3日）
1. ✅ Supabase認証ライブラリ統合
2. ✅ AuthContext.jsx 更新
3. ✅ ログイン/ログアウト機能移行
4. ✅ セッション管理移行

### **Phase 3: データサービス移行**（3-4日）
1. ✅ bookService.js → supabaseService.js
2. ✅ CRUD操作の移行
3. ✅ 検索・フィルタリング機能移行
4. ✅ 統計機能移行

### **Phase 4: データ移行**（1日）
1. ✅ Firestore データエクスポート
2. ✅ PostgreSQL データインポート
3. ✅ データ整合性確認

### **Phase 5: テスト・最適化**（2-3日）
1. ✅ 機能テスト
2. ✅ パフォーマンステスト
3. ✅ セキュリティテスト
4. ✅ バグ修正

---

## 💰 コスト比較

### **Firebase 現在コスト（推定）**
- Firestore読み取り: $0.36/100万回
- Firebase Auth: $0.02/月次アクティブユーザー
- Hosting: $0.026/GB

### **Supabase 新コスト**
- Pro Plan: $25/月（10GB含む）
- 追加ストレージ: $0.125/GB
- 無制限認証ユーザー

**月間1000ユーザー想定**: 
- Firebase: ~$50-100/月
- Supabase: $25-35/月

**コスト削減**: 約50-70%

---

## 🎯 移行メリット

### **技術的メリット**
- **PostgreSQL**: より強力なクエリ機能
- **リアルタイム**: WebSocket内蔵
- **API自動生成**: REST + GraphQL
- **型安全性**: TypeScript完全対応

### **開発効率メリット**
- **統合ダッシュボード**: DB管理+認証管理
- **SQL直接実行**: 柔軟なデータ操作
- **エッジ関数**: サーバーレス関数
- **ストレージ統合**: ファイル管理一元化

### **運用メリット**
- **コスト最適化**: 50-70%削減
- **スケーラビリティ**: 自動スケーリング
- **バックアップ**: 自動バックアップ
- **監視**: 内蔵モニタリング

---

## ⚠️ 移行リスク・注意点

### **技術的リスク**
- **データ移行**: データ損失の可能性
- **認証移行**: ユーザーの再ログイン要求
- **API変更**: 既存機能への影響

### **軽減策**
- **段階的移行**: 機能単位での移行
- **並行運用**: Firebase併用期間設定
- **ロールバック計画**: 移行失敗時の復旧手順
- **十分なテスト**: 全機能の動作確認

---

## 📅 移行スケジュール

### **推奨タイムライン: 2-3週間**

**Week 1**: 環境準備・認証移行
- Day 1-2: Supabase環境構築
- Day 3-5: 認証システム移行
- Day 6-7: 基本テスト

**Week 2**: データサービス移行
- Day 8-10: CRUD機能移行
- Day 11-12: 高度機能移行
- Day 13-14: データ移行実施

**Week 3**: テスト・本番移行
- Day 15-17: 包括的テスト
- Day 18-19: 本番環境移行
- Day 20-21: 監視・最適化

---

## ✅ チェックリスト

### **移行前準備**
- [ ] Supabaseプロジェクト作成
- [ ] データベーススキーマ設計完了
- [ ] 移行スクリプト作成
- [ ] テスト計画策定

### **移行実施**
- [ ] 認証システム移行
- [ ] データサービス移行
- [ ] UI コンポーネント更新
- [ ] データ移行実行

### **移行後確認**
- [ ] 全機能動作確認
- [ ] パフォーマンステスト
- [ ] セキュリティ監査
- [ ] ユーザー受け入れテスト

---

## 🎯 結論

Supabaseへの移行により、**コスト削減**、**開発効率向上**、**技術的柔軟性**を実現できます。

**移行推奨**: ✅ **即時開始推奨**  
**期待効果**: **50-70%コスト削減 + 開発効率向上**  
**リスク**: **低リスク（適切な移行計画により軽減可能）**