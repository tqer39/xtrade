export const metadata = {
  title: '特定商取引法に基づく表記 | xtrade',
  description: '特定商取引法に基づく表記',
};

export default function SctaPage() {
  return (
    <div className="container max-w-3xl py-12">
      <h1 className="text-3xl font-bold mb-8">特定商取引法に基づく表記</h1>

      <div className="prose prose-sm max-w-none dark:prose-invert">
        <table className="w-full">
          <tbody>
            <tr>
              <th className="text-left py-3 pr-4 border-b w-1/3">販売業者</th>
              <td className="py-3 border-b">
                {/* TODO: 事業者名を設定 */}
                [事業者名]
              </td>
            </tr>
            <tr>
              <th className="text-left py-3 pr-4 border-b">運営責任者</th>
              <td className="py-3 border-b">
                {/* TODO: 責任者名を設定 */}
                [運営責任者名]
              </td>
            </tr>
            <tr>
              <th className="text-left py-3 pr-4 border-b">所在地</th>
              <td className="py-3 border-b">
                {/* TODO: 住所を設定 */}
                [住所]
              </td>
            </tr>
            <tr>
              <th className="text-left py-3 pr-4 border-b">連絡先</th>
              <td className="py-3 border-b">
                {/* TODO: メールアドレスを設定 */}
                メール: [メールアドレス]
                <br />
                <span className="text-sm text-muted-foreground">
                  ※ お問い合わせはメールにてお願いいたします
                </span>
              </td>
            </tr>
            <tr>
              <th className="text-left py-3 pr-4 border-b">販売価格</th>
              <td className="py-3 border-b">
                <ul className="list-none p-0 m-0">
                  <li>Basic プラン: 月額200円（税込）</li>
                  <li>Premium プラン: 月額400円（税込）</li>
                </ul>
              </td>
            </tr>
            <tr>
              <th className="text-left py-3 pr-4 border-b">支払方法</th>
              <td className="py-3 border-b">
                クレジットカード決済（Stripe）
                <br />
                <span className="text-sm text-muted-foreground">
                  Visa、Mastercard、American Express、JCB に対応
                </span>
              </td>
            </tr>
            <tr>
              <th className="text-left py-3 pr-4 border-b">支払時期</th>
              <td className="py-3 border-b">
                サブスクリプション開始時および毎月の更新日に自動課金
              </td>
            </tr>
            <tr>
              <th className="text-left py-3 pr-4 border-b">サービス提供時期</th>
              <td className="py-3 border-b">決済完了後、即時利用可能</td>
            </tr>
            <tr>
              <th className="text-left py-3 pr-4 border-b">返品・キャンセル</th>
              <td className="py-3 border-b">
                <p className="m-0 mb-2">
                  デジタルサービスの性質上、ご購入後の返金には原則対応しておりません。
                </p>
                <p className="m-0 mb-2">
                  サブスクリプションはいつでもキャンセル可能です。
                  キャンセル後も、現在の請求期間終了までサービスをご利用いただけます。
                </p>
                <p className="m-0 text-sm text-muted-foreground">
                  ※ システム障害等、当社に起因する問題が発生した場合は個別に対応いたします
                </p>
              </td>
            </tr>
            <tr>
              <th className="text-left py-3 pr-4 border-b">動作環境</th>
              <td className="py-3 border-b">
                <ul className="list-none p-0 m-0">
                  <li>推奨ブラウザ: Chrome、Firefox、Safari、Edge の最新版</li>
                  <li>インターネット接続環境</li>
                  <li>X (Twitter) アカウント</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
