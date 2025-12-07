import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PricingNotice } from '../_components/pricing-notice';

describe('PricingNotice', () => {
  describe('無料枠が残っている場合', () => {
    it('デフォルト（0回取引）で無料枠メッセージを表示', () => {
      render(<PricingNotice />);

      expect(screen.getByText('今月あと 1 回無料で取引できます')).toBeInTheDocument();
      expect(screen.getByText('毎月1回まで無料でトレードが可能です')).toBeInTheDocument();
    });

    it('tradeCount=0 で無料枠1回と表示', () => {
      render(<PricingNotice tradeCount={0} />);

      expect(screen.getByText('今月あと 1 回無料で取引できます')).toBeInTheDocument();
    });
  });

  describe('無料枠を使い切った場合', () => {
    it('tradeCount=1 で有料プラン案内を表示', () => {
      render(<PricingNotice tradeCount={1} />);

      expect(screen.getByText('有料プランへのアップグレード')).toBeInTheDocument();
      expect(screen.getByText(/今月の無料枠を使い切りました/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /準備中/ })).toBeInTheDocument();
    });

    it('tradeCount=5 でも有料プラン案内を表示', () => {
      render(<PricingNotice tradeCount={5} />);

      expect(screen.getByText('有料プランへのアップグレード')).toBeInTheDocument();
    });
  });
});
