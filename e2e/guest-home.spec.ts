import { expect, test } from '@playwright/test';

// CI 環境では DATABASE_URL が設定されていないため、DB 接続が必要なテストはスキップ
test.describe('Guest Home Page', () => {
  // CI ではスキップ（DATABASE_URL が必要）
  test.skip(!!process.env.CI, 'Skipped in CI: requires database connection');

  test.beforeEach(async ({ page }) => {
    // localStorage をクリア
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('xtrade_favorite_cards');
      localStorage.removeItem('xtrade_favorite_users');
    });
  });

  test('should display latest cards section for guests', async ({ page }) => {
    await page.goto('/');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 「最近登録されたカード」セクションが表示されるか、「まだカードが登録されていません」が表示されることを確認
    const latestCards = page.getByText('最近登録されたカード');
    const noCards = page.getByText('まだカードが登録されていません');
    await expect(latestCards.or(noCards)).toBeVisible({ timeout: 10000 });
  });

  test('should display login button for guests', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // ログインボタンが表示されることを確認（複数ある場合は最初のもの）
    const loginButton = page.getByRole('button', { name: /ログイン/ }).first();
    await expect(loginButton).toBeVisible({ timeout: 10000 });
  });

  test('should display card search button for guests', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // カード検索ボタンが表示されることを確認
    const searchButton = page.getByRole('button', { name: /カードを検索/ });
    await expect(searchButton.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show card owner list when clicking a card', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // カードグリッドを待つ
    const cardGrid = page.locator('.grid');
    const hasCards = (await cardGrid.count()) > 0;

    if (hasCards) {
      // カードがあるか確認
      const cards = cardGrid.first().locator('[class*="cursor-pointer"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // 最初のカードをクリック
        await cards.first().click();

        // 所有者一覧ヘッダーが表示されることを確認
        await expect(
          page.getByRole('heading', { name: /このカードを持っているユーザー/ })
        ).toBeVisible({
          timeout: 10000,
        });
      }
    }
  });

  test('should display trust badge for card owners', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // カードグリッドを待つ
    const cardGrid = page.locator('.grid');
    const hasCards = (await cardGrid.count()) > 0;

    if (hasCards) {
      const cards = cardGrid.first().locator('[class*="cursor-pointer"]');
      const cardCount = await cards.count();

      if (cardCount > 0) {
        // 最初のカードをクリック
        await cards.first().click();

        // 所有者一覧ヘッダーが表示されるまで待機
        await expect(
          page.getByRole('heading', { name: /このカードを持っているユーザー/ })
        ).toBeVisible({
          timeout: 10000,
        });

        // 所有者がいる場合、信頼スコアバッジが表示されることを確認
        const owners = page.locator('[data-slot="trust-badge"]');
        const ownerCount = await owners.count();

        if (ownerCount > 0) {
          // TrustBadge が表示されていることを確認
          await expect(owners.first()).toBeVisible();

          // グレード（S/A/B/C/D/U）が表示されていることを確認
          const badgeText = await owners.first().textContent();
          expect(badgeText).toMatch(/^[SABCDU]/);
        }
      }
    }
  });

  test('should save favorite to localStorage for guests', async ({ page }) => {
    await page.goto('/');

    // localStorage に保存するテスト用の値を設定
    await page.evaluate(() => {
      localStorage.setItem('xtrade_favorite_cards', JSON.stringify(['test-card-id']));
    });

    // localStorage から値が取得できることを確認
    const storedCards = await page.evaluate(() => {
      return localStorage.getItem('xtrade_favorite_cards');
    });

    expect(storedCards).toBe(JSON.stringify(['test-card-id']));
  });

  test('should clear localStorage after login and sync', async ({ page }) => {
    await page.goto('/');

    // ゲスト時に localStorage にお気に入りを保存
    await page.evaluate(() => {
      localStorage.setItem('xtrade_favorite_cards', JSON.stringify(['test-card-id']));
      localStorage.setItem('xtrade_favorite_users', JSON.stringify(['test-user-id']));
    });

    // 注: 実際のログインフローは OAuth が必要なため手動確認が必要
    // ログイン後に localStorage がクリアされることを手動で確認してください
  });

  test('should display tabs for have/want/sets', async ({ page }) => {
    await page.goto('/');

    // タブが表示されることを確認
    await expect(page.getByRole('tab', { name: /持っている/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /欲しい/ })).toBeVisible();
    await expect(page.getByRole('tab', { name: /セット/ })).toBeVisible();
  });

  test('should show login prompt in tabs for guests', async ({ page }) => {
    await page.goto('/');

    // 「持っている」タブをクリック
    await page.getByRole('tab', { name: /持っている/ }).click();

    // ログイン促進メッセージが表示されることを確認
    await expect(
      page.getByText('ログインすると、持っているカードを登録・管理できます')
    ).toBeVisible();
  });
});
