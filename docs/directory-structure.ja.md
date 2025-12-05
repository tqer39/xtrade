# xtrade ディレクトリ構成

[🇺🇸 English](./directory-structure.md)

## 設計方針

- **Package by Feature**: ドメイン単位でモジュール分割
- **薄い DDD**: domain/app/infra の 3 層で DDD の考え方を活かす
- **MVP 最適化**: 1 人開発 + AI 協働を前提とした現実的な構成

## ディレクトリ構造

```text
xtrade/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 認証が必要なページグループ
│   │   ├── trades/
│   │   ├── rooms/
│   │   └── profile/
│   ├── api/                      # API Routes（薄い Controller）
│   │   ├── trades/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── rooms/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── messages/
│   │   │           └── route.ts
│   │   ├── reports/
│   │   │   └── route.ts
│   │   └── profiles/
│   │       └── [id]/
│   │           └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── src/
│   ├── components/               # 共通 UI コンポーネント
│   │   ├── ui/                   # shadcn/ui コンポーネント
│   │   ├── layouts/
│   │   └── features/             # 機能別コンポーネント
│   ├── db/                       # データベース
│   │   ├── schema/               # Drizzle スキーマ（ドメイン別）
│   │   │   ├── trades.ts
│   │   │   ├── rooms.ts
│   │   │   ├── messages.ts
│   │   │   ├── reports.ts
│   │   │   ├── profiles.ts
│   │   │   └── index.ts          # 全スキーマを export
│   │   ├── drizzle.ts            # DB 接続
│   │   └── migrations/           # マイグレーションファイル
│   ├── lib/                      # 共通ライブラリ
│   │   ├── auth.ts               # BetterAuth サーバー設定
│   │   ├── auth-client.ts        # BetterAuth クライアント
│   │   └── auth-guards.ts        # 認証ガード
│   └── modules/                  # ドメインモジュール（Feature 単位）
│       ├── shared/               # 共通モジュール
│       │   ├── domain/
│       │   │   ├── errors.ts     # DomainError, NotFoundError など
│       │   │   ├── types.ts      # Result<T, E> 型など
│       │   │   └── events.ts     # ドメインイベント基底型
│       │   └── utils/
│       │       ├── validation.ts
│       │       └── logger.ts
│       ├── trades/               # トレード（出品/募集）
│       │   ├── domain/
│       │   │   ├── model.ts      # Trade 型、ビジネスルール
│       │   │   ├── stateMachine.ts # 状態遷移定義
│       │   │   └── validation.ts # バリデーションルール
│       │   ├── app/
│       │   │   ├── service.ts    # ユースケース実装
│       │   │   └── dto.ts        # DTO 定義
│       │   ├── infra/
│       │   │   └── repo.ts       # Drizzle での永続化
│       │   └── index.ts          # public API
│       ├── rooms/                # 取引ルーム
│       │   ├── domain/
│       │   │   ├── model.ts
│       │   │   ├── stateMachine.ts # ルームステート管理
│       │   │   └── rules.ts      # 取引ルール
│       │   ├── app/
│       │   │   ├── service.ts
│       │   │   └── dto.ts
│       │   ├── infra/
│       │   │   └── repo.ts
│       │   └── index.ts
│       ├── messages/             # チャット
│       │   ├── domain/
│       │   │   └── model.ts
│       │   ├── app/
│       │   │   └── service.ts
│       │   ├── infra/
│       │   │   └── repo.ts
│       │   └── index.ts
│       ├── reports/              # 通報
│       │   ├── domain/
│       │   │   ├── model.ts
│       │   │   └── validation.ts
│       │   ├── app/
│       │   │   └── service.ts
│       │   ├── infra/
│       │   │   └── repo.ts
│       │   └── index.ts
│       └── profiles/             # プロフィール（X アカウント + 信頼スコア）
│           ├── domain/
│           │   ├── model.ts
│           │   └── trustScore.ts # 信頼スコア計算ロジック
│           ├── app/
│           │   └── service.ts
│           ├── infra/
│           │   └── repo.ts
│           └── index.ts
├── infra/                        # インフラストラクチャ
│   └── terraform/                # Terraform 構成
│       ├── config.yml
│       ├── modules/
│       ├── envs/
│       └── global/
├── docs/                         # ドキュメント
├── .github/                      # GitHub Actions
└── scripts/                      # 開発用スクリプト
```

## モジュール構成の詳細

### domain/ 層

**責務**: ビジネスルール、不変条件、状態遷移を担当します。

```typescript
// modules/trades/domain/model.ts
export type TradeStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'

export interface Trade {
  id: string
  title: string
  status: TradeStatus
  createdBy: string
  // ...
}

export const TradeRules = {
  canPublish: (trade: Trade): boolean => {
    return trade.status === 'DRAFT' && trade.title.length > 0
  },
  canClose: (trade: Trade, userId: string): boolean => {
    return trade.createdBy === userId && trade.status === 'PUBLISHED'
  }
}
```

**特徴**:

- Pure TypeScript（外部依存なし）
- ビジネスロジックのみ
- テストしやすい

### app/ 層

**責務**: ユースケース実装、トランザクション制御を担当します。

```typescript
// modules/trades/app/service.ts
import { TradeRepository } from '../infra/repo'
import { Trade, TradeRules } from '../domain/model'

export class TradeService {
  constructor(private repo: TradeRepository) {}

  async publishTrade(id: string, userId: string): Promise<Result<Trade>> {
    const trade = await this.repo.findById(id)
    if (!trade) return Err(new NotFoundError('Trade'))

    if (!TradeRules.canPublish(trade)) {
      return Err(new DomainError('Cannot publish this trade'))
    }

    trade.status = 'PUBLISHED'
    await this.repo.save(trade)
    return Ok(trade)
  }
}
```

**特徴**:

- ユースケースを表現
- domain と infra を繋ぐ
- トランザクション境界

### infra/ 層

**責務**: DB アクセス、外部 API 呼び出しを担当します。

```typescript
// modules/trades/infra/repo.ts
import { db } from '@/db/drizzle'
import { tradesTable } from '@/db/schema'
import { Trade } from '../domain/model'

export class TradeRepository {
  async findById(id: string): Promise<Trade | null> {
    const row = await db.query.tradesTable.findFirst({
      where: eq(tradesTable.id, id)
    })
    return row ? this.toDomain(row) : null
  }

  async save(trade: Trade): Promise<void> {
    await db.insert(tradesTable).values(this.toDb(trade))
      .onConflictDoUpdate({ target: tradesTable.id, set: this.toDb(trade) })
  }

  private toDomain(row: any): Trade { /* ... */ }
  private toDb(trade: Trade): any { /* ... */ }
}
```

**特徴**:

- Drizzle ORM を使用
- Domain モデルと DB レコードの変換
- この層は外部に export しない

### index.ts（Public API）

```typescript
// modules/trades/index.ts
export * from './domain/model'
export * from './app/service'
// infra は export しない（実装の詳細）
```

**使用例**:

```typescript
// app/api/trades/route.ts
import { TradeService } from '@/modules/trades'

export async function POST(req: Request) {
  const service = new TradeService(/* ... */)
  const result = await service.publishTrade(id, userId)
  // ...
}
```

## 依存関係のルール

```text
app/api/          →  modules/*/app/
                       ↓
modules/*/app/    →  modules/*/domain/
                  →  modules/*/infra/
                       ↓
modules/*/infra/  →  modules/*/domain/
                  →  src/db/
```

**禁止事項**:

- `domain/` から `app/` や `infra/` への依存
- `infra/` から `app/` への依存
- モジュール間の直接依存（`trades/` から `rooms/` など）
  - 必要な場合は `app/service.ts` 経由で呼び出す

## ステートマシンの実装例

```typescript
// modules/rooms/domain/stateMachine.ts
export type RoomStatus =
  | 'NEGOTIATING'   // 交渉中
  | 'TRADING'       // 取引中
  | 'COMPLETED'     // 完了
  | 'CANCELLED'     // キャンセル
  | 'DISPUTED'      // 紛争中

type Transition = {
  from: RoomStatus
  to: RoomStatus
  condition?: (room: Room) => boolean
}

const transitions: Transition[] = [
  { from: 'NEGOTIATING', to: 'TRADING' },
  { from: 'NEGOTIATING', to: 'CANCELLED' },
  { from: 'TRADING', to: 'COMPLETED' },
  { from: 'TRADING', to: 'DISPUTED' },
  { from: 'DISPUTED', to: 'COMPLETED' },
  { from: 'DISPUTED', to: 'CANCELLED' },
]

export function canTransition(from: RoomStatus, to: RoomStatus, room?: Room): boolean {
  const transition = transitions.find(t => t.from === from && t.to === to)
  if (!transition) return false
  if (transition.condition && room) {
    return transition.condition(room)
  }
  return true
}

export function transition(room: Room, to: RoomStatus): Result<Room> {
  if (!canTransition(room.status, to, room)) {
    return Err(new DomainError(`Cannot transition from ${room.status} to ${to}`))
  }
  return Ok({ ...room, status: to })
}
```

## AI との協働での利点

### 1. コンテキストが絞りやすい

```text
「modules/trades/ を見て、新しい機能を追加して」
→ Claude は 3 つのファイルだけ見ればいい
```

### 2. 機能追加が局所的

```text
新機能「評価システム」を追加
→ modules/ratings/ を作るだけ
→ 既存コードに影響なし
```

### 3. ステートマシンが守られる

```typescript
// domain/stateMachine.ts で定義
→ app/service.ts で使用
→ API Routes は service を呼ぶだけ
→ 不正な状態遷移は domain 層で防げる
```

## まとめ

この構成は：

- ✅ DDD の良い部分（境界づけられたコンテキスト、集約、ステートマシン）を活かす
- ✅ でもフォルダ階層は最小限（3 層）
- ✅ Next.js の規約を壊さない
- ✅ 1 人開発 + AI 協働に最適
- ✅ MVP から本番まで拡張可能

「教科書的 DDD」ではなく「実用的 DDD」の良い例です。
