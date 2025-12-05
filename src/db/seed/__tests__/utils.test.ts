import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Seed Utils', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('isLocalEnvironment', () => {
    it('localhost を含む場合は true を返す', async () => {
      vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/xtrade')

      const { isLocalEnvironment } = await import('../utils')

      expect(isLocalEnvironment()).toBe(true)
    })

    it('localhost を含まない場合は false を返す', async () => {
      vi.stubEnv('DATABASE_URL', 'postgres://user:pass@neon.tech/xtrade')

      const { isLocalEnvironment } = await import('../utils')

      expect(isLocalEnvironment()).toBe(false)
    })

    it('DATABASE_URL が未設定の場合はエラーをスローする', async () => {
      vi.stubEnv('DATABASE_URL', '')

      const { isLocalEnvironment } = await import('../utils')

      expect(() => isLocalEnvironment()).toThrow(
        'DATABASE_URL 環境変数が設定されていません'
      )
    })
  })

  describe('assertLocalEnvironment', () => {
    it('ローカル環境では何もしない', async () => {
      vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/xtrade')

      const { assertLocalEnvironment } = await import('../utils')

      expect(() => assertLocalEnvironment()).not.toThrow()
    })

    it('本番環境ではエラーをスローする', async () => {
      vi.stubEnv('DATABASE_URL', 'postgres://user:pass@neon.tech/xtrade')

      const { assertLocalEnvironment } = await import('../utils')

      expect(() => assertLocalEnvironment()).toThrow(
        'シードは本番環境では実行できません'
      )
    })
  })

  describe('generateId', () => {
    it('UUID 形式の文字列を返す', async () => {
      vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/xtrade')

      const { generateId } = await import('../utils')

      const id = generateId()

      // UUID v4 の形式をチェック
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('呼び出すたびに異なる ID を生成する', async () => {
      vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/xtrade')

      const { generateId } = await import('../utils')

      const id1 = generateId()
      const id2 = generateId()

      expect(id1).not.toBe(id2)
    })
  })
})
