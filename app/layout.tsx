import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'xtrade',
  description: 'X (Twitter) トレードアプリ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
