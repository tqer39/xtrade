# xtrade Dev 環境 DNS

このディレクトリは xtrade の開発（dev）環境の DNS リソースを管理します。

## DNS の役割

以下のリソースを作成します：

- GCP Cloud DNS Managed Zone（`tqer39.dev`）
- dev 環境のサブドメイン DNS レコード（`xtrade-dev.tqer39.dev`）

## 前提条件

### 1. GCP プロジェクトの作成

```bash
# GCP プロジェクトを作成
gcloud projects create xtrade-project --name="xtrade"

# プロジェクトを設定
gcloud config set project xtrade-project

# Cloud DNS API を有効化
gcloud services enable dns.googleapis.com
```

### 2. 環境変数の設定

#### 方法 A: direnv を使用（推奨）

```bash
# 1. このディレクトリに .envrc を作成
cd infra/terraform/envs/dev/dns
cp .envrc.example .envrc

# 2. .envrc を編集して GCP 認証情報を設定
vim .envrc

# 3. direnv を有効化
direnv allow
```

#### 方法 B: gcloud CLI で認証

```bash
# gcloud で認証
gcloud auth application-default login
```

### 3. Vercel CNAME ターゲットの取得

Vercel プロジェクトの設定画面で CNAME ターゲットを確認：

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. xtrade-dev プロジェクトを選択
3. Settings → Domains
4. CNAME レコードのターゲットをコピー（例: `cname.vercel-dns.com.`）

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
# justfile を使用（推奨）
just tf -chdir=infra/terraform/envs/dev/dns plan

# または直接実行
terraform plan
```

### リソースの作成

```bash
# justfile を使用（推奨）
just tf -chdir=infra/terraform/envs/dev/dns apply

# または直接実行
terraform apply
```

### ネームサーバーの確認

```bash
# ネームサーバーを取得
just tf -chdir=infra/terraform/envs/dev/dns output name_servers

# 出力例:
# [
#   "ns-cloud-a1.googledomains.com.",
#   "ns-cloud-a2.googledomains.com.",
#   "ns-cloud-a3.googledomains.com.",
#   "ns-cloud-a4.googledomains.com."
# ]
```

## 重要：ドメインレジストラでの設定

Terraform で DNS Zone を作成した後、**手動で1回だけ**ドメインレジストラでネームサーバーを設定する必要があります。

### 手順

1. **ネームサーバーを取得**:

   ```bash
   just tf -chdir=infra/terraform/envs/dev/dns output name_servers
   ```

2. **ドメインレジストラにログイン**:
   - お名前.com、Google Domains、Cloudflare など

3. **ネームサーバーを更新**:
   - DNS/ネームサーバー設定画面に移動
   - 既存のネームサーバーを削除
   - GCP の4つのネームサーバーを追加
   - 保存

4. **DNS 伝播を待つ**:
   - 通常 1-2 時間、最大 48 時間

### DNS 伝播の確認

```bash
# dig コマンドで確認
dig xtrade-dev.tqer39.dev

# nslookup で確認
nslookup xtrade-dev.tqer39.dev

# オンラインツール
# https://dnschecker.org/
# https://www.whatsmydns.net/
```

## 出力される情報

| Output 名 | 説明 |
| -------- | ---- |
| `zone_name` | DNS ゾーン名 |
| `dns_name` | DNS 名（ドメイン） |
| `name_servers` | ネームサーバーリスト |
| `dev_fqdn` | dev 環境の FQDN |

## Vercel との連携

DNS レコードが作成されたら、Vercel でカスタムドメインを追加：

1. Vercel Dashboard → xtrade-dev プロジェクト
2. Settings → Domains
3. `xtrade-dev.tqer39.dev` を追加
4. Vercel が自動的に DNS を検証

## 変数

### 必須変数

なし（すべて `config.yml` から読み込まれます）

### オプション変数

| 変数名 | 説明 | デフォルト値 |
| -------- | ---- | ------ |
| `dev_cname_target` | dev 環境の Vercel CNAME ターゲット | `""` |

### 変数の設定方法

#### terraform.tfvars ファイル（推奨）

```hcl
# terraform.tfvars
dev_cname_target = "cname.vercel-dns.com."
```

#### コマンドライン

```bash
terraform apply -var="dev_cname_target=cname.vercel-dns.com."
```

#### 環境変数

```bash
export TF_VAR_dev_cname_target="cname.vercel-dns.com."
terraform apply
```

## トラブルシューティング

### Issue: GCP 認証エラー

**エラー**: `Error: google: could not find default credentials`

**解決策**:

```bash
# gcloud で認証
gcloud auth application-default login

# または環境変数を設定
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
```

### Issue: Cloud DNS API が無効

**エラー**: `Error: Cloud DNS API has not been used`

**解決策**:

```bash
# API を有効化
gcloud services enable dns.googleapis.com

# 確認
gcloud services list --enabled | grep dns
```

### Issue: DNS レコードが作成されない

**原因**: `dev_cname_target` が設定されていない

**解決策**:

```bash
# CNAME ターゲットを指定して apply
terraform apply -var="dev_cname_target=cname.vercel-dns.com."
```

### Issue: ネームサーバーが反映されない

**確認方法**:

```bash
# ドメインレジストラのネームサーバーを確認
dig NS tqer39.dev
```

**解決策**:

1. ドメインレジストラで設定を確認
2. DNS 伝播を待つ（最大 48 時間）
3. ブラウザのキャッシュをクリア

## リソースの削除

```bash
# 削除前に確認
terraform plan -destroy

# リソースを削除
terraform destroy
```

**注意**: DNS Zone を削除すると、ドメイン全体が解決できなくなります。

## 関連ドキュメント

- [GCP Subdomain Setup Guide](../../../docs/gcp-subdomain-setup.md)
- [Terraform Environment Variables](../../../docs/terraform-environment-variables.md)
- [GitHub Secrets Configuration](../../../docs/github-secrets.md)
