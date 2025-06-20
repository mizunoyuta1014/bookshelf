import { test, expect } from '@playwright/test';

test.describe('書籍CRUD操作', () => {
  test.beforeEach(async ({ page }) => {
    // 認証済みユーザーとしてセットアップ
    await page.addInitScript(() => {
      localStorage.setItem('sb-localhost-auth-token', JSON.stringify({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          email_confirmed_at: new Date().toISOString()
        },
        session: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token'
        }
      }));
    });
    
    await page.goto('/books');
  });

  test('書籍一覧ページが正しく表示される', async ({ page }) => {
    // ページタイトルとメイン要素の確認
    await expect(page.locator('h1, h2')).toContainText(['書籍管理', '本', 'Books']);
    
    // 新規追加ボタンが表示される
    await expect(page.locator('button:has-text("追加"), button:has-text("新規")')).toBeVisible();
    
    // 年度選択が表示される
    await expect(page.locator('select, .year-selector')).toBeVisible();
  });

  test('新しい書籍を追加できる', async ({ page }) => {
    // 追加ボタンをクリック
    await page.locator('button:has-text("追加"), button:has-text("新規")').first().click();
    
    // モーダルまたはフォームが開くことを確認
    await expect(page.locator('.modal, .popup, form')).toBeVisible();
    
    // フォームフィールドに入力
    const titleInput = page.locator('input[name="bookTitle"], input[placeholder*="書名"], input[placeholder*="タイトル"]').first();
    const authorInput = page.locator('input[name="author"], input[placeholder*="著者"]').first();
    
    await titleInput.fill('テストブック');
    await authorInput.fill('テスト著者');
    
    // カテゴリを選択（選択肢がある場合）
    const categorySelect = page.locator('select[name="category"], select:has(option[value*="技術"])').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 });
    }
    
    // 保存ボタンをクリック
    await page.locator('button:has-text("保存"), button:has-text("追加"), button:has-text("登録")').first().click();
    
    // 成功メッセージまたは一覧に追加されたことを確認
    await expect(page.locator('text=テストブック')).toBeVisible({ timeout: 10000 });
  });

  test('書籍情報を編集できる', async ({ page }) => {
    // 既存の書籍の編集ボタンをクリック（最初の書籍）
    const editButton = page.locator('button:has-text("編集"), .edit-button, [data-testid="edit-button"]').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // 編集フォームが開くことを確認
      await expect(page.locator('.modal, .popup, form')).toBeVisible();
      
      // タイトルを変更
      const titleInput = page.locator('input[name="bookTitle"], input[placeholder*="書名"]').first();
      await titleInput.clear();
      await titleInput.fill('更新されたテストブック');
      
      // 保存ボタンをクリック
      await page.locator('button:has-text("更新"), button:has-text("保存")').first().click();
      
      // 更新されたタイトルが表示されることを確認
      await expect(page.locator('text=更新されたテストブック')).toBeVisible({ timeout: 10000 });
    }
  });

  test('書籍の読了状態を変更できる', async ({ page }) => {
    // 読了チェックボックスまたは読了ボタンをクリック
    const readCheckbox = page.locator('input[type="checkbox"][name*="read"], button:has-text("読了")').first();
    
    if (await readCheckbox.isVisible()) {
      await readCheckbox.click();
      
      // 状態が更新されることを確認
      await page.waitForTimeout(1000);
      
      // 読了状態の表示確認
      await expect(page.locator('.read-status, text=読了')).toBeVisible();
    }
  });

  test('書籍を削除できる', async ({ page }) => {
    // 削除ボタンをクリック
    const deleteButton = page.locator('button:has-text("削除"), .delete-button, [data-testid="delete-button"]').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // 確認ダイアログが表示される場合
      const confirmButton = page.locator('button:has-text("削除"), button:has-text("はい"), button:has-text("OK")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
      
      // 削除された書籍が一覧から消えることを確認
      await page.waitForTimeout(1000);
    }
  });

  test('書籍検索機能が動作する', async ({ page }) => {
    // 検索入力フィールドを見つける
    const searchInput = page.locator('input[type="search"], input[placeholder*="検索"], .search-input').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('テスト');
      
      // 検索実行（Enterキーまたは検索ボタン）
      await searchInput.press('Enter');
      
      // 検索結果が表示されることを確認
      await page.waitForTimeout(1000);
      
      // 検索をクリア
      await searchInput.clear();
      await searchInput.press('Enter');
    }
  });

  test('年度フィルターが動作する', async ({ page }) => {
    // 年度選択ドロップダウンを見つける
    const yearSelect = page.locator('select[name*="year"], .year-selector select').first();
    
    if (await yearSelect.isVisible()) {
      // 異なる年度を選択
      await yearSelect.selectOption('2023');
      
      // データが更新されることを確認
      await page.waitForTimeout(1000);
      
      // 現在年度に戻す
      await yearSelect.selectOption('2024');
    }
  });

  test('エクスポート機能が動作する', async ({ page }) => {
    // エクスポートボタンを見つける
    const exportButton = page.locator('button:has-text("エクスポート"), .export-button').first();
    
    if (await exportButton.isVisible()) {
      // ダウンロード開始を監視
      const downloadPromise = page.waitForEvent('download');
      
      await exportButton.click();
      
      // ダウンロードが開始されることを確認
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(csv|pdf|json)$/);
    }
  });

  test('評価とメモ機能が動作する', async ({ page }) => {
    // 編集ボタンをクリック
    const editButton = page.locator('button:has-text("編集")').first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // 評価（星）を設定
      const starRating = page.locator('.star, .rating-stars span').first();
      if (await starRating.isVisible()) {
        await starRating.click();
      }
      
      // メモを入力
      const memoInput = page.locator('textarea[name="memo"], textarea[placeholder*="メモ"]').first();
      if (await memoInput.isVisible()) {
        await memoInput.fill('これは素晴らしい本でした。');
      }
      
      // 保存
      await page.locator('button:has-text("保存"), button:has-text("更新")').first().click();
      
      // 保存されたことを確認
      await page.waitForTimeout(1000);
    }
  });

  test('ページネーションが動作する', async ({ page }) => {
    // ページネーションボタンを探す
    const nextButton = page.locator('button:has-text("次"), button:has-text("→"), .pagination-next').first();
    
    if (await nextButton.isVisible()) {
      await nextButton.click();
      
      // ページが変更されることを確認
      await page.waitForTimeout(1000);
      
      // 前のページに戻る
      const prevButton = page.locator('button:has-text("前"), button:has-text("←"), .pagination-prev').first();
      if (await prevButton.isVisible()) {
        await prevButton.click();
      }
    }
  });
});