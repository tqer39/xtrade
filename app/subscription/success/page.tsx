'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubscriptionSuccessPage() {
  return (
    <div className="container max-w-lg py-12">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">ご登録ありがとうございます</CardTitle>
          <CardDescription className="text-base">
            サブスクリプションが正常に開始されました
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            プレミアム機能をお楽しみください。 サブスクリプションの管理はいつでも行えます。
          </p>
          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/listing">カードを出品する</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/subscription">サブスクリプションを管理</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
