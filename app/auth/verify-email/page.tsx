import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VerifyEmailPageProps {
  searchParams: Promise<{
    error?: string;
  }>;
}

/**
 * メール認証完了ページ
 *
 * BetterAuth からリダイレクトされる
 * - 成功時: /auth/verify-email
 * - 失敗時: /auth/verify-email?error=xxx
 */
export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const error = params.error;
  const isSuccess = !error;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isSuccess ? (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">認証完了</CardTitle>
              <CardDescription>
                メールアドレスの認証が完了しました。
                <br />
                信頼スコアが向上しました。
              </CardDescription>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">認証に失敗しました</CardTitle>
              <CardDescription>{getErrorMessage(error)}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/">ホームに戻る</Link>
          </Button>
          {!isSuccess && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/settings">設定ページで再送信</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

/**
 * エラーメッセージを取得
 */
function getErrorMessage(error?: string): string {
  switch (error) {
    case 'INVALID_TOKEN':
      return '認証リンクが無効です。もう一度お試しください。';
    case 'TOKEN_EXPIRED':
      return '認証リンクの有効期限が切れています。設定ページから再送信してください。';
    case 'USER_NOT_FOUND':
      return 'ユーザーが見つかりません。';
    default:
      return 'メールアドレスの認証に失敗しました。もう一度お試しください。';
  }
}
