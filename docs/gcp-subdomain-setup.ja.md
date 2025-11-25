# GCP サブドメイン設定ガイド

[🇺🇸 English](./gcp-subdomain-setup.md)

このガイドでは、xtrade プロジェクトに Google Cloud Platform (GCP) Cloud DNS を使用してサブドメインを作成・設定する方法を説明します。

## 概要

xtrade プロジェクトでは、以下のサブドメインを設定する必要があります:

- `xtrade.tqer39.dev` - 本番環境
- `xtrade-dev.tqer39.dev` - 開発環境

これらのサブドメインは Vercel のデプロイメントを指すように設定します。

## 前提条件

開始する前に、以下を確認してください:

- **GCP アカウント** - 請求が有効になっていること
- **ドメインの所有権** - `tqer39.dev` ドメインを所有していること
- **gcloud CLI** - インストールおよび設定済みであること
- **Terraform** - インストール済み(オプション、Infrastructure as Code を使用する場合)
- **適切な権限** - DNS 管理者ロールまたは同等の権限

## ステップ 1: GCP プロジェクトの作成(存在しない場合)

### gcloud CLI を使用する場合

```bash
# プロジェクト変数の設定
export PROJECT_ID="xtrade-project"
export PROJECT_NAME="xtrade"

# プロジェクトの作成
gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"

# アクティブなプロジェクトとして設定
gcloud config set project $PROJECT_ID

# 請求の有効化(Cloud DNS に必要)
# GCP コンソール経由で請求先アカウントをリンクする必要があります
```

### GCP コンソールを使用する場合

1. [GCP コンソール](https://console.cloud.google.com/)にアクセス
2. プロジェクトのドロップダウンをクリック → **新しいプロジェクト**
3. プロジェクト名を入力: `xtrade`
4. **作成**をクリック
5. プロジェクトの請求を有効化

## ステップ 2: Cloud DNS API の有効化

### gcloud CLI を使用する場合

```bash
# Cloud DNS API を有効化
gcloud services enable dns.googleapis.com

# API が有効化されていることを確認
gcloud services list --enabled | grep dns
```

### GCP コンソールを使用する場合

1. **API とサービス** → **ライブラリ**に移動
2. 「Cloud DNS API」を検索
3. **有効にする**をクリック

## ステップ 3: マネージド DNS ゾーンの作成

### gcloud CLI を使用する場合

```bash
# tqer39.dev 用の DNS ゾーンを作成
gcloud dns managed-zones create tqer39-dev \
  --description="DNS zone for tqer39.dev domain" \
  --dns-name="tqer39.dev." \
  --visibility=public

# ゾーン作成を確認
gcloud dns managed-zones describe tqer39-dev
```

**重要な注意事項:**

- DNS 名はピリオド(`.`)で終わる必要があります
- ゾーン名(`tqer39-dev`)はプロジェクト内で一意である必要があります
- インターネットからアクセス可能なドメインの場合、可視性は `public` に設定します

### GCP コンソールを使用する場合

1. **ネットワーク サービス** → **Cloud DNS**に移動
2. **ゾーンを作成**をクリック
3. 詳細を入力:
   - **ゾーンタイプ**: 公開
   - **ゾーン名**: `tqer39-dev`
   - **DNS 名**: `tqer39.dev.`
   - **説明**: DNS zone for tqer39.dev domain
   - **DNSSEC**: オフ(または必要に応じてオン)
4. **作成**をクリック

## ステップ 4: ドメインレジストラのネームサーバーを更新

DNS ゾーンを作成した後、ドメインレジストラのネームサーバーを更新する必要があります。

### ネームサーバーレコードの取得

```bash
# ゾーンのネームサーバーを取得
gcloud dns managed-zones describe tqer39-dev \
  --format="value(nameServers)"
```

出力例:

```text
ns-cloud-a1.googledomains.com.
ns-cloud-a2.googledomains.com.
ns-cloud-a3.googledomains.com.
ns-cloud-a4.googledomains.com.
```

### ドメインレジストラでの更新

1. ドメインレジストラ(`tqer39.dev` を購入した場所)にログイン
2. DNS/ネームサーバー設定を探す
3. 既存のネームサーバーを GCP のネームサーバーに置き換える
4. 変更を保存

**注意:** DNS の伝播には 24〜48 時間かかることがありますが、通常は数時間以内に完了します。

## ステップ 5: サブドメイン DNS レコードの作成

### オプション A: gcloud CLI を使用する場合

#### 本番環境用(xtrade.tqer39.dev)

```bash
# Vercel を指す A レコードを作成
# まず、Vercel プロジェクト設定から Vercel の IP アドレスを取得
export VERCEL_IP="76.76.21.21"  # IP アドレスの例

# DNS レコードを作成
gcloud dns record-sets create xtrade.tqer39.dev. \
  --zone="tqer39-dev" \
  --type="A" \
  --ttl="300" \
  --rrdatas="$VERCEL_IP"
```

#### 開発環境用(xtrade-dev.tqer39.dev)

```bash
# 開発環境用の A レコードを作成
gcloud dns record-sets create xtrade-dev.tqer39.dev. \
  --zone="tqer39-dev" \
  --type="A" \
  --ttl="300" \
  --rrdatas="$VERCEL_IP"
```

#### CNAME レコードを使用する場合(代替方法)

```bash
# Vercel が CNAME ターゲットを提供する場合
export VERCEL_CNAME="cname.vercel-dns.com."

# 本番環境用の CNAME レコードを作成
gcloud dns record-sets create xtrade.tqer39.dev. \
  --zone="tqer39-dev" \
  --type="CNAME" \
  --ttl="300" \
  --rrdatas="$VERCEL_CNAME"

# 開発環境用の CNAME レコードを作成
gcloud dns record-sets create xtrade-dev.tqer39.dev. \
  --zone="tqer39-dev" \
  --type="CNAME" \
  --ttl="300" \
  --rrdatas="$VERCEL_CNAME"
```

### オプション B: GCP コンソールを使用する場合

1. **Cloud DNS** → ゾーン `tqer39-dev` を選択
2. **レコードセットを追加**をクリック
3. 詳細を入力:
   - **DNS 名**: `xtrade`(xtrade.tqer39.dev の場合)
   - **リソース レコード タイプ**: `A` または `CNAME`
   - **TTL**: `5` 分(`300` 秒)
   - **IPv4 アドレス** または **正規名**: Vercel の IP/CNAME
4. **作成**をクリック
5. `xtrade-dev` サブドメインについても繰り返す

### オプション C: Terraform を使用する場合(推奨)

Terraform 設定ファイルを作成:

```hcl
# infra/terraform/modules/dns/main.tf

resource "google_dns_managed_zone" "tqer39_dev" {
  name        = "tqer39-dev"
  dns_name    = "tqer39.dev."
  description = "DNS zone for tqer39.dev domain"
  visibility  = "public"
}

resource "google_dns_record_set" "xtrade_prod" {
  managed_zone = google_dns_managed_zone.tqer39_dev.name
  name         = "xtrade.tqer39.dev."
  type         = "A"
  ttl          = 300
  rrdatas      = [var.vercel_ip_prod]
}

resource "google_dns_record_set" "xtrade_dev" {
  managed_zone = google_dns_managed_zone.tqer39_dev.name
  name         = "xtrade-dev.tqer39.dev."
  type         = "A"
  ttl          = 300
  rrdatas      = [var.vercel_ip_dev]
}
```

Terraform の適用:

```bash
cd infra/terraform/modules/dns
terraform init
terraform plan
terraform apply
```

## ステップ 6: DNS 設定の確認

### dig を使用する場合

```bash
# 本番環境のサブドメインを確認
dig xtrade.tqer39.dev

# 開発環境のサブドメインを確認
dig xtrade-dev.tqer39.dev

# ネームサーバーを確認
dig NS tqer39.dev
```

### nslookup を使用する場合

```bash
# 本番環境のサブドメインを確認
nslookup xtrade.tqer39.dev

# 開発環境のサブドメインを確認
nslookup xtrade-dev.tqer39.dev
```

### オンラインツール

- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://www.whatsmydns.net/)

サブドメインを入力して、グローバルな DNS 伝播を確認できます。

## ステップ 7: Vercel カスタムドメインの設定

DNS レコードが設定されたら、Vercel でカスタムドメインを追加します:

1. [Vercel ダッシュボード](https://vercel.com/dashboard)にアクセス
2. `xtrade` プロジェクトを選択
3. **Settings** → **Domains**に移動
4. ドメインを追加:
   - 本番環境: `xtrade.tqer39.dev`
   - 開発環境: `xtrade-dev.tqer39.dev`
5. Vercel が自動的に DNS 設定を検出し、検証します

## よくある問題と解決方法

### 問題: DNS レコードが伝播しない

**症状:** `dig` や `nslookup` で結果が返されない

**解決方法:**

1. **伝播を待つ**: DNS の変更には最大 48 時間かかることがあります
2. **ローカル DNS キャッシュをクリア**:

   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches

   # Windows
   ipconfig /flushdns
   ```

3. **レコード作成を確認**:

   ```bash
   gcloud dns record-sets list --zone="tqer39-dev"
   ```

### 問題: レジストラでネームサーバーが更新されていない

**症状:** ドメインが古いネームサーバーを指したままになっている

**解決方法:**

1. レジストラのネームサーバーが GCP のネームサーバーと一致することを確認
2. レジストラの伝播を待つ(最大 24 時間かかることがあります)
3. ネームサーバーエントリにタイポがないか確認

### 問題: DNSSEC 検証エラー

**症状:** DNSSEC が有効な場合にドメインが解決されない

**解決方法:**

1. レジストラで一時的に DNSSEC を無効化
2. Cloud DNS ゾーンで DNSSEC を有効化
3. GCP から DS レコードをコピーしてレジストラに設定
4. 伝播を待つ

### 問題: Vercel ドメイン検証が失敗する

**症状:** Vercel が「Invalid Configuration」と表示

**解決方法:**

1. DNS レコードが伝播していることを確認(`dig` を使用して確認)
2. A/CNAME レコードが正しい Vercel ターゲットを指していることを確認
3. Vercel でドメインを削除して再追加
4. 数分待ってから検証を再試行

## セキュリティのベストプラクティス

1. **DNSSEC を有効化**: DNS スプーフィングから保護します

   ```bash
   gcloud dns managed-zones update tqer39-dev \
     --dnssec-state=on
   ```

2. **ゾーンアクセスを制限**: IAM ロールを使用して DNS レコードを変更できるユーザーを制限します

   ```bash
   gcloud dns managed-zones add-iam-policy-binding tqer39-dev \
     --member="user:admin@example.com" \
     --role="roles/dns.admin"
   ```

3. **監査ログを有効化**: DNS の変更を追跡します
   - **IAM と管理** → **監査ログ**に移動
   - Cloud DNS のログを有効化

4. **Terraform を使用**: Infrastructure as Code により、一貫性とバージョン管理が保証されます

## コストに関する考慮事項

**Cloud DNS の料金:**

- **ホストゾーン**: 月額 $0.20 ゾーンあたり
- **クエリ**: 100 万クエリあたり $0.40(最初の 10 億クエリ/月)
- **無料枠**: 最初の 25 マネージドゾーンは無料

**推定月額コスト:**

- xtrade プロジェクトの場合: 月額約 $0.20〜$1.00(トラフィックによる)

## 次のステップ

1. Vercel で SSL/TLS 証明書を設定(カスタムドメインで自動)
2. DNS の可用性を監視する設定を行う
3. `infra/terraform/` に DNS 設定をドキュメント化する
4. DNS レコードをバージョン管理に追加する

## 関連ドキュメント

- [Terraform Configuration](./terraform-environment-variables.md)
- [GitHub Secrets Setup](./github-secrets.md)
- [GCP Cloud DNS Documentation](https://cloud.google.com/dns/docs)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
