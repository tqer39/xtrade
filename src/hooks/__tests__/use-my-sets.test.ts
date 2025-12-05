import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMySets } from '../use-my-sets'

// fetch モック
global.fetch = vi.fn()

describe('useMySets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初期データ取得', () => {
    it('セット一覧を取得してステートに保存', async () => {
      const mockSets = [
        {
          id: 'set-1',
          name: 'Test Set',
          description: 'Description',
          isPublic: true,
          itemCount: 3,
          thumbnails: ['https://example.com/img1.jpg'],
        },
      ]

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ sets: mockSets }),
      })

      const { result } = renderHook(() => useMySets())

      expect(result.current.isLoading).toBe(true)

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.sets).toEqual(mockSets)
      expect(result.current.error).toBeNull()
    })

    it('取得エラー時にエラーステートを設定', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Failed to fetch sets')
    })

    it('ネットワークエラー時にエラーステートを設定', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      )

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe('Network error')
    })
  })

  describe('createSet', () => {
    it('セットを作成して一覧を再取得', async () => {
      const mockNewSet = { id: 'new-set', name: 'New Set' }

      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ set: mockNewSet }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              sets: [{ ...mockNewSet, itemCount: 0, thumbnails: [] }],
            }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let createdSet
      await act(async () => {
        createdSet = await result.current.createSet('New Set', 'Description', true)
      })

      expect(createdSet).toEqual(mockNewSet)
      expect(global.fetch).toHaveBeenCalledWith('/api/me/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Set', description: 'Description', isPublic: true }),
      })
    })

    it('作成エラー時に例外をスロー', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Invalid name' }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.createSet('')
        })
      ).rejects.toThrow('Invalid name')
    })
  })

  describe('updateSet', () => {
    it('セットを更新して一覧を再取得', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [{ id: 'set-1', name: 'Old Name' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ set: { id: 'set-1', name: 'New Name' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              sets: [{ id: 'set-1', name: 'New Name', itemCount: 0, thumbnails: [] }],
            }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.updateSet('set-1', { name: 'New Name' })
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/me/sets/set-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      })
    })

    it('更新エラー時に例外をスロー', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Set not found' }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.updateSet('invalid-set', { name: 'New Name' })
        })
      ).rejects.toThrow('Set not found')
    })
  })

  describe('deleteSet', () => {
    it('セットを削除して一覧を再取得', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [{ id: 'set-1' }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.deleteSet('set-1')
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/me/sets/set-1', {
        method: 'DELETE',
      })
    })

    it('削除エラー時に例外をスロー', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Set not found' }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.deleteSet('invalid-set')
        })
      ).rejects.toThrow('Set not found')
    })
  })

  describe('getSetDetail', () => {
    it('セット詳細を取得', async () => {
      const mockSetDetail = {
        id: 'set-1',
        name: 'Test Set',
        items: [{ id: 'item-1', cardId: 'card-1', quantity: 1 }],
      }

      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ set: mockSetDetail }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let setDetail
      await act(async () => {
        setDetail = await result.current.getSetDetail('set-1')
      })

      expect(setDetail).toEqual(mockSetDetail)
      expect(global.fetch).toHaveBeenCalledWith('/api/me/sets/set-1')
    })

    it('セットが見つからない場合は null を返す', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Not found' }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      let setDetail
      await act(async () => {
        setDetail = await result.current.getSetDetail('invalid-set')
      })

      expect(setDetail).toBeNull()
    })
  })

  describe('addCardToSet', () => {
    it('セットにカードを追加', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.addCardToSet('set-1', 'card-1', 2)
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/me/sets/set-1/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: 'card-1', quantity: 2 }),
      })
    })

    it('追加エラー時に例外をスロー', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Card not found' }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.addCardToSet('set-1', 'invalid-card')
        })
      ).rejects.toThrow('Card not found')
    })
  })

  describe('removeCardFromSet', () => {
    it('セットからカードを削除', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await act(async () => {
        await result.current.removeCardFromSet('set-1', 'card-1')
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/me/sets/set-1/items/card-1', {
        method: 'DELETE',
      })
    })

    it('削除エラー時に例外をスロー', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: () => Promise.resolve({ error: 'Card not in set' }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.removeCardFromSet('set-1', 'invalid-card')
        })
      ).rejects.toThrow('Card not in set')
    })
  })

  describe('refetch', () => {
    it('手動で一覧を再取得', async () => {
      ;(global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sets: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              sets: [{ id: 'set-1', name: 'New Set', itemCount: 0, thumbnails: [] }],
            }),
        })

      const { result } = renderHook(() => useMySets())

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.sets).toEqual([])

      await act(async () => {
        await result.current.refetch()
      })

      await waitFor(() => {
        expect(result.current.sets).toHaveLength(1)
      })
    })
  })
})
