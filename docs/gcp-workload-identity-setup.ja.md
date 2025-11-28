# GCP Workload Identity 設定ガイド

[🇬🇧 English](./gcp-workload-identity-setup.md)

このガイドでは、GitHub Actions から GCP リソースに安全にアクセスするための Workload Identity Federation の設定方法を説明します。

## 概要

Workload Identity Federation は、サービスアカウントキーを使用せずに、GitHub Actions から GCP リソースにアクセスできる仕組みです。OIDC（OpenID Connect）を使用して、GitHub Actions の実行時に一時的な認証情報を取得します。

## メリット

- **セキュリティ**: 長期的な認証情報（サービスアカウントキー）を保存する必要がない
- **管理の簡素化**: キーのローテーションや管理が不要
- **監査**: IAM ログで詳細なアクセス履歴を追跡可能

## 前提条件

- GCP プロジェクトが作成済み
- `gcloud` CLI がインストール済み
- プロジェクトの IAM 管理権限

## ステップ 1: サービスアカウントの作成

### gcloud CLI を使用

```bash
# プロジェクト ID を設定
export PROJECT_ID="your-project-id"

# サービスアカウントを作成
gcloud iam service-accounts create github-actions-terraform \
  --project="${PROJECT_ID}" \
  --description="Service account for GitHub Actions Terraform deployments" \
  --display-name="GitHub Actions Terraform"

# サービスアカウントのメールアドレスを取得（これが GCP_SERVICE_ACCOUNT になります）
gcloud iam service-accounts list \
  --project="${PROJECT_ID}" \
  --filter="email:github-actions-terraform@*"
```

### GCP Console を使用

1. [GCP Console](https://console.cloud.google.com/) にアクセス
2. **IAM と管理** → **サービスアカウント** に移動
3. **サービスアカウントを作成** をクリック
4. 以下を入力：
   - **サービスアカウント名**: `github-actions-terraform`
   - **サービスアカウント ID**: 自動入力される
   - **説明**: GitHub Actions Terraform deployments
5. **作成して続行** をクリック
6. **完了** をクリック
7. 作成されたサービスアカウントのメールアドレスをコピー（例: `github-actions-terraform@PROJECT_ID.iam.gserviceaccount.com`）

## ステップ 2: Workload Identity Pool の作成

### gcloud CLI を使用

```bash
# Workload Identity Pool を作成
gcloud iam workload-identity-pools create github \
  --project="${PROJECT_ID}" \
  --location="global" \
  --description="Workload Identity Pool for GitHub Actions" \
  --display-name="GitHub"

# Pool が作成されたことを確認
gcloud iam workload-identity-pools describe github \
  --project="${PROJECT_ID}" \
  --location="global"
```

### GCP Console を使用

1. **IAM と管理** → **Workload Identity プール** に移動
2. **プールを作成** をクリック
3. 以下を入力：
   - **プール名**: `github`
   - **説明**: Workload Identity Pool for GitHub Actions
4. **続行** をクリック

## ステップ 3: OIDC プロバイダーの作成

### gcloud CLI を使用

```bash
# GitHub 用の OIDC プロバイダーを作成
gcloud iam workload-identity-pools providers create-oidc github \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --display-name="GitHub" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'your-github-username'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# プロバイダーの完全パスを取得（これが GCP_WORKLOAD_IDENTITY_PROVIDER になります）
gcloud iam workload-identity-pools providers describe github \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --format="value(name)"
```

**重要**: `assertion.repository_owner == 'your-github-username'` の部分を実際の GitHub ユーザー名または Organization 名に置き換えてください。

### GCP Console を使用

1. **Workload Identity プール** → **github** プール → **プロバイダーを追加** をクリック
2. **プロバイダーを選択** で **OpenID Connect (OIDC)** を選択
3. 以下を入力：
   - **プロバイダー名**: `github`
   - **発行元（URL）**: `https://token.actions.githubusercontent.com`
4. **続行** をクリック
5. **属性マッピング** で以下を追加：
   - `google.subject` = `assertion.sub`
   - `attribute.actor` = `assertion.actor`
   - `attribute.repository` = `assertion.repository`
   - `attribute.repository_owner` = `assertion.repository_owner`
6. **属性条件** で以下を入力：

   ```text
   assertion.repository_owner == 'your-github-username'
   ```

7. **保存** をクリック
8. プロバイダーの詳細画面で **プロバイダー ID** をコピー

プロバイダーの完全パスは以下の形式になります：

```text
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github
```

## ステップ 4: 必要な API の有効化

Cloud DNS を使用するために、必要な API を有効化します。

```bash
# Cloud DNS API を有効化
gcloud services enable dns.googleapis.com --project=${PROJECT_ID}

# Service Usage API を有効化（API 利用のため）
gcloud services enable serviceusage.googleapis.com --project=${PROJECT_ID}

# IAM API を有効化（Workload Identity のため）
gcloud services enable iam.googleapis.com --project=${PROJECT_ID}

# 有効化されたことを確認
gcloud services list --enabled --project=${PROJECT_ID} | grep -E '(dns|serviceusage|iam)'
```

### GCP Console を使用

1. [API とサービス](https://console.cloud.google.com/apis/library) に移動
2. 以下の API を検索して有効化：
   - **Cloud DNS API**
   - **Service Usage API**
   - **Identity and Access Management (IAM) API**

## ステップ 5: サービスアカウントへの権限付与

### Cloud DNS 管理権限の付与

```bash
# Cloud DNS Admin ロールを付与
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-terraform@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/dns.admin"

# Service Usage Consumer ロールを付与（API 利用のため）
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-terraform@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageConsumer"
```

### Workload Identity User ロールの付与

```bash
# リポジトリ特定のバインディングを作成
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-terraform@${PROJECT_ID}.iam.gserviceaccount.com \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/your-github-username/xtrade"
```

**重要**:

- `PROJECT_NUMBER` をプロジェクト番号に置き換えてください（プロジェクト ID ではありません）
- `your-github-username` を実際の GitHub ユーザー名または Organization 名に置き換えてください

プロジェクト番号を取得するには：

```bash
gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)"
```

## ステップ 6: GitHub Secrets への登録

取得した値を GitHub リポジトリの Secrets に登録します。

### GitHub Secrets の設定

1. GitHub リポジトリに移動
2. **Settings** → **Secrets and variables** → **Actions** をクリック
3. **New repository secret** をクリック
4. 以下の Secrets を追加：

| Secret 名 | 値の例 | 説明 |
| -------- | ------ | ---- |
| `GCP_PROJECT_ID` | `xtrade-project` | GCP プロジェクト ID |
| `GCP_SERVICE_ACCOUNT` | `github-actions-terraform@xtrade-project.iam.gserviceaccount.com` | サービスアカウントのメールアドレス |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/123456789/locations/global/workloadIdentityPools/github/providers/github` | Workload Identity Provider の完全パス |

## ステップ 7: 動作確認

GitHub Actions ワークフローを実行して、GCP リソースにアクセスできることを確認します。

### テスト用ワークフロー

```yaml
name: Test GCP Authentication

on:
  workflow_dispatch:

jobs:
  test-gcp-auth:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v5

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Test gcloud command
        run: |
          gcloud config list
          gcloud projects describe ${{ secrets.GCP_PROJECT_ID }}
```

## トラブルシューティング

### Issue: 認証エラー

**エラー**: `Error: google-github-actions/auth failed with: retry function failed after X attempts`

**解決策**:

1. `GCP_WORKLOAD_IDENTITY_PROVIDER` と `GCP_SERVICE_ACCOUNT` が正しいか確認
2. Workload Identity User のバインディングが正しいか確認
3. リポジトリ名が正しいか確認（`attribute.repository` の条件）

### Issue: 権限エラー

**エラー**: `Error: PERMISSION_DENIED: The caller does not have permission`

**解決策**:

1. サービスアカウントに必要な IAM ロールが付与されているか確認
2. API が有効化されているか確認：

   ```bash
   gcloud services enable dns.googleapis.com --project=${PROJECT_ID}
   ```

### Issue: Pool または Provider が見つからない

**エラー**: `Error: Workload identity pool does not exist`

**解決策**:

1. Workload Identity Pool が作成されているか確認：

   ```bash
   gcloud iam workload-identity-pools list --location=global --project=${PROJECT_ID}
   ```

2. プロバイダーが作成されているか確認：

   ```bash
   gcloud iam workload-identity-pools providers list \
     --workload-identity-pool=github \
     --location=global \
     --project=${PROJECT_ID}
   ```

## セキュリティのベストプラクティス

1. **最小権限の原則**: サービスアカウントには必要最小限の権限のみを付与
2. **リポジトリの制限**: `attribute.repository` 条件で特定のリポジトリのみアクセスを許可
3. **監査ログの有効化**: Cloud Audit Logs を有効にして、すべてのアクセスを記録
4. **定期的な見直し**: 権限とアクセスパターンを定期的に確認

## 関連ドキュメント

- [GitHub Secrets Configuration](./github-secrets.ja.md)
- [GCP Subdomain Setup Guide](./gcp-subdomain-setup.ja.md)
- [Terraform Environment Variables](./terraform-environment-variables.ja.md)
- [Google Cloud Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions OIDC](https://docs.github.com/ja/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
