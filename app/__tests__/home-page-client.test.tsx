import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePageClient } from '../_components/home-page-client';

// モック設定
const mockUseSession = vi.fn();
const mockUseMyCards = vi.fn();
const mockUseLatestCards = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}));

vi.mock('@/hooks/use-my-cards', () => ({
  useMyCards: () => mockUseMyCards(),
}));

vi.mock('@/hooks/use-latest-cards', () => ({
  useLatestCards: () => mockUseLatestCards(),
}));

vi.mock('@/components/auth', () => ({
  LoginButton: () => <button type="button">ログイン</button>,
  UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));

vi.mock('@/components/layout', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

const defaultLatestCardsReturn = {
  latestCards: [],
  isLoading: false,
  error: null,
  refetch: vi.fn(),
};

describe('HomePageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLatestCards.mockReturnValue(defaultLatestCardsReturn);
  });

  describe('ローディング状態', () => {
    it('セッション読み込み中はローディング表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: true });
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      // ローディング中はxtradeタイトルが表示されない
      expect(screen.queryByText('xtrade')).not.toBeInTheDocument();
    });
  });

  describe('未ログイン状態', () => {
    it('ログインボタンを表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      expect(screen.getByText('ログイン')).toBeInTheDocument();
    });

    it('最近登録されたアイテムセクションを表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      expect(screen.getByText('最近登録されたアイテム')).toBeInTheDocument();
    });

    it('フッターを表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('エラー状態', () => {
    it('エラーメッセージと再読み込みボタンを表示', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      });
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: new Error('Failed to fetch'),
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
      expect(screen.getByText('再読み込み')).toBeInTheDocument();
    });
  });

  describe('ログイン状態', () => {
    it('タブとカード一覧を表示', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      });
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
      });

      render(<HomePageClient />);

      expect(screen.getByText('xtrade')).toBeInTheDocument();
      expect(screen.getByText('持っている (1)')).toBeInTheDocument();
      expect(screen.getByText('欲しい (0)')).toBeInTheDocument();
      expect(screen.getByText('Test Card')).toBeInTheDocument();
    });

    it('アイテムがない場合は空の状態を表示', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      });
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      expect(screen.getByText('まだアイテムを登録していません')).toBeInTheDocument();
    });

    it('UserMenuを表示', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      });
      mockUseMyCards.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    });
  });
});
