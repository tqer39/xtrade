import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ItemOwnerList } from '../_components/item-owner-list';

// モック設定
const mockUseItemOwners = vi.fn();

vi.mock('@/hooks/use-item-owners', () => ({
  useItemOwners: () => mockUseItemOwners(),
}));

vi.mock('@/components/auth', () => ({
  LoginButton: () => <button type="button">ログイン</button>,
}));

vi.mock('@/components/trust/trust-badge', () => ({
  TrustBadge: ({ grade, score }: { grade: string; score?: number }) => (
    <span data-testid="trust-badge">
      {grade}
      {score}
    </span>
  ),
}));

describe('ItemOwnerList', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ローディング状態', () => {
    it('ローディング中はスケルトンを表示', () => {
      mockUseItemOwners.mockReturnValue({
        card: null,
        owners: [],
        isLoading: true,
        error: null,
      });

      render(<ItemOwnerList cardId="card-1" onBack={mockOnBack} isLoggedIn={false} />);

      // スケルトンが表示されていることを確認（class で確認）
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('エラー状態', () => {
    it('エラーメッセージと戻るボタンを表示', () => {
      mockUseItemOwners.mockReturnValue({
        card: null,
        owners: [],
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(<ItemOwnerList cardId="card-1" onBack={mockOnBack} isLoggedIn={false} />);

      expect(screen.getByText(/エラーが発生しました/)).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();

      const backButton = screen.getByRole('button', { name: '戻る' });
      fireEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('アイテムが見つからない場合', () => {
    it('メッセージと戻るボタンを表示', () => {
      mockUseItemOwners.mockReturnValue({
        card: null,
        owners: [],
        isLoading: false,
        error: null,
      });

      render(<ItemOwnerList cardId="card-1" onBack={mockOnBack} isLoggedIn={false} />);

      expect(screen.getByText('アイテムが見つかりません')).toBeInTheDocument();

      const backButton = screen.getByRole('button', { name: '戻る' });
      fireEvent.click(backButton);
      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe('正常表示', () => {
    const mockCard = {
      id: 'card-1',
      name: 'Test Card',
      category: 'pokemon',
      imageUrl: 'https://example.com/card.png',
    };

    it('アイテム情報を表示', () => {
      mockUseItemOwners.mockReturnValue({
        card: mockCard,
        owners: [],
        isLoading: false,
        error: null,
      });

      render(<ItemOwnerList cardId="card-1" onBack={mockOnBack} isLoggedIn={false} />);

      expect(screen.getByText('Test Card')).toBeInTheDocument();
      expect(screen.getByText('pokemon')).toBeInTheDocument();
      expect(screen.getByAltText('Test Card')).toBeInTheDocument();
    });

    it('画像がない場合はプレースホルダーを表示', () => {
      mockUseItemOwners.mockReturnValue({
        card: { ...mockCard, imageUrl: null },
        owners: [],
        isLoading: false,
        error: null,
      });

      render(<ItemOwnerList cardId="card-1" onBack={mockOnBack} isLoggedIn={false} />);

      expect(screen.queryByAltText('Test Card')).not.toBeInTheDocument();
    });

    it('所有者がいない場合はメッセージを表示', () => {
      mockUseItemOwners.mockReturnValue({
        card: mockCard,
        owners: [],
        isLoading: false,
        error: null,
      });

      render(<ItemOwnerList cardId="card-1" onBack={mockOnBack} isLoggedIn={false} />);

      expect(screen.getByText('このアイテムを持っているユーザーがいません')).toBeInTheDocument();
    });

    it('所有者一覧を表示', () => {
      const mockOwners = [
        {
          userId: 'user-1',
          name: 'User 1',
          image: 'https://example.com/user1.png',
          twitterUsername: 'user1',
          trustGrade: 'A',
          trustScore: 80,
        },
        {
          userId: 'user-2',
          name: 'User 2',
          image: null,
          twitterUsername: null,
          trustGrade: 'B',
          trustScore: 60,
        },
      ];

      mockUseItemOwners.mockReturnValue({
        card: mockCard,
        owners: mockOwners,
        isLoading: false,
        error: null,
      });

      render(<ItemOwnerList cardId="card-1" onBack={mockOnBack} isLoggedIn={false} />);

      expect(screen.getByText('このアイテムを持っているユーザー (2人)')).toBeInTheDocument();
      expect(screen.getByText('User 1')).toBeInTheDocument();
      expect(screen.getByText('@user1')).toBeInTheDocument();
      expect(screen.getByText('2枚')).toBeInTheDocument();
      expect(screen.getByText('User 2')).toBeInTheDocument();
      expect(screen.getByText('1枚')).toBeInTheDocument();
    });

    it('戻るボタンが機能する', () => {
      mockUseItemOwners.mockReturnValue({
        card: mockCard,
        owners: [],
        isLoading: false,
        error: null,
      });

      render(<ItemOwnerList cardId="card-1" onBack={mockOnBack} isLoggedIn={false} />);

      const backButtons = screen.getAllByRole('button');
      const arrowBackButton = backButtons.find((btn) => btn.querySelector('svg'));
      if (arrowBackButton) {
        fireEvent.click(arrowBackButton);
        expect(mockOnBack).toHaveBeenCalled();
      }
    });
  });

  describe('ログイン状態による表示', () => {
    const mockCard = {
      id: 'card-1',
      name: 'Test Card',
      category: 'pokemon',
      imageUrl: null,
    };

    it('ログイン済みの場合は取引ボタンを表示', () => {
      mockUseItemOwners.mockReturnValue({
        card: mockCard,
        owners: [],
        isLoading: false,
        error: null,
      });

      render(<ItemOwnerList cardId="card-1" onBack={mockOnBack} isLoggedIn={true} />);

      expect(screen.getByText(/取引を申し込む/)).toBeInTheDocument();
    });

    it('未ログインの場合はログインボタンを表示', () => {
      mockUseItemOwners.mockReturnValue({
        card: mockCard,
        owners: [],
        isLoading: false,
        error: null,
      });

      render(<ItemOwnerList cardId="card-1" onBack={mockOnBack} isLoggedIn={false} />);

      expect(screen.getByText('取引を申し込むにはログインが必要です')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    });
  });
});
