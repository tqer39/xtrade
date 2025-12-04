# 信頼スコア・トレード基盤 実装計画

- **作成日**: 2024-12-04
- **ステータス**: 実装完了
- **担当 Agent**: ArchAgent（起点）→ DBAgent, APIAgent, TestAgent

## 概要

X アカウントでログインするトレードマッチングアプリの基盤機能を実装する。
信頼スコアシステム、カード管理、マッチング、トレード機能を含む。

## 前提条件

- [x] X OAuth 認証設定済み（BetterAuth）
- [x] Neon データベース接続済み
- [x] Drizzle ORM 設定済み

## 主要機能

1. **信頼スコアシステム**: X プロフィール情報から信頼度を計算（0-100, S/A/B/C/D/U グレード）
2. **カード管理**: ユーザーが持っている/欲しいカードを登録
3. **マッチング**: 信頼スコアを考慮したトレード相手の検索
4. **トレード**: ステートマシンベースの取引管理

---

## 実装順序

### Phase 1: DB スキーマ拡張

**担当**: DBAgent

#### 追加テーブル

| テーブル | 説明 |
| --- | --- |
| `user` (拡張) | `trustScore`, `trustGrade`, `trustScoreUpdatedAt`, `trustScoreRefreshRequestedAt` |
| `user_trust_job` | 信頼スコア再計算キュー |
| `card` | カードマスター |
| `user_have_card` | ユーザーが持っているカード |
| `user_want_card` | ユーザーが欲しいカード |
| `trade` | トレード情報 |
| `trade_item` | トレードアイテム |
| `trade_history` | 状態遷移履歴 |

**成果物**:

- `src/db/schema.ts` - スキーマ拡張
- `src/db/migrations/0004_heavy_rhodey.sql` - マイグレーション

---

### Phase 2: 信頼スコア計算ロジック

**担当**: APIAgent

#### 計算アルゴリズム

| 項目 | 条件 | スコア |
| --- | --- | --- |
| アカウント年齢 | 5年以上 | +30 |
| | 2年以上 | +20 |
| | 180日以上 | +10 |
| | 30日以上 | +5 |
| | 30日未満 | -20 |
| ツイート数 | 5000以上 | +25 |
| | 1000以上 | +15 |
| | 200以上 | +5 |
| | 0 | -10 |
| フォロワー数 | 1000以上 | +20 |
| | 200以上 | +10 |
| | 50以上 | +5 |
| プロフィール画像 | あり | +10 |
| | なし | -15 |
| 自己紹介 | あり | +5 |
| 認証済み | あり | +10 |
| 鍵垢 | あり | -10 |

#### グレード分類

| グレード | スコア範囲 |
| --- | --- |
| S | 80+ |
| A | 65-79 |
| B | 50-64 |
| C | 35-49 |
| D | 0-34 |
| U | 未評価 |

**成果物**:

- `src/modules/trust/calc-trust-score.ts`
- `src/modules/trust/__tests__/calc-trust-score.test.ts`

---

### Phase 3: 信頼スコア API

**担当**: APIAgent

| エンドポイント | メソッド | 説明 |
| --- | --- | --- |
| `/api/me/trust` | GET | 現在の信頼スコア取得 |
| `/api/me/trust/recalc` | GET | 最新ジョブのステータス確認 |
| `/api/me/trust/recalc` | POST | 再計算リクエスト |

**成果物**:

- `app/api/me/trust/route.ts`
- `app/api/me/trust/recalc/route.ts`

---

### Phase 4: Cron ワーカー

**担当**: APIAgent

#### 処理フロー

1. Vercel Cron 認証チェック（`CRON_SECRET`）
2. queued ジョブを created_at 順で最大 5 件取得
3. 各ジョブを running に更新
4. X API 呼び出し
5. `calcTrustScore` でスコア計算
6. users テーブル更新、ジョブを succeeded/failed に
7. 429 エラー時は queued に戻して処理中断

**成果物**:

- `app/api/cron/trust-worker/route.ts`
- `src/modules/trust/x-api-client.ts`
- `vercel.json` - Cron 設定追加

---

### Phase 5: カード管理 API

**担当**: APIAgent

| エンドポイント | メソッド | 説明 |
| --- | --- | --- |
| `/api/cards` | GET | カードマスター検索 |
| `/api/cards` | POST | カード新規登録 |
| `/api/me/cards` | GET | 自分のカード一覧 |
| `/api/me/cards/have` | POST | 持っているカード追加/更新 |
| `/api/me/cards/want` | POST | 欲しいカード追加/更新 |
| `/api/me/cards/want` | DELETE | 欲しいカード削除 |

**成果物**:

- `src/modules/cards/service.ts`
- `app/api/cards/route.ts`
- `app/api/me/cards/route.ts`
- `app/api/me/cards/have/route.ts`
- `app/api/me/cards/want/route.ts`

---

### Phase 6: マッチング API

**担当**: APIAgent

#### マッチング条件

1. 自分の want_cards を相手が持っている
2. 相手の want_cards を自分が持っている
3. 相手の trust_grade が指定値以上

| エンドポイント | メソッド | 説明 |
| --- | --- | --- |
| `/api/matches` | GET | マッチング候補取得 |

**成果物**:

- `src/modules/matches/service.ts`
- `app/api/matches/route.ts`

---

### Phase 7: トレード API

**担当**: APIAgent

#### ステートマシン

```text
[*] --> draft
draft --> proposed
proposed --> agreed / canceled / expired
agreed --> completed / disputed / canceled
completed --> [*]
canceled --> [*]
expired --> [*]
disputed --> [*]
```

| エンドポイント | メソッド | 説明 |
| --- | --- | --- |
| `/api/trades` | POST | トレード作成 |
| `/api/trades/:roomSlug` | GET | トレード詳細 |
| `/api/trades/:roomSlug/offer` | POST | オファー更新 |
| `/api/trades/:roomSlug/propose` | POST | 提案（draft → proposed） |
| `/api/trades/:roomSlug/agree` | POST | 合意（proposed → agreed） |
| `/api/trades/:roomSlug/complete` | POST | 完了（agreed → completed） |
| `/api/trades/:roomSlug/cancel` | POST | キャンセル |
| `/api/trades/:roomSlug/dispute` | POST | 紛争（agreed → disputed） |

**成果物**:

- `src/modules/trades/state-machine.ts`
- `src/modules/trades/service.ts`
- `app/api/trades/route.ts`
- `app/api/trades/[roomSlug]/route.ts`
- `app/api/trades/[roomSlug]/*/route.ts`

---

### Phase 8: 管理者 API

**担当**: APIAgent

| エンドポイント | メソッド | 説明 |
| --- | --- | --- |
| `/api/admin/trust-queue/summary` | GET | キュー状態確認 |

**成果物**:

- `app/api/admin/trust-queue/summary/route.ts`

---

## ファイル構成

```text
src/
├── db/
│   └── schema.ts                    # 拡張
│
├── modules/
│   ├── trust/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── calc-trust-score.ts
│   │   ├── x-api-client.ts
│   │   └── __tests__/calc-trust-score.test.ts
│   │
│   ├── cards/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── service.ts
│   │
│   ├── matches/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   └── service.ts
│   │
│   └── trades/
│       ├── index.ts
│       ├── types.ts
│       ├── state-machine.ts
│       └── service.ts

app/api/
├── me/
│   ├── trust/
│   │   ├── route.ts
│   │   └── recalc/route.ts
│   └── cards/
│       ├── route.ts
│       ├── have/route.ts
│       └── want/route.ts
├── cards/route.ts
├── matches/route.ts
├── trades/
│   ├── route.ts
│   └── [roomSlug]/
│       ├── route.ts
│       ├── offer/route.ts
│       ├── propose/route.ts
│       ├── agree/route.ts
│       ├── complete/route.ts
│       ├── cancel/route.ts
│       └── dispute/route.ts
├── admin/trust-queue/summary/route.ts
└── cron/trust-worker/route.ts
```

---

## 環境変数

### 追加が必要な環境変数

| Key | 説明 |
| --- | --- |
| `CRON_SECRET` | Vercel Cron 認証用シークレット |

### BetterAuth OAuth スコープ

X API でプロフィール情報を取得するには `users.read` スコープが必要。

---

## 成功基準

1. [x] 信頼スコア計算ロジックが仕様通りに動作する
2. [x] 再計算キューが正しく動作する
3. [x] カードの登録・検索ができる
4. [x] マッチング検索が正しく動作する
5. [x] トレードのステートマシンが正しく遷移する
6. [x] すべてのテストがパスする
7. [x] lint がパスする

---

## リスクと対策

| リスク | 対策 |
| --- | --- |
| X API Rate Limit | Cron ワーカーで 429 時にジョブを再キュー、5分間隔で実行 |
| キュー肥大化 | バックプレッシャー制御（1000件以上で受付停止） |
| トレード期限切れ | ステートマシンで期限チェック |

---

## 参照

- [BetterAuth ドキュメント](https://www.better-auth.com/)
- [X API v2 ドキュメント](https://developer.twitter.com/en/docs/twitter-api)
- [docs/architecture.ja.md](../architecture.ja.md)
