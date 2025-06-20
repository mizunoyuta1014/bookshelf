# 🚀 Supabase移行セットアップガイド

## 📋 前提条件
- Supabaseアカウント作成済み
- プロジェクトURL: `https://phojrdecrbdlyyoqdjld.supabase.co`
- 環境変数設定済み（.env.local）

## 🔧 セットアップ手順

### 1. Supabaseダッシュボードでのデータベース設定

1. **Supabaseダッシュボードにログイン**
   - URL: https://supabase.com/dashboard
   - プロジェクト: `phojrdecrbdlyyoqdjld`

2. **SQLエディターでスキーマ実行**
   - 左メニュー「SQL Editor」を選択
   - `supabase-schema.sql`の内容をコピー&ペースト
   - 「Run」ボタンをクリックして実行

### 2. Google OAuth設定

1. **Authentication設定**
   - 左メニュー「Authentication」→「Providers」
   - Googleプロバイダーを有効化
   - Google OAuth設定：
     ```
     Client ID: [Googleコンソールから取得]
     Client Secret: [Googleコンソールから取得]
     ```

2. **リダイレクトURL設定**
   ```
   http://localhost:5173  (開発環境)
   https://your-domain.com  (本番環境)
   ```

### 3. アプリケーションの更新

1. **現在のステータス**
   - ✅ パッケージインストール完了 (`@supabase/supabase-js`)
   - ✅ 環境変数設定完了 (`.env.local`)
   - ✅ Supabaseクライアント作成 (`src/lib/supabase.js`)
   - ✅ 新しい認証コンテキスト作成 (`src/contexts/SupabaseAuthContext.jsx`)
   - ✅ Supabaseサービス層作成 (`src/services/supabaseService.js`)

### 4. 次の必要な作業

#### A. App.jsxの更新
```jsx
// 変更前（Firebase）
import { AuthProvider } from './contexts/AuthContext'

// 変更後（Supabase）
import { AuthProvider } from './contexts/SupabaseAuthContext'
```

#### B. 各コンポーネントの更新
- Books.jsx → supabaseServiceの使用
- Header.jsx → 新しい認証コンテキストの使用
- Home.jsx → Supabase統計データの使用

#### C. データ移行（オプション）
現在のFirebaseデータをSupabaseに移行する場合:
1. Firestoreからデータエクスポート
2. PostgreSQL形式に変換
3. Supabaseにインポート

## 🎯 実装完了チェックリスト

### Phase 1: 基盤 ✅
- [x] Supabaseクライアント設定
- [x] 環境変数設定
- [x] データベーススキーマ作成
- [x] RLSポリシー設定
- [x] 認証コンテキスト作成
- [x] サービス層作成

### Phase 2: コンポーネント更新 🔄
- [ ] App.jsx 認証プロバイダー切り替え
- [ ] Books.jsx サービス層切り替え
- [ ] Header.jsx 認証処理切り替え
- [ ] Home.jsx 統計データ切り替え
- [ ] Login.jsx Supabase認証対応

### Phase 3: テスト・最適化 ⏳
- [ ] 全機能動作テスト
- [ ] パフォーマンステスト
- [ ] セキュリティテスト
- [ ] データ整合性確認

## 🚦 実行準備完了

現在の状況:
- **基盤実装**: 100%完了
- **コンポーネント更新**: 準備完了
- **テスト環境**: 準備完了

次のステップ:
1. Supabaseダッシュボードでスキーマ実行
2. Google OAuth設定
3. App.jsxで認証プロバイダー切り替え
4. 動作テスト実行

## 📞 サポート

問題が発生した場合:
1. Supabaseダッシュボードのログを確認
2. ブラウザの開発者ツールでエラーを確認
3. 環境変数が正しく設定されているか確認

---

**準備完了！** Supabaseダッシュボードでの設定完了後、移行を開始できます。