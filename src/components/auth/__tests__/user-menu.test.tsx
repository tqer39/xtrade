import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserMenu } from '../user-menu';

// モック設定
const mockSignOut = vi.fn();
const mockUseSession = vi.fn();

vi.mock('@/lib/auth-client', () => ({
  signOut: () => mockSignOut(),
  useSession: () => mockUseSession(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// fetch モック
global.fetch = vi.fn();

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: () => Promise.resolve({ user: { role: 'user' } }),
    });
  });

  describe('ローディング状態', () => {
    it('isPending が true の場合、ローディングプレースホルダーを表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: true });

      render(<UserMenu />);

      const placeholder = document.querySelector('.animate-pulse');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('未ログイン状態', () => {
    it('セッションがない場合、LoginButton を表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });

      render(<UserMenu />);

      // LoginButton がレンダリングされる（モックされているので button を探す）
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('ログイン状態', () => {
    it('ユーザー名を表示', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-1',
            name: 'Test User',
            image: 'https://example.com/avatar.jpg',
          },
        },
        isPending: false,
      });

      render(<UserMenu />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('ユーザーアバターを表示', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-1',
            name: 'Test User',
            image: 'https://example.com/avatar.jpg',
          },
        },
        isPending: false,
      });

      render(<UserMenu />);

      const avatar = screen.getByAltText('Test User');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    it('ログアウトボタンを表示', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-1',
            name: 'Test User',
            image: null,
          },
        },
        isPending: false,
      });

      render(<UserMenu />);

      expect(screen.getByText('ログアウト')).toBeInTheDocument();
    });

    it('管理者の場合、管理画面リンクを表示', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'admin-1',
            name: 'Admin User',
            image: null,
          },
        },
        isPending: false,
      });
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve({ user: { role: 'admin' } }),
      });

      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.getByText('管理画面')).toBeInTheDocument();
      });

      const adminLink = screen.getByRole('link', { name: '管理画面' });
      expect(adminLink).toHaveAttribute('href', '/admin/users');
    });

    it('一般ユーザーの場合、管理画面リンクを表示しない', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: 'user-1',
            name: 'Normal User',
            image: null,
          },
        },
        isPending: false,
      });
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        json: () => Promise.resolve({ user: { role: 'user' } }),
      });

      render(<UserMenu />);

      await waitFor(() => {
        expect(screen.queryByText('管理画面')).not.toBeInTheDocument();
      });
    });
  });
});
