import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { UserHaveCard, UserWantCard } from '@/modules/cards/types';
import { CardGridItem } from '../_components/card-grid-item';

describe('CardGridItem', () => {
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

  const mockHaveCard: UserHaveCard = {
    id: 'have-1',
    userId: 'user-1',
    cardId: 'card-1',
    quantity: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    card: mockCard,
  };

  const mockWantCard: UserWantCard = {
    id: 'want-1',
    userId: 'user-1',
    cardId: 'card-1',
    priority: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
    card: mockCard,
  };

  describe('基本レンダリング', () => {
    it('カード画像を表示すること', () => {
      render(<CardGridItem item={mockHaveCard} type="have" />);

      const img = screen.getByAltText('テストカード');
      expect(img).toBeInTheDocument();
    });

    it('画像がない場合はプレースホルダーを表示すること', () => {
      const cardWithoutImage: UserHaveCard = {
        ...mockHaveCard,
        card: {
          ...mockCard,
          imageUrl: null,
        },
      };

      const { container } = render(<CardGridItem item={cardWithoutImage} type="have" />);

      const svgIcon = container.querySelector('svg.lucide-image');
      expect(svgIcon).toBeInTheDocument();
    });

    it('cardがnullの場合はnullを返すこと', () => {
      const itemWithNullCard: UserHaveCard = {
        ...mockHaveCard,
        card: null as unknown as undefined,
      };

      const { container } = render(<CardGridItem item={itemWithNullCard} type="have" />);
      expect(container.firstChild).toBeNull();
    });

    it('cardがundefinedの場合はnullを返すこと', () => {
      const itemWithoutCard: UserHaveCard = {
        ...mockHaveCard,
        card: undefined,
      };

      const { container } = render(<CardGridItem item={itemWithoutCard} type="have" />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('持っているカード表示', () => {
    it('数量バッジを表示すること', () => {
      render(<CardGridItem item={mockHaveCard} type="have" />);

      expect(screen.getByText('×2')).toBeInTheDocument();
    });
  });

  describe('欲しいカード表示', () => {
    it('優先度バッジを表示すること', () => {
      render(<CardGridItem item={mockWantCard} type="want" />);

      expect(screen.getByText('P5')).toBeInTheDocument();
    });

    it('優先度がnullの場合はバッジを表示しないこと', () => {
      const wantCardWithoutPriority: UserWantCard = {
        ...mockWantCard,
        priority: null,
      };

      render(<CardGridItem item={wantCardWithoutPriority} type="want" />);
      expect(screen.queryByText(/^P\d+$/)).not.toBeInTheDocument();
    });
  });

  describe('インタラクション', () => {
    it('クリック時にonCardClickが呼ばれること', () => {
      const handleClick = vi.fn();

      render(<CardGridItem item={mockHaveCard} type="have" onCardClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledWith(mockHaveCard);
    });

    it('お気に入りボタンをクリック時にonFavoriteToggleが呼ばれること', () => {
      const handleFavoriteToggle = vi.fn();

      render(
        <CardGridItem
          item={mockHaveCard}
          type="have"
          onFavoriteToggle={handleFavoriteToggle}
          isFavorite={false}
        />
      );

      // お気に入りボタンは2番目のボタン（最初はカード全体）
      const buttons = screen.getAllByRole('button');
      const favoriteButton = buttons[1];
      fireEvent.click(favoriteButton);

      expect(handleFavoriteToggle).toHaveBeenCalledWith('card-1', true);
    });

    it('お気に入り解除時にonFavoriteToggleが呼ばれること', () => {
      const handleFavoriteToggle = vi.fn();

      render(
        <CardGridItem
          item={mockHaveCard}
          type="have"
          onFavoriteToggle={handleFavoriteToggle}
          isFavorite={true}
        />
      );

      const buttons = screen.getAllByRole('button');
      const favoriteButton = buttons[1];
      fireEvent.click(favoriteButton);

      expect(handleFavoriteToggle).toHaveBeenCalledWith('card-1', false);
    });
  });

  describe('ホバー状態', () => {
    it('ホバー時にオーバーレイ情報を表示すること', () => {
      render(<CardGridItem item={mockHaveCard} type="have" />);

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      // カード名は複数箇所に表示されるのでgetAllByTextを使用
      expect(screen.getAllByText('テストカード').length).toBeGreaterThan(0);
      expect(screen.getAllByText('INI').length).toBeGreaterThan(0);
    });
  });
});
