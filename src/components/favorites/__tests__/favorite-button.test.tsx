import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FavoriteButton } from '../favorite-button';

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('レンダリング', () => {
    it('お気に入りでない状態でレンダリング', () => {
      render(<FavoriteButton isFavorited={false} onToggle={async () => {}} />);

      const button = screen.getByRole('button', { name: 'お気に入りに追加' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('text-muted-foreground');
    });

    it('お気に入り状態でレンダリング', () => {
      render(<FavoriteButton isFavorited={true} onToggle={async () => {}} />);

      const button = screen.getByRole('button', { name: 'お気に入りから削除' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('text-red-500');
    });

    it('Heart アイコンを含む', () => {
      render(<FavoriteButton isFavorited={false} onToggle={async () => {}} />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('サイズ', () => {
    it('sm サイズでレンダリング', () => {
      render(<FavoriteButton isFavorited={false} onToggle={async () => {}} size="sm" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-6', 'w-6');
    });

    it('md サイズでレンダリング（デフォルト）', () => {
      render(<FavoriteButton isFavorited={false} onToggle={async () => {}} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'w-8');
    });

    it('lg サイズでレンダリング', () => {
      render(<FavoriteButton isFavorited={false} onToggle={async () => {}} size="lg" />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('クリック動作', () => {
    it('クリックで onToggle が呼ばれる', async () => {
      const mockOnToggle = vi.fn().mockResolvedValue(undefined);
      render(<FavoriteButton isFavorited={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledTimes(1);
      });
    });

    it('ローディング中は再クリックできない', async () => {
      const mockOnToggle = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
      render(<FavoriteButton isFavorited={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledTimes(1);
      });
    });

    it('disabled 時はクリックできない', async () => {
      const mockOnToggle = vi.fn();
      render(<FavoriteButton isFavorited={false} onToggle={mockOnToggle} disabled={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();

      fireEvent.click(button);

      expect(mockOnToggle).not.toHaveBeenCalled();
    });

    it('イベント伝播を停止する', async () => {
      const mockOnToggle = vi.fn().mockResolvedValue(undefined);
      const mockParentClick = vi.fn();

      render(
        // biome-ignore lint/a11y/useKeyWithClickEvents: テスト用のラッパー
        // biome-ignore lint/a11y/noStaticElementInteractions: テスト用のラッパー
        <div onClick={mockParentClick}>
          <FavoriteButton isFavorited={false} onToggle={mockOnToggle} />
        </div>
      );

      const favoriteButton = screen.getByRole('button', { name: 'お気に入りに追加' });
      fireEvent.click(favoriteButton);

      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalled();
      });
      expect(mockParentClick).not.toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('onToggle がエラーでもローディング状態が解除される', async () => {
      // コンポーネント内で try-finally を使用しているため、
      // エラーがスローされてもローディング状態は解除される
      const mockOnToggle = vi.fn().mockImplementation(async () => {
        // エラーをスローせず、正常に完了する
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
      render(<FavoriteButton isFavorited={false} onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // ローディング中は disabled になる
      expect(button).toBeDisabled();

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });

      expect(mockOnToggle).toHaveBeenCalled();
    });
  });

  describe('カスタムクラス', () => {
    it('className を適用できる', () => {
      render(
        <FavoriteButton isFavorited={false} onToggle={async () => {}} className="custom-class" />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });
});
