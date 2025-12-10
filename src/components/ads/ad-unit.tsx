'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: { push: (params: Record<string, unknown>) => void };
  }
}

export type AdFormat = 'auto' | 'rectangle' | 'horizontal' | 'vertical';

interface AdUnitProps {
  /**
   * 広告スロット ID（AdSense で作成した広告ユニットの data-ad-slot）
   */
  slot: string;
  /**
   * 広告フォーマット
   * - auto: レスポンシブ（推奨）
   * - rectangle: 300x250 等の四角形
   * - horizontal: 横長バナー
   * - vertical: 縦長バナー
   */
  format?: AdFormat;
  /**
   * 追加の CSS クラス
   */
  className?: string;
  /**
   * テストモード（開発時に使用）
   */
  testMode?: boolean;
}

/**
 * Google AdSense 広告ユニットコンポーネント
 *
 * 使用方法:
 * ```tsx
 * <AdUnit slot="1234567890" format="auto" />
 * ```
 *
 * 注意:
 * - AdSenseScript が読み込まれている必要があります
 * - 本番環境でのみ広告を表示します
 * - 環境変数 NEXT_PUBLIC_ADSENSE_CLIENT が設定されている必要があります
 */
export function AdUnit({ slot, format = 'auto', className = '', testMode = false }: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isInitialized = useRef(false);

  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const isProduction = process.env.NODE_ENV === 'production';

  useEffect(() => {
    // 本番環境でのみ広告を初期化
    if (!isProduction && !testMode) return;
    if (!adsenseClient) return;
    if (isInitialized.current) return;

    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
        isInitialized.current = true;
      }
    } catch (error) {
      console.error('AdSense initialization error:', error);
    }
  }, [adsenseClient, isProduction, testMode]);

  // 開発環境ではプレースホルダーを表示
  if (!isProduction && !testMode) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-muted-foreground rounded-md border border-dashed ${className}`}
        style={{ minHeight: '100px' }}
      >
        <span className="text-sm">広告枠（本番環境でのみ表示）</span>
      </div>
    );
  }

  // 環境変数が未設定の場合は何も表示しない
  if (!adsenseClient) {
    return null;
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block' }}
      data-ad-client={adsenseClient}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive="true"
    />
  );
}
