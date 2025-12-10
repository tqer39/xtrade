'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

export default function TermsPage() {
  const [lang, setLang] = useState<'ja' | 'en'>('ja');

  return (
    <div className="container max-w-3xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{lang === 'ja' ? '利用規約' : 'Terms of Service'}</h1>
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

      {lang === 'ja' ? <TermsJa /> : <TermsEn />}
    </div>
  );
}

function TermsJa() {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <p className="text-muted-foreground">最終更新日: 2025年12月7日</p>

      <h2>第1条（適用）</h2>
      <p>
        本利用規約（以下「本規約」）は、xtrade（以下「本サービス」）の利用に関する条件を定めるものです。
        ユーザーは本規約に同意の上、本サービスを利用するものとします。
      </p>

      <h2>第2条（定義）</h2>
      <p>本規約において使用する用語の定義は以下の通りです。</p>
      <ul>
        <li>「ユーザー」とは、本サービスを利用する全ての方を指します。</li>
        <li>「コンテンツ」とは、ユーザーが本サービス上で投稿・登録したデータを指します。</li>
      </ul>

      <h2>第3条（利用料金）</h2>
      <p>
        本サービスは、無料プランと有料プラン（Basic、Premium）を提供しています。
        有料プランの料金は以下の通りです。
      </p>
      <ul>
        <li>Basic プラン: 月額200円（税込）</li>
        <li>Premium プラン: 月額400円（税込）</li>
      </ul>
      <p>
        有料プランは月額自動更新となります。
        解約はいつでも可能で、解約後は次回更新日まで有料プランの機能をご利用いただけます。
      </p>

      <h2>第4条（禁止事項）</h2>
      <p>ユーザーは、以下の行為を行ってはなりません。</p>
      <ul>
        <li>法令または公序良俗に違反する行為</li>
        <li>犯罪行為に関連する行為</li>
        <li>他のユーザーまたは第三者の権利を侵害する行為</li>
        <li>本サービスの運営を妨害する行為</li>
        <li>不正アクセス、なりすまし行為</li>
        <li>虚偽の情報を登録する行為</li>
      </ul>

      <h2>第5条（サービスの変更・停止）</h2>
      <p>
        当社は、ユーザーに事前通知することなく、本サービスの内容を変更、
        または提供を中止することができるものとします。
      </p>

      <h2>第6条（免責事項）</h2>
      <p>
        当社は、本サービスに関して、ユーザー間のトラブルや損害について一切責任を負いません。
        トレードはユーザー同士の自己責任で行っていただくものとします。
      </p>

      <h2>第7条（個人情報の取り扱い）</h2>
      <p>
        当社は、本サービスの利用によって取得する個人情報を、
        当社のプライバシーポリシーに従い適切に取り扱います。
      </p>

      <h2>第8条（規約の変更）</h2>
      <p>
        当社は、必要に応じて本規約を変更できるものとします。
        変更後の規約は、本サービス上に掲載した時点から効力を生じるものとします。
      </p>

      <h2>第9条（準拠法・管轄裁判所）</h2>
      <p>
        本規約の解釈は日本法に準拠するものとし、本サービスに関する紛争は、
        東京地方裁判所を第一審の専属的合意管轄裁判所とします。
      </p>
    </div>
  );
}

function TermsEn() {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <p className="text-muted-foreground">Last updated: December 7, 2025</p>

      <h2>Article 1 (Application)</h2>
      <p>
        These Terms of Service (hereinafter referred to as &quot;Terms&quot;) set forth the
        conditions for use of xtrade (hereinafter referred to as &quot;Service&quot;). Users shall
        use the Service upon agreeing to these Terms.
      </p>

      <h2>Article 2 (Definitions)</h2>
      <p>The definitions of terms used in these Terms are as follows:</p>
      <ul>
        <li>&quot;User&quot; refers to all persons who use this Service.</li>
        <li>&quot;Content&quot; refers to data posted or registered by users on this Service.</li>
      </ul>

      <h2>Article 3 (Fees)</h2>
      <p>
        This Service offers a free plan and paid plans (Basic, Premium). The fees for paid plans are
        as follows:
      </p>
      <ul>
        <li>Basic Plan: 200 JPY per month (tax included)</li>
        <li>Premium Plan: 400 JPY per month (tax included)</li>
      </ul>
      <p>
        Paid plans are automatically renewed monthly. You may cancel at any time, and you will
        continue to have access to paid features until the next renewal date.
      </p>

      <h2>Article 4 (Prohibited Activities)</h2>
      <p>Users shall not engage in the following activities:</p>
      <ul>
        <li>Activities that violate laws or public order</li>
        <li>Activities related to criminal acts</li>
        <li>Activities that infringe on the rights of other users or third parties</li>
        <li>Activities that interfere with the operation of this Service</li>
        <li>Unauthorized access or impersonation</li>
        <li>Registering false information</li>
      </ul>

      <h2>Article 5 (Changes to Service)</h2>
      <p>We may change or discontinue the content of this Service without prior notice to users.</p>

      <h2>Article 6 (Disclaimer)</h2>
      <p>
        We assume no responsibility for any disputes or damages between users regarding this
        Service. Trades are conducted at the users&apos; own risk.
      </p>

      <h2>Article 7 (Handling of Personal Information)</h2>
      <p>
        We will handle personal information obtained through the use of this Service appropriately
        in accordance with our Privacy Policy.
      </p>

      <h2>Article 8 (Changes to Terms)</h2>
      <p>
        We may change these Terms as necessary. The revised Terms shall take effect from the time
        they are posted on this Service.
      </p>

      <h2>Article 9 (Governing Law and Jurisdiction)</h2>
      <p>
        These Terms shall be governed by Japanese law, and any disputes related to this Service
        shall be subject to the exclusive jurisdiction of the Tokyo District Court as the court of
        first instance.
      </p>
    </div>
  );
}
