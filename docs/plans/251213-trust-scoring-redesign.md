# 信頼性スコアリングシステム再設計

## 概要

信頼性スコアリングを3軸評価（Twitter、トータル取引、直近取引）に再設計し、レーダーチャート・折れ線グラフで可視化する。

## 実装日

2024-12-13

## 背景

従来の信頼性スコアリングシステムは xProfile、behavior、review の3要素で構成されていたが、より直感的で取引に特化した評価軸への変更が求められた。

## 新しい評価軸

| 軸                   | 配点    | 評価項目                                           |
| -------------------- | ------- | -------------------------------------------------- |
| Twitter アカウント   | 0-40点  | アカウント年齢、フォロワー数、投稿頻度、認証バッジ |
| トータル取引         | 0-40点  | 成約率、取引総数、トラブル率、平均評価             |
| 直近取引             | 0-20点  | 直近10件の成約率、平均評価、トラブル率             |

### グレード判定

| グレード | スコア範囲 |
| -------- | ---------- |
| S        | 90+        |
| A        | 75-89      |
| B        | 60-74      |
| C        | 45-59      |
| D        | 30-44      |
| E        | 0-29       |

## 変更内容

### 1. DBスキーマ変更

- `user` テーブルに新フィールド追加:
  - `twitterScore` (0-40)
  - `totalTradeScore` (0-40)
  - `recentTradeScore` (0-20)

- 新規テーブル `trust_score_history`:
  - スコア履歴の保持（折れ線グラフ用）
  - カラム: `id`, `userId`, `trustScore`, `twitterScore` 等

### 2. スコア計算ロジック

新しい関数群を `src/modules/trust/calc-trust-score.ts` に追加:

- `calcTwitterScore()`: Twitter アカウントスコア計算
- `calcTotalTradeScore()`: トータル取引スコア計算
- `calcRecentTradeScore()`: 直近取引スコア計算
- `calcNewTrustScore()`: 3軸統合スコア計算

### 3. グラフライブラリ導入

**recharts** と **date-fns** をインストール:

```bash
npm install recharts date-fns
```

### 4. 新規コンポーネント

- `src/components/trust/trust-radar-chart.tsx`
  - レーダーチャートで3軸スコアを可視化
  - 各軸を100点満点に正規化して表示

- `src/components/trust/trust-history-chart.tsx`
  - 折れ線グラフでスコア推移を表示
  - 総合スコア、Twitter、取引実績、直近取引の4系列

### 5. UI実装

#### カード一覧での出品者スコア表示

- `app/_components/home-page-client.tsx` 変更
- カード作成者のアバターと信頼性バッジを表示
- グリッド表示：左上に小さいアバター + バッジ
- リスト表示：右側にアバター + バッジ（スコア付き）

#### ユーザープロフィールでのサマリ表示

- `app/users/[userId]/_components/user-profile-client.tsx` 変更
- 名前の横に TrustBadge を表示
- 詳細画面へのリンクを追加

#### 信頼性スコア詳細画面

- `app/users/[userId]/trust/page.tsx` 新規作成
- レーダーチャート（3軸スコア分布）
- スコアバー（各軸の詳細）
- 取引統計（完了数、成功率、平均評価、レビュー数）
- スコア推移グラフ（履歴）

### 6. API更新

`app/api/users/[userId]/trust/route.ts` 更新:

- 新3軸スコア（`newBreakdown`）を追加
- スコア履歴（`history`）を追加（最新30件）
- 旧スコア（`breakdown`）は後方互換性のため維持

## ファイル一覧

### 変更

- `src/db/schema.ts`
- `src/modules/trust/types.ts`
- `src/modules/trust/calc-trust-score.ts`
- `src/modules/cards/types.ts`
- `src/modules/cards/service.ts`
- `src/modules/cards/index.ts`
- `src/hooks/use-latest-cards.ts`
- `app/api/cards/latest/route.ts`
- `app/api/users/[userId]/trust/route.ts`
- `app/_components/home-page-client.tsx`
- `app/users/[userId]/_components/user-profile-client.tsx`

### 新規作成

- `src/components/trust/trust-radar-chart.tsx`
- `src/components/trust/trust-history-chart.tsx`
- `app/users/[userId]/trust/page.tsx`
- `docs/plans/251213-trust-scoring-redesign.md`

## 今後の課題

1. スコア自動計算バッチの実装
2. スコア履歴の定期記録
3. 旧スコアフィールドの廃止タイミング検討
4. モバイル表示の最適化
