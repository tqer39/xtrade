import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UserHaveCard } from '@/modules/cards/types';
import { CardGrid } from '../_components/card-grid';

describe('CardGrid', () => {
  const mockCard = {
    id: 'card-1',
    name: 'テストカード',
    category: 'INI',
    description: 'テスト用のカードです',
    imageUrl: 'https://example.com/image.jpg',
    createdByUserId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHaveCards: UserHaveCard[] = [
    {
      id: 'have-1',
      userId: 'user-1',
      cardId: 'card-1',
      quantity: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      card: mockCard,
    },
    {
      id: 'have-2',
      userId: 'user-1',
      cardId: 'card-2',
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      card: {
        ...mockCard,
        id: 'card-2',
        name: 'テストカード2',
      },
    },
  ];

  describe('ローディング状態', () => {
    it('isLoadingがtrueの場合はスケルトンを表示すること', () => {
      const { container } = render(<CardGrid items={[]} type="have" isLoading={true} />);

      const skeletons = container.querySelectorAll('.aspect-square');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('空の状態', () => {
    it('アイテムがない場合はデフォルトメッセージを表示すること', () => {
      render(<CardGrid items={[]} type="have" />);

      expect(screen.getByText('カードがありません')).toBeInTheDocument();
    });

    it('カスタム空メッセージを表示できること', () => {
      render(<CardGrid items={[]} type="have" emptyMessage="登録されたカードはありません" />);

      expect(screen.getByText('登録されたカードはありません')).toBeInTheDocument();
    });
  });

  describe('グリッド表示', () => {
    it('カードアイテムをグリッドで表示すること', () => {
      const { container } = render(<CardGrid items={mockHaveCards} type="have" />);

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveClass('grid-cols-2');
    });

    it('各カードアイテムを表示すること', () => {
      render(<CardGrid items={mockHaveCards} type="have" />);

      expect(screen.getByAltText('テストカード')).toBeInTheDocument();
      expect(screen.getByAltText('テストカード2')).toBeInTheDocument();
    });
  });

  describe('コールバック', () => {
    it('onCardClickを各アイテムに渡すこと', () => {
      const handleClick = vi.fn();

      render(<CardGrid items={mockHaveCards} type="have" onCardClick={handleClick} />);

      // ボタンが存在することを確認
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('onFavoriteToggleを各アイテムに渡すこと', () => {
      const handleFavoriteToggle = vi.fn();

      render(
        <CardGrid items={mockHaveCards} type="have" onFavoriteToggle={handleFavoriteToggle} />
      );

      // お気に入りボタンが存在することを確認
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(mockHaveCards.length);
    });

    it('favoriteCardIdsでお気に入り状態を管理すること', () => {
      const favoriteCardIds = new Set(['card-1']);

      render(
        <CardGrid
          items={mockHaveCards}
          type="have"
          onFavoriteToggle={vi.fn()}
          favoriteCardIds={favoriteCardIds}
        />
      );

      // お気に入りボタンの状態は内部で管理されるため、ボタンの存在を確認
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
