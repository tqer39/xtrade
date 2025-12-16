# UI改善計画 (2025/12/16)

## 概要

ユーザーからの8項目のUI改善要求に対する実装計画。

## 対象ファイル

| ファイル                                                  | 変更内容                                      |
| --------------------------------------------------------- | --------------------------------------------- |
| `app/_components/home-page-client.tsx`                    | 検索クエリのURL反映                           |
| `app/users/[userId]/trust/page.tsx`                       | Twitterリンク表示改善、ユーザー名クリック遷移 |
| `app/users/[userId]/_components/user-profile-client.tsx`  | タブの条件付き表示                            |
| `app/trades/[roomSlug]/page.tsx`                          | 更新日追加、アイテム画像表示改善、余白調整    |

---

## 1. アイテム検索クエリのURL反映

**ファイル**: `app/_components/home-page-client.tsx`

**現状**: 検索クエリはコンポーネント内のstateで管理されている。

**変更内容**:

- 検索入力時に `?q=キーワード` をURLに反映
- 複数キーワード対応: `?q=INI&q=尾崎` 形式
- `encodeURIComponent()` でURLエンコード
- ページ読み込み時にURLパラメーターから検索クエリを復元

---

## 2. 信頼性スコア詳細画面のTwitterリンク改善

**ファイル**: `app/users/[userId]/trust/page.tsx`

**現状** (行236-244):

```tsx
{userData.twitterUsername && (
  <p className="text-muted-foreground">
    @{userData.twitterUsername}
  </p>
)}
```

**変更内容**:

- Twitter IDの左側にTwitterアイコン (`<Twitter />`) を追加
- 右側に「のプロフィールを見る」テキストを追加
- `user-profile-client.tsx` の実装を参考にリンク化

**変更後**:

```tsx
{userData.twitterUsername && (
  <a
    href={`https://x.com/${userData.twitterUsername}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
  >
    <Twitter className="w-4 h-4" />
    @{userData.twitterUsername} のプロフィールを見る
  </a>
)}
```

---

## 3. 信頼性スコア詳細画面のユーザー遷移

**ファイル**: `app/users/[userId]/trust/page.tsx`

**現状**: ユーザー名とアバターはクリック不可。

**変更内容**:

- アバター画像とユーザー名を `<Link href={/users/${userId}}>` でラップ
- ホバー時のカーソルとスタイル追加

---

## 4. 他ユーザーのトレード中・成約済タブ非表示

**ファイル**: `app/users/[userId]/_components/user-profile-client.tsx`

**現状** (行563-569):

```tsx
<TabsTrigger value="activeTrades">
  トレード中 ({activeTrades.filter((t) => t.status !== 'draft').length})
</TabsTrigger>
<TabsTrigger value="completedTrades">
  成約済 ({completedTrades.length})
</TabsTrigger>
```

**変更内容**:

- `isOwnProfile` 条件を追加して自分以外のプロフィールでは非表示に

**変更後**:

```tsx
{isOwnProfile && (
  <>
    <TabsTrigger value="activeTrades">
      トレード中 ({activeTrades.filter((t) => t.status !== 'draft').length})
    </TabsTrigger>
    <TabsTrigger value="completedTrades">
      成約済 ({completedTrades.length})
    </TabsTrigger>
  </>
)}
```

---

## 5. トレードルームに更新日追加

**ファイル**: `app/trades/[roomSlug]/page.tsx`

**現状** (行656-658): 作成日のみ表示。

**変更内容**:

- `trade.updatedAt` を追加表示
- 「更新日: YYYY/MM/DD」形式

---

## 6. トレードルームのアイテム画像表示改善

**ファイル**: `app/trades/[roomSlug]/page.tsx`

**現状** (行419-435): テキストとアイコンのみ表示。

**変更内容**:

- アイテムの画像サムネイル表示 (h-16 w-16 程度)
- `<Link href={/items/${item.cardId}}>` でラップしてクリック遷移可能に
- ホバースタイル追加

---

## 7. トレードルームの信頼性スコアとTwitter IDの余白調整

**ファイル**: `app/trades/[roomSlug]/page.tsx`

**現状** (行390-410): スコアバッジとTwitter IDが近い。

**変更内容**:

- `gap-1` → `gap-2` または `gap-3` に変更
- 必要に応じて `mt-1` 等のマージン追加

---

## 実装順序

1. 信頼性スコア詳細画面の改善 (項目2, 3)
2. ユーザープロフィールのタブ非表示 (項目4)
3. トレードルームの改善 (項目5, 6, 7)
4. 検索クエリのURL反映 (項目1)

## 実装完了

### 変更ファイル一覧

| ファイル                                                 | 変更内容                                                                           |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `app/_components/home-page-client.tsx`                   | 検索クエリのURL反映（`?q=INI&q=尾崎` 形式）                                        |
| `app/users/[userId]/trust/page.tsx`                      | Twitterアイコン追加、「のプロフィールを見る」表示、ユーザー名/アバタークリック遷移 |
| `app/users/[userId]/_components/user-profile-client.tsx` | 他ユーザープロフィールで「トレード中」「成約済」タブ非表示                         |
| `app/trades/[roomSlug]/page.tsx`                         | 更新日追加、アイテム画像表示(16x16)、クリック遷移、余白調整                        |
| `src/modules/trades/service.ts`                          | `cardImageUrl`をクエリに追加                                                       |
| `src/modules/trades/types.ts`                            | `TradeItem`型に`cardImageUrl`追加                                                  |

## テスト確認項目

- [x] 信頼性スコア詳細画面でTwitterリンクが正しく表示される
- [x] ユーザー名/アバタークリックでプロフィールに遷移
- [x] 他ユーザーのプロフィールでトレード中・成約済タブが非表示
- [x] トレードルームに更新日が表示される
- [x] トレードルームのアイテム画像が大きく表示される
- [x] アイテムクリックで詳細画面に遷移
- [x] 検索クエリがURLに反映される
