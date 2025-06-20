# 📋 E2Eテストガイド

## 🚀 セットアップ

### 1. Playwrightブラウザのインストール
```bash
npm run test:install
```

### 2. アプリケーションの起動
```bash
npm run start
```

## 🧪 テスト実行

### 基本的なテスト実行
```bash
# 全てのテストを実行
npm run test

# UIモードでテスト実行
npm run test:ui

# ブラウザを表示してテスト実行
npm run test:headed

# デバッグモードでテスト実行
npm run test:debug
```

### 特定のテストファイルを実行
```bash
# 認証テストのみ
npx playwright test auth.spec.js

# 書籍機能テストのみ
npx playwright test books.spec.js

# 統計・ウィッシュリスト機能テストのみ
npx playwright test features.spec.js
```

### 特定のブラウザでテスト実行
```bash
# Chromiumのみ
npx playwright test --project=chromium

# Firefoxのみ
npx playwright test --project=firefox

# Safariのみ
npx playwright test --project=webkit
```

## 📁 テストファイル構成

```
tests/
├── e2e/
│   ├── auth.spec.js        # 認証フローのテスト
│   ├── books.spec.js       # 書籍CRUD操作のテスト
│   └── features.spec.js    # 統計・ウィッシュリスト機能のテスト
└── README.md              # このファイル
```

## 🔧 テスト内容

### 1. 認証フロー (`auth.spec.js`)
- [ ] ログインページの表示確認
- [ ] Googleログインボタンの動作確認
- [ ] テーマ切り替え機能
- [ ] パスワードリセット機能
- [ ] レスポンシブデザイン確認
- [ ] 認証済みユーザーのホーム画面表示
- [ ] ログアウト機能
- [ ] サイドバーナビゲーション

### 2. 書籍CRUD操作 (`books.spec.js`)
- [ ] 書籍一覧ページの表示
- [ ] 新しい書籍の追加
- [ ] 書籍情報の編集
- [ ] 読了状態の変更
- [ ] 書籍の削除
- [ ] 書籍検索機能
- [ ] 年度フィルター
- [ ] エクスポート機能
- [ ] 評価とメモ機能
- [ ] ページネーション

### 3. 統計・ウィッシュリスト機能 (`features.spec.js`)

#### 統計機能
- [ ] 統計ページの表示
- [ ] 読書進捗バーの表示
- [ ] 円グラフの表示
- [ ] 月別読書グラフの表示
- [ ] 目標設定機能
- [ ] 年度変更による統計更新
- [ ] 統計データのエクスポート

#### ウィッシュリスト機能
- [ ] ウィッシュリストページの表示
- [ ] 本検索機能
- [ ] ウィッシュリストに本を追加
- [ ] ウィッシュリストの表示
- [ ] ウィッシュリストから削除
- [ ] 読書記録への移動

#### 推薦機能
- [ ] 推薦パネルの表示
- [ ] 推薦機能の動作

## 🔍 テスト戦略

### モック認証
テストでは実際のSupabase認証ではなく、ローカルストレージにモックトークンを設定して認証済み状態をシミュレートしています。

```javascript
await page.addInitScript(() => {
  localStorage.setItem('sb-localhost-auth-token', JSON.stringify({
    user: { id: 'test-user-id', email: 'test@example.com' },
    session: { access_token: 'mock-token' }
  }));
});
```

### エラー処理
- ネットワークエラーやAPI障害のシミュレーション
- フォームバリデーションエラーの確認
- エラーメッセージの表示確認

### レスポンシブテスト
複数の画面サイズでのテスト実行：
- デスクトップ (1200x800)
- タブレット (768x1024)
- モバイル (375x667)

## 📊 テストレポート

テスト実行後、`playwright-report/`ディレクトリにHTMLレポートが生成されます。

```bash
# レポートを開く
npx playwright show-report
```

## 🐛 トラブルシューティング

### よくある問題

1. **テストがタイムアウトする**
   ```bash
   # タイムアウト時間を延長
   npx playwright test --timeout=60000
   ```

2. **ブラウザが見つからない**
   ```bash
   # ブラウザを再インストール
   npm run test:install
   ```

3. **ポートが使用中**
   ```bash
   # 別のポートでアプリを起動
   npm run start -- --port 5174
   ```
   その後、`playwright.config.js`の`baseURL`を更新してください。

## 🔄 CI/CD統合

### GitHub Actions設定例
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:install
      - run: npm run build
      - run: npm run test
```

## 📝 メンテナンス

### テストの更新
- UI変更時は対応するセレクターを更新
- 新機能追加時は対応するテストケースを追加
- パフォーマンス改善のため定期的にテストの実行時間を確認

### ベストプラクティス
- 独立性: 各テストは他のテストに依存しない
- 安定性: フラキーなテストを避けるため適切な待機を使用
- 可読性: テスト名と内容を明確に記述
- 保守性: 重複コードを避け、再利用可能なヘルパー関数を作成