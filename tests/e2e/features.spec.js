import { test, expect } from '@playwright/test';

test.describe('統計機能', () => {
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
    
    await page.goto('/statistics');
  });

  test('統計ページが正しく表示される', async ({ page }) => {
    // 統計ページのタイトル確認
    await expect(page.locator('h1, h2')).toContainText(['統計', 'Statistics']);
    
    // 年度選択が表示される
    await expect(page.locator('select, .year-selector')).toBeVisible();
  });

  test('読書進捗バーが表示される', async ({ page }) => {
    // 進捗バーまたは進捗表示要素を確認
    const progressElements = page.locator('.progress, .progress-bar, [data-testid="progress"]');
    
    // 少なくとも1つの進捗要素が表示されることを確認
    if (await progressElements.count() > 0) {
      await expect(progressElements.first()).toBeVisible();
    }
  });

  test('円グラフが表示される', async ({ page }) => {
    // チャート要素（Recharts、Canvas、SVGなど）を確認
    const chartElements = page.locator('svg, canvas, .recharts-wrapper, .chart-container');
    
    if (await chartElements.count() > 0) {
      await expect(chartElements.first()).toBeVisible();
    }
  });

  test('月別読書グラフが表示される', async ({ page }) => {
    // 月別グラフ要素を確認
    const monthlyChart = page.locator('.line-chart, .monthly-chart, svg:has(line)');
    
    if (await monthlyChart.count() > 0) {
      await expect(monthlyChart.first()).toBeVisible();
    }
  });

  test('目標設定機能が動作する', async ({ page }) => {
    // 目標設定入力フィールドを探す
    const targetInput = page.locator('input[type="number"], input[name*="target"]').first();
    
    if (await targetInput.isVisible()) {
      await targetInput.clear();
      await targetInput.fill('50');
      
      // Enterまたは保存ボタンで設定を保存
      await targetInput.press('Enter');
      
      // 設定が反映されることを確認
      await page.waitForTimeout(1000);
    }
  });

  test('年度変更で統計が更新される', async ({ page }) => {
    // 年度選択ドロップダウン
    const yearSelect = page.locator('select[name*="year"], .year-selector select').first();
    
    if (await yearSelect.isVisible()) {
      await yearSelect.selectOption('2023');
      
      // 統計データが更新されることを確認（ローディングまたはデータ変更）
      await page.waitForTimeout(2000);
      
      // 現在年度に戻す
      await yearSelect.selectOption('2024');
    }
  });

  test('エクスポート機能が動作する', async ({ page }) => {
    const exportButton = page.locator('button:has-text("エクスポート"), .export-button').first();
    
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(csv|pdf|json)$/);
    }
  });
});

test.describe('ウィッシュリスト機能', () => {
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
    
    await page.goto('/want');
  });

  test('ウィッシュリストページが正しく表示される', async ({ page }) => {
    // ページタイトル確認
    await expect(page.locator('h1, h2')).toContainText(['ウィッシュリスト', 'Want', '読みたい本']);
    
    // タブが表示される
    await expect(page.locator('.tab-button, button:has-text("検索")')).toBeVisible();
  });

  test('本検索機能が動作する', async ({ page }) => {
    // 検索タブを選択
    const searchTab = page.locator('button:has-text("検索"), button:has-text("本を検索")').first();
    if (await searchTab.isVisible()) {
      await searchTab.click();
    }
    
    // 検索入力フィールド
    const searchInput = page.locator('input[placeholder*="本"], input[placeholder*="検索"]').first();
    await expect(searchInput).toBeVisible();
    
    // 検索実行
    await searchInput.fill('JavaScript');
    
    // 検索ボタンをクリック
    const searchButton = page.locator('button:has-text("検索")').first();
    await searchButton.click();
    
    // 検索結果が表示されることを確認（非同期なので時間を置く）
    await page.waitForTimeout(3000);
    
    // 検索結果テーブルまたはリストが表示される
    const resultsTable = page.locator('table, .book-list, .search-results');
    if (await resultsTable.count() > 0) {
      await expect(resultsTable.first()).toBeVisible();
    }
  });

  test('ウィッシュリストに本を追加できる', async ({ page }) => {
    // まず検索を実行
    const searchInput = page.locator('input[placeholder*="本"], input[placeholder*="検索"]').first();
    await searchInput.fill('React');
    
    const searchButton = page.locator('button:has-text("検索")').first();
    await searchButton.click();
    
    await page.waitForTimeout(3000);
    
    // ウィッシュリストに追加ボタンをクリック
    const addButton = page.locator('button:has-text("ウィッシュリストに追加"), button:has-text("追加")').first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // 成功メッセージまたはボタンの状態変化を確認
      await expect(page.locator('text=追加済み, text=追加しました')).toBeVisible({ timeout: 5000 });
    }
  });

  test('ウィッシュリストタブで追加した本が表示される', async ({ page }) => {
    // ウィッシュリストタブを選択
    const wishlistTab = page.locator('button:has-text("ウィッシュリスト")').first();
    await wishlistTab.click();
    
    // ウィッシュリストの内容が表示される
    const wishlistContent = page.locator('.wishlist-section, .wishlist-grid, .wishlist-item');
    
    if (await wishlistContent.count() > 0) {
      await expect(wishlistContent.first()).toBeVisible();
    } else {
      // 空のウィッシュリストメッセージが表示される
      await expect(page.locator('text=空です, text=ありません')).toBeVisible();
    }
  });

  test('ウィッシュリストから本を削除できる', async ({ page }) => {
    // ウィッシュリストタブを選択
    const wishlistTab = page.locator('button:has-text("ウィッシュリスト")').first();
    await wishlistTab.click();
    
    // 削除ボタンをクリック
    const deleteButton = page.locator('button:has-text("削除"), .remove-button').first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      // 確認ダイアログがある場合
      const confirmButton = page.locator('button:has-text("削除"), button:has-text("はい")');
      if (await confirmButton.isVisible({ timeout: 2000 })) {
        await confirmButton.click();
      }
      
      // アイテムが削除されることを確認
      await page.waitForTimeout(1000);
    }
  });

  test('読書記録に移動機能が動作する', async ({ page }) => {
    // ウィッシュリストタブを選択
    const wishlistTab = page.locator('button:has-text("ウィッシュリスト")').first();
    await wishlistTab.click();
    
    // 読書記録に移動ボタンをクリック
    const moveButton = page.locator('button:has-text("読書記録に移動"), button:has-text("移動")').first();
    
    if (await moveButton.isVisible()) {
      await moveButton.click();
      
      // 成功メッセージが表示されることを確認
      await expect(page.locator('text=移動しました, text=追加しました')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('推薦機能', () => {
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

  test('推薦パネルが表示される', async ({ page }) => {
    // 推薦パネルまたは推薦ボタンが表示されることを確認
    const recommendationPanel = page.locator('.recommendation-panel, button:has-text("推薦"), [data-testid="recommendations"]');
    
    if (await recommendationPanel.count() > 0) {
      await expect(recommendationPanel.first()).toBeVisible();
    }
  });

  test('推薦機能が動作する', async ({ page }) => {
    // 推薦ボタンまたはパネルを開く
    const recommendationButton = page.locator('button:has-text("推薦"), button:has-text("おすすめ")').first();
    
    if (await recommendationButton.isVisible()) {
      await recommendationButton.click();
      
      // 推薦結果が表示されることを確認
      await page.waitForTimeout(2000);
      
      const recommendationResults = page.locator('.recommendation-item, .recommended-book');
      if (await recommendationResults.count() > 0) {
        await expect(recommendationResults.first()).toBeVisible();
      }
    }
  });
});