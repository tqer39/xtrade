# カード検索・一覧画面の改善計画

## 概要

カード一覧系画面を改善し、「探したいものがすぐに見つかる」体験を実現する。

## 要件

1. **ビュー切り替え**: リスト（テキスト重視）とグリッド（Instagram風、画像重視）の2種類
2. **デフォルトはグリッド表示**
3. **検索結果のソート**: 和名マッチ + 信頼スコアが高いユーザーの出品が上位
4. **モーダルをやめてページに変更**: 操作性向上のため

## 対象画面

| 画面 | グリッド/リスト切替 | 信頼スコアソート |
| ------ | :------------------: | :---------------: |
| カード検索ページ（新規） | ✅ | ✅ |
| 自分の欲しいカード一覧 | ✅ | ✅ (※1) |
| 自分の持っているカード一覧 | ✅ | - |
| セット一覧 | ✅ | - |

**※1 欲しいカード一覧の信頼スコア機能:**

- カード一覧を「信頼できる出品者がいる順」でソート
- カードをクリック → そのカードを持つユーザー一覧を信頼スコア順で表示

---

## Phase 1: 基盤作成 ✅

### 1.1 ビュー設定フック（新規）

**ファイル**: `src/hooks/use-view-preference.ts`

```typescript
// localStorage で永続化
// デフォルト: 'grid'
// SSRハイドレーション対策込み
```

### 1.2 ビュー切り替えボタン（新規）

**ファイル**: `src/components/view-toggle.tsx`

- lucide-react の `LayoutGrid` / `List` アイコン使用
- アクティブ状態の視覚的フィードバック

### 1.3 グリッド用カードアイテム（新規）

**ファイル**: `app/listing/_components/card-grid-item.tsx`

- アスペクト比 1:1 の正方形
- 画像が全面（`object-cover`）
- ホバー時にオーバーレイでカード名表示
- 信頼スコアバッジ（対応画面のみ）

---

## Phase 2: カード検索ページ化 ✅

### 2.1 検索ページ作成（新規）

**ファイル**: `app/cards/search/page.tsx`

- 検索入力（デバウンス 300ms）
- フィルター（グループ、メンバー、シリーズ）
- ビュー切り替えボタン
- グリッド/リスト表示
- 信頼スコア順ソート対応

### 2.2 既存モーダルからの移行

**修正ファイル**: `app/listing/_components/listing-page-client.tsx`

- 「カードを追加」ボタンのリンク先を検索ページに変更
- モーダルの呼び出しを削除

### 2.3 モーダル削除（将来的に）

**ファイル**: `app/listing/_components/card-search-modal.tsx`

- 検索ページが安定したら削除

---

## Phase 3: マイカード一覧のビュー切替 ✅

### 3.1 リストページクライアント修正

**修正ファイル**: `app/listing/_components/listing-page-client.tsx`

- タブヘッダーにビュー切り替えボタン追加
- 「持っているカード」タブ: グリッド/リスト切替
- 「欲しいカード」タブ: グリッド/リスト切替 + 信頼スコアソート
- 「セット」タブ: グリッド/リスト切替

### 3.2 カードリストアイテム調整

**修正ファイル**: `app/listing/_components/card-list-item.tsx`

- リスト表示時のレイアウト最適化
- 信頼スコア表示対応（欲しいカード用）

---

## Phase 4: バックエンドソート機能 ✅

### 4.1 フォトカード検索サービス拡張 ✅

**修正ファイル**: `src/modules/photocard/service.ts`

```typescript
// ソートロジック
// 1. 和名完全一致: +100
// 2. 和名前方一致: +50
// 3. 和名部分一致: +25
// 4. 読み/正規化名マッチ: +10
```

### 4.2 検索API拡張 ✅

**修正ファイル**: `app/api/photocards/search/route.ts`

- `sortBy` パラメーター追加（`name` | `relevance`）
- デフォルト: `relevance`

### 4.3 出品者情報付き検索API（新規） ✅

**ファイル**: `app/api/cards/search-with-owners/route.ts`

- カード + 所有ユーザー + 信頼スコアを返す
- 信頼スコア降順ソート

**追加ファイル**: `app/api/cards/[cardId]/owners/route.ts`

- 特定カードの所有者一覧を信頼スコア順で取得

---

## Phase 5: フロントエンド統合 ✅

### 5.1 検索フック拡張 ✅

**修正ファイル**: `src/hooks/use-photocard-search.ts`

- `sortBy` オプション追加

### 5.2 カード所有者フック（新規） ✅

**ファイル**: `src/hooks/use-card-owners.ts`

- 特定カードの所有者を信頼スコア順で取得

---

## 修正ファイル一覧

### 新規作成

- `src/hooks/use-view-preference.ts` ✅
- `src/components/view-toggle.tsx` ✅
- `app/listing/_components/card-grid-item.tsx` ✅
- `app/cards/search/page.tsx` ✅
- `app/api/cards/search-with-owners/route.ts` ✅
- `app/api/cards/[cardId]/owners/route.ts` ✅
- `src/hooks/use-card-owners.ts` ✅

### 修正

- `app/listing/_components/listing-page-client.tsx` ✅
- `app/listing/_components/card-list-item.tsx`
- `src/modules/photocard/service.ts` ✅
- `app/api/photocards/search/route.ts` ✅
- `src/hooks/use-photocard-search.ts` ✅

### 削除（Phase 2完了後）

- `app/listing/_components/card-search-modal.tsx`

---

## 技術的考慮点

### パフォーマンス

- 画像の遅延読み込み（`loading="lazy"`）
- 50件制限のため仮想スクロールは不要

### レスポンシブ

- モバイル: 3カラム
- タブレット: 4カラム
- デスクトップ: 5カラム

### SSRハイドレーション対策

- `use-view-preference.ts` で `mounted` 状態管理
- サーバー側はデフォルト値でレンダリング

---

## 実装優先順位

1. **Phase 1**: 基盤（フック、コンポーネント）✅
2. **Phase 2**: カード検索ページ化（モーダル廃止）✅
3. **Phase 3**: マイカード一覧のビュー切替 ✅
4. **Phase 4-5**: ソート機能 ✅

全Phase完了。
