# xtrade Directory Structure

[🇯🇵 日本語版](./directory-structure.ja.md)

## Design Principles

- **Package by Feature**: Modularize by domain units
- **Lightweight DDD**: Leverage DDD concepts with 3 layers: domain/app/infra
- **MVP Optimization**: Realistic structure for solo development + AI collaboration

## Directory Structure

```text
xtrade/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Pages requiring authentication
│   │   ├── trades/
│   │   ├── rooms/
│   │   └── profile/
│   ├── api/                      # API Routes (thin controllers)
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
│   ├── components/               # Common UI components
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/               # Common layout (Header, Footer)
│   │   └── features/             # Feature-specific components
│   ├── db/                       # Database
│   │   ├── schema/               # Drizzle schema (by domain)
│   │   │   ├── trades.ts
│   │   │   ├── rooms.ts
│   │   │   ├── messages.ts
│   │   │   ├── reports.ts
│   │   │   ├── profiles.ts
│   │   │   └── index.ts          # Export all schemas
│   │   ├── drizzle.ts            # DB connection
│   │   └── migrations/           # Migration files
│   ├── lib/                      # Common library
│   │   ├── auth.ts               # BetterAuth server config
│   │   ├── auth-client.ts        # BetterAuth client
│   │   └── auth-guards.ts        # Auth guards
│   └── modules/                  # Domain modules (by feature)
│       ├── shared/               # Shared module
│       │   ├── domain/
│       │   │   ├── errors.ts     # DomainError, NotFoundError, etc.
│       │   │   ├── types.ts      # Result<T, E> type, etc.
│       │   │   └── events.ts     # Domain event base type
│       │   └── utils/
│       │       ├── validation.ts
│       │       └── logger.ts
│       ├── trades/               # Trades (listings/offers)
│       │   ├── domain/
│       │   │   ├── model.ts      # Trade type, business rules
│       │   │   ├── stateMachine.ts # State transition definitions
│       │   │   └── validation.ts # Validation rules
│       │   ├── app/
│       │   │   ├── service.ts    # Use case implementation
│       │   │   └── dto.ts        # DTO definitions
│       │   ├── infra/
│       │   │   └── repo.ts       # Persistence with Drizzle
│       │   └── index.ts          # Public API
│       ├── rooms/                # Trading rooms
│       │   ├── domain/
│       │   │   ├── model.ts
│       │   │   ├── stateMachine.ts # Room state management
│       │   │   └── rules.ts      # Trading rules
│       │   ├── app/
│       │   │   ├── service.ts
│       │   │   └── dto.ts
│       │   ├── infra/
│       │   │   └── repo.ts
│       │   └── index.ts
│       ├── messages/             # Chat
│       │   ├── domain/
│       │   │   └── model.ts
│       │   ├── app/
│       │   │   └── service.ts
│       │   ├── infra/
│       │   │   └── repo.ts
│       │   └── index.ts
│       ├── reports/              # Reports
│       │   ├── domain/
│       │   │   ├── model.ts
│       │   │   └── validation.ts
│       │   ├── app/
│       │   │   └── service.ts
│       │   ├── infra/
│       │   │   └── repo.ts
│       │   └── index.ts
│       └── profiles/             # Profiles (X account + trust score)
│           ├── domain/
│           │   ├── model.ts
│           │   └── trustScore.ts # Trust score calculation logic
│           ├── app/
│           │   └── service.ts
│           ├── infra/
│           │   └── repo.ts
│           └── index.ts
├── infra/                        # Infrastructure
│   └── terraform/                # Terraform configuration
│       ├── config.yml
│       ├── modules/
│       ├── envs/
│       └── global/
├── docs/                         # Documentation
├── .github/                      # GitHub Actions
└── scripts/                      # Development scripts
```

## Module Structure Details

### domain/ Layer

**Responsibility**: Business rules, invariants, state transitions

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

**Characteristics**:

- Pure TypeScript (no external dependencies)
- Business logic only
- Easy to test

### app/ Layer

**Responsibility**: Use case implementation, transaction control

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

**Characteristics**:

- Represents use cases
- Connects domain and infra
- Transaction boundaries

### infra/ Layer

**Responsibility**: DB access, external API calls

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

**Characteristics**:

- Uses Drizzle ORM
- Transforms between domain model and DB records
- Not exported from this layer

### index.ts (Public API)

```typescript
// modules/trades/index.ts
export * from './domain/model'
export * from './app/service'
// infra is not exported (implementation detail)
```

**Usage Example**:

```typescript
// app/api/trades/route.ts
import { TradeService } from '@/modules/trades'

export async function POST(req: Request) {
  const service = new TradeService(/* ... */)
  const result = await service.publishTrade(id, userId)
  // ...
}
```

## Dependency Rules

```text
app/api/          →  modules/*/app/
                       ↓
modules/*/app/    →  modules/*/domain/
                  →  modules/*/infra/
                       ↓
modules/*/infra/  →  modules/*/domain/
                  →  src/db/
```

**Prohibited**:

- Dependencies from `domain/` to `app/` or `infra/`
- Dependencies from `infra/` to `app/`
- Direct dependencies between modules (e.g., `trades/` to `rooms/`)
  - If needed, call through `app/service.ts`

## State Machine Implementation Example

```typescript
// modules/rooms/domain/stateMachine.ts
export type RoomStatus =
  | 'NEGOTIATING'   // Negotiating
  | 'TRADING'       // Trading
  | 'COMPLETED'     // Completed
  | 'CANCELLED'     // Cancelled
  | 'DISPUTED'      // Disputed

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

## Benefits for AI Collaboration

### 1. Easy to Focus Context

```text
"Look at modules/trades/ and add a new feature"
→ Claude only needs to look at 3 files
```

### 2. Local Feature Addition

```text
Add new "rating system" feature
→ Just create modules/ratings/
→ No impact on existing code
```

### 3. State Machine Protection

```typescript
// Defined in domain/stateMachine.ts
→ Used in app/service.ts
→ API Routes just call service
→ Invalid state transitions prevented at domain layer
```

## Summary

This structure:

- ✅ Leverages good parts of DDD (bounded contexts, aggregates, state machines)
- ✅ But minimal folder hierarchy (3 layers)
- ✅ Doesn't break Next.js conventions
- ✅ Optimal for solo development + AI collaboration
- ✅ Scalable from MVP to production

A good example of "practical DDD" rather than "textbook DDD".
