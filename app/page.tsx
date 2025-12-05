import { Heart } from 'lucide-react';
import Link from 'next/link';
import { UserMenu } from '@/components/auth';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-bold">xtrade</h1>
      <p className="text-muted-foreground">X (Twitter) トレードアプリ</p>
      <UserMenu />
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/listing">カードを出品する</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/favorites">
            <Heart className="h-4 w-4 mr-2" />
            お気に入り
          </Link>
        </Button>
      </div>
    </main>
  );
}
