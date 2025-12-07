import type { Metadata } from 'next';
import { AdSenseScript } from '@/components/ads';
import './globals.css';

export const metadata: Metadata = {
  title: 'xtrade',
  description: 'X (Twitter) トレードアプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
        <AdSenseScript />
      </body>
    </html>
  );
}
