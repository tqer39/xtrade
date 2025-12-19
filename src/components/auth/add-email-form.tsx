'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AddEmailFormProps {
  /** 現在のメールアドレス */
  currentEmail?: string;
  /** メール認証済みかどうか */
  emailVerified?: boolean;
  /** reCAPTCHA サイトキー */
  recaptchaSiteKey?: string;
}

/**
 * メールアドレス追加・認証フォーム
 * 認証済みでもメールアドレスの変更が可能
 */
export function AddEmailForm({
  currentEmail,
  emailVerified = false,
  recaptchaSiteKey,
}: AddEmailFormProps) {
  const [email, setEmail] = useState(currentEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(!emailVerified);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // reCAPTCHA トークンを取得（設定されている場合）
      let recaptchaToken = '';
      if (recaptchaSiteKey && typeof window !== 'undefined' && window.grecaptcha) {
        try {
          recaptchaToken = await window.grecaptcha.execute(recaptchaSiteKey, {
            action: 'send_verification_email',
          });
        } catch {
          console.warn('reCAPTCHA token acquisition failed, continuing without it');
        }
      }

      const response = await fetch('/api/me/email/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || '送信に失敗しました' });
        return;
      }

      setMessage({
        type: 'success',
        text: '認証メールを送信しました。メールをご確認ください。',
      });
    } catch {
      setMessage({ type: 'error', text: 'エラーが発生しました。もう一度お試しください。' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">メールアドレス認証</CardTitle>
          {emailVerified ? (
            <Badge variant="default" className="bg-green-500">
              認証済み
            </Badge>
          ) : (
            <Badge variant="secondary">未認証</Badge>
          )}
        </div>
        <CardDescription>メールアドレスを認証すると、信頼スコアが向上します。</CardDescription>
      </CardHeader>
      <CardContent>
        {emailVerified && !isEditing ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>
                登録済みメールアドレス: <strong>{currentEmail}</strong>
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(true);
                setMessage(null);
              }}
              className="w-full"
            >
              メールアドレスを変更する
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              {emailVerified && (
                <p className="text-xs text-muted-foreground">
                  現在の認証済みアドレス: {currentEmail}
                </p>
              )}
            </div>

            {message && (
              <div
                className={`text-sm p-3 rounded-md ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-2">
              {emailVerified && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEmail(currentEmail || '');
                    setMessage(null);
                  }}
                  className="flex-1"
                >
                  キャンセル
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading || !email}
                className={emailVerified ? 'flex-1' : 'w-full'}
              >
                {isLoading
                  ? '送信中...'
                  : emailVerified
                    ? '新しいアドレスに認証メールを送信'
                    : '認証メールを送信'}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              認証メールは1時間に3回まで送信できます。
              {emailVerified && '新しいアドレスで認証すると、以前の認証は無効になります。'}
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// reCAPTCHA の型定義
declare global {
  interface Window {
    grecaptcha: {
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      ready: (callback: () => void) => void;
    };
  }
}
