import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrustScoreCard } from '../trust-score-card';

// 日付のモック
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-12-06'));

describe('TrustScoreCard', () => {
  const defaultProps = {
    trustScore: 75,
    trustGrade: 'A' as const,
  };

  describe('基本レンダリング', () => {
    it('信頼スコアのタイトルを表示する', () => {
      render(<TrustScoreCard {...defaultProps} />);

      expect(screen.getByText('信頼スコア')).toBeInTheDocument();
    });

    it('TrustBadge を正しいグレードで表示する', () => {
      render(<TrustScoreCard {...defaultProps} />);

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('スコアを表示する', () => {
      render(<TrustScoreCard {...defaultProps} />);

      expect(screen.getByText('75')).toBeInTheDocument();
    });

    it('更新日時を表示する', () => {
      render(<TrustScoreCard {...defaultProps} updatedAt="2024-12-01T10:00:00Z" />);

      expect(screen.getByText(/最終更新:/)).toBeInTheDocument();
    });

    it('更新日時が null の場合は表示しない', () => {
      render(<TrustScoreCard {...defaultProps} updatedAt={null} />);

      expect(screen.queryByText(/最終更新:/)).not.toBeInTheDocument();
    });
  });

  describe('スコア内訳', () => {
    const breakdown = {
      xProfile: 32,
      behavior: 28,
      review: 15,
    };

    it('breakdown が指定されている場合はスコア内訳を表示する', () => {
      render(<TrustScoreCard {...defaultProps} breakdown={breakdown} />);

      expect(screen.getByText('スコア内訳')).toBeInTheDocument();
      expect(screen.getByText('Xプロフィール')).toBeInTheDocument();
      expect(screen.getByText('取引実績')).toBeInTheDocument();
      expect(screen.getByText('レビュー')).toBeInTheDocument();
    });

    it('各スコアと最大値を表示する', () => {
      render(<TrustScoreCard {...defaultProps} breakdown={breakdown} />);

      expect(screen.getByText('32/40')).toBeInTheDocument();
      expect(screen.getByText('28/40')).toBeInTheDocument();
      expect(screen.getByText('15/20')).toBeInTheDocument();
    });

    it('breakdown が指定されていない場合はスコア内訳を表示しない', () => {
      render(<TrustScoreCard {...defaultProps} />);

      expect(screen.queryByText('スコア内訳')).not.toBeInTheDocument();
    });
  });

  describe('統計情報', () => {
    const stats = {
      completedTrades: 12,
      successRate: 92,
      avgRating: 4.3,
      reviewCount: 8,
    };

    it('stats が指定されている場合は統計を表示する', () => {
      render(<TrustScoreCard {...defaultProps} stats={stats} />);

      expect(screen.getByText('12')).toBeInTheDocument();
      expect(screen.getByText('トレード完了')).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText('成功率')).toBeInTheDocument();
      expect(screen.getByText('4.3')).toBeInTheDocument();
      expect(screen.getByText('平均評価')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      expect(screen.getByText('レビュー数')).toBeInTheDocument();
    });

    it('successRate が null の場合は - を表示する', () => {
      render(<TrustScoreCard {...defaultProps} stats={{ ...stats, successRate: null }} />);

      // 成功率の値が - であることを確認
      const successRateSection = screen.getByText('成功率').parentElement;
      expect(successRateSection?.querySelector('.text-2xl')?.textContent).toBe('-');
    });

    it('avgRating が null の場合は - を表示する', () => {
      render(<TrustScoreCard {...defaultProps} stats={{ ...stats, avgRating: null }} />);

      const avgRatingSection = screen.getByText('平均評価').parentElement;
      expect(avgRatingSection?.querySelector('.text-2xl')?.textContent).toBe('-');
    });

    it('stats が指定されていない場合は統計を表示しない', () => {
      render(<TrustScoreCard {...defaultProps} />);

      expect(screen.queryByText('トレード完了')).not.toBeInTheDocument();
    });
  });

  describe('コンパクトモード', () => {
    const stats = {
      completedTrades: 12,
      successRate: 92,
      avgRating: 4.3,
      reviewCount: 8,
    };

    it('compact=true の場合はシンプルな表示になる', () => {
      render(<TrustScoreCard {...defaultProps} stats={stats} compact />);

      // グレードバッジは表示される
      expect(screen.getByText('A')).toBeInTheDocument();
      // トレード完了数のサマリーは表示される
      expect(screen.getByText('12件のトレード完了')).toBeInTheDocument();
      // 詳細な統計は表示されない
      expect(screen.queryByText('成功率')).not.toBeInTheDocument();
    });

    it('compact=true で completedTrades が 0 の場合はトレード数を表示しない', () => {
      render(<TrustScoreCard {...defaultProps} stats={{ ...stats, completedTrades: 0 }} compact />);

      expect(screen.queryByText(/件のトレード完了/)).not.toBeInTheDocument();
    });

    it('compact=true で stats がない場合はトレード数を表示しない', () => {
      render(<TrustScoreCard {...defaultProps} compact />);

      expect(screen.queryByText(/件のトレード完了/)).not.toBeInTheDocument();
    });
  });

  describe('グレードなし', () => {
    it('trustGrade が null の場合は U グレードを表示する', () => {
      render(<TrustScoreCard trustScore={null} trustGrade={null} />);

      expect(screen.getByText('U')).toBeInTheDocument();
    });
  });

  describe('カスタムクラス', () => {
    it('className が正しくマージされる', () => {
      const { container } = render(<TrustScoreCard {...defaultProps} className="custom-class" />);

      const card = container.firstChild;
      expect(card).toHaveClass('custom-class');
    });
  });
});
