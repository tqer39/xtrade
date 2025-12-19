'use client';

import { usePathname, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { signIn } from '@/lib/auth-client';

/**
 * X (Twitter) ログインボタン
 * ログイン後は現在のページにリダイレクトする
 */
export function LoginButton() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleLogin = async () => {
    // 現在のURLを構築（パス + クエリパラメータ）
    const currentUrl = searchParams.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    await signIn.social({
      provider: 'twitter',
      callbackURL: currentUrl || '/',
    });
  };

  return (
    <Button onClick={handleLogin} size="sm" className="rounded-full gap-1.5 px-3 h-8">
      <XLogo />
      ログイン
    </Button>
  );
}

function XLogo() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="X logo"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
