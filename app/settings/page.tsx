'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

import { AddEmailForm } from '@/components/auth/add-email-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useSession } from '@/lib/auth-client';

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // email_verified=true のクエリパラメータがある場合、成功メッセージを表示
  useEffect(() => {
    if (searchParams.get('email_verified') === 'true') {
      setShowSuccessMessage(true);
      // URL からクエリパラメータを削除
      router.replace('/settings', { scroll: false });
    }
  }, [searchParams, router]);

  // ローディング中
  if (isPending) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // 未ログインの場合はホームにリダイレクト
  if (!session?.user) {
    router.push('/');
    return null;
  }

  const user = session.user;

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      {/* ヘッダー */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
          xtrade
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">設定</h1>

      {/* メール認証成功メッセージ */}
      {showSuccessMessage && (
        <div className="mb-6 p-4 rounded-md bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
          メールアドレスの認証が完了しました。信頼スコアが向上しました。
        </div>
      )}

      {/* メールアドレス認証セクション */}
      <AddEmailForm
        currentEmail={user.email}
        emailVerified={user.emailVerified}
        recaptchaSiteKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-8 px-4 max-w-2xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
