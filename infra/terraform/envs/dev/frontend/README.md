# xtrade Dev 環境 Frontend

このディレクトリは xtrade の開発（dev）環境の Frontend アプリケーションリソースを管理します。

## Vercel の役割

以下のリソースを作成します：

- Vercel プロジェクト
- GitHub リポジトリ連携
- 環境変数設定（DATABASE_URL など）
- デプロイメント設定

Next.js アプリケーションを Vercel へデプロイするために使用されます。

## リソース

- **Vercel Project**: xtrade-dev
  - Framework: Next.js
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`
- **GitHub Repository**: tqer39/xtrade
  - Production Branch: `main`

## 前提条件

### 1. Vercel API トークンの取得

1. [Vercel Dashboard](https://vercel.com/account/tokens) にアクセス
2. "Create Token" をクリック
3. スコープを選択（推奨: Full Access）
4. トークンをコピー

### 2. 環境変数の設定

#### 方法 A: direnv を使用（推奨）

```bash
# 1. このディレクトリに .envrc を作成
cd infra/terraform/envs/dev/frontend
cp .envrc.example .envrc

# 2. .envrc を編集して API トークンを設定
vim .envrc  # または任意のエディタ

# 3. direnv を有効化
direnv allow

# 4. 環境変数が読み込まれたことを確認
echo $VERCEL_API_TOKEN
```

#### 方法 B: 環境変数を直接設定

```bash
export VERCEL_API_TOKEN="your-vercel-token"
```

#### 方法 C: プロジェクトルートの .envrc を使用

```bash
# プロジェクトルートで設定（全環境で共有）
cd /path/to/xtrade
cp .envrc.example .envrc
vim .envrc  # VERCEL_API_TOKEN を設定
direnv allow
```

### 3. データベースの作成

Vercel モジュールは database モジュールの outputs を参照するため、先にデータベースを作成する必要があります。

```bash
# database モジュールを先に apply
just tf -chdir=infra/terraform/envs/dev/database apply
```

## 使い方

### 初期化

```bash
# justfile を使用（推奨）
just tf -chdir=infra/terraform/envs/dev/frontend init

# または直接実行
cd infra/terraform/envs/dev/frontend
terraform init
```

### プランの確認

```bash
# justfile を使用（推奨）
just tf -chdir=infra/terraform/envs/dev/frontend plan

# または直接実行
terraform plan
```

### リソースの作成

```bash
# justfile を使用（推奨）
just tf -chdir=infra/terraform/envs/dev/frontend apply

# または直接実行
terraform apply
```

### プロジェクト情報の取得

```bash
# Vercel プロジェクト ID を取得
just tf -chdir=infra/terraform/envs/dev/frontend output vercel_project_id

# デプロイメント URL を取得
just tf -chdir=infra/terraform/envs/dev/frontend output vercel_deployment_url

# 全ての出力を表示
just tf -chdir=infra/terraform/envs/dev/frontend output
```

### リソースの削除

```bash
terraform destroy
```

## 出力される情報

- `vercel_project_id`: Vercel プロジェクト ID
- `vercel_project_name`: Vercel プロジェクト名
- `vercel_deployment_url`: デプロイメント URL

## 環境変数

Vercel プロジェクトに自動的に設定される環境変数：

| 環境変数名 | 説明 | ソース |
| -------- | ---- | ------ |
| DATABASE_URL | Neon データベース接続 URI（pooled） | database モジュール |
| DATABASE_URL_UNPOOLED | Neon データベース接続 URI（unpooled） | database モジュール |
| NODE_ENV | Node.js 環境（production） | ハードコード |

## デプロイフロー

```text
1. GitHub に push
   ↓
2. Vercel が自動的に検知
   ↓
3. ビルド実行（npm run build）
   ↓
4. デプロイ完了
   ↓
5. デプロイメント URL にアクセス可能
```

## 注意事項

### セキュリティ

- `terraform.tfstate` ファイルには機密情報が含まれます
- `.gitignore` で state ファイルを除外してください
- 本番運用では remote backend（S3）を使用

### デプロイメント

- GitHub の `main` ブランチへの push が本番デプロイをトリガーします
- プレビューデプロイは PR ごとに自動作成されます

### 環境変数の更新

環境変数を変更した場合：

1. `terraform apply` を実行
2. Vercel で再デプロイが必要になることがあります

## トラブルシューティング

### API トークンエラー

```bash
Error: error getting vercel client: missing API token
```

→ `VERCEL_API_TOKEN` 環境変数が設定されているか確認してください。

### データベース接続エラー

```bash
Error: data.terraform_remote_state.database: no outputs found
```

→ database モジュールを先に `terraform apply` してください。

### GitHub リポジトリ連携エラー

```bash
Error: repository not found
```

→ Vercel アカウントに GitHub リポジトリへのアクセス権限があるか確認してください。
