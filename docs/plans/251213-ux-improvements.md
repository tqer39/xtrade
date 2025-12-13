# UX改善: ログイン後リダイレクト・用語変更・画像エラー修正

## 概要

3つのUX問題を修正し、プラットフォームの方向性を「トレーディングカード専門」から「アイテム交換専用」に変更した。

## 実施日

2025-12-13

## 修正内容

### 1. DiceBear 画像エラー修正

**問題**: `api.dicebear.com` が Next.js の `images.remotePatterns` に未登録でエラーが発生した。

**対応ファイル**: `next.config.ts`

```typescript
// 追加
{
  protocol: 'https',
  hostname: 'api.dicebear.com',
  pathname: '/**',
},
```

**関連**: `cspell.json` に `dicebear`, `DiceBear` を追加した。

---

### 2. ログイン後のリダイレクト修正

**問題**: ログイン後、常にトップページ (`/`) に戻され、ログイン直前の画面に戻らない。

**原因**: `LoginButton` コンポーネントで `callbackURL: '/'` がハードコードされていた。

**対応ファイル**: `src/components/auth/login-button.tsx`

**修正内容**:

- `usePathname()` と `useSearchParams()` で現在の URL を取得
- `callbackURL` に現在のページを動的に設定
- ログイン後、元のページに戻る

```typescript
const pathname = usePathname();
const searchParams = useSearchParams();

const handleLogin = async () => {
  const currentUrl = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  await signIn.social({
    provider: 'twitter',
    callbackURL: currentUrl || '/',
  });
};
```

---

### 3. 用語変更: 「カード」→「アイテム」

**変更対象** (UIテキストのみ、変数名・ファイル名は変更不要):

#### `app/_components/home-page-client.tsx` (約10箇所)

- カードを検索 → アイテムを検索
- カードを追加・管理するにはログインが必要です → アイテムを追加・管理するにはログインが必要です
- 最近登録されたカード → 最近登録されたアイテム
- まだカードが登録されていません → まだアイテムが登録されていません
- カードを追加 → アイテムを追加
- ログインすると、持っているカードを登録・管理できます → ログインすると、持っているアイテムを登録・管理できます
- まだカードを登録していません → まだアイテムを登録していません
- ログインすると、欲しいカードを登録・管理できます → ログインすると、欲しいアイテムを登録・管理できます
- まだ欲しいカードを登録していません → まだ欲しいアイテムを登録していません

#### `app/_components/card-edit-modal.tsx` (1箇所)

- 持っているカードを編集 / 欲しいカードを編集 → 持っているアイテムを編集 / 欲しいアイテムを編集

#### `app/_components/card-owner-list.tsx` (1箇所)

- 「カードが見つかりません」→「アイテムが見つかりません」

#### `app/cards/search/page.tsx` (1箇所)

- 登録済みカード → 登録済みアイテム

---

## 変更ファイル一覧

- `next.config.ts`: DiceBear ドメイン追加
- `cspell.json`: dicebear を辞書に追加
- `src/components/auth/login-button.tsx`: リダイレクト URL を動的に設定
- `app/_components/home-page-client.tsx`: 用語変更 (約10箇所)
- `app/_components/card-edit-modal.tsx`: 用語変更 (1箇所)
- `app/_components/card-owner-list.tsx`: 用語変更 (1箇所)
- `app/cards/search/page.tsx`: 用語変更 (1箇所)

---

## 備考

- 変数名・ファイル名（`card`, `cards` など）はそのまま維持
- セット機能関連のファイルは削除予定のため対象外
- 既存のテストファイルには別途の型エラーがあるが、今回の変更とは無関係
