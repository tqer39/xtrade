# GitHub Secrets 設定

[🇺🇸 English](./github-secrets.md)

このドキュメントは、xtrade プロジェクトの CI/CD ワークフローに必要なすべての GitHub Secrets をリストしています。

## 必須 Secrets

### Database

| Secret 名 | 説明 | 使用箇所 | 必須 |
| -------- | ---- | ------ | -------- |
| `DATABASE_URL_DEV` | dev 環境用 Neon データベース接続 URL（pooled） | `db-migrate-dev.yml` | Yes |

**取得方法**: Neon ダッシュボードから取得、または database モジュールの Terraform apply 後に出力から取得。

**フォーマット**: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

### BetterAuth 認証

| Secret 名 | 説明 | 使用箇所 | 必須 |
| -------- | ---- | ------ | -------- |
| `BETTER_AUTH_SECRET_DEV` | dev 環境用 BetterAuth シークレットキー | `terraform-dev.yml` | Yes |
| `TWITTER_CLIENT_ID_DEV` | dev 環境用 X (Twitter) OAuth クライアント ID | `terraform-dev.yml` | Yes |
| `TWITTER_CLIENT_SECRET_DEV` | dev 環境用 X (Twitter) OAuth クライアントシークレット | `terraform-dev.yml` | Yes |
| `ALLOWED_TWITTER_IDS_DEV` | dev 環境でログイン許可する X アカウント ID（カンマ区切り） | `terraform-dev.yml` | No |

**取得方法**:

- `BETTER_AUTH_SECRET_DEV`: `openssl rand -base64 32` で生成
- `TWITTER_CLIENT_ID_DEV` / `TWITTER_CLIENT_SECRET_DEV`: [X Developer Portal](https://developer.x.com/en/portal/dashboard) で取得
- `ALLOWED_TWITTER_IDS_DEV`: 許可する X アカウントの ID をカンマ区切りで指定（例: `123456789,987654321`）。未設定の場合は全ユーザーがログイン可能。

### ホワイトリスト機能

| 変数名 | 説明 | 使用箇所 | 必須 |
| -------- | ---- | ------ | -------- |
| `TF_VAR_admin_twitter_username` | 管理者の X ユーザー名（@なし） | Terraform variables | No |

**説明**:

- この値が設定されている場合、ホワイトリスト機能が有効になります
- 管理者は常にログイン可能で、初回ログイン時に admin ロールが付与されます
- ホワイトリストに登録されていないユーザーはログインできません
- GitHub Secrets に `ADMIN_TWITTER_USERNAME_DEV` として設定し、CI/CD で `TF_VAR_admin_twitter_username` として渡す

### Terraform

| Secret 名 | 説明 | 使用箇所 | 必須 |
| -------- | ---- | ------ | -------- |
| `NEON_API_KEY` | Terraform 用 Neon API キー | `terraform-dev.yml` | Yes |
| `VERCEL_API_TOKEN` | Terraform 用 Vercel API トークン | `terraform-dev.yml` | Yes |
| `CLOUDFLARE_API_TOKEN` | CloudFlare API トークン（DNS 管理用） | `terraform-dev.yml` | Yes |
| `CLOUDFLARE_ACCOUNT_ID` | CloudFlare Account ID | `terraform-dev.yml` | Yes |
| `CLOUDFLARE_ZONE_ID` | CloudFlare Zone ID（tqer39.dev） | `terraform-dev.yml` | Yes |
| `SLACK_WEBHOOK_DEV` | dev 環境通知用 Slack webhook URL | `terraform-dev.yml` | No |

**取得方法**:

- Neon: [Neon Console](https://console.neon.tech/) → Account Settings → API Keys
- Vercel: [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token
- CloudFlare API Token: [CloudFlare Dashboard](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Edit zone DNS テンプレート使用
- CloudFlare Account ID: [CloudFlare Dashboard](https://dash.cloudflare.com/) → 右上のアカウントメニュー → Account ID、または任意のドメインの Overview ページ右側
- CloudFlare Zone ID: [CloudFlare Dashboard](https://dash.cloudflare.com/) → 対象ドメイン → Overview ページ右側の「Zone ID」
- Slack: [Slack API](https://api.slack.com/messaging/webhooks)

### GitHub Apps

| Secret 名 | 説明 | 使用箇所 | 必須 |
| -------- | ---- | ------ | -------- |
| `GHA_APP_ID` | 自動コミット用 GitHub App ID | `update-license-year.yml` | No |
| `GHA_APP_PRIVATE_KEY` | GitHub App 秘密鍵 | `update-license-year.yml` | No |

**取得方法**: リポジトリ設定で GitHub App を作成し、秘密鍵を生成。

### Test / Coverage

| Secret 名 | 説明 | 使用箇所 | 必須 |
| -------- | ---- | ------ | -------- |
| `CODECOV_TOKEN` | Codecov へのカバレッジアップロード用トークン | `test.yml` | Yes |

**取得方法**: [Codecov](https://codecov.io/) → リポジトリ設定 → Upload Token をコピーしてください。

### AI/LLM

| Secret 名 | 説明 | 使用箇所 | 必須 |
| -------- | ---- | ------ | -------- |
| `OPENAI_API_KEY` | PR 説明生成用 OpenAI API キー | `generate-pr-description.yml` | No |
| `ANTHROPIC_API_KEY_DEV` | dev 環境用 Claude API キー | `scrape-cards.yml` | No |
| `ANTHROPIC_API_KEY_PROD` | prod 環境用 Claude API キー | （prod ワークフロー） | No |

**取得方法**:

- OpenAI: [OpenAI Platform](https://platform.openai.com/api-keys)
- Anthropic: [Anthropic Console](https://console.anthropic.com/settings/keys)

**注**: dev/prod で別の API キーを使用することで、使用量・コストを環境別に追跡できます。

### CloudFlare R2

環境ごとに異なるバケット・ドメインを使用するため、Secrets は `_DEV` / `_PROD` サフィックスで分離します。

#### dev 環境

| Secret 名 | 説明 | 値の取得元 |
| -------- | ---- | ------ |
| `CLOUDFLARE_R2_ENDPOINT_DEV` | R2 エンドポイント | `terraform output r2_endpoint` |
| `CLOUDFLARE_R2_BUCKET_DEV` | R2 バケット名 | `terraform output r2_bucket_name` |
| `CLOUDFLARE_R2_CUSTOM_DOMAIN_DEV` | R2 カスタムドメイン | `terraform output r2_public_url` |
| `CLOUDFLARE_R2_ACCESS_KEY_ID_DEV` | R2 API アクセスキー | CloudFlare Dashboard |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY_DEV` | R2 API シークレット | CloudFlare Dashboard |

#### prod 環境

| Secret 名 | 説明 | 値の取得元 |
| -------- | ---- | ------ |
| `CLOUDFLARE_R2_ENDPOINT_PROD` | R2 エンドポイント | `terraform output r2_endpoint` |
| `CLOUDFLARE_R2_BUCKET_PROD` | R2 バケット名 | `terraform output r2_bucket_name` |
| `CLOUDFLARE_R2_CUSTOM_DOMAIN_PROD` | R2 カスタムドメイン | `terraform output r2_public_url` |
| `CLOUDFLARE_R2_ACCESS_KEY_ID_PROD` | R2 API アクセスキー | CloudFlare Dashboard |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY_PROD` | R2 API シークレット | CloudFlare Dashboard |

**Terraform 出力からの値取得**:

```bash
cd infra/terraform/envs/dev/storage
terraform output r2_bucket_name    # → xtrade-card-images-dev
terraform output r2_public_url     # → https://card-images.xtrade-dev.tqer39.dev
terraform output r2_endpoint       # → https://<account_id>.r2.cloudflarestorage.com
```

**R2 API トークンの作成**:

1. CloudFlare Dashboard → R2 → Manage R2 API Tokens
2. 「Create API Token」をクリック
3. 権限: Object Read & Write
4. バケット: 環境に応じたバケットを選択

### 自動 Secrets

これらの Secrets は GitHub Actions によって自動的に提供され、設定する必要はありません：

| Secret 名 | 説明 | 使用箇所 |
| -------- | ---- | ------ |
| `GITHUB_TOKEN` | GitHub API アクセス用に自動生成されるトークン | 全ワークフロー |

## Secrets の設定方法

### リポジトリ Secrets

1. GitHub リポジトリに移動
2. **Settings** → **Secrets and variables** → **Actions** に移動
3. **New repository secret** をクリック
4. Secret 名と値を入力
5. **Add secret** をクリック

### 環境固有の Secrets

本番環境では、GitHub Environments の使用を検討してください：

1. **Settings** → **Environments** に移動
2. 新しい環境を作成（例: `production`）
3. 環境固有の Secrets を追加
4. 必要に応じてデプロイ保護ルールを設定

## セキュリティベストプラクティス

1. **ローテーション**: API キーとトークンを定期的にローテーション
2. **最小権限**: 各トークンに必要最小限の権限を付与
3. **モニタリング**: ワークフロー実行で Secret の使用状況を監視
4. **コミット禁止**: Secret をリポジトリにコミットしない
5. **環境の使用**: 本番 Secret には保護ルール付きの GitHub Environments を使用

## 検証

Secrets が適切に設定されているか確認するには：

1. **Actions** タブでワークフロー実行を確認
2. Secret に関連するエラーメッセージを確認
3. ワークフローを実行する前に、必須の Secrets がすべて設定されていることを確認

## トラブルシューティング

### Secret が利用できない

**エラー**: `Error: Input required and not supplied: [secret-name]`

**解決策**: リポジトリ設定にて Secret が正確な名前で設定されているか確認してください。

### 無効な Secret 値

**エラー**: 認証または接続が失敗しました。

**解決策**:

1. Secret の値が正しいか確認
2. 余分な空白や改行がないか確認
3. 必要に応じてトークン/キーを再生成

### 権限拒否

**エラー**: `Error: Resource not accessible by integration`

**解決策**: トークンが必要な操作に対して十分な権限を持っているか確認。

## 関連ドキュメント

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Terraform 環境変数](./terraform-environment-variables.md)
- [Neon Database セットアップ](../infra/terraform/envs/dev/database/README.md)
