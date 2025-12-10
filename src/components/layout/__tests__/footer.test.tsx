import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Footer } from '../footer';

// AdUnit をモック
vi.mock('@/components/ads', () => ({
  AdUnit: ({ slot, format, className }: { slot: string; format: string; className: string }) => (
    <div data-testid="ad-unit" data-slot={slot} data-format={format} className={className}>
      Mock AdUnit
    </div>
  ),
}));

describe('Footer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('プライバシーポリシーへのリンクを表示する', () => {
    render(<Footer />);

    const link = screen.getByRole('link', { name: 'プライバシーポリシー' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/privacy');
  });

  it('利用規約へのリンクを表示する', () => {
    render(<Footer />);

    const link = screen.getByRole('link', { name: '利用規約' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/terms');
  });

  it('著作権表示を表示する', () => {
    render(<Footer />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} xtrade`)).toBeInTheDocument();
  });

  describe('広告表示', () => {
    it('showAd=true かつ adSlot が設定されている場合は広告を表示する', () => {
      render(<Footer showAd adSlot="1234567890" />);

      const adUnit = screen.getByTestId('ad-unit');
      expect(adUnit).toBeInTheDocument();
      expect(adUnit).toHaveAttribute('data-slot', '1234567890');
    });

    it('showAd=false の場合は広告を表示しない', () => {
      render(<Footer showAd={false} adSlot="1234567890" />);

      expect(screen.queryByTestId('ad-unit')).not.toBeInTheDocument();
    });

    it('adSlot が未設定の場合は広告を表示しない', () => {
      render(<Footer showAd />);

      expect(screen.queryByTestId('ad-unit')).not.toBeInTheDocument();
    });

    it('デフォルトで showAd=true', () => {
      render(<Footer adSlot="1234567890" />);

      expect(screen.getByTestId('ad-unit')).toBeInTheDocument();
    });

    it('広告フォーマットが horizontal で設定される', () => {
      render(<Footer showAd adSlot="1234567890" />);

      const adUnit = screen.getByTestId('ad-unit');
      expect(adUnit).toHaveAttribute('data-format', 'horizontal');
    });
  });
});
