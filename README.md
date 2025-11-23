# xtrade

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
- **インフラ**: Vercel + GCP Cloud DNS (Terraform 管理)
- **開発ツール**: mise, just, pre-commit

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

### 開発サーバーの起動

```bash
# データベースのマイグレーション実行
npm run db:migrate

# 開発サーバー起動
npm run dev
```

ブラウザで `http://localhost:3000` を開くと、アプリケーションが起動します。

## 利用可能なコマンド

```bash
# すべての利用可能なタスクを表示
just help

# コード品質チェック
just lint

# 一般的なフォーマット問題の修正
just fix

# pre-commit キャッシュのクリーン
just clean

# 開発ツールの更新
just update-brew  # Homebrew パッケージを更新
just update       # mise 管理ツールを更新
just update-hooks # pre-commit フックを更新

# mise ステータス表示
just status
```

## プロジェクト構成

```text
xtrade/
├── app/              # Next.js App Router（フロントエンド + API）
├── src/              # 共通ライブラリ、DB、ドメインサービス、認証
│   ├── lib/          # 共通ユーティリティ
│   ├── db/           # データベース接続とスキーマ
│   ├── modules/      # ドメインモジュール
│   └── components/   # 共通 UI コンポーネント
├── terraform/        # インフラ構成（IaC）
│   ├── modules/      # 再利用可能な Terraform モジュール
│   ├── environments/ # 環境ごとの設定（dev / prod）
│   └── global/       # グローバルリソース（DNS など）
├── docs/             # ドキュメント
├── .github/          # GitHub Actions、CODEOWNERS、PR テンプレート
├── .claude/          # Claude Code Agent 設定
└── scripts/          # 開発用スクリプト
```

詳細なアーキテクチャについては [docs/architecture.md](docs/architecture.md) を参照してください。

## Agent 構成

xtrade では、Claude Code の Sub Agent を活用して責務を分離した開発を行います。

### Agent 一覧

- **ArchAgent**: アーキテクチャ設計・規約管理
- **DBAgent**: データベース・スキーマ管理
- **AuthAgent**: 認証・セッション管理
- **APIAgent**: API・ビジネスロジック
- **UIAgent**: UI・UX
- **TestAgent**: テスト・品質保証

詳細は [CLAUDE.md](CLAUDE.md#xtrade-開発用-agent-構成) を参照してください。

## ドキュメント

- [アーキテクチャ設計書](docs/architecture.md)
- [AI ルール](docs/AI_RULES.ja.md)
- [Claude Code 利用ガイド](docs/CLAUDE.ja.md)

## ライセンス

このプロジェクトは [LICENSE](LICENSE) ファイルに基づいてライセンスされています。

## ツールの責務

このセットアップでは、ツールの責務を明確に分離しています：

- **brew**: システムレベルの開発ツール (git, pre-commit, mise, just, uv)
- **mise**: Node.js バージョン管理のみ
- **uv**: Python パッケージとプロジェクト管理
- **pre-commit**: すべてのリンティングツールを自動処理（個別インストール不要）

### 自動 AI CLI ツール

`just setup` 実行時（または `just ai-install` で手動実行）に Claude Code CLI を自動インストールします：

- **Claude Code CLI**: `@anthropic-ai/claude-code` - VS Code での AI アシスト開発用

このアプローチにより、懸念事項の明確な分離と、システムツールと言語固有バージョン間の競合を回避します。
