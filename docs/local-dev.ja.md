# ローカル開発環境セットアップ

[🇺🇸 English](./local-dev.md)

このガイドでは、xtrade プロジェクトのローカル開発環境をセットアップする手順を説明します。

## 前提条件

開始する前に、以下がインストールされていることを確認してください：

- **macOS または Linux** - Windows ユーザーは WSL2 を使用してください
- **Homebrew** - macOS/Linux 用パッケージマネージャー
- **Git** - バージョン管理システム

## クイックスタート

### 1. リポジトリのクローン

```bash
git clone https://github.com/tqer39/xtrade.git
cd xtrade
```

### 2. 開発ツールのブートストラップ

Homebrew パッケージをインストール（初回のみ）：

```bash
make bootstrap
```

これにより以下がインストールされます：

- `mise` - ツールバージョンマネージャー
- `direnv` - 環境変数マネージャー
- `Brewfile` からのその他の開発ツール

### 3. セットアップの実行

完全なセットアッププロセスを実行：

```bash
just setup
```

このコマンドは以下を実行します：

1. mise 経由でツールをインストール（Node.js、Terraform、prek）
2. prek フックをインストール
3. `.env.example` から `.env.local` を作成
4. npm 依存関係をインストール
5. ローカルデータベースをセットアップ

### 4. 環境変数の設定

`.env.local` を実際の値で編集：

```bash
# データベース接続（ローカル開発に必須）
DATABASE_URL="postgresql://user:password@localhost:5432/xtrade"

# BetterAuth 設定（認証に必須）
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-key-here"

# X (Twitter) OAuth 認証情報（ローカル開発ではオプション）
TWITTER_CLIENT_ID="your-client-id"
TWITTER_CLIENT_SECRET="your-client-secret"
```

**X OAuth 認証情報の取得方法：**

1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. 新しいアプリを作成するか、既存のアプリを使用
3. "Keys and tokens" に移動
4. Client ID と Client Secret をコピー

### 5. ローカルデータベースのセットアップ

#### オプション A: Docker を使用（推奨）

```bash
# PostgreSQL コンテナを起動
docker-compose up -d

# マイグレーションを実行
npm run db:migrate

# シードデータを投入（開発用のサンプルデータ）
npm run db:seed

# または、マイグレーション + シードを一括実行
just db-setup

# Drizzle Studio を開く（オプション）
npm run db:studio
```

**シードデータについて：**

シード機能はローカル環境でのみ実行可能です。以下のサンプルデータが投入されます：

- テストユーザー（3名: 一般ユーザー2名 + 管理者1名）
- サンプルカード（15件: ポケモン、遊戯王、MTG、ワンピース）
- サンプルトレード（3件: 異なるステータス）
- その他関連データ（所持カード、欲しいカード、許可ユーザー等）

#### オプション B: 既存の PostgreSQL を使用

PostgreSQL がローカルにインストールされている場合：

```bash
# データベースを作成
createdb xtrade

# .env.local の接続文字列を更新
# DATABASE_URL="postgresql://user:password@localhost:5432/xtrade"

# マイグレーションを実行
npm run db:migrate
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは以下で利用可能になります：

- **Web アプリ**: `http://localhost:3000`
- **API エンドポイント**: `http://localhost:3000/api/*`

**ヘルスチェック：**

```bash
curl http://localhost:3000/api/health
```

## 利用可能なコマンド

### 開発

| コマンド | 説明 |
| -------- | ---- |
| `npm run dev` | 開発サーバーを起動 |
| `npm run build` | 本番用にビルド |
| `npm run start` | 本番サーバーを起動 |
| `npm run typecheck` | TypeScript 型チェックを実行 |

### データベース

| コマンド | 説明 |
| -------- | ---- |
| `npm run db:generate` | スキーマからマイグレーションファイルを生成 |
| `npm run db:migrate` | データベースにマイグレーションを適用 |
| `npm run db:studio` | Drizzle Studio を開く（データベース GUI） |
| `npm run db:seed` | シードデータを投入（ローカル環境のみ） |
| `npm run db:setup` | マイグレーション + シードを一括実行 |

### コード品質

| コマンド | 説明 |
| -------- | ---- |
| `just lint` | すべてのリンターを実行（prek） |
| `just fix` | フォーマット問題を自動修正 |
| `npm run lint` | Next.js ESLint を実行 |

### Justfile コマンド

| コマンド | 説明 |
| -------- | ---- |
| `just setup` | 完全なセットアッププロセス |
| `just setup-env` | テンプレートから .env.local を作成 |
| `just setup-deps` | npm 依存関係をインストール |
| `just setup-db` | ローカルデータベースをセットアップ |
| `just db-seed` | シードデータを投入（ローカル環境のみ） |
| `just db-setup` | マイグレーション + シードを一括実行 |
| `just lint` | prek チェックを実行 |
| `just fix` | 一般的な問題を自動修正 |

## 開発ワークフロー

### スキーマ変更の実施

1. **スキーマファイルを編集：**

   ```bash
   vim src/db/schema.ts
   ```

2. **マイグレーションを生成：**

   ```bash
   npm run db:generate
   ```

3. **マイグレーションを確認：**

   ```bash
   ls -la src/db/migrations/
   ```

4. **マイグレーションを適用：**

   ```bash
   npm run db:migrate
   ```

### PR 前のチェックリスト

プルリクエストを提出する前に、すべてのチェックが通過することを確認：

```bash
# リンターを実行
just lint

# 型チェックを実行
npm run typecheck

# ビルドが成功することを確認
npm run build
```

### コードフォーマット

プロジェクトは prek（pre-commit フック）を使用して自動フォーマットを行います：

```bash
# すべてのファイルをフォーマット
just fix

# ステージされたファイルのみフォーマット（コミット時に自動実行）
git commit
```

## よくある問題と解決策

### 問題: `mise` が見つからない

**解決策：**

```bash
# 最初に bootstrap を実行
make bootstrap

# または mise を手動でインストール
brew install mise
```

### 問題: Node.js バージョンの不一致

**解決策：**

```bash
# mise 経由で正しい Node.js バージョンをインストール
mise install nodejs@24

# バージョンを確認
node --version
```

### 問題: データベース接続失敗

**解決策：**

1. **PostgreSQL が実行中か確認：**

   ```bash
   # Docker の場合
   docker ps | grep postgres

   # ローカルインストールの場合
   pg_isready
   ```

2. **.env.local の DATABASE_URL を確認：**

   ```bash
   cat .env.local | grep DATABASE_URL
   ```

3. **接続をテスト：**

   ```bash
   psql $DATABASE_URL
   ```

### 問題: マイグレーション失敗

**解決策：**

1. **マイグレーションファイルを確認：**

   ```bash
   ls -la src/db/migrations/
   ```

2. **データベースをリセット（開発環境のみ）：**

   ```bash
   # データベースを削除して再作成
   dropdb xtrade
   createdb xtrade

   # マイグレーションを再実行
   npm run db:migrate
   ```

### 問題: ポートが既に使用中

**エラー：** `Error: listen EADDRINUSE: address already in use :::3000`

**解決策：**

```bash
# ポート 3000 を使用しているプロセスを見つける
lsof -ti:3000

# プロセスを終了
kill -9 $(lsof -ti:3000)

# または別のポートを使用
PORT=3001 npm run dev
```

### 問題: prek フックが実行されない

**解決策：**

1. **フックを再インストール：**

   ```bash
   prek install
   ```

2. **prek 設定を確認：**

   ```bash
   cat .pre-commit-config.yaml
   ```

3. **手動で実行：**

   ```bash
   prek run --all-files
   ```

### 問題: 環境変数が読み込まれない

**解決策：**

```bash
# .env.local が存在するか確認
ls -la .env.local

# direnv が動作しているか確認（direnv 使用時）
direnv allow

# 開発サーバーを再起動
npm run dev
```

### 問題: CloudFlare 認証エラー

**エラー：** `Error: failed to lookup credentials`

**解決策：**

```bash
# cf-vault プロファイルを確認
cf-vault list

# プロファイルが存在しない場合、追加
cf-vault add xtrade

# 環境変数を確認
cf-vault exec xtrade -- env | grep CLOUDFLARE
```

**エラー：** `CLOUDFLARE_API_TOKEN` または `CLOUDFLARE_ACCOUNT_ID` が見つからない

**解決策：**

```bash
# プロファイルを再追加
cf-vault add xtrade

# トークンの権限を確認（Edit zone DNS が必要）
```

## オプション: direnv による環境管理

環境変数の自動読み込みを使用する場合：

1. **.envrc を作成：**

   ```bash
   cp .envrc.example .envrc
   vim .envrc
   ```

2. **direnv を許可：**

   ```bash
   direnv allow
   ```

3. **変数が読み込まれたことを確認：**

   ```bash
   echo $DATABASE_URL
   ```

## Terraform での作業（インフラ）

### 前提条件

- AWS 認証情報が設定済み（S3 バックエンド用）
- CloudFlare API Token が設定済み（DNS 管理用）
- mise 経由で Terraform がインストール済み

### CloudFlare 認証のセットアップ（cf-vault）

CloudFlare リソースへのローカルアクセスを設定します。

#### 1. API Token の作成

1. [CloudFlare Dashboard - API Tokens](https://dash.cloudflare.com/profile/api-tokens) にアクセス
2. **Create Token** をクリック
3. **Edit zone DNS** テンプレートの **Use template** をクリック
4. **Zone Resources** で以下を設定：
   - **Include** → **Specific zone** → **tqer39.dev**
5. **Continue to summary** → **Create Token**
6. 表示されたトークンをコピー（この画面を閉じると再表示できません）

#### 2. cf-vault プロファイルの追加

```bash
# xtrade プロファイルを追加
cf-vault add xtrade

# API Token の入力を求められるので、上記で取得したトークンを貼り付け
# トークンはキーチェーンに安全に保存されます

# プロファイルが追加されたことを確認
cf-vault list
```

出力例：

```text
PROFILE NAME    AUTHENTICATION TYPE    EMAIL
xtrade          api_token
```

#### 3. 動作確認

```bash
# 環境変数が設定されることを確認
cf-vault exec xtrade -- env | grep CLOUDFLARE
```

### Terraform のセットアップ

```bash
# Terraform を初期化（初回のみ）
just tf -chdir=dev/database init

# 変更を計画
just tf -chdir=dev/database plan

# 適用（Neon データベースを作成）
just tf -chdir=dev/database apply
```

### DNS 設定（CloudFlare）

```bash
# DNS 設定を計画
just tf -chdir=dev/dns plan

# DNS 設定を適用
just tf -chdir=dev/dns apply
```

詳細は [Terraform 環境変数](./terraform-environment-variables.ja.md) を参照してください。

## 認証フローのテスト

### モック認証（開発環境）

X OAuth セットアップなしでクイックテストする場合：

1. **コード内にモックセッションを作成：**

   ```typescript
   // 開発環境のみ
   const mockSession = {
     user: {
       id: 'test-user-id',
       name: 'Test User',
       email: 'test@example.com'
     }
   }
   ```

### 実際の X OAuth（ステージング/本番）

1. `.env.local` に X OAuth 認証情報を設定
2. `http://localhost:3000/api/auth/signin/twitter` にアクセス
3. OAuth フローを完了
4. アプリケーションにリダイレクトされます

## 次のステップ

- [アーキテクチャドキュメント](./architecture.ja.md) を読む
- [ディレクトリ構造](./directory-structure.ja.md) を確認
- CI/CD セットアップのため [GitHub Secrets 設定](./github-secrets.ja.md) を確認

## ヘルプ

- **問題**: 既存の [GitHub Issues](https://github.com/tqer39/xtrade/issues) を確認
- **ドキュメント**: `docs/` ディレクトリ内の他のドキュメントを参照
- **コード**: エージェント固有のガイドラインは `.claude/agents/` を確認
