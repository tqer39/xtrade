import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrustBadge } from '../trust-badge';

describe('TrustBadge', () => {
  describe('グレード表示', () => {
    it.each(['S', 'A', 'B', 'C', 'D'] as const)('グレード %s を表示する', (grade) => {
      render(<TrustBadge grade={grade} />);

      expect(screen.getByText(grade)).toBeInTheDocument();
    });

    it('grade が null の場合 U を表示する', () => {
      render(<TrustBadge grade={null} />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('grade が undefined の場合 U を表示する', () => {
      render(<TrustBadge grade={undefined} />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('スタイル', () => {
    it('S グレードはゴールドのグラデーション背景を持つ', () => {
      render(<TrustBadge grade="S" />);

      const badge = screen.getByText('S');
      expect(badge).toHaveClass('from-yellow-400', 'to-amber-500');
    });

    it('A グレードはエメラルド背景を持つ', () => {
      render(<TrustBadge grade="A" />);

      const badge = screen.getByText('A');
      expect(badge).toHaveClass('bg-emerald-500');
    });

    it('D グレードは赤背景を持つ', () => {
      render(<TrustBadge grade="D" />);

      const badge = screen.getByText('D');
      expect(badge).toHaveClass('bg-red-400');
    });
  });

  describe('サイズ', () => {
    it('sm サイズが正しく適用される', () => {
      render(<TrustBadge grade="A" size="sm" />);

      const badge = screen.getByText('A');
      expect(badge).toHaveClass('h-5');
    });

    it('default サイズが正しく適用される', () => {
      render(<TrustBadge grade="A" size="default" />);

      const badge = screen.getByText('A');
      expect(badge).toHaveClass('h-6');
    });

    it('lg サイズが正しく適用される', () => {
      render(<TrustBadge grade="A" size="lg" />);

      const badge = screen.getByText('A');
      expect(badge).toHaveClass('h-8');
    });
  });

  describe('スコア表示', () => {
    it('showScore が true でスコアがある場合はスコアを表示する', () => {
      render(<TrustBadge grade="A" showScore score={85} />);

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('showScore が true でもスコアが null の場合は表示しない', () => {
      render(<TrustBadge grade="A" showScore score={null} />);

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    it('showScore が false の場合はスコアを表示しない', () => {
      render(<TrustBadge grade="A" showScore={false} score={85} />);

      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.queryByText('85')).not.toBeInTheDocument();
    });
  });

  describe('title 属性', () => {
    it('グレードのみの場合は適切な title を持つ', () => {
      render(<TrustBadge grade="A" />);

      const badge = screen.getByText('A');
      expect(badge).toHaveAttribute('title', '信頼グレード: A');
    });

    it('スコアがある場合は title にスコアも含む', () => {
      render(<TrustBadge grade="A" score={85} />);

      const badge = screen.getByText('A');
      expect(badge).toHaveAttribute('title', '信頼グレード: A (85点)');
    });
  });

  describe('カスタムクラス', () => {
    it('className が正しくマージされる', () => {
      render(<TrustBadge grade="A" className="custom-class" />);

      const badge = screen.getByText('A');
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('data-slot 属性', () => {
    it('data-slot="trust-badge" を持つ', () => {
      render(<TrustBadge grade="A" />);

      const badge = screen.getByText('A');
      expect(badge).toHaveAttribute('data-slot', 'trust-badge');
    });
  });
});
