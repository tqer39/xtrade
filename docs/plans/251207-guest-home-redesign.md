# ログイン前ホーム画面リデザイン

- **作成日**: 2025-12-07
- **ステータス**: 実装完了
- **担当 Agent**: UIAgent

## 概要

ログイン前のユーザーでもカード検索と所有者確認ができるようにホーム画面をリデザインする。

## 前提条件

- [x] Listing Feature（カード出品画面）実装済み
- [x] 信頼スコアシステム実装済み
- [x] お気に入り機能の基盤実装済み

## 実装したユーザーストーリー

1. ログインしていなくてもカード検索ができる
2. デフォルトで最新登録カードが表示される
3. 検索結果にカードを持っているユーザー一覧が表示される
4. 各ユーザーに信頼スコア（S/A/B/C/D/U）が表示される
5. お気に入りは localStorage に保存、ログイン後に DB 同期
6. 「カードを出品する」ボタンは X ログインに遷移
7. 課金プランの案内 UI を表示（実装は後回し）

## 後回し

- 実際の課金処理
- 取引申し込み機能の実装
- 取引回数のカウント・制限
- 取引方法（郵送/手渡し等）の表示

---

## ファイル構成

```text
app/
├── api/cards/
│   ├── latest/route.ts              # 最新カード一覧 API（認証不要）
│   └── [cardId]/owners/route.ts     # カード所有者一覧 API（認証不要）
└── _components/
    ├── home-page-client.tsx         # メイン Client Component
    ├── card-owner-list.tsx          # カード所有者一覧 UI
    └── pricing-notice.tsx           # 課金案内 UI（スタブ）

src/
├── hooks/
│   ├── use-latest-cards.ts          # 最新カード取得 hook
│   ├── use-card-owners.ts           # カード所有者一覧取得 hook
│   └── use-favorites.ts             # localStorage 対応
└── modules/cards/
    ├── service.ts                   # getLatestCards, getCardOwners 追加
    └── types.ts                     # CardOwner 型追加
```

---

## API 仕様

### GET /api/cards/latest

最新登録カードを取得する（認証不要）。

| パラメーター | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| limit | number | 20 | 取得件数（最大100） |

### GET /api/cards/[cardId]/owners

カードを持っているユーザー一覧を取得する（認証不要）。

---

## コンポーネント

### CardOwnerList

カード所有者一覧を表示するコンポーネント。

| Prop | 型 | 説明 |
| --- | --- | --- |
| cardId | string | カードID |
| onBack | () => void | 戻るボタンのコールバック |
| isLoggedIn | boolean | ログイン状態 |

### PricingNotice

課金プランの案内 UI（スタブ）。

| Prop | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| tradeCount | number | 0 | 今月の取引回数 |

---

## localStorage お気に入り機能

### 動作仕様

1. **ゲスト時**
   - カード/ユーザーのお気に入りを localStorage に保存
   - キー: `xtrade_favorite_cards`, `xtrade_favorite_users`
   - 値: JSON 配列（ID のみ）

2. **ログイン時**
   - localStorage から読み込み → DB に同期
   - 同期完了後に localStorage をクリア
   - 以降は DB のみを使用

3. **ログアウト時**
   - DB のデータは保持
   - 新たなゲスト操作は localStorage に保存

---

## 実装順序

1. [x] API 作成（`/api/cards/latest`, `/api/cards/[cardId]/owners`）
2. [x] サービス関数追加（`getLatestCards`, `getCardOwners`）
3. [x] 型定義追加（`CardOwner`）
4. [x] 最新カード表示 hook（`use-latest-cards.ts`）
5. [x] カード所有者取得 hook（`use-card-owners.ts`）
6. [x] カード所有者一覧 UI（`card-owner-list.tsx`）
7. [x] home-page-client.tsx 更新（デフォルト表示）
8. [x] localStorage お気に入り対応（`use-favorites.ts`）
9. [x] 課金案内 UI（`pricing-notice.tsx`）

---

## テスト観点

- [x] カードをクリックすると所有者一覧が表示される
- [x] 所有者に信頼スコアバッジが表示される
- [x] ゲストのお気に入りが localStorage に保存される
- [ ] ログイン後に localStorage から DB へ同期される（OAuth 認証が必要なため手動確認）
- [ ] 同期後に localStorage がクリアされる（OAuth 認証が必要なため手動確認）

E2E テストは `e2e/guest-home.spec.ts` に追加済み

## 関連ドキュメント

- `docs/plans/251205-listing-feature.md` - Listing Feature 実装計画
- `docs/plans/251204-trust-score-trade-system.md` - 信頼スコアシステム
