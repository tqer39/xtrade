# 共通ヘッダーコンポーネントの全ページ実装 (2025/12/17)

## 概要

トップページのヘッダーレイアウトを全画面に統一実装した。

**ヘッダー構成:**

```text
[xtrade ロゴ] ─────── [ユーザー検索] [信頼性スコア] [アバター+名前] [設定⚙️] [ログアウト] [戻る(オプション)]
```

## 実装内容

### 1. 共通 Header コンポーネント作成

**新規ファイル:** `src/components/layout/header.tsx`

```tsx
interface HeaderProps {
  showBackButton?: boolean;
}
```

**機能:**

- ロゴ（ホームへのリンク）
- ユーザー検索ボタン（ログイン時）
- 信頼性スコアリンク（ログイン時）
- UserMenu（アバター、設定、ログアウト）
- オプションで戻るボタン
- UserSearchModal を内包

### 2. 各ページのヘッダー置換

| ページ | ファイル | 変更 |
| --- | --- | --- |
| トップページ | `app/_components/home-page-client.tsx` | 独自ヘッダー → `<Header />` |
| 設定 | `app/settings/page.tsx` | 独自ヘッダー → `<Header showBackButton />` |
| ユーザープロフィール | `app/users/[userId]/_components/user-profile-client.tsx` | 独自ヘッダー → `<Header showBackButton />` |
| アイテム詳細 | `app/items/[itemId]/page.tsx` | 独自ヘッダー → `<Header showBackButton />` |
| トレードルーム | `app/trades/[roomSlug]/page.tsx` | 独自ヘッダー → `<Header showBackButton />` |
| 管理画面 | `app/admin/users/page.tsx` | ヘッダーなし → `<Header showBackButton />` |

## 変更ファイル一覧

### 新規作成

- `src/components/layout/header.tsx`

### 修正

- `src/components/layout/index.ts` - Header エクスポート追加
- `app/_components/home-page-client.tsx` - Header 使用、UserSearchModal 削除
- `app/settings/page.tsx` - Header 使用
- `app/users/[userId]/_components/user-profile-client.tsx` - Header 使用
- `app/items/[itemId]/page.tsx` - Header 使用
- `app/trades/[roomSlug]/page.tsx` - Header 使用
- `app/admin/users/page.tsx` - Header 追加

## 結果

- 全ページで統一されたヘッダーが表示される
- ユーザー検索と信頼性スコアリンクが全ページで利用可能
- 戻るボタンは必要なページのみ表示
