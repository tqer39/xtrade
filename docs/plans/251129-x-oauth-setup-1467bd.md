# X OAuth 認証セットアップ計画

- **作成日**: 2024-11-29
- **ステータス**: 計画中
- **担当 Agent**: ArchAgent（起点）→ 各専門Agentへエスカレーション

## 概要

xtradeアプリケーションにX（Twitter）OAuth認証を実装する。
BetterAuthを使用し、Neon PostgreSQL + Vercel + Next.js App Routerの構成で構築する。

## 前提条件

- [x] CloudFlare DNS設定済み
- [x] Neonデータベース作成済み（xtrade-dev）
- [x] Vercelデプロイ済み（<https://xtrade-dev.tqer39.dev/>）
- [ ] X Developer Portalアプリ未作成

## 実装順序

### Phase 1: X Developer Portal 設定

**担当**: 手動作業（ユーザー）

1. [X Developer Portal](https://developer.twitter.com/) にアクセス
2. 新規アプリを作成
3. OAuth 2.0を有効化
4. 以下を設定:
   - **App permissions**: Read
   - **Type of App**: Web App
   - **Callback URL**:
     - `https://xtrade-dev.tqer39.dev/api/auth/callback/twitter`
     - `http://localhost:3000/api/auth/callback/twitter`（ローカル開発用）
   - **Website URL**: `https://xtrade-dev.tqer39.dev`
5. `Client ID` と `Client Secret` を取得

**成果物**:

- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`

---

### Phase 2: 環境変数の設定

**担当**: 手動作業（ユーザー）

#### ローカル環境（.env.local）

```bash
# Auth
BETTER_AUTH_SECRET=<openssl rand -base64 32 で生成>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# X OAuth
TWITTER_CLIENT_ID=<Phase 1 で取得>
TWITTER_CLIENT_SECRET=<Phase 1 で取得>

# Database
DATABASE_URL=<Neon 接続文字列>
```

#### Vercel 環境変数（dev）

| Key | Value |
| --- | --- |
| `BETTER_AUTH_SECRET` | 別途生成した値 |
| `BETTER_AUTH_URL` | `https://xtrade-dev.tqer39.dev` |
| `NEXT_PUBLIC_APP_URL` | `https://xtrade-dev.tqer39.dev` |
| `TWITTER_CLIENT_ID` | Phase 1 で取得 |
| `TWITTER_CLIENT_SECRET` | Phase 1 で取得 |
| `DATABASE_URL` | Neon dev 接続文字列 |

---

### Phase 3: BetterAuth 依存関係のインストール

**担当**: ArchAgent

```bash
npm install better-auth
```

**成果物**:

- `package.json` 更新

---

### Phase 4: データベーススキーマ定義

**担当**: DBAgent

BetterAuthが必要とするテーブルをDrizzleスキーマで定義。

#### 必要なテーブル

| テーブル | 説明 |
| --- | --- |
| `user` | ユーザー基本情報 |
| `session` | セッション管理 |
| `account` | OAuth プロバイダー連携 |
| `verification` | メール確認トークン（オプション） |

**成果物**:

- `src/db/schema/auth.ts` - 認証関連スキーマ
- マイグレーションファイル

---

### Phase 5: BetterAuth 設定

**担当**: AuthAgent

#### 5.1 サーバー設定

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  socialProviders: {
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    },
  },
});
```

#### 5.2 クライアント設定

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
```

**成果物**:

- `src/lib/auth.ts` - サーバー側認証設定
- `src/lib/auth-client.ts` - クライアント側認証設定

---

### Phase 6: API ルート設定

**担当**: APIAgent

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

**成果物**:

- `app/api/auth/[...all]/route.ts` - 認証APIハンドラー

自動生成されるエンドポイント:

- `POST /api/auth/signin/twitter` - Xログイン開始
- `GET /api/auth/callback/twitter` - OAuthコールバック
- `POST /api/auth/signout` - ログアウト
- `GET /api/auth/session` - セッション取得

---

### Phase 7: UI コンポーネント

**担当**: UIAgent

#### 7.1 ログインボタン

```typescript
// src/components/auth/login-button.tsx
"use client";

import { authClient } from "@/lib/auth-client";

export function LoginButton() {
  const handleLogin = () => {
    authClient.signIn.social({ provider: "twitter" });
  };

  return (
    <button onClick={handleLogin}>
      X でログイン
    </button>
  );
}
```

#### 7.2 ユーザー表示

```typescript
// src/components/auth/user-menu.tsx
"use client";

import { authClient } from "@/lib/auth-client";

export function UserMenu() {
  const { data: session } = authClient.useSession();

  if (!session?.user) {
    return <LoginButton />;
  }

  return (
    <div>
      <span>{session.user.name}</span>
      <button onClick={() => authClient.signOut()}>
        ログアウト
      </button>
    </div>
  );
}
```

**成果物**:

- `src/components/auth/login-button.tsx`
- `src/components/auth/user-menu.tsx`

---

### Phase 8: 保護されたページ

**担当**: UIAgent + APIAgent

#### ミドルウェア（オプション）

```typescript
// middleware.ts
import { auth } from "@/lib/auth";

export default auth.middleware;

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

**成果物**:

- `middleware.ts`（必要に応じて）

---

### Phase 9: テスト

**担当**: TestAgent

- [ ] ローカル環境でのログインフロー
- [ ] dev環境でのログインフロー
- [ ] セッション永続化の確認
- [ ] ログアウト動作確認

---

## Agent 間の依存関係

```text
ArchAgent（計画・調整）
    │
    ├── DBAgent（Phase 4: スキーマ）
    │       │
    │       ▼
    ├── AuthAgent（Phase 5: BetterAuth 設定）
    │       │
    │       ▼
    ├── APIAgent（Phase 6: ルート設定）
    │       │
    │       ▼
    ├── UIAgent（Phase 7-8: コンポーネント）
    │       │
    │       ▼
    └── TestAgent（Phase 9: テスト）
```

## 成功基準

1. ローカル環境でXログインが動作する
2. dev環境（<https://xtrade-dev.tqer39.dev/>）でXログインが動作する
3. セッションが正しく永続化される
4. ログアウトが正しく動作する

## リスクと対策

| リスク | 対策 |
| --- | --- |
| X API の Rate Limit | Free Tier で十分対応可能 |
| Callback URL の設定ミス | 開発/本番両方の URL を登録 |
| 環境変数の漏洩 | .env.local は Git 管理外、Vercel Secrets 使用 |

## 参照

- [BetterAuth ドキュメント](https://www.better-auth.com/)
- [X Developer Portal](https://developer.twitter.com/)
- [docs/architecture.ja.md](../architecture.ja.md)
- [docs/github-secrets.ja.md](../github-secrets.ja.md)
