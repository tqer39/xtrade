# セキュリティ設計

[English](./security.md)

xtrade のセキュリティ設計と方針について説明します。

## 認証方式

xtrade は **X (Twitter) OAuth 認証** を使用しています。

### 選定理由

- ユーザーは既存の X アカウントでログイン可能（新規アカウント作成不要）
- X のセキュリティ基盤を活用（パスワード管理不要）
- トレード相手の X プロフィールを確認できる透明性

## アクセス制御

### ホワイトリスト機能

招待制のアクセス制御を実装しています。

| 機能 | 説明 |
| --- | --- |
| 管理者設定 | `ADMIN_TWITTER_USERNAME` 環境変数で指定 |
| ホワイトリスト | 管理者が許可した X ユーザーのみログイン可能 |
| 管理画面 | `/admin/users` でホワイトリストを管理 |

### ロールベースアクセス制御

| ロール | 権限 |
| --- | --- |
| `admin` | 全機能 + ユーザー管理 |
| `user` | 一般機能のみ |

### BAN 機能

問題のあるユーザーを管理者が BAN 可能です。

- `banned`: BAN 状態フラグ
- `banReason`: BAN 理由
- `banExpires`: BAN 期限（永久 BAN の場合は null）

## MFA（多要素認証）について

### 現状の方針

xtrade 側での MFA 実装は行いません。

### 理由

1. **認証方式の制約**
   - X OAuth 認証の場合、MFA はプロバイダー（X）側で処理される
   - BetterAuth の MFA プラグインはメール/パスワード認証専用

2. **リスクレベルの評価**
   - xtrade は金銭取引ではなくアイテムトレードのプラットフォーム
   - 乗っ取られた場合の金銭的被害は限定的

3. **既存のセキュリティ層**
   - ホワイトリスト機能で招待制（不特定多数がアクセスできない）
   - 管理者によるユーザー管理・BAN が可能
   - 問題発生時の対応手段が確保されている

4. **利便性とのバランス**
   - 追加の認証ステップはユーザー離脱の原因となる
   - 初期フェーズでは「まず使ってもらう」ことが重要

### X 側の 2FA について

X アカウントの 2FA（二段階認証）設定はユーザー自身の責任範囲です。

- xtrade 側で X の電話番号登録を強制することは **推奨しない**
- 理由：利便性の低下による離脱リスクが、セキュリティ向上のメリットを上回る

### 将来的な検討事項

以下の状況が発生した場合、セキュリティ強化を検討します：

- 高額アイテムのトレードが増加
- 詐欺被害の報告が増加
- ユーザー数の大幅な増加

段階的なアプローチ例：

1. 高額トレード時のみ追加認証を要求
2. トレード履歴の監視・異常検知
3. 信頼スコアに基づくアクセス制御

## 環境変数のセキュリティ

### シークレット管理

| 環境変数 | 説明 | 保管場所 |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | セッション暗号化キー | GitHub Secrets |
| `TWITTER_CLIENT_ID` | X OAuth クライアント ID | GitHub Secrets |
| `TWITTER_CLIENT_SECRET` | X OAuth クライアントシークレット | GitHub Secrets |
| `ADMIN_TWITTER_USERNAME` | 管理者ユーザー名 | GitHub Secrets |
| `DATABASE_URL` | DB 接続文字列 | GitHub Secrets / Terraform |

### 注意事項

- `.env.local` は Git 管理外（`.gitignore` に含まれる）
- 本番環境のシークレットはコードにハードコードしない
- `ADMIN_TWITTER_USERNAME` は公開リポジトリにコミットしない

## CSRF 対策

BetterAuth の `trustedOrigins` 設定で、許可された Origin からのリクエストのみ受け付けます。

```typescript
trustedOrigins: [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  'https://xtrade-dev.tqer39.dev',
  'https://xtrade.tqer39.dev',
  'http://localhost:3000',
]
```

Vercel プレビュー URL（`*.vercel.app`）は動的に許可されます。

## セッション管理

| 設定 | 値 | 説明 |
| --- | --- | --- |
| `expiresIn` | 7 日 | セッションの有効期限 |
| `updateAge` | 1 日 | セッション更新間隔 |
| `cookieCache.maxAge` | 5 分 | Cookie キャッシュ時間 |

## インシデント対応

### ユーザーアカウント侵害時

1. 管理画面から該当ユーザーを BAN
2. 必要に応じてホワイトリストから削除
3. 関連するトレードの確認・対応

### 管理者アカウント侵害時

1. `ADMIN_TWITTER_USERNAME` を変更
2. Terraform apply で環境変数を更新
3. Vercel を再デプロイ

## 関連ドキュメント

- [GitHub Secrets 設定](./github-secrets.ja.md)
- [ローカル開発環境](./local-dev.ja.md)
- [Terraform 環境変数](./terraform-environment-variables.ja.md)
