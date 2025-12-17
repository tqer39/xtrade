import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginButton } from '../login-button';

// モック設定
const _mockSignIn = {
  social: vi.fn(),
};

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => ({
    toString: () => '',
  }),
}));

vi.mock('@/lib/auth-client', () => ({
  signIn: {
    social: vi.fn(),
  },
}));

describe('LoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('「ログイン」ボタンをレンダリングする', () => {
    render(<LoginButton />);

    const button = screen.getByRole('button', { name: /ログイン/i });
    expect(button).toBeInTheDocument();
  });

  it('X ロゴ（SVG）を含む', () => {
    render(<LoginButton />);

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('ボタンのスタイルクラスが正しく適用されている', () => {
    render(<LoginButton />);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('rounded-full');
    expect(button).toHaveClass('gap-1.5');
  });

  it('クリックで signIn.social が呼ばれる', async () => {
    const { signIn } = await import('@/lib/auth-client');

    render(<LoginButton />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(signIn.social).toHaveBeenCalledWith({
      provider: 'twitter',
      callbackURL: '/',
    });
  });
});
