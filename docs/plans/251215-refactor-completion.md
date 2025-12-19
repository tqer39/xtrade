# リファクタリング完了計画: card -> item 用語変更

## 概要

カード関連の用語をアイテムに変更するリファクタリングの完成と、関連する改善タスクの実装。

## 背景

- xtrade はトレカ交換だけでなく、汎用的なアイテム交換プラットフォームを目指している
- 「カード」という用語を「アイテム」に統一することで、より汎用性の高いプラットフォームを実現する

## 完了したタスク

### 1. package.json のバージョン固定

**変更内容:**

- 13 パッケージの `^` プレフィックスを削除
- バージョンを完全固定化

**対象パッケージ:**

- `@aws-sdk/client-s3`
- `@radix-ui/react-tooltip`
- `@react-email/components`
- `date-fns`
- `disposable-email-domains`
- `lucide-react`
- `next`
- `react` / `react-dom`
- `recharts`
- `resend`
- `stripe`
- `swr`
- `uuid` / `@types/uuid`
- `drizzle-kit`

### 2. テスト失敗の修正

**修正内容:**

- `login-button.test.tsx`: `usePathname`/`useSearchParams` モック追加
- `item-owner-list.test.tsx`: `useRouter` モック追加、テキスト変更対応
- `user-menu.test.tsx`: ナビゲーションモック追加
- `home-page-client.test.tsx`: `useViewPreference`/`useDebounce` モック追加
- `review-form.test.tsx`:「取引」→「トレード」テキスト変更対応
- `data.test.ts`: シードデータ件数更新（3→31 users, 26→127 cards）

### 3. main ブランチへの rebase

**実施内容:**

- 47 コミットを main にリベース
- package.json/package-lock.json のコンフリクト解消
- バージョン固定を維持

### 4. 「欲しいもの」タブの grid/list 実装

**ファイル:** `app/users/[userId]/_components/user-profile-client.tsx`

**実装内容:**

- 検索クエリ状態 (`wantSearchQuery`) の追加
- フィルタリングロジック (`filteredWantCards`) の実装
- 検索ボックスの追加
- `ViewToggle` コンポーネントによる表示切り替え
- Grid/List ビューの条件付きレンダリング

### 5. N+1 問題の修正

**修正ファイル:**

| ファイル | 関数 | 修正内容 |
| -------- | ---- | -------- |
| `src/modules/trades/service.ts` | `getUserTrades` | ループ内クエリ → バッチ取得 + Map |
| `src/modules/cards/service.ts` | `getCardOwnersWithWantCards` | Promise.all + map → バッチ取得 + Map |
| `src/modules/matches/service.ts` | `findMatches` | ループ内クエリ → バッチ取得 + Map |

**パフォーマンス改善:**

- Before: N 件のデータに対して 2N 回のクエリ
- After: 固定 2-3 回のクエリ（データ量に依存しない）

## テスト結果

- 全 710 テストがパス
- ビルド成功

## 関連ファイル変更一覧

### リネーム済みファイル

```text
app/_components/card-* -> app/_components/item-*
app/__tests__/card-* -> app/__tests__/item-*
src/hooks/use-card-* -> src/hooks/use-item-*
src/hooks/__tests__/use-card-* -> src/hooks/__tests__/use-item-*
```

### 修正済みファイル

- `package.json` - バージョン固定
- `app/users/[userId]/_components/user-profile-client.tsx` - 欲しいもの検索/表示
- `src/modules/trades/service.ts` - N+1 修正
- `src/modules/cards/service.ts` - N+1 修正
- `src/modules/matches/service.ts` - N+1 修正
- `src/modules/matches/__tests__/service.test.ts` - バッチクエリ対応

## 今後の課題

- [ ] UI/UX の追加改善
- [ ] パフォーマンスモニタリングの導入
- [ ] E2E テストの拡充
