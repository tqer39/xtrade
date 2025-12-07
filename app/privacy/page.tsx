'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');

  return (
    <div className="container max-w-3xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
          {lang === 'ja' ? 'プライバシーポリシー' : 'Privacy Policy'}
        </h1>
        <div className="flex gap-2">
          <Button
            variant={lang === 'ja' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLang('ja')}
          >
            日本語
          </Button>
          <Button
            variant={lang === 'en' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLang('en')}
          >
            English
          </Button>
        </div>
      </div>

      {lang === 'ja' ? <PrivacyJa /> : <PrivacyEn />}
    </div>
  );
}

function PrivacyJa() {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <p className="text-muted-foreground">最終更新日: 2025年12月7日</p>

      <h2>1. 収集する情報</h2>
      <p>当社は、本サービスの提供にあたり、以下の情報を収集します。</p>
      <ul>
        <li>X (Twitter) アカウント情報（ユーザー名、プロフィール画像、メールアドレス）</li>
        <li>本サービス上で登録された情報（カード情報、トレード履歴）</li>
        <li>決済情報（Stripe を通じて処理、当社はカード番号を保持しません）</li>
        <li>アクセスログ（IP アドレス、ブラウザ情報）</li>
      </ul>

      <h2>2. 情報の利用目的</h2>
      <p>収集した情報は、以下の目的で利用します。</p>
      <ul>
        <li>本サービスの提供・運営</li>
        <li>ユーザー認証</li>
        <li>決済処理</li>
        <li>カスタマーサポート</li>
        <li>サービスの改善・新機能の開発</li>
        <li>利用規約違反の調査</li>
      </ul>

      <h2>3. 情報の共有</h2>
      <p>当社は、以下の場合を除き、個人情報を第三者に提供しません。</p>
      <ul>
        <li>ユーザーの同意がある場合</li>
        <li>法令に基づく場合</li>
        <li>サービス提供に必要な業務委託先（Stripe、Vercel 等）</li>
      </ul>

      <h2>4. セキュリティ</h2>
      <p>
        当社は、個人情報の漏洩、紛失、改ざんを防止するため、 適切なセキュリティ対策を講じています。
        決済情報は PCI DSS に準拠した Stripe を通じて処理されます。
      </p>

      <h2>5. Cookie の使用</h2>
      <p>
        本サービスは、セッション管理のために Cookie を使用しています。 ブラウザの設定で Cookie
        を無効にすることができますが、 一部の機能が利用できなくなる場合があります。
      </p>

      <h2>6. お問い合わせ</h2>
      <p>
        プライバシーに関するお問い合わせは、 本サービス内のお問い合わせフォームよりご連絡ください。
      </p>

      <h2>7. 改定</h2>
      <p>
        当社は、必要に応じて本ポリシーを改定することがあります。
        重要な変更がある場合は、本サービス上でお知らせします。
      </p>
    </div>
  );
}

function PrivacyEn() {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <p className="text-muted-foreground">Last updated: December 7, 2025</p>

      <h2>1. Information We Collect</h2>
      <p>We collect the following information in providing this Service:</p>
      <ul>
        <li>X (Twitter) account information (username, profile image, email address)</li>
        <li>Information registered on this Service (card information, trade history)</li>
        <li>Payment information (processed through Stripe; we do not store card numbers)</li>
        <li>Access logs (IP address, browser information)</li>
      </ul>

      <h2>2. Purpose of Use</h2>
      <p>The collected information is used for the following purposes:</p>
      <ul>
        <li>Providing and operating this Service</li>
        <li>User authentication</li>
        <li>Payment processing</li>
        <li>Customer support</li>
        <li>Service improvement and new feature development</li>
        <li>Investigation of terms of service violations</li>
      </ul>

      <h2>3. Information Sharing</h2>
      <p>We do not provide personal information to third parties except in the following cases:</p>
      <ul>
        <li>With user consent</li>
        <li>When required by law</li>
        <li>Service providers necessary for service delivery (Stripe, Vercel, etc.)</li>
      </ul>

      <h2>4. Security</h2>
      <p>
        We implement appropriate security measures to prevent leakage, loss, or alteration of
        personal information. Payment information is processed through Stripe, which is PCI DSS
        compliant.
      </p>

      <h2>5. Use of Cookies</h2>
      <p>
        This Service uses cookies for session management. You can disable cookies in your browser
        settings, but some features may become unavailable.
      </p>

      <h2>6. Contact</h2>
      <p>
        For privacy-related inquiries, please contact us through the inquiry form within this
        Service.
      </p>

      <h2>7. Amendments</h2>
      <p>
        We may revise this Policy as necessary. We will notify users of significant changes on this
        Service.
      </p>
    </div>
  );
}
