# xtrade

[![codecov](https://codecov.io/gh/tqer39/xtrade/graph/badge.svg)](https://codecov.io/gh/tqer39/xtrade)
[![Test](https://github.com/tqer39/xtrade/actions/workflows/test.yml/badge.svg)](https://github.com/tqer39/xtrade/actions/workflows/test.yml)
[![Terraform Dev](https://github.com/tqer39/xtrade/actions/workflows/terraform-dev.yml/badge.svg)](https://github.com/tqer39/xtrade/actions/workflows/terraform-dev.yml)
[![DB Migrate Dev](https://github.com/tqer39/xtrade/actions/workflows/db-migrate-dev.yml/badge.svg)](https://github.com/tqer39/xtrade/actions/workflows/db-migrate-dev.yml)

X を利用した toC 向けソーシャルトレーディングサービス

## 概要

xtrade は、X (旧 Twitter) のソーシャルグラフを活用したリアルタイムトレーディングサービスです。
ユーザーは X アカウントでログインし、トレーディングルームに参加して取引を行います。

## 特徴

- **X ログイン**: BetterAuth による X (Twitter) OAuth 認証
- **リアルタイムトレーディング**: Next.js App Router + Route Handlers によるリアルタイム取引
- **モノレポ構成**: フロントエンド・バックエンド・インフラを一元管理
- **IaC 管理**: Terraform によるインフラのコード化
- **Agent 駆動開発**: Claude Code の Sub Agent による責務分離

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router)
- **バックエンド**: Next.js Route Handlers
- **データベース**: Neon (Serverless PostgreSQL)
- **ORM**: Drizzle ORM
- **認証**: BetterAuth + X OAuth
- **インフラ**: Vercel + CloudFlare DNS (Terraform 管理)
- **開発ツール**: mise, just, prek

## 環境構成

xtrade は local / dev / prod の 3 環境で運用します。

| 環境 | APP URL | 備考 |
| --- | --- | --- |
| local | `http://localhost:3000` | 開発用 |
| dev | `https://xtrade-dev.tqer39.dev` | ステージング・動作確認 |
| prod | `https://xtrade.tqer39.dev` | 本番 |

## クイックスタート

### 前提条件

以下のツールが必要です：

- **Homebrew**: システムレベルの開発ツール
- **mise**: プログラミング言語のバージョン管理
- **just**: タスク自動化とコマンドランナー

### セットアップ

```bash
# 1. Homebrew のインストール（未インストールの場合）
make bootstrap

# 2. すべての開発ツールをインストール
brew bundle install

# 3. 開発環境のセットアップ
just setup

# 4. 環境変数の設定
cp .env.example .env.local
# .env.local を編集して、必要な値を設定
```

**ワンコマンドセットアップ**（Homebrew がインストール済みの場合）：

```bash
just setup
```

### AWS と環境変数の設定（Terraform 利用時）

Terraform で AWS をバックエンドに使用する場合：

```bash
# 1. direnv の設定
just setup-direnv
# .envrc を編集して AWS プロファイルと Neon API キーを設定

# 2. direnv を有効化
just direnv-allow

# 3. aws-vault でプロファイルを追加
just aws-add xtrade-dev
```

### 開発サーバーの起動

```bash
# ローカルデータベースの起動（Docker Compose）
just db-start

# データベースのマイグレーション実行
just db-migrate

# 開発サーバー起動
just dev
```

ブラウザで `http://localhost:3000` を開くと、アプリケーションが起動します。

## 利用可能なコマンド

### 開発環境セットアップ

```bash
# すべての利用可能なタスクを表示
just help

# 初回セットアップ（環境構築）
just setup

# 環境変数ファイルのみセットアップ
just setup-env

# Node.js 依存関係のインストール
just setup-deps

# direnv セットアップ
just setup-direnv

# direnv を有効化
just direnv-allow
```

### 開発サーバー

```bash
# 開発サーバー起動
just dev

# 本番ビルド
just build

# 本番サーバー起動
just start
```

### AWS と Terraform

```bash
# AWS プロファイル追加
just aws-add <profile-name>

# AWS プロファイル一覧
just aws-list

# AWS 認証情報でコマンド実行
just aws-exec <profile> <command>

# Terraform コマンド（-chdir で環境を指定）
just tf -chdir=infra/terraform/envs/dev/bootstrap init
just tf -chdir=infra/terraform/envs/dev/bootstrap plan
just tf -chdir=infra/terraform/envs/dev/bootstrap apply
just tf -chdir=infra/terraform/envs/dev/bootstrap output
just tf -chdir=infra/terraform/envs/dev/bootstrap destroy

# Terraform バージョン確認
just tf version
```

### データベース管理

```bash
# ローカルデータベースの起動
just db-start

# ローカルデータベースの停止
just db-stop

# データベースログの表示
just db-logs

# マイグレーション実行
just db-migrate

# マイグレーションファイル生成
just db-generate

# Drizzle Studio 起動（GUI）
just db-studio

# データベースリセット（全データ削除）
just db-reset
```

### コード品質チェック

```bash
# コード品質チェック
just lint

# 一般的なフォーマット問題の修正
just fix

# prek キャッシュのクリーン
just clean
```

### ツール更新

```bash
# 開発ツールの更新
just update-brew  # Homebrew パッケージを更新
just update       # mise 管理ツールを更新
just update-hooks # prek フックを更新

# mise ステータス表示
just status
```

## プロジェクト構成

```text
xtrade/
├── app/                    # Next.js App Router
│   ├── admin/              # 管理画面
│   ├── api/                # Route Handlers（API）
│   │   ├── auth/           # BetterAuth エンドポイント
│   │   ├── trades/         # トレード API
│   │   ├── cards/          # カード API
│   │   ├── matches/        # マッチング API
│   │   ├── me/             # ユーザー自身の API
│   │   ├── admin/          # 管理 API
│   │   └── cron/           # Cron ジョブ
│   ├── layout.tsx          # ルートレイアウト
│   └── page.tsx            # トップページ
├── src/                    # 共通ライブラリ
│   ├── lib/                # ユーティリティ（auth, utils）
│   ├── db/                 # データベース接続とスキーマ
│   ├── modules/            # ドメインモジュール
│   │   ├── trades/         # トレードドメイン
│   │   ├── cards/          # カードドメイン
│   │   ├── matches/        # マッチングドメイン
│   │   └── trust/          # 信頼スコアドメイン
│   └── components/         # 共通 UI コンポーネント
├── infra/
│   └── terraform/          # インフラ構成（IaC）
│       ├── config.yml      # 共通設定ファイル
│       ├── modules/        # 再利用可能な Terraform モジュール
│       │   ├── cloudflare/ # CloudFlare DNS
│       │   ├── vercel/     # Vercel プロジェクト
│       │   ├── neon/       # Neon DB
│       │   └── deploy-role/# デプロイ用 IAM ロール
│       └── envs/           # 環境ごとの設定
│           └── dev/        # dev 環境
│               ├── bootstrap/  # 初期セットアップ
│               ├── database/   # Neon データベース
│               ├── frontend/   # Vercel プロジェクト
│               └── dns/        # CloudFlare DNS
├── e2e/                    # E2E テスト（Playwright）
├── docs/                   # ドキュメント
├── .github/                # GitHub Actions、CODEOWNERS
├── .claude/                # Claude Code Agent 設定
└── scripts/                # 開発用スクリプト
```

詳細なアーキテクチャについては [docs/architecture.md](docs/architecture.md) を参照してください。

## MCP サーバー

Claude Code の能力を拡張するため、以下の MCP サーバーを導入しています：

### 導入済み MCP サーバー

- **Context7**: 最新のライブラリドキュメントとコード例を提供
  - Terraform、AWS SDK などの公式ドキュメントをリアルタイムで取得
  - 古い情報やハルシネーションを排除
- **Serena**: セマンティックコード検索と編集機能を提供
  - IDE のようなコード理解と編集機能を LLM に追加
  - プロジェクト全体のコンテキストを活用した開発支援

### MCP サーバーのセットアップ

MCP サーバーは既に設定済みです。Claude Code を再起動すると自動的に有効化されます。

```bash
# 設定を確認（~/.claude.json に保存されています）
cat ~/.claude.json
```

詳細は [Context7 公式ドキュメント](https://github.com/upstash/context7) と [Serena 公式ドキュメント](https://github.com/oraios/serena) を参照してください。

## Agent 構成

xtrade では、Claude Code の Sub Agent を活用して責務を分離した開発を行います。

### Agent 一覧

- **ArchAgent** 🧠: アーキテクチャ設計・規約管理
- **DBAgent** 🗃: データベース・スキーマ管理（Drizzle）
- **AuthAgent** 🔐: 認証・セッション管理（BetterAuth）
- **APIAgent** 🛠: API・ビジネスロジック
- **UIAgent** 🎨: UI・UX
- **TestAgent** 🧪: テスト・品質保証
- **SecurityAgent** 🔒: セキュリティチェック・脆弱性検出
- **DocAgent** 📝: ドキュメント管理

詳細は [CLAUDE.md](CLAUDE.md#xtrade-開発用-agent-構成) を参照してください。

## インフラ管理（Terraform）

### Bootstrap（初回デプロイ）

Dev 環境の初回セットアップ時に実行：

```bash
# 1. AWS と環境変数のセットアップ
just setup-direnv
# .envrc を編集して NEON_API_KEY と AWS_VAULT_PROFILE を設定
just direnv-allow

# 2. AWS プロファイル追加
just aws-add xtrade-dev

# 3. Terraform 実行
just tf -chdir=infra/terraform/envs/dev/bootstrap init
just tf -chdir=infra/terraform/envs/dev/bootstrap plan
just tf -chdir=infra/terraform/envs/dev/bootstrap apply

# 4. 接続情報確認
just tf -chdir=infra/terraform/envs/dev/bootstrap output
```

詳細は [infra/terraform/envs/dev/bootstrap/README.md](infra/terraform/envs/dev/bootstrap/README.md) を参照してください。

## ドキュメント

- [アーキテクチャ設計書](docs/architecture.md)
- [AI ルール](docs/AI_RULES.ja.md)
- [Claude Code 利用ガイド](docs/CLAUDE.ja.md)
- [Terraform Bootstrap](infra/terraform/envs/dev/bootstrap/README.md)

## ライセンス

このプロジェクトは [LICENSE](LICENSE) ファイルに基づいてライセンスされています。

## ツールの責務

このセットアップでは、ツールの責務を明確に分離しています：

- **brew**: システムレベルの開発ツール
  - git, mise, just, uv
  - aws-vault（AWS 認証情報管理）
  - direnv（ディレクトリごとの環境変数管理）
- **mise**: プログラミング言語とツールのバージョン管理
  - Node.js 24
  - Terraform 1.14.0
  - prek (latest) - Git hooks フレームワーク
- **uv**: Python パッケージとプロジェクト管理
- **prek**: すべてのリンティングツールを自動処理（Rust 製で高速、pre-commit の完全互換）
- **aws-vault**: Terraform state の AWS S3 バックエンド用の安全な認証情報管理
- **direnv**: プロジェクトディレクトリごとの環境変数自動ロード

このアプローチにより、懸念事項の明確な分離と、システムツールと言語固有バージョン間の競合を回避します。
