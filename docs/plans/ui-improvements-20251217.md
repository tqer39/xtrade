# UI改善・メール認証・テストカバレッジ向上計画 (2025/12/17)

## 概要

4つの改善要件に対する実装計画。

| # | 要件 | 対象ファイル | 状態 |
| --- | ------ | ------------- | ------ |
| 1 | 自分の出品でハートボタン非表示 | `app/items/[itemId]/page.tsx` | 完了 |
| 2 | 欲しいもの追加をトップページ遷移に変更 | `app/users/[userId]/_components/user-profile-client.tsx` | 完了 |
| 3 | Mailpit でローカルメール検証 | `docker-compose.yml`, `src/modules/email/` | 完了 |
| 4 | Unit Test カバレッジ向上 | `src/hooks/__tests__/`, `src/modules/` | 進行中 |

---

## 1. 自分の出品アイテムでハートボタン非表示 [完了]

**ファイル**: `app/items/[itemId]/page.tsx`

**変更内容**:

- 自分が所有者の場合、ハートボタン（お気に入り）を非表示に
- `owners.some(owner => owner.userId === currentUserId)` で判定

**変更後** (行 209-214):

```tsx
{/* お気に入りボタン - 自分が所有者でない場合のみ表示 */}
{isLoggedIn && !owners.some((owner) => owner.userId === currentUserId) && (
  <div className="absolute top-2 right-2">
    <FavoriteButton isFavorited={isFavorited} onToggle={toggleFavorite} size="lg" />
  </div>
)}
```

---

## 2. 欲しいもの追加機能の変更 [完了]

**ファイル**: `app/users/[userId]/_components/user-profile-client.tsx`

### 削除した項目

1. **State 変数**:
   - `showWantInlineSearch`
   - `wantInlineSearchQuery`
   - `isAddingWantItem`
   - `addWantItemError`
   - `useItemSearch` から取得する検索関連変数（`createCard` は維持）

2. **ハンドラー関数**:
   - `handleWantInlineSearchChange`
   - `handleAddWantItemFromSearch`
   - `handleCancelWantInlineSearch`

3. **インライン検索フォーム**:
   - 「欲しいアイテムを検索して追加」セクション全体

### 変更後のUI

```tsx
{isOwnProfile && (
  <div className="mb-4">
    <Link href="/">
      <Button className="w-full sm:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        トップページで検索して追加
      </Button>
    </Link>
  </div>
)}
```

---

## 3. Mailpit でローカルメール検証 [完了]

### 追加したファイル

1. **`docker-compose.yml`** に Mailpit サービス追加:

```yaml
mailpit:
  image: axllent/mailpit:latest
  container_name: xtrade-mailpit
  ports:
    - '8025:8025'  # Web UI
    - '1025:1025'  # SMTP
  environment:
    MP_SMTP_AUTH_ACCEPT_ANY: 1
    MP_SMTP_AUTH_ALLOW_INSECURE: 1
  restart: unless-stopped
```

1. **`src/modules/email/mailpit-client.ts`** (新規):
   - nodemailer による SMTP トランスポーター
   - `isMailpitEnabled()` - 環境変数チェック
   - `sendViaMailpit()` - Mailpit 経由でメール送信

2. **`src/modules/email/service.ts`** (修正):
   - `MAIL_PROVIDER` 環境変数で切り替え
   - `mailpit`: ローカル開発用 Mailpit
   - `resend`: 本番環境用 Resend

### 依存関係

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### 環境変数 (`.env.example`)

```bash
# メールプロバイダーの選択
MAIL_PROVIDER=resend  # mailpit or resend

# Mailpit 設定
MAILPIT_HOST=localhost
MAILPIT_PORT=1025
```

### 使用方法

1. `docker compose up -d`
2. `.env.local` に `MAIL_PROVIDER=mailpit` 設定
3. <http://localhost:8025> でメール確認

---

## 4. Unit Test カバレッジ向上 [進行中]

### 優先度

1. **高**: `src/modules/email/__tests__/service.test.ts`
   - `sendVerificationEmail` の Mailpit/Resend 切り替えテスト

2. **中**: `src/modules/trades/__tests__/service.test.ts`
   - `createTrade`, `updateTradeStatus`, `addTradeItem`

3. **低**: 既存テストの修正
   - 型エラーの解消

---

## 変更ファイル一覧

| ファイル | 変更内容 |
| --------- | --------- |
| `app/items/[itemId]/page.tsx` | 自分の出品でハートボタン非表示 |
| `app/users/[userId]/_components/user-profile-client.tsx` | インライン検索削除、トップページへのリンク追加 |
| `docker-compose.yml` | Mailpit サービス追加 |
| `src/modules/email/mailpit-client.ts` | 新規作成 |
| `src/modules/email/service.ts` | Mailpit/Resend 切り替え機能追加 |
| `.env.example` | MAIL_PROVIDER, MAILPIT_HOST, MAILPIT_PORT 追加 |
| `package.json` | nodemailer 追加 |
