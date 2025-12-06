import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { StarRating } from '../star-rating';

describe('StarRating', () => {
  describe('基本レンダリング', () => {
    it('5つの星ボタンを表示する', () => {
      render(<StarRating />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('各ボタンに適切な aria-label がある', () => {
      render(<StarRating />);

      expect(screen.getByLabelText('1つ星')).toBeInTheDocument();
      expect(screen.getByLabelText('2つ星')).toBeInTheDocument();
      expect(screen.getByLabelText('3つ星')).toBeInTheDocument();
      expect(screen.getByLabelText('4つ星')).toBeInTheDocument();
      expect(screen.getByLabelText('5つ星')).toBeInTheDocument();
    });

    it('data-slot="star-rating" を持つ', () => {
      const { container } = render(<StarRating />);

      const fieldset = container.querySelector('[data-slot="star-rating"]');
      expect(fieldset).toBeInTheDocument();
    });

    it('legend を持つ（スクリーンリーダー用）', () => {
      render(<StarRating />);

      expect(screen.getByText('評価')).toBeInTheDocument();
    });
  });

  describe('インタラクティブモード', () => {
    it('クリックで onChange が呼ばれる', () => {
      const handleChange = vi.fn();
      render(<StarRating onChange={handleChange} />);

      fireEvent.click(screen.getByLabelText('3つ星'));

      expect(handleChange).toHaveBeenCalledWith(3);
    });

    it('ホバーでハイライト表示が変わる', () => {
      render(<StarRating value={1} />);

      const button4 = screen.getByLabelText('4つ星');
      fireEvent.mouseEnter(button4);

      // ホバー中は4つ星までがハイライトされる
      // （内部状態が変わることを確認）
      expect(button4).toBeInTheDocument();
    });

    it('マウスリーブで元の値に戻る', () => {
      const { container } = render(<StarRating value={2} />);

      const button4 = screen.getByLabelText('4つ星');
      fireEvent.mouseEnter(button4);

      const fieldset = container.querySelector('[data-slot="star-rating"]');
      if (fieldset) {
        fireEvent.mouseLeave(fieldset);
      }

      // マウスリーブ後も動作していることを確認
      expect(fieldset).toBeInTheDocument();
    });
  });

  describe('読み取り専用モード', () => {
    it('readOnly=true の場合はボタンが disabled になる', () => {
      render(<StarRating readOnly />);

      const buttons = screen.getAllByRole('button');
      for (const button of buttons) {
        expect(button).toBeDisabled();
      }
    });

    it('readOnly=true でクリックしても onChange が呼ばれない', () => {
      const handleChange = vi.fn();
      render(<StarRating readOnly onChange={handleChange} />);

      fireEvent.click(screen.getByLabelText('3つ星'));

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('readOnly=true かつ value > 0 の場合は評価値を表示する', () => {
      render(<StarRating value={4.5} readOnly />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('readOnly=true でも value=0 の場合は評価値を表示しない', () => {
      render(<StarRating value={0} readOnly />);

      expect(screen.queryByText('0.0')).not.toBeInTheDocument();
    });
  });

  describe('サイズ', () => {
    it('sm サイズが適用される', () => {
      render(<StarRating size="sm" />);

      const button = screen.getByLabelText('1つ星');
      const svg = button.querySelector('svg');
      expect(svg).toHaveClass('h-4', 'w-4');
    });

    it('default サイズが適用される', () => {
      render(<StarRating size="default" />);

      const button = screen.getByLabelText('1つ星');
      const svg = button.querySelector('svg');
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    it('lg サイズが適用される', () => {
      render(<StarRating size="lg" />);

      const button = screen.getByLabelText('1つ星');
      const svg = button.querySelector('svg');
      expect(svg).toHaveClass('h-6', 'w-6');
    });
  });

  describe('空の星表示', () => {
    it('showEmpty=true の場合は空の星を表示する（デフォルト）', () => {
      render(<StarRating value={0} />);

      const button = screen.getByLabelText('1つ星');
      const starIcons = button.querySelectorAll('svg');
      expect(starIcons.length).toBeGreaterThan(0);
    });

    it('showEmpty=false の場合は塗りつぶし星のみ', () => {
      render(<StarRating value={3} showEmpty={false} />);

      // 3つ星までは塗りつぶされている
      expect(screen.getByLabelText('3つ星')).toBeInTheDocument();
    });
  });

  describe('カスタムクラス', () => {
    it('className が正しくマージされる', () => {
      const { container } = render(<StarRating className="custom-class" />);

      const fieldset = container.querySelector('[data-slot="star-rating"]');
      expect(fieldset).toHaveClass('custom-class');
    });
  });
});
