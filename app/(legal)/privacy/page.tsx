import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'プライバシーポリシー | xtrade',
  description: 'xtrade のプライバシーポリシー',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-block text-sm"
        >
          ← ホームに戻る
        </Link>

        <h1 className="mb-8 text-3xl font-bold">プライバシーポリシー</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">最終更新日: 2025年12月7日</p>

          <section>
            <h2 className="text-xl font-semibold">1. はじめに</h2>
            <p>
              xtrade（以下「当サービス」）は、ユーザーのプライバシーを尊重し、個人情報の保護に努めます。
              本プライバシーポリシーでは、当サービスが収集する情報、その利用方法、およびユーザーの権利について説明します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. 収集する情報</h2>
            <h3 className="text-lg font-medium">2.1 X (Twitter) アカウント情報</h3>
            <p>X OAuth を通じて以下の情報を取得します:</p>
            <ul className="list-disc pl-6">
              <li>ユーザー ID</li>
              <li>ユーザー名（@ハンドル）</li>
              <li>表示名</li>
              <li>プロフィール画像 URL</li>
            </ul>

            <h3 className="text-lg font-medium">2.2 サービス利用データ</h3>
            <ul className="list-disc pl-6">
              <li>登録したカード情報</li>
              <li>取引履歴</li>
              <li>お気に入り情報</li>
            </ul>

            <h3 className="text-lg font-medium">2.3 技術的情報</h3>
            <ul className="list-disc pl-6">
              <li>IP アドレス</li>
              <li>ブラウザ情報</li>
              <li>アクセスログ</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. 情報の利用目的</h2>
            <ul className="list-disc pl-6">
              <li>サービスの提供・運営</li>
              <li>ユーザー認証</li>
              <li>取引のマッチング</li>
              <li>サービスの改善</li>
              <li>不正利用の防止</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. 広告について</h2>
            <p>
              当サービスでは、サービス運営のため第三者配信の広告サービス（Google AdSense
              等）を利用する場合があります。
            </p>
            <p>
              これらの広告配信事業者は、ユーザーの興味に応じた広告を表示するために Cookie
              を使用することがあります。
            </p>
            <p>
              Cookie を無効にする方法や Google AdSense に関する詳細は、
              <a
                href="https://policies.google.com/technologies/ads?hl=ja"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google 広告に関するポリシー
              </a>
              をご確認ください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. 情報の共有</h2>
            <p>当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません:</p>
            <ul className="list-disc pl-6">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>サービス提供に必要な業務委託先への提供</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. データの保管</h2>
            <p>ユーザーデータは、適切なセキュリティ対策を講じた上で保管されます。</p>
            <p>アカウントを削除した場合、関連するデータは合理的な期間内に削除されます。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. ユーザーの権利</h2>
            <p>ユーザーは以下の権利を有します:</p>
            <ul className="list-disc pl-6">
              <li>自己の情報へのアクセス</li>
              <li>情報の訂正・削除の要求</li>
              <li>アカウントの削除</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. お問い合わせ</h2>
            <p>プライバシーに関するお問い合わせは、X (Twitter) の DM にてご連絡ください。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. 変更について</h2>
            <p>
              本プライバシーポリシーは、必要に応じて変更されることがあります。
              重要な変更がある場合は、サービス内でお知らせします。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
