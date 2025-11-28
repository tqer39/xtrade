# xtrade Dev 環境 DNS

このディレクトリは xtrade の開発（dev）環境の DNS リソースを管理します。

## DNS の役割

以下のリソースを作成します：

- CloudFlare DNS レコード（`xtrade-dev.tqer39.dev`）

## 前提条件

### 1. CloudFlare API Token の取得

1. [CloudFlare Dashboard](https://dash.cloudflare.com/profile/api-tokens) にアクセス
2. Create Token → Edit zone DNS テンプレートを使用
3. Zone Resources で `tqer39.dev` を選択
4. Token を生成してコピー

### 2. 環境変数の設定

#### 方法 A: cf-vault を使用（推奨）

```bash
# 1. cf-vault プロファイルを追加
cf-vault add xtrade

# 2. API Token を入力（プロンプトが表示されます）

# 3. cf-vault でコマンド実行
cf-vault exec xtrade -- terraform plan
```

#### 方法 B: 環境変数を直接設定

```bash
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
```

## 使い方

### 初期化

```bash
# justfile を使用（推奨）
just tf -chdir=infra/terraform/envs/dev/dns init

# または直接実行
cd infra/terraform/envs/dev/dns
terraform init
```

### プランの確認

```bash
# cf-vault + aws-vault を使用（推奨）
make terraform-cf ARGS="-chdir=infra/terraform/envs/dev/dns plan"

# justfile を使用
just tf -chdir=infra/terraform/envs/dev/dns plan

# または直接実行
terraform plan
```

### リソースの作成

```bash
# cf-vault + aws-vault を使用（推奨）
make terraform-cf ARGS="-chdir=infra/terraform/envs/dev/dns apply"

# justfile を使用
just tf -chdir=infra/terraform/envs/dev/dns apply

# または直接実行
terraform apply
```

## 出力される情報

| Output 名 | 説明 |
| -------- | ---- |
| `dns_records` | 作成された DNS レコード |
| `dev_fqdn` | dev 環境の FQDN |

## Vercel との連携

DNS レコードは `terraform_remote_state` を使って frontend モジュールから CNAME ターゲットを自動取得します。

1. まず `frontend` モジュールを apply
2. その後 `dns` モジュールを apply

DNS レコードが作成されたら、Vercel でカスタムドメインを追加：

1. Vercel Dashboard → xtrade-dev プロジェクト
2. Settings → Domains
3. `xtrade-dev.tqer39.dev` を追加
4. Vercel が自動的に DNS を検証

## 変数

### 必須変数

なし（すべて `config.yml` または `terraform_remote_state` から読み込まれます）

## トラブルシューティング

### Issue: CloudFlare 認証エラー

**エラー**: `Error: failed to create API client: invalid credentials`

**解決策**:

```bash
# cf-vault でプロファイルを確認
cf-vault list

# プロファイルがない場合は追加
cf-vault add xtrade

# 環境変数を確認
echo $CLOUDFLARE_API_TOKEN
echo $CLOUDFLARE_ACCOUNT_ID
```

### Issue: Zone が見つからない

**エラー**: `The given key does not identify an element in this collection value`

**解決策**:

1. CloudFlare Dashboard で `tqer39.dev` ゾーンが存在することを確認
2. API Token に該当ゾーンへのアクセス権があることを確認

### Issue: DNS レコードが作成されない

**原因**: `frontend` モジュールの state がない

**解決策**:

```bash
# 先に frontend モジュールを apply
just tf -chdir=infra/terraform/envs/dev/frontend apply

# その後 dns モジュールを apply
just tf -chdir=infra/terraform/envs/dev/dns apply
```

## リソースの削除

```bash
# 削除前に確認
terraform plan -destroy

# リソースを削除
terraform destroy
```

**注意**: DNS レコードを削除すると、サブドメインが解決できなくなります。

## 関連ドキュメント

- [Terraform Environment Variables](../../../../docs/terraform-environment-variables.ja.md)
- [GitHub Secrets Configuration](../../../../docs/github-secrets.ja.md)
- [Local Development Guide](../../../../docs/local-dev.ja.md)
