import { and, eq, gte } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { db } from '@/db/drizzle';
import * as schema from '@/db/schema';
import { auth } from '@/lib/auth';
import { isDisposableEmail, verifyRecaptcha } from '@/modules/email';

/**
 * レート制限: 1時間に3回まで
 */
const RATE_LIMIT_WINDOW_HOURS = 1;
const RATE_LIMIT_MAX_REQUESTS = 3;

/**
 * POST: メールアドレス認証メールを送信
 *
 * リクエストボディ:
 * - email: 認証するメールアドレス
 * - recaptchaToken: reCAPTCHA v3 トークン
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, recaptchaToken } = body as {
      email?: string;
      recaptchaToken?: string;
    };

    // メールアドレスのバリデーション
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'メールアドレスは必須です' }, { status: 400 });
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '無効なメールアドレス形式です' }, { status: 400 });
    }

    // 使い捨てメールチェック
    const disposableCheck = isDisposableEmail(email);
    if (!disposableCheck.valid) {
      return NextResponse.json({ error: disposableCheck.error }, { status: 400 });
    }

    // reCAPTCHA 検証
    const recaptchaResult = await verifyRecaptcha(recaptchaToken || '', 'send_verification_email');
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: recaptchaResult.error || 'reCAPTCHA 検証に失敗しました' },
        { status: 400 }
      );
    }

    // 既に認証済みかチェック
    const users = await db
      .select({
        email: schema.user.email,
        emailVerified: schema.user.emailVerified,
      })
      .from(schema.user)
      .where(eq(schema.user.id, session.user.id))
      .limit(1);

    const user = users[0];
    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    if (user.emailVerified && user.email === email) {
      return NextResponse.json({ error: 'このメールアドレスは既に認証済みです' }, { status: 400 });
    }

    // レート制限チェック
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000);
    const recentVerifications = await db
      .select()
      .from(schema.verification)
      .where(
        and(
          eq(schema.verification.identifier, email),
          gte(schema.verification.createdAt, windowStart)
        )
      );

    if (recentVerifications.length >= RATE_LIMIT_MAX_REQUESTS) {
      return NextResponse.json(
        {
          error: `認証メールの送信は${RATE_LIMIT_WINDOW_HOURS}時間に${RATE_LIMIT_MAX_REQUESTS}回までです。しばらくお待ちください。`,
        },
        { status: 429 }
      );
    }

    // メールアドレスを更新（未認証状態で）
    await db
      .update(schema.user)
      .set({
        email: email,
        emailVerified: false,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, session.user.id));

    // BetterAuth の sendVerificationEmail を呼び出す
    const result = await auth.api.sendVerificationEmail({
      body: {
        email: email,
      },
      headers: await headers(),
    });

    if (!result) {
      return NextResponse.json({ error: '認証メールの送信に失敗しました' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: '認証メールを送信しました。メールをご確認ください。',
    });
  } catch (error) {
    console.error('[API] Error sending verification email:', error);
    return NextResponse.json({ error: '認証メールの送信に失敗しました' }, { status: 500 });
  }
}
