import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdUnit } from '../ad-unit';

describe('AdUnit', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('開発環境', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('プレースホルダーを表示する', () => {
      render(<AdUnit slot="1234567890" />);

      expect(screen.getByText('広告枠（本番環境でのみ表示）')).toBeInTheDocument();
    });

    it('testMode が true の場合は広告要素を表示する', () => {
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT = 'ca-pub-1234567890';

      const { container } = render(<AdUnit slot="1234567890" testMode />);

      const ins = container.querySelector('ins.adsbygoogle');
      expect(ins).toBeInTheDocument();
    });
  });

  describe('本番環境', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('NEXT_PUBLIC_ADSENSE_CLIENT が未設定の場合は何も表示しない', () => {
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT = '';

      const { container } = render(<AdUnit slot="1234567890" />);
      expect(container.firstChild).toBeNull();
    });

    it('環境変数が設定されている場合は広告要素を表示する', () => {
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT = 'ca-pub-1234567890';

      const { container } = render(<AdUnit slot="1234567890" />);

      const ins = container.querySelector('ins.adsbygoogle');
      expect(ins).toBeInTheDocument();
      expect(ins).toHaveAttribute('data-ad-client', 'ca-pub-1234567890');
      expect(ins).toHaveAttribute('data-ad-slot', '1234567890');
    });

    it('format プロパティが正しく設定される', () => {
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT = 'ca-pub-1234567890';

      const { container } = render(<AdUnit slot="1234567890" format="horizontal" />);

      const ins = container.querySelector('ins.adsbygoogle');
      expect(ins).toHaveAttribute('data-ad-format', 'horizontal');
    });

    it('className プロパティが正しく適用される', () => {
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT = 'ca-pub-1234567890';

      const { container } = render(<AdUnit slot="1234567890" className="custom-class" />);

      const ins = container.querySelector('ins.adsbygoogle');
      expect(ins).toHaveClass('custom-class');
    });

    it('デフォルトで auto フォーマットを使用する', () => {
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT = 'ca-pub-1234567890';

      const { container } = render(<AdUnit slot="1234567890" />);

      const ins = container.querySelector('ins.adsbygoogle');
      expect(ins).toHaveAttribute('data-ad-format', 'auto');
    });
  });
});
