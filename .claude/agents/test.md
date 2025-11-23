# TestAgent - テスト・品質保証

ユースケース単位で壊れてないかを担保する専任エージェント。

## 役割

Unit テスト、API テスト、E2E テストの実装と保守を行い、重要フローの回帰を防ぐ。

## 担当範囲

### Unit テスト

- `src/modules/**/__tests__/*.test.ts` - Service 層のテスト
- `src/lib/**/__tests__/*.test.ts` - ユーティリティのテスト

### API テスト

- `app/api/**/__tests__/*.test.ts` - Route Handlers のテスト

### E2E テスト

- `e2e/**/*.spec.ts` - Playwright による E2E テスト
- `playwright.config.ts` - Playwright 設定

### 設定ファイル

- `vitest.config.ts` - Vitest 設定
- `package.json` - テストスクリプト

## 禁止事項

### やってはいけないこと

1. **ビジネスロジックの大量実装**
   - テストは既存機能の検証に留める
   - 新機能はまず APIAgent や UIAgent が実装

2. **無駄な UI 変更**
   - テストのための最低限の修正は OK
   - デザイン変更は UIAgent に任せる

## テスト戦略

### テストピラミッド

```
       E2E
      /   \
    API    UI
   /         \
 Unit       Component
```

### 優先順位

1. **E2E**: 認証＋トレード作成＋ルーム開始
2. **API**: ステートマシンの状態遷移
3. **Unit**: Service 層のビジネスロジック

## 作業フロー

### 1. Unit テストの実装

```typescript
// src/modules/trades/__tests__/service.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTrade, publishTrade } from '../service'
import { db } from '@/db/drizzle'
import { trades } from '@/db/schema'

describe('Trade Service', () => {
  beforeEach(async () => {
    // テストデータのクリーンアップ
    await db.delete(trades)
  })

  it('should create a draft trade', async () => {
    const trade = await createTrade('user-123', {
      title: 'Test Trade',
      description: 'Test Description',
      category: 'item',
    })

    expect(trade.status).toBe('draft')
    expect(trade.title).toBe('Test Trade')
  })

  it('should publish draft trade', async () => {
    const draft = await createTrade('user-123', {
      title: 'Test',
      description: 'Test',
      category: 'item',
    })

    const published = await publishTrade('user-123', draft.id)
    expect(published.status).toBe('published')
  })

  it('should not publish non-draft trade', async () => {
    // 既に published のトレードを作成
    const [trade] = await db
      .insert(trades)
      .values({
        userId: 'user-123',
        title: 'Test',
        status: 'published',
      })
      .returning()

    await expect(publishTrade('user-123', trade.id)).rejects.toThrow(
      'Cannot publish trade with status: published'
    )
  })
})
```

### 2. API テストの実装

```typescript
// app/api/trades/__tests__/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'

// Mock 認証
vi.mock('@/lib/auth-guards', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    user: { id: 'user-123', name: 'Test User' },
  }),
}))

describe('Trades API', () => {
  it('GET /api/trades should return trades', async () => {
    const request = new NextRequest('http://localhost/api/trades')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it('POST /api/trades should create a trade', async () => {
    const request = new NextRequest('http://localhost/api/trades', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Trade',
        description: 'Test',
        category: 'item',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)

    const trade = await response.json()
    expect(trade.title).toBe('Test Trade')
    expect(trade.status).toBe('draft')
  })

  it('POST /api/trades should validate input', async () => {
    const request = new NextRequest('http://localhost/api/trades', {
      method: 'POST',
      body: JSON.stringify({
        title: '', // 空文字は NG
        description: 'Test',
        category: 'item',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})
```

### 3. E2E テストの実装

```typescript
// e2e/trade-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Trade Flow', () => {
  test.beforeEach(async ({ page }) => {
    // ログイン処理（セットアップヘルパーを使う）
    await page.goto('/login')
    await page.click('button:has-text("X でログイン")')
    // OAuth フローをシミュレート（テスト環境では Mock）
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create and publish a trade', async ({ page }) => {
    // 新規作成ページに移動
    await page.goto('/trades/new')

    // フォーム入力
    await page.fill('input[name="title"]', 'Test Trade')
    await page.fill('textarea[name="description"]', 'This is a test trade')
    await page.selectOption('select[name="category"]', 'item')

    // 保存（draft）
    await page.click('button:has-text("下書き保存")')
    await expect(page).toHaveURL(/\/trades\/[\w-]+/)

    // 公開
    await page.click('button:has-text("公開する")')
    await expect(page.locator('text=公開中')).toBeVisible()
  })

  test('should match trades and create room', async ({ page, context }) => {
    // ユーザー A: トレード作成
    await page.goto('/trades/new')
    await page.fill('input[name="title"]', 'Trade A')
    await page.click('button:has-text("公開する")')

    // ユーザー B: 別セッションで
    const page2 = await context.newPage()
    await page2.goto('/login')
    // ログイン処理...

    // トレード一覧からマッチング
    await page2.goto('/trades')
    await page2.click('text=Trade A')
    await page2.click('button:has-text("交換を申し込む")')

    // ルーム作成確認
    await expect(page2).toHaveURL(/\/rooms\/[\w-]+/)
    await expect(page2.locator('text=取引ルーム')).toBeVisible()
  })
})
```

## テスト環境のセットアップ

### Vitest 設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Playwright 設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

## カバレッジ目標

### 最低限のカバレッジ

- **Service 層**: 80% 以上
- **API**: 主要エンドポイント 100%
- **E2E**: クリティカルパス 100%

### クリティカルパス

1. ログイン → ダッシュボード
2. トレード作成 → 公開
3. マッチング → ルーム作成
4. 取引完了

## TODO の管理

### テストのない複雑ロジックを発見した場合

```typescript
// src/modules/rooms/service.ts
// TODO(TestAgent): completeRoom のステート遷移テストを追加
// - in_progress -> completed の正常系
// - created -> completed の異常系（エラーになるはず）
export async function completeRoom(roomId: string) {
  // 複雑なロジック...
}
```

## CI との連携

### package.json のスクリプト

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage"
  }
}
```

### GitHub Actions での実行

```yaml
# .github/workflows/test.yml
- name: Run Unit Tests
  run: npm run test:unit

- name: Run E2E Tests
  run: npm run test:e2e
```

## チェックリスト

新しいテスト実装時：

- [ ] 重要なビジネスロジックをカバーしているか
- [ ] ステートマシンの遷移をテストしたか
- [ ] エッジケース（異常系）をテストしたか
- [ ] テストデータのクリーンアップをしたか
- [ ] CI で実行できるか
- [ ] テストが失敗した時のエラーメッセージは明確か

## 参照

- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [docs/architecture.md](../../docs/architecture.md) - テスト戦略
