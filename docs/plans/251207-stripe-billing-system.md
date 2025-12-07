# Stripe 課金システム実装計画

- **作成日**: 2025-12-07
- **ステータス**: 実装中
- **担当 Agent**: ArchAgent（起点）→ DBAgent → APIAgent → UIAgent → DocAgent → SecurityAgent

## 概要

xtrade に Stripe を用いた課金システムを導入する。Free / Basic / Premium の3段階料金プラン（月額、日本円決済）を実装し、Terraform でインフラリソースを管理する。

## 料金プラン

| プラン | 月額（税込） | 機能 |
| --- | --- | --- |
| Free | 0円 | 基本機能（マッチング閲覧制限あり） |
| Basic | 200円 | 中級機能（マッチング制限緩和） |
| Premium | 400円 | 全機能解放（無制限マッチング、優先表示、詳細統計） |

## 前提条件

- [x] X OAuth 認証設定済み（BetterAuth 1.4.5）
- [x] Neon データベース接続済み（Drizzle ORM）
- [x] Terraform インフラ管理設定済み（CloudFlare, Neon, Vercel）
- [ ] Stripe アカウント作成（dev/prod 用）
- [ ] Stripe API キー取得

---

## 実装順序

### Phase 1: Terraform Stripe モジュール作成

**担当**: ArchAgent

**新規ファイル:**

- `infra/terraform/modules/stripe/main.tf`
- `infra/terraform/modules/stripe/variables.tf`
- `infra/terraform/modules/stripe/outputs.tf`
- `infra/terraform/modules/stripe/versions.tf`
- `infra/terraform/envs/dev/billing/main.tf`
- `infra/terraform/envs/dev/billing/provider.tf`

**変更ファイル:**

- `infra/terraform/config.yml` - Stripe 設定追加

**リソース:**

- `stripe_product` - Basic / Premium 商品定義
- `stripe_price` - 各プランの価格定義（200円、400円）
- `stripe_webhook_endpoint` - Webhook エンドポイント

**Provider**: `lukasaron/stripe` >= 3.4.1

---

### Phase 2: DB スキーマ追加

**担当**: DBAgent

**変更ファイル:** `src/db/schema.ts`

**追加テーブル:**

| テーブル | 説明 |
| --- | --- |
| `stripe_customer` | ユーザーと Stripe Customer の紐付け |
| `subscription` | サブスクリプション状態管理 |
| `payment_event` | Webhook イベント記録（冪等性・監査ログ） |

**user テーブル拡張:**

- `subscriptionStatus` (free/active/canceled/past_due)
- `subscriptionPlan` (free/basic/premium)

---

### Phase 3: サブスクリプション API 実装

**担当**: APIAgent

**新規ファイル:**

- `src/lib/stripe.ts` - Stripe クライアント設定
- `src/modules/subscription/service.ts` - サブスクリプションサービス
- `src/modules/subscription/webhook-handlers.ts` - Webhook ハンドラ
- `app/api/stripe/webhook/route.ts` - Webhook 受信
- `app/api/subscription/route.ts` - サブスクリプション取得
- `app/api/subscription/checkout/route.ts` - Checkout Session 作成
- `app/api/subscription/portal/route.ts` - カスタマーポータル
- `app/api/subscription/cancel/route.ts` - キャンセル処理

**主要機能:**

- Stripe Customer 作成/取得
- Checkout Session 作成（Basic/Premium 選択）
- Webhook イベント処理（subscription.created/updated/deleted, invoice.paid/failed）
- カスタマーポータルセッション作成

---

### Phase 4: UI 実装

**担当**: UIAgent

**新規ファイル:**

- `app/pricing/page.tsx` - 料金プランページ
- `app/pricing/_components/plan-card.tsx` - プランカード
- `app/subscription/page.tsx` - サブスクリプション管理
- `app/subscription/success/page.tsx` - 契約完了ページ
- `app/terms/page.tsx` - 利用規約（日本語/英語切替）
- `app/privacy/page.tsx` - プライバシーポリシー
- `app/legal/scta/page.tsx` - 特定商取引法に基づく表記
- `src/components/subscription/plan-badge.tsx` - プランバッジ
- `src/hooks/use-subscription.ts` - サブスクリプション状態フック

---

### Phase 5: 利用規約・法的ドキュメント作成

**担当**: DocAgent

**新規ファイル:**

- `docs/legal/terms-of-service.ja.md` - 利用規約（日本語）
- `docs/legal/terms-of-service.en.md` - 利用規約（英語）
- `docs/legal/privacy-policy.ja.md` - プライバシーポリシー（日本語）
- `docs/legal/privacy-policy.en.md` - プライバシーポリシー（英語）
- `docs/legal/scta.ja.md` - 特商法表記（事業者情報はプレースホルダー）

**必須記載事項:**

- サービス概要、利用料金、自動更新・解約ポリシー
- 禁止事項、免責事項、個人情報の取り扱い
- 特商法：販売業者名、所在地、連絡先、支払方法、返品ポリシー

---

### Phase 6: セキュリティ実装

**担当**: SecurityAgent

**実装内容:**

1. **Webhook 署名検証** - `stripe.webhooks.constructEvent()` で署名検証必須
2. **環境変数管理** - `.env.example` に Stripe 関連変数追加
3. **PCI コンプライアンス** - Stripe Checkout 使用（SAQ-A 準拠）
4. **認証チェック** - サブスクリプション API は認証必須

**環境変数:**

```text
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_BASIC_PRICE_ID
STRIPE_PREMIUM_PRICE_ID
```

---

## 依存関係

```text
Phase 1 (Terraform) ─┬─> Phase 3 (API) ─┬─> Phase 4 (UI)
                     │                   │
Phase 2 (DB) ────────┘                   └─> Phase 6 (Security)
                                              │
Phase 5 (Legal) ─────────────────────────────┘
```

---

## 成功基準

- [ ] Terraform で Stripe Product/Price/Webhook が作成できる
- [ ] DB マイグレーションが正常に完了する
- [ ] Stripe Checkout で Basic/Premium 契約ができる
- [ ] Webhook でステータス更新が正しく処理される
- [ ] カスタマーポータルで契約管理ができる
- [ ] 料金ページで3プランが正しく表示される
- [ ] 利用規約・特商法表記が日英で閲覧できる
- [ ] `just lint` がパスする

---

## リスクと対策

| リスク | 影響度 | 対策 |
| --- | --- | --- |
| Webhook 到達失敗 | 高 | Stripe 自動リトライ + payment_event で冪等性担保 |
| 二重課金 | 高 | Checkout Session ID でユニーク制約 |
| ステータス不整合 | 中 | Webhook ハンドラで完全同期 + 手動同期 API |
| 特商法・利用規約不備 | 中 | 法務レビュー推奨、テンプレート活用 |

---

## 決済サービス選定理由

### Stripe を採用

調査した決済サービス：

- [Stripe](https://stripe.com) - サブスクリプション機能充実、API 豊富、Terraform 対応
- [PayPal](https://paypal.com) - 国際展開に強いが、サブスクリプションの柔軟性が劣る
- [Square](https://squareup.com) - 対面販売向け、オンラインはサブ機能

**Stripe 採用理由:**

1. サブスクリプション管理機能が最も充実
2. Terraform Provider が存在（[lukasaron/stripe](https://registry.terraform.io/providers/lukasaron/stripe/latest)）
3. 日本円での決済に対応
4. Checkout/Customer Portal で PCI コンプライアンス対応が容易
5. BetterAuth との統合が容易（userId ベース）

---

## 参照

- [Stripe API ドキュメント](https://stripe.com/docs/api)
- [Stripe Terraform Provider](https://registry.terraform.io/providers/lukasaron/stripe/latest/docs)
- [特定商取引法ガイド](https://www.no-trouble.caa.go.jp/)
- `docs/architecture.ja.md`
- `docs/plans/251204-trust-score-trade-system.md` - 計画書フォーマット参照
