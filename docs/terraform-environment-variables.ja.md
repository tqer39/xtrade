# Terraform 環境変数管理ガイド

[🇺🇸 English](./terraform-environment-variables.md)

このドキュメントでは、direnv を使って Terraform の環境変数を管理する方法を説明します。

## 概要

xtrade プロジェクトでは、環境変数の管理に **direnv** を使用します。これにより、ディレクトリごとに異なる環境変数を自動的にロード/アンロードできます。

## direnv の基本

### direnv とは

direnv は、ディレクトリに入ると自動的に環境変数をロードし、出ると自動的にアンロードするツールです。

### 動作の仕組み

1. ディレクトリに `.envrc` ファイルを配置
2. `direnv allow` で許可
3. ディレクトリに入ると自動的に環境変数がロードされる
4. ディレクトリを出ると自動的に環境変数がアンロードされる

## Terraform での使用パターン

### パターン 1: プロジェクトルートで管理（全環境共通）

**推奨度**: ⭐⭐⭐⭐⭐（最も簡単）

```bash
# プロジェクトルート
/Users/you/workspace/xtrade/
├── .envrc              # ← ここに配置
├── .envrc.example
└── infra/terraform/...
```

**セットアップ**:

```bash
cd /Users/you/workspace/xtrade
cp .envrc.example .envrc
vim .envrc  # API キーを設定
direnv allow
```

**.envrc の例**:

```bash
# AWS Vault Profile
export AWS_VAULT_PROFILE=xtrade-dev
export AWS_REGION=ap-northeast-1

# Neon API Key
export NEON_API_KEY=neon_api_xxxxxxxxxxxxx

# Terraform 変数として自動読み込み
export TF_VAR_neon_api_key="${NEON_API_KEY}"
```

**メリット**:

- プロジェクト全体で一度設定すればOK
- どのディレクトリからでも `just tf` コマンドが動く

**デメリット**:

- 環境（dev/prod）ごとに変数を切り替えられない

### パターン 2: 環境ごとに .envrc を配置（環境別管理）

**推奨度**: ⭐⭐⭐⭐（環境を厳密に分離したい場合）

```bash
infra/terraform/envs/
├── dev/
│   ├── .envrc              # ← dev 環境用
│   ├── .envrc.example
│   └── database/
│       └── main.tf
└── prod/
    ├── .envrc              # ← prod 環境用
    ├── .envrc.example
    └── database/
        └── main.tf
```

**セットアップ**:

```bash
# dev 環境
cd infra/terraform/envs/dev
cp .envrc.example .envrc
vim .envrc  # dev 用の API キーを設定
direnv allow

# prod 環境
cd infra/terraform/envs/prod
cp .envrc.example .envrc
vim .envrc  # prod 用の API キーを設定
direnv allow
```

**メリット**:

- 環境ごとに異なる API キーを使用できる
- 誤って別環境のリソースを操作するリスクが減る

**デメリット**:

- 各環境で個別に設定が必要

### パターン 3: モジュールごとに .envrc を配置（最も細かい管理）

**推奨度**: ⭐⭐⭐（特殊なケースのみ）

```bash
infra/terraform/envs/dev/
├── database/
│   ├── .envrc              # ← database 専用
│   └── main.tf
├── vercel/
│   ├── .envrc              # ← vercel 専用
│   └── main.tf
└── dns/
    ├── .envrc              # ← dns 専用
    └── main.tf
```

**メリット**:

- モジュールごとに必要な環境変数だけを定義できる

**デメリット**:

- 管理が煩雑になる

## Terraform 変数の自動読み込み

### TF_VAR_ プレフィックス

Terraform は `TF_VAR_` で始まる環境変数を自動的に変数として認識します。

**例**:

```bash
# .envrc
export NEON_API_KEY=neon_api_xxxxxxxxxxxxx
export TF_VAR_neon_api_key="${NEON_API_KEY}"
```

```hcl
# variables.tf
variable "neon_api_key" {
  description = "Neon API Key"
  type        = string
  sensitive   = true
}

# provider.tf
provider "neon" {
  api_key = var.neon_api_key
}
```

### 直接環境変数を使う方法

Provider によっては、特定の環境変数名を直接認識します。

**Neon の例**:

```bash
# .envrc
export NEON_API_KEY=neon_api_xxxxxxxxxxxxx
```

```hcl
# provider.tf
provider "neon" {
  # NEON_API_KEY 環境変数を自動的に使用
}
```

## 実践例：Neon データベースのローカル terraform plan

Neon データベースの Terraform をローカルで実行する手順を説明します。

### ステップ 1: API キーの取得

1. [Neon Console](https://console.neon.tech/) にログイン
2. **Account Settings** → **API Keys** → **Generate new API key** をクリック
3. API キーをコピー（`neon_api_` で始まる文字列）

### ステップ 2: .envrc の設定

```bash
# プロジェクトルートで設定（推奨）
cd /path/to/xtrade
cp .envrc.example .envrc
vim .envrc
```

**.envrc** に以下を追加：

```bash
# AWS Vault Profile（Terraform Backend 用）
export AWS_VAULT_PROFILE=portfolio

# Neon API Key（ここに実際のキーを貼り付け）
export NEON_API_KEY=neon_api_xxxxxxxxxxxxx
```

### ステップ 3: direnv の有効化

```bash
direnv allow
```

### ステップ 4: 環境変数の確認

```bash
echo $NEON_API_KEY
# → neon_api_xxxxxxxxxxxxx（実際の値が表示されればOK）
```

### ステップ 5: Terraform の実行

```bash
# 初期化（初回のみ）
just tf -chdir=dev/database init

# plan 実行
just tf -chdir=dev/database plan

# apply 実行（必要な場合）
just tf -chdir=dev/database apply
```

### トラブルシューティング

#### エラー: `authorization key must be provided`

```text
Error: authorization key must be provided
```

**原因**: `NEON_API_KEY` 環境変数が設定されていません。

**解決策**:

```bash
# 環境変数を確認
echo $NEON_API_KEY

# 設定されていない場合、.envrc を確認して direnv allow を実行
direnv allow
```

#### エラー: `database owner not found`

```text
Error: database owner not found; role_name:"xtrade"
```

**原因**: Terraform のリソース依存関係の問題（ロールが作成される前にデータベースが作成されようとしている）

**解決策**: `infra/terraform/modules/neon/main.tf` で `neon_database` リソースに `depends_on = [neon_role.this]` が設定されていることを確認してください。

#### エラー: `ENDPOINTS_LIMIT_EXCEEDED`

```text
Error: read_write endpoint already exists
```

**原因**: Neon プロジェクト作成時、デフォルトエンドポイントが自動作成されるため追加するとエラーになります。

**解決策**: `neon_endpoint` リソースを削除し、`data "neon_branch_endpoints"` でデフォルトエンドポイントを参照してください。

## トラブルシューティング

### 環境変数が読み込まれない

```bash
# direnv のステータス確認
direnv status

# .envrc を再読み込み
direnv allow
```

### 別の環境変数が優先されている

```bash
# 環境変数の優先順位を確認
env | grep NEON_API_KEY

# direnv の環境変数のみ表示
direnv export bash | grep NEON_API_KEY
```

### .envrc が自動的にロードされない

```bash
# direnv のフックが有効か確認
echo $DIRENV_ACTIVE
# → 1 が返ってくれば有効

# シェルの設定を確認（.zshrc や .bashrc）
# 以下の行が必要：
# eval "$(direnv hook zsh)"  # zsh の場合
# eval "$(direnv hook bash)" # bash の場合
```

## セキュリティのベストプラクティス

### 1. .envrc をバージョン管理に含めない

```bash
# .gitignore に含まれていることを確認
cat .gitignore | grep .envrc
# → .envrc が含まれていればOK
```

### 2. .envrc.example を用意する

```bash
# テンプレートとして .envrc.example を作成
cp .envrc .envrc.example

# 実際のキーを削除して、プレースホルダーに置き換える
vim .envrc.example
```

### 3. API キーを環境変数名で管理する

```bash
# ❌ 悪い例：ハードコード
export NEON_API_KEY=neon_api_1234567890abcdef

# ✅ 良い例：パスワードマネージャーから取得
export NEON_API_KEY=$(op read "op://Private/Neon API Key/credential")
```

## まとめ

| パターン | 推奨度 | ユースケース |
| -------- | ------ | ------------ |
| プロジェクトルート | ⭐⭐⭐⭐⭐ | 個人開発、環境が1つ |
| 環境ごと | ⭐⭐⭐⭐ | チーム開発、dev/prod 分離 |
| モジュールごと | ⭐⭐⭐ | 複雑なモジュール構成 |

**xtrade での推奨**: プロジェクトルートで `.envrc` を管理し、必要に応じて環境ごとに分ける。
