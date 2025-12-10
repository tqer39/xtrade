'use client';

import Script from 'next/script';

/**
 * Google AdSense のスクリプトを読み込むコンポーネント
 * layout.tsx に配置して、サイト全体で一度だけ読み込む
 *
 * 使用方法:
 * 1. .env.local に NEXT_PUBLIC_ADSENSE_CLIENT を設定
 * 2. layout.tsx に <AdSenseScript /> を追加
 *
 * 注意:
 * - 本番環境でのみ広告を表示
 * - 環境変数が未設定の場合は何も表示しない
 */
export function AdSenseScript() {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  // 開発環境または環境変数未設定の場合はスクリプトを読み込まない
  if (process.env.NODE_ENV !== 'production' || !adsenseClient) {
    return null;
  }

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
