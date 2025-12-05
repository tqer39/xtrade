import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ListingPageClient } from '../_components/listing-page-client'

// モック設定
const mockUseSession = vi.fn()
const mockUseMyCards = vi.fn()
const mockUseMySets = vi.fn()

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}))

vi.mock('@/hooks/use-my-cards', () => ({
  useMyCards: () => mockUseMyCards(),
}))

vi.mock('@/hooks/use-my-sets', () => ({
  useMySets: () => mockUseMySets(),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

vi.mock('@/components/auth', () => ({
  LoginButton: () => <button>ログイン</button>,
}))

const defaultSetsReturn = {
  sets: [],
  isLoading: false,
  error: null,
  createSet: vi.fn(),
  updateSet: vi.fn(),
  deleteSet: vi.fn(),
  getSetDetail: vi.fn(),
  addCardToSet: vi.fn(),
  removeCardFromSet: vi.fn(),
  refetch: vi.fn(),
}

describe('ListingPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMySets.mockReturnValue(defaultSetsReturn)
  })

  describe('ローディング状態', () => {
    it('セッション読み込み中はローディング表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: true })
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      })

      render(<ListingPageClient />)

      // ローディング中はカード出品タイトルが表示されない
      expect(screen.queryByText('カード出品')).not.toBeInTheDocument()
    })
  })

  describe('未ログイン状態', () => {
    it('ログインボタンを表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false })
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      })

      render(<ListingPageClient />)

      expect(screen.getByText('ログイン')).toBeInTheDocument()
      expect(screen.getByText('ログインして、カードを管理しましょう')).toBeInTheDocument()
    })
  })

  describe('エラー状態', () => {
    it('エラーメッセージと再読み込みボタンを表示', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      })
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: new Error('Failed to fetch'),
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      })

      render(<ListingPageClient />)

      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument()
      expect(screen.getByText('再読み込み')).toBeInTheDocument()
    })
  })

  describe('ログイン状態', () => {
    it('タブとカード一覧を表示', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      })
      mockUseMyCards.mockReturnValue({
        haveCards: [
          {
            id: 'have-1',
            cardId: 'card-1',
            quantity: 2,
            card: { id: 'card-1', name: 'Test Card', category: 'pokemon', rarity: 'SR' },
          },
        ],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      })

      render(<ListingPageClient />)

      expect(screen.getByText('カード出品')).toBeInTheDocument()
      expect(screen.getByText('持っている (1)')).toBeInTheDocument()
      expect(screen.getByText('欲しい (0)')).toBeInTheDocument()
      expect(screen.getByText('セット (0)')).toBeInTheDocument()
      expect(screen.getByText('Test Card')).toBeInTheDocument()
    })

    it('カードがない場合は空の状態を表示', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      })
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      })

      render(<ListingPageClient />)

      expect(screen.getByText('まだカードを登録していません')).toBeInTheDocument()
    })

    it('ホームに戻るリンクを表示', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      })
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      })

      render(<ListingPageClient />)

      const homeLink = screen.getByRole('link', { name: 'ホームに戻る' })
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })
})
