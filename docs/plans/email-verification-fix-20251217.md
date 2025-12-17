# メール認証機能の修正計画 (2025/12/17)

## 問題

| # | 問題 | 原因 |
| --- | --- | --- |
| 1 | X OAuth ログイン時にメールが自動認証される | BetterAuth の Twitter プロバイダーが `confirmed_email` を取得 → `emailVerified: true` |
| 2 | メール変更・削除ができない | `AddEmailForm` は `emailVerified: true` だとフォームを非表示 |

## 解決策

### 1. X OAuth ログイン時の emailVerified を false に強制

**対象ファイル**: `src/lib/auth.ts`

BetterAuth の `databaseHooks` を使用して、ユーザー作成時に `emailVerified: false` を強制。

```typescript
databaseHooks: {
  user: {
    create: {
      before: async (user) => {
        return {
          data: {
            ...user,
            emailVerified: false,
          },
        };
      },
    },
  },
},
```

### 2. AddEmailForm のロジック修正

**対象ファイル**: `src/components/auth/add-email-form.tsx`

認証済みでもメール変更を許可:

- `isEditing` state を追加
- 認証済みの場合は「メールアドレスを変更する」ボタンを表示
- キャンセルボタンでフォームを閉じられる

### 3. DB マイグレーション

**対象ファイル**: `src/db/migrations/0020_reset_email_verified.sql`

全ユーザーの `emailVerified` を `false` にリセット:

```sql
UPDATE "user" SET email_verified = false;
```

## 変更ファイル一覧

| ファイル | 変更内容 | 状態 |
| --- | --- | --- |
| `src/lib/auth.ts` | databaseHooks で emailVerified を false に強制 | ✅ 完了 |
| `src/components/auth/add-email-form.tsx` | メール変更機能追加 | ✅ 完了 |
| `src/db/migrations/0020_reset_email_verified.sql` | 新規作成 | ✅ 完了 |
| `src/db/migrations/meta/_journal.json` | マイグレーションエントリ追加 | ✅ 完了 |

## 適用手順

1. **ローカル**: `npm run db:migrate` を実行
2. **dev/prod**: PR マージ時に CI/CD が自動実行

## 注意事項

- この変更後、既存ユーザーはメール認証を再度行う必要がある
- 新規ユーザーは X OAuth ログイン後、設定ページからメール認証を行う
