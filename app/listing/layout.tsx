import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'カード出品 | xtrade',
  description: '持っているカード・欲しいカードを管理',
}

export default function ListingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
