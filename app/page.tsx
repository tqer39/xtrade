import { UserMenu } from '@/components/auth'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-bold">xtrade</h1>
      <p className="text-muted-foreground">X (Twitter) トレードアプリ</p>
      <UserMenu />
    </main>
  )
}
