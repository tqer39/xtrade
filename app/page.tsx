import { UserMenu } from '@/components/auth'

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
      }}
    >
      <h1 style={{ fontSize: '48px', margin: 0 }}>xtrade</h1>
      <p style={{ color: '#666', margin: 0 }}>X (Twitter) トレードアプリ</p>
      <UserMenu />
    </main>
  )
}
