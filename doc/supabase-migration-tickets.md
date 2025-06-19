# 🔄 Supabase移行プロジェクト - 開発チケット一覧
作成日時: 2025年6月19日

---

## 📋 プロジェクト概要

**目的**: Firebase → Supabase完全移行  
**期間**: 2-3週間  
**効果**: 50-70%コスト削減 + 開発効率向上  
**担当**: 全チーム協力（Phase別分担）

---

## 🎫 Phase 1: 環境準備・基盤構築

### 🔧 [SUPABASE-001] Supabaseプロジェクト環境構築
**担当**: DevOps + Team A  
**工数**: 1日  
**優先度**: 🔴 High  

**要件**:
- [ ] Supabaseプロジェクト作成
- [ ] 環境変数設定 (.env.example更新)
- [ ] プロジェクト設定の最適化
- [ ] 開発・本番環境分離

**成果物**:
- Supabaseプロジェクト
- 環境設定ドキュメント
- アクセス権限設定

**完了条件**:
- [ ] Supabaseダッシュボードアクセス可能
- [ ] 環境変数正常設定
- [ ] チーム全員アクセス権付与

---

### 🗃️ [SUPABASE-002] PostgreSQLデータベーススキーマ設計・実装
**担当**: Team A + Team C  
**工数**: 2日  
**優先度**: 🔴 High  

**要件**:
- [ ] usersテーブル作成
- [ ] booksテーブル作成
- [ ] wishlistテーブル作成
- [ ] user_preferencesテーブル作成
- [ ] インデックス最適化
- [ ] 制約条件設定

**SQLスクリプト**:
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

-- その他テーブル...
```

**完了条件**:
- [ ] 全テーブル作成完了
- [ ] インデックス設定完了
- [ ] データ整合性テスト通過

---

### 🛡️ [SUPABASE-003] Row Level Security (RLS) ポリシー実装
**担当**: Team A  
**工数**: 1日  
**優先度**: 🔴 High  

**要件**:
- [ ] 全テーブルのRLS有効化
- [ ] ユーザー別データアクセス制御
- [ ] セキュリティポリシー設定
- [ ] 権限テスト実施

**セキュリティポリシー例**:
```sql
-- Books RLS
CREATE POLICY "Users can view own books" ON books
  FOR SELECT USING (auth.uid() = user_id);
```

**完了条件**:
- [ ] 全テーブルRLS設定完了
- [ ] セキュリティテスト全通過
- [ ] 不正アクセス防止確認

---

### 📦 [SUPABASE-004] 依存関係・パッケージ更新
**担当**: Team B  
**工数**: 0.5日  
**優先度**: 🔴 High  

**要件**:
- [ ] @supabase/supabase-js インストール
- [ ] firebase 依存関係削除
- [ ] package.json 更新
- [ ] 型定義更新

**更新内容**:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    // firebase削除
  }
}
```

**完了条件**:
- [ ] パッケージインストール完了
- [ ] ビルドエラーなし
- [ ] 型定義エラーなし

---

## 🎫 Phase 2: 認証システム移行

### 🔐 [SUPABASE-005] Supabase認証クライアント実装
**担当**: Team A  
**工数**: 1日  
**優先度**: 🔴 High  

**要件**:
- [ ] supabase.js クライアント作成
- [ ] 認証設定最適化
- [ ] Google OAuth設定
- [ ] セッション管理設定

**ファイル**:
- `src/lib/supabase.js` (新規作成)

**実装内容**:
```javascript
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

**完了条件**:
- [ ] クライアント正常動作
- [ ] Google OAuth設定完了
- [ ] セッション管理動作確認

---

### 🔄 [SUPABASE-006] AuthContext移行実装
**担当**: Team A  
**工数**: 2日  
**優先度**: 🔴 High  

**要件**:
- [ ] AuthContext.jsx 完全書き換え
- [ ] Supabase認証統合
- [ ] セッション状態管理
- [ ] エラーハンドリング強化

**ファイル**:
- `src/contexts/AuthContext.jsx` (更新)

**主要機能**:
- signInWithGoogle()
- signOut()
- セッション監視
- ユーザー情報管理

**完了条件**:
- [ ] ログイン/ログアウト動作
- [ ] セッション永続化
- [ ] エラーハンドリング完了

---

### 🎯 [SUPABASE-007] ログイン・認証UI更新
**担当**: Team B  
**工数**: 1日  
**優先度**: 🟡 Medium  

**要件**:
- [ ] Login.jsx Supabase対応
- [ ] ProtectedRoute.jsx 更新
- [ ] エラーメッセージ更新
- [ ] ローディング状態改善

**ファイル**:
- `src/components/Login.jsx` (更新)
- `src/components/ProtectedRoute.jsx` (更新)

**完了条件**:
- [ ] UI正常動作
- [ ] エラー表示適切
- [ ] UX改善確認

---

## 🎫 Phase 3: データサービス層移行

### 🔧 [SUPABASE-008] 新しいSupabaseサービス層実装
**担当**: Team A + Team D  
**工数**: 3日  
**優先度**: 🔴 High  

**要件**:
- [ ] supabaseService.js 新規作成
- [ ] CRUD操作実装
- [ ] エラーハンドリング
- [ ] 型安全性確保

**ファイル**:
- `src/services/supabaseService.js` (新規作成)

**主要機能**:
```javascript
export const bookService = {
  getBooks: async (userId, year) => {},
  addBook: async (userId, bookData, year) => {},
  updateBook: async (userId, bookId, updates) => {},
  deleteBook: async (userId, bookId) => {},
  searchBooks: async (userId, query, year) => {},
  getStatistics: async (userId, year) => {}
}
```

**完了条件**:
- [ ] 全CRUD操作動作
- [ ] エラーハンドリング完了
- [ ] 型定義完了

---

### 🔍 [SUPABASE-009] 検索・フィルタリング機能移行
**担当**: Team D  
**工数**: 2日  
**優先度**: 🟡 Medium  

**要件**:
- [ ] PostgreSQL検索クエリ最適化
- [ ] フィルタリング機能移行
- [ ] ソート機能移行
- [ ] パフォーマンス最適化

**実装範囲**:
- useSearch.js 更新
- useFilter.js 更新
- useSort.js 更新

**完了条件**:
- [ ] 検索機能正常動作
- [ ] フィルタリング正常動作
- [ ] パフォーマンス基準達成

---

### 📊 [SUPABASE-010] 統計・分析機能移行
**担当**: Team C  
**工数**: 2日  
**優先度**: 🟡 Medium  

**要件**:
- [ ] PostgreSQL統計クエリ実装
- [ ] 集計機能最適化
- [ ] リアルタイム統計対応
- [ ] エクスポート機能維持

**実装範囲**:
- useStatistics.js 更新
- statistics.js 更新
- export.js 更新

**完了条件**:
- [ ] 統計機能正常動作
- [ ] エクスポート機能維持
- [ ] リアルタイム更新確認

---

### 💝 [SUPABASE-011] ウィッシュリスト機能移行
**担当**: Team D  
**工数**: 1日  
**優先度**: 🟢 Low  

**要件**:
- [ ] wishlistテーブル対応
- [ ] Want.jsx 機能移行
- [ ] Google Books API統合維持
- [ ] ウィッシュリスト→読書記録移行機能

**ファイル**:
- `src/components/Want.jsx` (更新)
- `src/services/wishlistService.js` (新規作成)

**完了条件**:
- [ ] ウィッシュリスト機能動作
- [ ] データ移行機能動作
- [ ] Google Books統合維持

---

## 🎫 Phase 4: UI コンポーネント統合

### 🎨 [SUPABASE-012] メインコンポーネント更新
**担当**: Team B  
**工数**: 2日  
**優先度**: 🟡 Medium  

**要件**:
- [ ] Books.jsx サービス層変更対応
- [ ] Header.jsx 認証状態対応
- [ ] Home.jsx 統計データ対応
- [ ] エラーハンドリング統一

**更新ファイル**:
- Books.jsx
- Header.jsx
- Home.jsx
- Statistics.jsx

**完了条件**:
- [ ] 全コンポーネント正常動作
- [ ] データ表示正常
- [ ] エラー処理統一

---

### 🎯 [SUPABASE-013] フック・ユーティリティ更新
**担当**: Team B + Team D  
**工数**: 1日  
**優先度**: 🟡 Medium  

**要件**:
- [ ] useAuth.js 完全更新
- [ ] カスタムフック Supabase対応
- [ ] ユーティリティ関数更新
- [ ] 型定義更新

**更新ファイル**:
- useAuth.js
- useSearch.js
- useFilter.js
- useStatistics.js

**完了条件**:
- [ ] 全フック正常動作
- [ ] 型安全性確保
- [ ] パフォーマンス最適化

---

## 🎫 Phase 5: データ移行・テスト

### 📦 [SUPABASE-014] Firebaseデータエクスポート
**担当**: Team A  
**工数**: 1日  
**優先度**: 🔴 High  

**要件**:
- [ ] Firestoreデータ完全エクスポート
- [ ] データ形式変換スクリプト作成
- [ ] データ整合性確認
- [ ] バックアップ作成

**ツール**:
- Firebase Admin SDK
- データ変換スクリプト
- 検証スクリプト

**完了条件**:
- [ ] 全データエクスポート完了
- [ ] データ整合性確認
- [ ] バックアップ確保

---

### 🔄 [SUPABASE-015] PostgreSQLデータインポート
**担当**: Team A + Team C  
**工数**: 1日  
**優先度**: 🔴 High  

**要件**:
- [ ] データ変換処理実行
- [ ] PostgreSQLデータインポート
- [ ] データ検証・確認
- [ ] インデックス再構築

**インポートプロセス**:
1. ユーザーデータ変換・インポート
2. 書籍データ変換・インポート
3. 関連データ整合性確認
4. インデックス最適化

**完了条件**:
- [ ] 全データインポート完了
- [ ] データ整合性確認
- [ ] パフォーマンステスト通過

---

### 🧪 [SUPABASE-016] 包括的機能テスト
**担当**: 全チーム  
**工数**: 2日  
**優先度**: 🔴 High  

**要件**:
- [ ] 全機能動作確認
- [ ] 認証フローテスト
- [ ] CRUD操作テスト
- [ ] 検索・フィルタリングテスト
- [ ] 統計・エクスポートテスト

**テスト項目**:
- ユーザー登録・ログイン
- 書籍追加・編集・削除
- 検索・フィルタリング
- 統計表示・エクスポート
- エラーハンドリング

**完了条件**:
- [ ] 全機能テスト通過
- [ ] パフォーマンス基準達成
- [ ] セキュリティテスト通過

---

### ⚡ [SUPABASE-017] パフォーマンス最適化・チューニング
**担当**: Team A + Team C  
**工数**: 1日  
**優先度**: 🟡 Medium  

**要件**:
- [ ] クエリ最適化
- [ ] インデックス調整
- [ ] コネクション最適化
- [ ] キャッシュ戦略実装

**最適化項目**:
- データベースクエリ最適化
- フロントエンドキャッシュ
- バンドルサイズ最適化
- ネットワーク最適化

**完了条件**:
- [ ] ページ読み込み < 2秒
- [ ] クエリ応答 < 200ms
- [ ] バンドルサイズ最適化

---

## 🎫 Phase 6: 本番移行・監視

### 🚀 [SUPABASE-018] 本番環境デプロイメント
**担当**: DevOps + Team A  
**工数**: 1日  
**優先度**: 🔴 High  

**要件**:
- [ ] 本番環境設定
- [ ] 環境変数設定
- [ ] SSL証明書設定
- [ ] CDN設定

**デプロイメント手順**:
1. 本番Supabaseプロジェクト設定
2. 環境変数設定
3. アプリケーションデプロイ
4. 動作確認

**完了条件**:
- [ ] 本番環境正常動作
- [ ] SSL設定完了
- [ ] 監視設定完了

---

### 📊 [SUPABASE-019] 監視・アラート設定
**担当**: Team A  
**工数**: 0.5日  
**優先度**: 🟡 Medium  

**要件**:
- [ ] Supabase監視設定
- [ ] エラーアラート設定
- [ ] パフォーマンス監視
- [ ] ログ集約設定

**監視項目**:
- データベース接続状況
- クエリパフォーマンス
- エラー率
- レスポンス時間

**完了条件**:
- [ ] 監視ダッシュボード設定
- [ ] アラート動作確認
- [ ] ログ収集確認

---

### 📚 [SUPABASE-020] ドキュメント・ガイド更新
**担当**: Team B  
**工数**: 1日  
**優先度**: 🟢 Low  

**要件**:
- [ ] 開発者ドキュメント更新
- [ ] API仕様書更新
- [ ] 運用ガイド作成
- [ ] トラブルシューティングガイド

**作成ドキュメント**:
- Supabase設定ガイド
- API仕様書
- 運用マニュアル
- バックアップ・復旧手順

**完了条件**:
- [ ] 全ドキュメント更新完了
- [ ] チーム全員確認済み
- [ ] 運用ガイド整備完了

---

## 📊 チケット一覧サマリー

### **Phase 1: 環境準備**（4チケット - 4.5日）
| チケット | 担当 | 工数 | 優先度 |
|---------|------|------|--------|
| SUPABASE-001 | DevOps + Team A | 1日 | 🔴 High |
| SUPABASE-002 | Team A + Team C | 2日 | 🔴 High |
| SUPABASE-003 | Team A | 1日 | 🔴 High |
| SUPABASE-004 | Team B | 0.5日 | 🔴 High |

### **Phase 2: 認証移行**（3チケット - 4日）
| チケット | 担当 | 工数 | 優先度 |
|---------|------|------|--------|
| SUPABASE-005 | Team A | 1日 | 🔴 High |
| SUPABASE-006 | Team A | 2日 | 🔴 High |
| SUPABASE-007 | Team B | 1日 | 🟡 Medium |

### **Phase 3: データサービス移行**（4チケット - 8日）
| チケット | 担当 | 工数 | 優先度 |
|---------|------|------|--------|
| SUPABASE-008 | Team A + Team D | 3日 | 🔴 High |
| SUPABASE-009 | Team D | 2日 | 🟡 Medium |
| SUPABASE-010 | Team C | 2日 | 🟡 Medium |
| SUPABASE-011 | Team D | 1日 | 🟢 Low |

### **Phase 4: UI統合**（2チケット - 3日）
| チケット | 担当 | 工数 | 優先度 |
|---------|------|------|--------|
| SUPABASE-012 | Team B | 2日 | 🟡 Medium |
| SUPABASE-013 | Team B + Team D | 1日 | 🟡 Medium |

### **Phase 5: データ移行・テスト**（4チケット - 5日）
| チケット | 担当 | 工数 | 優先度 |
|---------|------|------|--------|
| SUPABASE-014 | Team A | 1日 | 🔴 High |
| SUPABASE-015 | Team A + Team C | 1日 | 🔴 High |
| SUPABASE-016 | 全チーム | 2日 | 🔴 High |
| SUPABASE-017 | Team A + Team C | 1日 | 🟡 Medium |

### **Phase 6: 本番移行**（3チケット - 2.5日）
| チケット | 担当 | 工数 | 優先度 |
|---------|------|------|--------|
| SUPABASE-018 | DevOps + Team A | 1日 | 🔴 High |
| SUPABASE-019 | Team A | 0.5日 | 🟡 Medium |
| SUPABASE-020 | Team B | 1日 | 🟢 Low |

---

## 📈 工数・スケジュール総計

### **総チケット数**: 20チケット
### **総工数**: 27日
### **推奨期間**: 3週間（並行作業により短縮）

### **チーム別工数配分**
- **Team A**: 12日（認証・データベース中心）
- **Team B**: 6.5日（UI・ドキュメント中心）
- **Team C**: 5日（統計・データ移行中心）
- **Team D**: 6日（検索・サービス層中心）
- **DevOps**: 2日（インフラ・デプロイ）

---

## 🎯 成功指標

### **技術指標**
- [ ] 全機能動作確認 100%
- [ ] パフォーマンス改善 20%以上
- [ ] セキュリティテスト 100%通過

### **ビジネス指標**
- [ ] コスト削減 50%以上達成
- [ ] ダウンタイム 0時間
- [ ] ユーザー影響 最小化

### **品質指標**
- [ ] バグ発生 0件
- [ ] データ損失 0件
- [ ] セキュリティ問題 0件

---

## ✅ 移行完了チェックリスト

### **機能確認**
- [ ] ユーザー認証（ログイン・ログアウト）
- [ ] 書籍CRUD操作
- [ ] 検索・フィルタリング
- [ ] 統計・エクスポート
- [ ] ウィッシュリスト

### **非機能確認**
- [ ] パフォーマンス基準達成
- [ ] セキュリティ要件満足
- [ ] 監視・アラート動作

### **運用確認**
- [ ] バックアップ動作
- [ ] 復旧手順確認
- [ ] ドキュメント整備

---

## 🚀 Supabase移行による期待効果

### **即座の効果**
- **コスト削減**: 50-70%減
- **開発効率**: PostgreSQL活用
- **監視統合**: 一元管理

### **中長期効果**
- **スケーラビリティ**: 自動スケーリング
- **技術的負債軽減**: モダンな技術スタック
- **競争優位性**: 最新技術による差別化

**結論**: Supabase移行により、技術的・経済的に大幅な改善が期待できる戦略的プロジェクトです。