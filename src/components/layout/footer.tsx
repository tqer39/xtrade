import Link from 'next/link';
import { AdUnit } from '@/components/ads';

interface FooterProps {
  /**
   * 広告を表示するかどうか
   * ログインユーザーや課金ユーザーには非表示にする場合に使用
   */
  showAd?: boolean;
  /**
   * 広告スロット ID（AdSense で発行されたもの）
   */
  adSlot?: string;
}

/**
 * サイト共通フッター
 * - プライバシーポリシー、利用規約へのリンク
 * - 広告枠（オプション）
 */
export function Footer({ showAd = true, adSlot }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-muted/30">
      {/* 広告枠 */}
      {showAd && adSlot && (
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <AdUnit slot={adSlot} format="horizontal" className="mx-auto max-w-2xl" />
        </div>
      )}

      {/* フッターリンク */}
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              利用規約
            </Link>
          </nav>
          <p>© {currentYear} xtrade</p>
        </div>
      </div>
    </footer>
  );
}
