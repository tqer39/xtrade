# xtrade Storage (dev)

Cloudflare R2 ストレージの設定。

## 必要な環境変数

```bash
export CLOUDFLARE_API_TOKEN=xxx           # CloudFlare API Token
export TF_VAR_cloudflare_account_id=xxx   # CloudFlare Account ID
export TF_VAR_cloudflare_zone_id=xxx      # CloudFlare Zone ID
```

## コマンド

```bash
# 初期化
just tf -chdir=dev/storage init

# プラン確認
just tf -chdir=dev/storage plan

# 適用
just tf -chdir=dev/storage apply
```

## Terraform 出力

適用後、以下のコマンドで出力値を取得できます：

```bash
cd infra/terraform/envs/dev/storage

# バケット名
terraform output r2_bucket_name
# → xtrade-card-images-dev

# カスタムドメイン URL
terraform output r2_public_url
# → https://card-images.xtrade-dev.tqer39.dev

# S3互換エンドポイント（sensitive）
terraform output r2_endpoint
# → https://<account_id>.r2.cloudflarestorage.com
```

## R2 API キーの作成

バケット作成後、CloudFlare ダッシュボードで R2 API キーを作成してください：

1. CloudFlare Dashboard → R2 → Manage R2 API Tokens
2. 「Create API Token」をクリック
3. 権限: Object Read & Write
4. バケット: `xtrade-card-images-dev` のみ

## GitHub Secrets 設定

以下の Secrets を GitHub リポジトリに設定してください：

| Secret 名 | 値の取得方法 |
| --------- | ------------ |
| `CLOUDFLARE_R2_ENDPOINT_DEV` | `terraform output r2_endpoint` |
| `CLOUDFLARE_R2_BUCKET_DEV` | `terraform output r2_bucket_name` |
| `CLOUDFLARE_R2_CUSTOM_DOMAIN_DEV` | `terraform output r2_public_url` |
| `CLOUDFLARE_R2_ACCESS_KEY_ID_DEV` | R2 API トークン作成時に取得 |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY_DEV` | R2 API トークン作成時に取得 |

詳細は [GitHub Secrets ドキュメント](../../../../docs/github-secrets.ja.md) を参照してください。
