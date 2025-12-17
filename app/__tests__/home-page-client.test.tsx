import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePageClient } from '../_components/home-page-client';

// モック設定
const mockUseSession = vi.fn();
const mockUseMyItems = vi.fn();
const mockUseLatestItems = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn() }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
    getAll: vi.fn().mockReturnValue([]),
    toString: vi.fn().mockReturnValue(''),
  }),
  usePathname: () => '/',
}));

vi.mock('@/hooks/use-view-preference', () => ({
  useViewPreference: () => ({
    viewMode: 'grid',
    setViewMode: vi.fn(),
    isHydrated: true,
  }),
}));

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}));

vi.mock('@/hooks/use-my-items', () => ({
  useMyItems: () => mockUseMyItems(),
}));

vi.mock('@/hooks/use-latest-items', () => ({
  useLatestItems: () => mockUseLatestItems(),
}));

vi.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: string) => value,
}));

vi.mock('@/components/auth', () => ({
  LoginButton: () => <button type="button">ログイン</button>,
  UserMenu: () => <div data-testid="user-menu">UserMenu</div>,
}));

vi.mock('@/components/layout', () => ({
  Header: () => (
    <header data-testid="header">
      <span>xtrade</span>
    </header>
  ),
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

const defaultLatestItemsReturn = {
  latestItems: [],
  isLoading: false,
  error: null,
  refetch: vi.fn(),
  page: 1,
  totalPages: 1,
  setPage: vi.fn(),
  setQuery: vi.fn(),
};

describe('HomePageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLatestItems.mockReturnValue(defaultLatestItemsReturn);
  });

  describe('ローディング状態', () => {
    it('セッション読み込み中はローディング表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: true });
      mockUseMyItems.mockReturnValue({
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
    it('xtradeタイトルを表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      mockUseMyItems.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      expect(screen.getByText('xtrade')).toBeInTheDocument();
    });

    it('最近登録されたアイテムセクションを表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });
      mockUseMyItems.mockReturnValue({
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
      mockUseMyItems.mockReturnValue({
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
      mockUseMyItems.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });
      mockUseLatestItems.mockReturnValue({
        ...defaultLatestItemsReturn,
        error: new Error('Failed to fetch'),
      });

      render(<HomePageClient />);

      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
      expect(screen.getByText('再読み込み')).toBeInTheDocument();
    });
  });

  describe('ログイン状態', () => {
    it('最近登録されたアイテム一覧を表示', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      });
      mockUseMyItems.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      expect(screen.getByText('xtrade')).toBeInTheDocument();
      expect(screen.getByText('最近登録されたアイテム')).toBeInTheDocument();
    });

    it('アイテムがない場合は空の状態を表示', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      });
      mockUseMyItems.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      expect(screen.getByText('まだアイテムが登録されていません')).toBeInTheDocument();
    });

    it('Headerを表示', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        isPending: false,
      });
      mockUseMyItems.mockReturnValue({
        haveCards: [],
        wantCards: [],
        isLoading: false,
        error: null,
        addHaveCard: vi.fn(),
        addWantCard: vi.fn(),
        refetch: vi.fn(),
      });

      render(<HomePageClient />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
    });
  });
});
