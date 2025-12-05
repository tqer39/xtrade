# Listing Feature（カード出品画面）実装計画

- **作成日**: 2025-12-05
- **ステータス**: 実装完了（MVP）
- **担当 Agent**: ArchAgent（起点）→ UIAgent

## 概要

ユーザーが自分のカードを管理できる出品ページをMVPとして実装する。

## 前提条件

- [x] X OAuth認証設定済み（BetterAuth）
- [x] カード管理API実装済み
- [x] shadcn/ui設定済み（new-yorkスタイル）

## スコープ（MVP）

**実装する:**

- 自分の「持っているカード」「欲しいカード」一覧表示
- カードマスターデータから検索して追加
- 新規カード登録（全ユーザー可）

**後回し:**

- 数量・優先度の編集
- カード削除
- 重複カード対策
- セット登録機能
- カテゴリの整理・正規化

---

## ファイル構成

```text
app/listing/
├── page.tsx                          # Server Component シェル
├── layout.tsx                        # メタデータ
└── _components/
    ├── listing-page-client.tsx       # メイン Client Component
    ├── card-list-item.tsx            # カードリストアイテム
    └── card-search-modal.tsx         # カード検索・追加モーダル

src/
├── components/ui/
│   ├── input.tsx                     # shadcn/ui 追加
│   ├── label.tsx                     # shadcn/ui 追加
│   ├── tabs.tsx                      # shadcn/ui 追加
│   ├── card.tsx                      # shadcn/ui 追加
│   ├── dialog.tsx                    # shadcn/ui 追加
│   ├── badge.tsx                     # shadcn/ui 追加
│   └── skeleton.tsx                  # shadcn/ui 追加
└── hooks/
    ├── use-my-cards.ts               # カード一覧取得フック
    └── use-card-search.ts            # カード検索フック
```

---

## 実装手順

### Step 1: shadcn/ui コンポーネント追加

```bash
npx shadcn@latest add input label tabs card dialog badge skeleton
```

### Step 2: カスタムフック作成

**`src/hooks/use-my-cards.ts`**

- `GET /api/me/cards` でデータ取得
- `haveCards`, `wantCards` を返す
- ローディング・エラー状態管理
- `addHaveCard()`, `addWantCard()` 関数

**`src/hooks/use-card-search.ts`**

- `GET /api/cards?q=` で検索
- デバウンス処理（300ms）
- `createCard()` で新規登録

### Step 3: Listing ページ作成

**`app/listing/layout.tsx`**

```typescript
export const metadata = {
  title: 'カード出品 | xtrade',
  description: '持っているカード・欲しいカードを管理',
}
```

**`app/listing/page.tsx`**

```typescript
import { ListingPageClient } from './_components/listing-page-client'

export default function ListingPage() {
  return <ListingPageClient />
}
```

### Step 4: ListingPageClient 実装

**責務:**

- 認証チェック（未ログインならログインボタン表示）
- タブ切り替え（持っている / 欲しい）
- 画面制御

**構造:**

```text
ListingPageClient
├── Header（ページタイトル）
├── Tabs
│   ├── HaveCards タブ
│   │   ├── 追加ボタン
│   │   └── CardListItem[]
│   └── WantCards タブ
│       ├── 追加ボタン
│       └── CardListItem[]
└── CardSearchModal
```

### Step 5: CardSearchModal 実装

**機能:**

- 検索入力（デバウンス）
- 検索結果リスト表示
- カード選択 → 追加（POST /api/me/cards/have or want）
- 「新しいカードを登録」フォーム
  - 名前（必須）
  - カテゴリ（自由入力、必須）
  - レアリティ（任意）
  - → POST /api/cardsで作成後、自動追加

### Step 6: ホームからのリンク追加

**`app/page.tsx`**

- Listingページへのリンクを追加

---

## 既存ファイル参照

| ファイル | 参照目的 |
| --- | --- |
| `src/components/ui/button.tsx` | UI パターン |
| `src/components/auth/user-menu.tsx` | 認証状態の扱い |
| `app/admin/users/page.tsx` | フォーム・fetch パターン |
| `src/modules/cards/service.ts` | API の仕様確認 |
| `src/modules/cards/types.ts` | 型定義 |

---

## API 使用

| API | 用途 |
| --- | --- |
| `GET /api/me/cards` | 自分のカード一覧取得 |
| `POST /api/me/cards/have` | 持っているカード追加 |
| `POST /api/me/cards/want` | 欲しいカード追加 |
| `GET /api/cards?q=&category=` | カード検索 |
| `POST /api/cards` | 新規カード登録 |

---

## 完了条件

- [x] `/listing` でカード一覧が表示される
- [x] タブで「持っている」「欲しい」を切り替えられる
- [x] 画面でカード検索・追加ができる
- [x] 新規カード登録ができる
- [x] 未ログイン時はログインボタンが表示される
- [x] `just lint` が通る
- [x] 基本的なテストが通る
- [x] 持っているカードの数量を +/- で変更できる
- [x] 欲しいカードの優先度を変更できる
- [x] カードを削除できる（確認画面付き）

---

## 将来の課題（MVP 外）

1. **カード重複対策**: 同一商品の検出・マージ機能
2. **セット登録**: 複数カードを1アイテムとして登録
3. **カテゴリ整理**: 固定リスト化orサジェスト機能
4. **事前登録データ**: トレーディングカード上位100件の初期データ投入
5. **編集・削除機能**: 数量変更、優先度変更、削除
6. **画像アップロード機能**: クリップボード貼り付け・ファイルアップロード対応
   - 対応形式: PNG, JPEG, WebP
   - ファイルサイズ上限: 要検討（例: 2MB）
   - ストレージ候補:
     - Vercel Blob（Vercel統合、シンプル）
     - CloudFlare R2（S3互換、エグレス無料）
     - AWS S3 + CloudFront
   - コスト比較・調査が必要
7. **分類体系の拡張**: アーティスト、商品名、バージョン、店舗特典、カード種類などのフィールド追加（実際のトレカ交換文化に合わせた分類）

---

## 参照

- [信頼スコア・トレード基盤 計画](./251204-trust-score-trade-system.md)
- [アーキテクチャ設計書](../architecture.ja.md)
