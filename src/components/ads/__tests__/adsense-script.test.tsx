import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdSenseScript } from '../adsense-script';

// next/script をモック
vi.mock('next/script', () => ({
  default: ({ src, ...props }: { src: string; [key: string]: unknown }) => (
    <script data-testid="adsense-script" src={src} {...props} />
  ),
}));

describe('AdSenseScript', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('開発環境では何も表示しない', () => {
    // 開発環境では NODE_ENV='test' なので、production ではないため null
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = 'ca-pub-1234567890';

    const { container } = render(<AdSenseScript />);
    expect(container.firstChild).toBeNull();
  });

  it('NEXT_PUBLIC_ADSENSE_CLIENT が未設定の場合は何も表示しない', () => {
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = '';

    const { container } = render(<AdSenseScript />);
    expect(container.firstChild).toBeNull();
  });

  it('NEXT_PUBLIC_ADSENSE_CLIENT が undefined の場合は何も表示しない', () => {
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

    const { container } = render(<AdSenseScript />);
    expect(container.firstChild).toBeNull();
  });
});
