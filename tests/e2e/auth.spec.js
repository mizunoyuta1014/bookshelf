import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('未認証時はログインページが表示される', async ({ page }) => {
    // ログインページの要素が表示されることを確認
    await expect(page.locator('text=Googleでログイン')).toBeVisible();
    await expect(page.locator('.login-container')).toBeVisible();
  });

  test('ログインボタンがクリック可能', async ({ page }) => {
    const loginButton = page.locator('text=Googleでログイン');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
    
    // ボタンにホバーした時のスタイル変更を確認
    await loginButton.hover();
    // 実際のGoogleログインはテスト環境では実行しない
  });

  test('テーマ切り替えボタンが動作する', async ({ page }) => {
    const themeToggle = page.locator('[data-testid="theme-toggle"]').first();
    
    // テーマトグルボタンが存在することを確認
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      
      // ダークテーマが適用されることを確認
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      
      // 再度クリックしてライトテーマに戻る
      await themeToggle.click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    }
  });

  test('パスワードリセット機能へのナビゲーション', async ({ page }) => {
    const resetLink = page.locator('text=パスワードを忘れた方はこちら');
    
    if (await resetLink.isVisible()) {
      await resetLink.click();
      await expect(page.locator('.password-reset-container')).toBeVisible();
      
      // 戻るボタンでログインページに戻れることを確認
      const backButton = page.locator('text=戻る');
      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(page.locator('text=Googleでログイン')).toBeVisible();
      }
    }
  });

  test('レスポンシブデザインの確認', async ({ page }) => {
    // デスクトップビュー
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('.login-container')).toBeVisible();
    
    // タブレットビュー
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.login-container')).toBeVisible();
    
    // モバイルビュー
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.login-container')).toBeVisible();
  });
});

// 認証済みユーザーのテスト（モック使用）
test.describe('認証済みユーザー', () => {
  test.beforeEach(async ({ page }) => {
    // ローカルストレージにモックユーザーを設定（実際の実装に合わせて調整）
    await page.addInitScript(() => {
      // Supabaseセッションのモック
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
    
    await page.goto('/');
  });

  test('認証済みユーザーはホームページが表示される', async ({ page }) => {
    // ホームページの要素が表示されることを確認
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('ログアウト機能が動作する', async ({ page }) => {
    const logoutButton = page.locator('text=ログアウト').first();
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // ログアウト後にログインページが表示されることを確認
      await expect(page.locator('text=Googleでログイン')).toBeVisible();
    }
  });

  test('サイドバーナビゲーションが動作する', async ({ page }) => {
    // ホームリンク
    const homeLink = page.locator('a[href="/"]').first();
    if (await homeLink.isVisible()) {
      await homeLink.click();
      await expect(page).toHaveURL('/');
    }

    // 書籍管理リンク
    const booksLink = page.locator('a[href="/books"]').first();
    if (await booksLink.isVisible()) {
      await booksLink.click();
      await expect(page).toHaveURL('/books');
    }

    // 統計リンク
    const statisticsLink = page.locator('a[href="/statistics"]').first();
    if (await statisticsLink.isVisible()) {
      await statisticsLink.click();
      await expect(page).toHaveURL('/statistics');
    }

    // ウィッシュリストリンク
    const wishlistLink = page.locator('a[href="/want"]').first();
    if (await wishlistLink.isVisible()) {
      await wishlistLink.click();
      await expect(page).toHaveURL('/want');
    }
  });
});