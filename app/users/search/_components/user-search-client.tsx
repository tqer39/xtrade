'use client';

import { Search, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { LoginButton } from '@/components/auth';
import { TrustBadge } from '@/components/trust';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';
import type { TrustGrade } from '@/modules/trust';

interface SearchUser {
  id: string;
  name: string;
  twitterUsername: string | null;
  image: string | null;
  trustScore: number | null;
  trustGrade: TrustGrade | null;
}

export function UserSearchClient() {
  const { data: session, isPending: isSessionPending } = useSession();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error('検索に失敗しました');
      }
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (isSessionPending) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">ユーザー検索</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">ホームに戻る</Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">ユーザー検索を利用するにはログインが必要です</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ユーザー検索</h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">ホームに戻る</Link>
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="名前またはTwitterユーザー名で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="max-w-md"
        />
        <Button onClick={handleSearch} disabled={isLoading || !query.trim()} className="gap-2">
          <Search className="h-4 w-4" />
          検索
        </Button>
      </div>

      {error && (
        <div className="text-center py-8">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={handleSearch}>再検索</Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : hasSearched && users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          該当するユーザーが見つかりませんでした
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserListItem key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserListItem({ user }: { user: SearchUser }) {
  return (
    <Link href={`/users/${user.id}`}>
      <Card className="p-4 hover:bg-accent transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{user.name}</span>
              <TrustBadge grade={user.trustGrade} size="sm" />
            </div>
            {user.twitterUsername && (
              <p className="text-sm text-muted-foreground truncate">@{user.twitterUsername}</p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
