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

### Terraform

| Secret 名 | 説明 | 使用箇所 | 必須 |
| -------- | ---- | ------ | -------- |
| `NEON_API_KEY` | Terraform 用 Neon API キー | `terraform-dev.yml` | Yes |
| `VERCEL_API_TOKEN` | Terraform 用 Vercel API トークン | `terraform-dev.yml` | Yes |
| `SLACK_WEBHOOK_DEV` | dev 環境通知用 Slack webhook URL | `terraform-dev.yml` | No |

**取得方法**:

- Neon: [Neon Console](https://console.neon.tech/) → Account Settings → API Keys
- Vercel: [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token
- Slack: [Slack API](https://api.slack.com/messaging/webhooks)

### GitHub Apps

| Secret 名 | 説明 | 使用箇所 | 必須 |
| -------- | ---- | ------ | -------- |
| `GHA_APP_ID` | 自動コミット用 GitHub App ID | `update-license-year.yml` | No |
| `GHA_APP_PRIVATE_KEY` | GitHub App 秘密鍵 | `update-license-year.yml` | No |

**取得方法**: リポジトリ設定で GitHub App を作成し、秘密鍵を生成。

### AI/LLM

| Secret 名 | 説明 | 使用箇所 | 必須 |
| -------- | ---- | ------ | -------- |
| `OPENAI_API_KEY` | PR 説明生成用 OpenAI API キー | `generate-pr-description.yml` | No |

**取得方法**: [OpenAI Platform](https://platform.openai.com/api-keys)

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

**解決策**: リポジトリ設定で Secret が正確な名前で設定されているか確認。

### 無効な Secret 値

**エラー**: 認証または接続の失敗

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
