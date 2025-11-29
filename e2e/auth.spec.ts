import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display login button on home page', async ({ page }) => {
    await page.goto('/')

    // ログインボタンが表示されていることを確認
    const loginButton = page.getByRole('button', { name: 'X でログイン' })
    await expect(loginButton).toBeVisible()
  })

  test('should redirect to Twitter OAuth when clicking login', async ({
    page,
  }) => {
    await page.goto('/')

    // ログインボタンをクリック
    const loginButton = page.getByRole('button', { name: 'X でログイン' })
    await loginButton.click()

    // Twitter の OAuth ページにリダイレクトされることを確認
    // 注意: 実際の OAuth フローはテスト環境では完了しない
    await page.waitForURL(/twitter\.com|x\.com/, { timeout: 10000 })
  })
})
