import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { UserHaveCard, UserWantCard } from '@/modules/cards/types';
import { CardListItem } from '../_components/card-list-item';

describe('CardListItem', () => {
  const mockCard = {
    id: 'card-1',
    name: 'テストカード',
    category: 'INI',
    description: 'テスト用のカードです',
    imageUrl: null,
    createdByUserId: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHaveCard: UserHaveCard = {
    id: 'have-1',
    userId: 'user-1',
    cardId: 'card-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    card: mockCard,
  };

  const mockWantCard: UserWantCard = {
    id: 'want-1',
    userId: 'user-1',
    cardId: 'card-1',
    priority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    card: mockCard,
  };

  describe('サムネイル表示', () => {
    it('画像がない場合はプレースホルダーアイコンを表示すること', () => {
      const { container } = render(<CardListItem item={mockHaveCard} type="have" />);

      // SVGアイコン（lucide-image）が存在することを確認
      const svgIcon = container.querySelector('svg.lucide-image');
      expect(svgIcon).toBeInTheDocument();

      // img要素は存在しないこと
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('画像がある場合はサムネイルを表示すること', () => {
      const cardWithImage: UserHaveCard = {
        ...mockHaveCard,
        card: {
          ...mockCard,
          imageUrl: 'https://example.com/image.jpg',
        },
      };

      render(<CardListItem item={cardWithImage} type="have" />);

      const img = screen.getByAltText('テストカード');
      expect(img).toBeInTheDocument();
      // Next.js Imageコンポーネントは/_next/image?url=... 形式にURLを変換する
      expect(img.getAttribute('src')).toContain(
        encodeURIComponent('https://example.com/image.jpg')
      );
    });
  });

  describe('カード情報表示', () => {
    it('カード名が表示されること', () => {
      render(<CardListItem item={mockHaveCard} type="have" />);

      expect(screen.getByText('テストカード')).toBeInTheDocument();
    });

    it('カテゴリがバッジとして表示されること', () => {
      render(<CardListItem item={mockHaveCard} type="have" />);

      expect(screen.getByText('INI')).toBeInTheDocument();
    });

    it('説明が表示されること', () => {
      render(<CardListItem item={mockHaveCard} type="have" />);

      expect(screen.getByText('テスト用のカードです')).toBeInTheDocument();
    });

    it('説明がない場合は表示しないこと', () => {
      const cardWithoutDescription: UserHaveCard = {
        ...mockHaveCard,
        card: {
          ...mockCard,
          description: null,
        },
      };

      render(<CardListItem item={cardWithoutDescription} type="have" />);

      expect(screen.queryByText('テスト用のカードです')).not.toBeInTheDocument();
    });
  });

  describe('持っているカード表示', () => {
    it('カード情報が表示されること', () => {
      render(<CardListItem item={mockHaveCard} type="have" />);

      expect(screen.getByText('テストカード')).toBeInTheDocument();
    });
  });

  describe('欲しいカード表示', () => {
    it('優先度が表示されること', () => {
      render(<CardListItem item={mockWantCard} type="want" />);

      expect(screen.getByText('優先度:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('優先度がnullの場合は表示しないこと', () => {
      const wantCardWithoutPriority: UserWantCard = {
        ...mockWantCard,
        priority: null,
      };

      render(<CardListItem item={wantCardWithoutPriority} type="want" />);

      expect(screen.queryByText('優先度:')).not.toBeInTheDocument();
    });
  });

  describe('cardがundefinedの場合', () => {
    it('nullを返すこと', () => {
      const itemWithoutCard: UserHaveCard = {
        ...mockHaveCard,
        card: undefined,
      };

      const { container } = render(<CardListItem item={itemWithoutCard} type="have" />);

      expect(container.firstChild).toBeNull();
    });
  });
});
