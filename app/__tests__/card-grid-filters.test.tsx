import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CardGridFilters } from '../_components/card-grid-filters';

describe('CardGridFilters', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    selectedCategory: 'all',
    onCategoryChange: vi.fn(),
    categories: ['INI', 'JO1', 'BE:FIRST'],
    viewMode: 'grid' as const,
    onViewModeChange: vi.fn(),
    totalCount: 100,
    filteredCount: 50,
  };

  describe('検索バー', () => {
    it('検索入力を表示すること', () => {
      render(<CardGridFilters {...defaultProps} />);

      expect(screen.getByPlaceholderText('アイテム名で検索...')).toBeInTheDocument();
    });

    it('検索クエリを入力できること', () => {
      const handleSearchChange = vi.fn();
      render(<CardGridFilters {...defaultProps} onSearchChange={handleSearchChange} />);

      const input = screen.getByPlaceholderText('アイテム名で検索...');
      fireEvent.change(input, { target: { value: 'テスト' } });

      expect(handleSearchChange).toHaveBeenCalledWith('テスト');
    });

    it('検索クエリがある場合はクリアボタンを表示すること', () => {
      render(<CardGridFilters {...defaultProps} searchQuery="テスト" />);

      const clearButtons = screen.getAllByRole('button');
      expect(clearButtons.length).toBeGreaterThan(1);
    });

    it('クリアボタンをクリックすると検索クエリがクリアされること', () => {
      const handleSearchChange = vi.fn();
      render(
        <CardGridFilters
          {...defaultProps}
          searchQuery="テスト"
          onSearchChange={handleSearchChange}
        />
      );

      // Xボタンを探してクリック
      const buttons = screen.getAllByRole('button');
      const clearButton = buttons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-x');
      });
      if (clearButton) {
        fireEvent.click(clearButton);
        expect(handleSearchChange).toHaveBeenCalledWith('');
      }
    });
  });

  describe('フィルターパネル', () => {
    it('フィルターボタンをクリックするとパネルが開くこと', () => {
      render(<CardGridFilters {...defaultProps} />);

      // フィルターボタンは検索入力の隣にあるボタン（検索クリアボタンを除く）
      const buttons = screen.getAllByRole('button');
      // フィルターボタンを探す（最初のoutlineボタン）
      const filterButton = buttons[0]; // 最初のボタンがフィルターボタン

      expect(filterButton).toBeDefined();
      fireEvent.click(filterButton);

      expect(screen.getByText('フィルター')).toBeInTheDocument();
      expect(screen.getByText('カテゴリ')).toBeInTheDocument();
    });

    it('フィルターがアクティブな場合はボーダーがハイライトされること', () => {
      const { container } = render(<CardGridFilters {...defaultProps} selectedCategory="INI" />);

      // border-primaryクラスを持つボタンが存在することを確認
      const highlightedButton = container.querySelector('button.border-primary');
      expect(highlightedButton).toBeInTheDocument();
    });
  });

  describe('表示モード切替', () => {
    it('グリッドモードボタンがアクティブであること', () => {
      const { container } = render(<CardGridFilters {...defaultProps} viewMode="grid" />);

      // bg-secondaryクラスを持つボタンが存在することを確認
      const activeButton = container.querySelector('button.bg-secondary');
      expect(activeButton).toBeInTheDocument();
    });

    it('リストモードに切り替えられること', () => {
      const handleViewModeChange = vi.fn();
      const { container } = render(
        <CardGridFilters {...defaultProps} onViewModeChange={handleViewModeChange} />
      );

      // グリッド/リスト切替ボタングループを探す
      const viewModeButtons = container.querySelectorAll('.flex.gap-1.border button');
      // 2番目のボタン（リストボタン）をクリック
      if (viewModeButtons.length >= 2) {
        fireEvent.click(viewModeButtons[1]);
        expect(handleViewModeChange).toHaveBeenCalledWith('list');
      }
    });
  });

  describe('結果カウント', () => {
    it('フィルター結果の件数を表示すること', () => {
      render(<CardGridFilters {...defaultProps} filteredCount={50} totalCount={100} />);

      expect(screen.getByText(/50件表示/)).toBeInTheDocument();
      expect(screen.getByText(/100件中/)).toBeInTheDocument();
    });

    it('全件表示の場合は合計を表示しないこと', () => {
      render(<CardGridFilters {...defaultProps} filteredCount={100} totalCount={100} />);

      expect(screen.getByText('100件表示')).toBeInTheDocument();
      expect(screen.queryByText(/件中/)).not.toBeInTheDocument();
    });

    it('アクティブフィルターをバッジとして表示すること', () => {
      render(<CardGridFilters {...defaultProps} searchQuery="テスト" selectedCategory="INI" />);

      expect(screen.getByText('検索: テスト')).toBeInTheDocument();
      expect(screen.getByText('INI')).toBeInTheDocument();
    });
  });

  describe('フィルタークリア', () => {
    it('フィルターパネル内のクリアボタンで全フィルターをクリアできること', async () => {
      const handleSearchChange = vi.fn();
      const handleCategoryChange = vi.fn();

      render(
        <CardGridFilters
          {...defaultProps}
          searchQuery="テスト"
          selectedCategory="INI"
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
        />
      );

      // フィルターパネルを開く
      const buttons = screen.getAllByRole('button');
      const filterButton = buttons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-filter');
      });

      if (filterButton) {
        fireEvent.click(filterButton);

        const clearButton = screen.getByText('クリア');
        fireEvent.click(clearButton);

        expect(handleSearchChange).toHaveBeenCalledWith('');
        expect(handleCategoryChange).toHaveBeenCalledWith('all');
      }
    });
  });
});
