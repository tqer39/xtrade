# xtrade Dev 環境 Database

このディレクトリは xtrade の開発（dev）環境のデータベース（Neon）リソースを管理します。

## Database の役割

以下のリソースを作成します：

- Neon データベースプロジェクト
- データベースとロール
- コンピュートエンドポイント

これらのリソースは Vercel アプリケーションから接続するデータベースとして使用されます。

## リソース

- **Neon Database**: xtrade-dev プロジェクト
  - データベース: `xtrade`
  - リージョン: `aws-us-east-2`
  - コンピュート: 0.25 - 1 CU（自動スケーリング）

## 前提条件

### 1. Neon API キーの取得

1. [Neon Console](https://console.neon.tech/) にログイン
2. Account Settings → API Keys → Generate new API key
3. API キーをコピー

### 2. 環境変数の設定

#### 方法 A: direnv を使用（推奨）

```bash
# 1. このディレクトリに .envrc を作成
cd infra/terraform/envs/dev/database
cp .envrc.example .envrc

# 2. .envrc を編集して API キーを設定
vim .envrc  # または任意のエディタ

# 3. direnv を有効化
direnv allow

# 4. 環境変数が読み込まれたことを確認
echo $NEON_API_KEY
```

#### 方法 B: 環境変数を直接設定

```bash
export NEON_API_KEY="your-neon-api-key"
```

#### 方法 C: プロジェクトルートの .envrc を使用

```bash
# プロジェクトルートで設定（全環境で共有）
cd /path/to/xtrade
cp .envrc.example .envrc
vim .envrc  # API キーを設定
direnv allow
```

## 使い方

### 初期化

```bash
# justfile を使用（推奨）
just tf -chdir=infra/terraform/envs/dev/database init

# または直接実行
cd infra/terraform/envs/dev/database
terraform init
```

### プランの確認

```bash
# justfile を使用（推奨）
just tf -chdir=infra/terraform/envs/dev/database plan

# または直接実行
terraform plan
```

### リソースの作成

```bash
# justfile を使用（推奨）
just tf -chdir=infra/terraform/envs/dev/database apply

# または直接実行
terraform apply
```

### 接続情報の取得

```bash
# データベース接続 URI を取得
terraform output database_connection_uri

# データベースパスワードを取得（sensitive）
terraform output -raw database_password

# Vercel 環境変数のテンプレートを取得
terraform output vercel_env_vars
```

### リソースの削除

```bash
terraform destroy
```

## 出力される情報

- `neon_project_id`: Neon プロジェクト ID
- `database_connection_uri`: データベース接続 URI（pooling）
- `database_password`: データベースパスワード（sensitive）
- `vercel_env_vars`: Vercel に設定する環境変数のテンプレート

## 注意事項

### セキュリティ

- `terraform.tfstate` ファイルにはパスワードなどの機密情報が含まれます
- `.gitignore` で state ファイルを除外してください
- 本番運用では remote backend（Terraform Cloud / S3 など）の使用を推奨

### アップグレード

- `terraform init -upgrade` は慎重に実行してください
- 必ず `terraform plan` で変更内容を確認してから `apply` してください
- リソースの置換が発生する場合、データ損失の可能性があります

## トラブルシューティング

### API キーエラー

```bash
Error: error getting neon client: missing API key
```

→ `NEON_API_KEY` 環境変数が設定されているか確認してください。

### リージョンエラー

```bash
Error: Invalid value for variable
```

→ `variables.tf` で有効な Neon リージョンを指定してください。
