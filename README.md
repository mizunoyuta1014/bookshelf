# 読書管理アプリケーション (Bookshelf)

Firebase を使用した個人読書記録管理アプリケーションです。読書記録の登録、統計表示、エクスポート機能などを提供します。

## 機能概要

- **読書記録管理**: 本の登録、編集、削除
- **統計・分析**: カテゴリ別統計、月別推移グラフ、目標達成率
- **検索・フィルタリング**: 書名・著者検索、カテゴリ・読了状態フィルター
- **データエクスポート**: CSV/PDF形式でのデータ出力
- **認証システム**: Firebase Authentication による Google ログイン
- **年別管理**: 年度別での読書記録管理
- **レスポンシブデザイン**: モバイル・タブレット対応
- **ダークモード**: テーマ切り替え機能

## 必要環境

- **Node.js**: 18.0.0 以上
- **npm**: 9.0.0 以上
- **Firebase プロジェクト**: Firestore、Authentication が有効
- **ブラウザ**: Chrome, Firefox, Safari, Edge (ES2020 対応)

## セットアップ手順

### 1. リポジトリのクローン・依存関係インストール

```bash
# プロジェクトディレクトリに移動
cd bookshelf

# 依存関係をインストール
npm install
```

### 2. Firebase 設定

#### 2.1 Firebase プロジェクトの作成
1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 新しいプロジェクトを作成
3. Firestore Database を有効化 (テストモードで開始)
4. Authentication を有効化し、Google プロバイダーを設定

#### 2.2 環境変数の設定
プロジェクトルートに `.env` ファイルを作成し、Firebase の設定を追加：

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> `.env.example` ファイルを参考にしてください。

### 3. Firestore セキュリティルール

Firestore のセキュリティルールを以下のように設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ユーザー認証済みの場合のみ、自分のデータにアクセス可能
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 旧形式の booklist コレクション（下位互換性）
    match /booklist/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 開発・起動手順

### 開発サーバーの起動

```bash
# 開発サーバーを起動 (http://localhost:5173)
npm run start
# または
npm run dev
```

### ビルド・本番環境

```bash
# プロダクションビルド
npm run build

# ビルド結果のプレビュー
npm run preview

# コード品質チェック
npm run lint
```

### 一般的な開発ワークフロー

1. **開発開始**
   ```bash
   npm run start
   ```

2. **コード修正・機能追加**
   - `src/` ディレクトリ内のファイルを編集
   - ホットリロードで即座に変更が反映

3. **品質チェック**
   ```bash
   npm run lint
   ```

4. **本番デプロイ前確認**
   ```bash
   npm run build
   npm run preview
   ```

## プロジェクト構造

```
src/
├── components/          # React コンポーネント
│   ├── Charts/         # グラフ・統計表示コンポーネント
│   ├── Books.jsx       # 読書記録メインページ
│   ├── Statistics.jsx  # 統計・分析ページ
│   ├── Want.jsx        # 読みたい本リスト
│   └── ...
├── contexts/           # React Context (認証、テーマ)
├── hooks/              # カスタムフック
├── services/           # Firebase 操作
├── utils/              # ユーティリティ関数
└── ...
```

## 主要な依存関係

- **React 18**: UI フレームワーク
- **Vite**: ビルドツール・開発サーバー
- **Firebase 10**: バックエンドサービス (Firestore, Auth)
- **React Router 6**: ルーティング
- **Recharts**: グラフ・チャート表示
- **jsPDF**: PDF エクスポート
- **React Icons**: アイコンライブラリ

## トラブルシューティング

### よくある問題と解決方法

#### 1. Firebase 接続エラー
```bash
# 環境変数の確認
echo $VITE_FIREBASE_API_KEY

# .env ファイルの存在確認
ls -la .env
```

#### 2. 依存関係エラー
```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 3. ポート番号競合
```bash
# 別のポートで起動
npm run start -- --port 3000
```

#### 4. ビルドエラー
```bash
# 型チェック・Lint エラーの確認
npm run lint

# キャッシュクリア
rm -rf dist .vite
npm run build
```

### ログの確認方法

- **開発時**: ブラウザの Developer Tools > Console
- **Firebase エラー**: Network タブで API リクエストを確認
- **認証エラー**: Firebase Console > Authentication > Users

## デプロイ手順

### Vercel へのデプロイ

1. **Vercel アカウント作成・ログイン**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **プロジェクト設定**
   ```bash
   vercel
   # プロジェクト名、設定を対話的に入力
   ```

3. **環境変数設定**
   - Vercel Dashboard で環境変数を設定
   - `.env` の内容をコピー

4. **自動デプロイ設定**
   - GitHub リポジトリと連携
   - main ブランチへの push で自動デプロイ

### Firebase Hosting へのデプロイ

```bash
# Firebase CLI インストール
npm install -g firebase-tools

# ログイン
firebase login

# プロジェクト初期化
firebase init hosting

# デプロイ
npm run build
firebase deploy
```

## 開発チーム向け情報

このプロジェクトは並列開発に対応した構造になっています：

- **Team A**: 認証・セキュリティ (`src/contexts/`, `src/services/`)
- **Team B**: UI/UX 改善 (`src/components/`, CSS ファイル)
- **Team C**: データ分析・統計 (`src/utils/statistics.js`, `src/components/Charts/`)
- **Team D**: 検索・フィルタリング (`src/hooks/useSearch.js`, `src/hooks/useFilter.js`)

詳細は `doc/parallel-development-tasks.md` を参照してください。

## ライセンス

MIT License

## サポート・問い合わせ

- バグ報告: GitHub Issues
- 機能要望: GitHub Discussions
- 技術的質問: README の内容を確認後、Issues へ投稿