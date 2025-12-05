# xtrade Storage (dev)

Cloudflare R2 ストレージの設定。

## 必要な環境変数

```bash
export CLOUDFLARE_API_TOKEN=xxx           # CloudFlare API Token
export TF_VAR_cloudflare_account_id=xxx   # CloudFlare Account ID
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

## R2 APIキーの取得

バケット作成後、CloudFlareダッシュボードで R2 API キーを作成してください:

1. CloudFlare Dashboard → R2 → Manage R2 API Tokens
2. 「Create API Token」をクリック
3. 権限: Object Read & Write
4. バケット: xtrade-card-images-dev のみ

生成された Access Key ID と Secret Access Key を環境変数に設定:

```bash
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=xtrade-card-images-dev
```
