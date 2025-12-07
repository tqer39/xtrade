import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminUsersPage from '../page';

// モック設定
const mockUseSession = vi.fn();
const mockPush = vi.fn();

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// fetch モック
global.fetch = vi.fn();

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockReset();
  });

  describe('ローディング状態', () => {
    it('isPending が true の場合、ローディング表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: true });

      render(<AdminUsersPage />);

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('未ログイン状態', () => {
    it('セッションがない場合、ログイン要求メッセージを表示', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });

      render(<AdminUsersPage />);

      expect(screen.getByText('管理画面')).toBeInTheDocument();
      expect(screen.getByText('ログインが必要です')).toBeInTheDocument();
    });

    it('「トップに戻る」ボタンクリックで / に遷移', () => {
      mockUseSession.mockReturnValue({ data: null, isPending: false });

      render(<AdminUsersPage />);

      const button = screen.getByText('トップに戻る');
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('一般ユーザー（非管理者）', () => {
    it('admin 以外の role の場合、アクセス拒否を表示', async () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1' } },
        isPending: false,
      });
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: { role: 'user' } }),
      });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('アクセス拒否')).toBeInTheDocument();
        expect(screen.getByText('管理者権限が必要です')).toBeInTheDocument();
      });
    });
  });

  describe('管理者ユーザー', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'admin-1' } },
        isPending: false,
      });
    });

    it('ホワイトリスト一覧を表示', async () => {
      const mockAllowedUsers = [
        {
          id: '1',
          twitterUsername: 'user1',
          addedBy: 'admin-1',
          createdAt: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          twitterUsername: 'user2',
          addedBy: 'admin-1',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ];

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ user: { role: 'admin' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ allowedUsers: mockAllowedUsers }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: [] }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('ユーザー管理')).toBeInTheDocument();
        expect(screen.getByText('@user1')).toBeInTheDocument();
        expect(screen.getByText('@user2')).toBeInTheDocument();
      });
    });

    it('空のホワイトリストの場合、メッセージを表示', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ user: { role: 'admin' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ allowedUsers: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: [] }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('ホワイトリストは空です')).toBeInTheDocument();
      });
    });

    it('ユーザー追加フォームを表示', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ user: { role: 'admin' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ allowedUsers: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: [] }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('ホワイトリストに追加')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('username')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '追加' })).toBeInTheDocument();
      });
    });

    it('ユーザー追加が成功する', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ user: { role: 'admin' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ allowedUsers: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ allowedUser: { id: '1', twitterUsername: 'newuser' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              allowedUsers: [
                {
                  id: '1',
                  twitterUsername: 'newuser',
                  addedBy: 'admin-1',
                  createdAt: '2024-01-01',
                },
              ],
            }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('username')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('username');
      fireEvent.change(input, { target: { value: 'newuser' } });

      const submitButton = screen.getByRole('button', { name: '追加' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('@newuser')).toBeInTheDocument();
      });
    });

    it('403 エラー時にエラーメッセージを表示', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ user: { role: 'admin' } }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: () => Promise.resolve({ error: 'Forbidden' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: [] }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('管理者権限が必要です')).toBeInTheDocument();
      });
    });

    it('「戻る」ボタンクリックで / に遷移', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ user: { role: 'admin' } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ allowedUsers: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ users: [] }),
        });

      render(<AdminUsersPage />);

      await waitFor(() => {
        expect(screen.getByText('戻る')).toBeInTheDocument();
      });

      const backButton = screen.getByText('戻る');
      fireEvent.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });
});
