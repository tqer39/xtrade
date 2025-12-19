# トップページ・マイページUI改善計画 (2024-12-13)

## 概要

トップページとマイページのUIを改善する。

---

## 修正項目

### 1. トップページの「アイテムを検索」ボタン削除

**対象**: `app/_components/home-page-client.tsx`

**変更内容**:

- 未ログイン時に表示される「アイテムを検索」ボタンと説明文を削除

---

### 2. ログイン後のヘッダー表示名をTwitter IDに修正

**対象**: `src/components/auth/user-menu.tsx`

**現状**: Twitter表示名（Takeru O'oyama）が表示されている。
**変更**: Twitter ID（@tqer39）を表示する。

**原因調査**: API `/api/admin/me` から `twitterUsername` を取得しているが、取得できていない可能性がある。

---

### 3. 検索の全文検索対応

**対象**:

- `src/modules/cards/service.ts`

**変更内容**:

- 現在: `LIKE '%query%'` でカード名のみ検索
- 変更: カード名 OR カテゴリ OR 説明文で検索

---

### 4. マイページに「欲しいもの」タブ追加

**対象**: `app/users/[userId]/_components/user-profile-client.tsx`

**変更内容**:

- 「出品中」「欲しいもの」「取引中」「成約済」「レビュー」タブ構成に変更
- 「欲しいもの」: ユーザーがお気に入りしたアイテム一覧
- 「取引中」: 進行中の取引一覧
- 「成約済」: 完了した取引一覧

**API追加**:

- `/api/users/[userId]/want-cards` - ユーザーの欲しいカード一覧
- `/api/users/[userId]/trades` - ユーザーの取引一覧（既存を流用）

---

### 5. フリーテキスト設定機能

**対象**:

- DBスキーマ: `src/db/schema.ts` - userテーブルに `bio` カラム追加
- API: `/api/users/[userId]` - bio の取得・更新
- UI: マイページにフリーテキスト編集UI追加
- 表示: 画像一覧でホバー時にbioを表示

---

## 実装順序

1. トップページの「アイテムを検索」ボタン削除
2. Twitter ID表示の修正
3. 検索の全文検索対応
4. DBスキーマ更新（bio追加）・マイグレーション
5. マイページタブ追加（欲しいもの、取引中、成約済）
6. フリーテキスト機能実装
7. lint確認

---

## 対象ファイル一覧

| ファイル | 変更内容 |
| --------- | --------- |
| `app/_components/home-page-client.tsx` | 検索ボタン削除 |
| `src/components/auth/user-menu.tsx` | Twitter ID表示修正 |
| `src/modules/cards/service.ts` | 全文検索対応 |
| `src/db/schema.ts` | bio カラム追加 |
| `src/db/migrations/XXXX_add_bio.sql` | マイグレーション |
| `app/users/[userId]/_components/user-profile-client.tsx` | タブ追加、フリーテキスト編集 |
| `app/api/users/[userId]/want-cards/route.ts` | 新規API |
| `app/api/users/[userId]/route.ts` | bio取得・更新 |
