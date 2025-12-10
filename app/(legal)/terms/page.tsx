import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '利用規約 | xtrade',
  description: 'xtrade の利用規約',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground mb-8 inline-block text-sm"
        >
          ← ホームに戻る
        </Link>

        <h1 className="mb-8 text-3xl font-bold">利用規約</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">最終更新日: 2025年12月7日</p>

          <section>
            <h2 className="text-xl font-semibold">第1条（適用）</h2>
            <p>
              本規約は、xtrade（以下「当サービス」）の利用に関する条件を定めるものです。
              ユーザーは、本規約に同意した上で当サービスを利用するものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第2条（定義）</h2>
            <ul className="list-disc pl-6">
              <li>「ユーザー」とは、当サービスを利用するすべての個人を指します</li>
              <li>「コンテンツ」とは、ユーザーが当サービスに登録した情報を指します</li>
              <li>「取引」とは、ユーザー間でのカード交換を指します</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第3条（アカウント）</h2>
            <ol className="list-decimal pl-6">
              <li>当サービスの利用には X (Twitter) アカウントでのログインが必要です</li>
              <li>ユーザーは、自己のアカウントを適切に管理する責任を負います</li>
              <li>アカウントの第三者への貸与・譲渡は禁止します</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第4条（禁止事項）</h2>
            <p>ユーザーは、以下の行為を行ってはなりません:</p>
            <ul className="list-disc pl-6">
              <li>法令または公序良俗に反する行為</li>
              <li>他のユーザーへの迷惑行為、嫌がらせ</li>
              <li>虚偽の情報の登録</li>
              <li>取引における詐欺行為</li>
              <li>当サービスの運営を妨害する行為</li>
              <li>不正アクセス、クローリング等の技術的な攻撃</li>
              <li>当サービスの信用を毀損する行為</li>
              <li>その他、運営者が不適切と判断する行為</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第5条（取引について）</h2>
            <ol className="list-decimal pl-6">
              <li>当サービスは、ユーザー間の取引を仲介するプラットフォームを提供します</li>
              <li>取引はユーザー間の自己責任において行われます</li>
              <li>当サービスは、取引に関するトラブルについて一切の責任を負いません</li>
              <li>取引の成立・不成立に関わらず、当サービスは仲介手数料を請求する場合があります</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第6条（信頼スコア）</h2>
            <ol className="list-decimal pl-6">
              <li>当サービスは、取引履歴等に基づきユーザーの信頼スコアを算出します</li>
              <li>信頼スコアは参考情報であり、取引の安全性を保証するものではありません</li>
              <li>信頼スコアの算出方法は予告なく変更される場合があります</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第7条（広告）</h2>
            <ol className="list-decimal pl-6">
              <li>当サービスは、サービス内に広告を表示する場合があります</li>
              <li>広告の内容は、当サービスの推奨を意味するものではありません</li>
              <li>広告に関するトラブルは、広告主との間で解決するものとします</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第8条（知的財産権）</h2>
            <ol className="list-decimal pl-6">
              <li>当サービスに関する知的財産権は、運営者または正当な権利者に帰属します</li>
              <li>ユーザーが登録したコンテンツの著作権は、ユーザーに帰属します</li>
              <li>
                ユーザーは、運営者に対し、コンテンツをサービス提供に必要な範囲で利用することを許諾します
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第9条（免責事項）</h2>
            <ol className="list-decimal pl-6">
              <li>当サービスは「現状有姿」で提供され、いかなる保証も行いません</li>
              <li>当サービスの利用により生じた損害について、運営者は責任を負いません</li>
              <li>サービスの中断、終了により生じた損害についても同様とします</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第10条（サービスの変更・終了）</h2>
            <ol className="list-decimal pl-6">
              <li>運営者は、予告なくサービス内容を変更することがあります</li>
              <li>運営者は、1ヶ月前の予告をもってサービスを終了することがあります</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第11条（アカウントの停止・削除）</h2>
            <p>運営者は、以下の場合にユーザーのアカウントを停止または削除することがあります:</p>
            <ul className="list-disc pl-6">
              <li>本規約に違反した場合</li>
              <li>不正行為が確認された場合</li>
              <li>長期間の利用がない場合</li>
              <li>その他、運営者が必要と判断した場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第12条（規約の変更）</h2>
            <ol className="list-decimal pl-6">
              <li>運営者は、必要に応じて本規約を変更することがあります</li>
              <li>変更後の規約は、サービス内での掲示をもって効力を生じます</li>
              <li>変更後のサービス利用をもって、変更に同意したものとみなします</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第13条（準拠法・管轄）</h2>
            <ol className="list-decimal pl-6">
              <li>本規約は日本法に準拠します</li>
              <li>紛争が生じた場合は、東京地方裁判所を第一審の専属的合意管轄裁判所とします</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold">第14条（お問い合わせ）</h2>
            <p>本規約に関するお問い合わせは、X (Twitter) の DM にてご連絡ください。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
