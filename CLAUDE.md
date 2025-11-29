# Claude Code プロジェクト指示

以下のプロジェクト規約に従い、すべて日本語で回答してください。詳細は `docs/AI_RULES.ja.md` を参照。

## 基本方針

- **日本語での応答を徹底する。**
- 変更は最小限・フォーカスで、無関係な修正は避ける。
- 既存設定（`.editorconfig`、`.prettierrc`、`.pre-commit-config.yaml`）に準拠する。
- `just lint` が通る提案のみ行う。
- セキュリティ情報（API キー、認証情報等）を含めない。
- ファイル参照は `path/to/file:line` の形式で短く明示する。
- 大きな変更は動機と範囲を先に提示する。

## Git 操作ルール

- **`git commit` はユーザーの明示的な指示があるまで実行しない。**
- `git add` でステージングまでは行ってよいが、コミットは必ずユーザーの確認を得る。
- `git push` もユーザーの明示的な指示があるまで実行しない。
- コミットメッセージの提案は行ってよいが、実行はユーザーに委ねる。

## プロジェクト構造

```text
xtrade/
├── app/              # Next.js App Router（フロントエンド + API）
├── src/              # 共通ライブラリ、DB、ドメインサービス
├── infra/terraform/  # インフラ構成（IaC）
├── docs/             # ドキュメント
├── .github/          # GitHub Actions、CODEOWNERS
├── .claude/          # Claude Code Agent 設定
└── scripts/          # 開発用スクリプト
```

詳細は `docs/architecture.ja.md` と `docs/directory-structure.ja.md` を参照。

## 主要コマンド

- `make bootstrap`: Homebrew インストール
- `just setup`: 開発環境セットアップ（mise、pre-commit）
- `just lint`: すべてのファイルをチェック
- `just fix`: 自動修正適用
- `npm run dev`: ローカル開発サーバー起動

詳細は `docs/local-dev.ja.md` を参照。

## コーディング規約

- インデント: デフォルト 2 スペース（Python は 4 スペース）
- フォーマット: Prettier、markdownlint、yamllint
- ファイル名: 小文字とハイフン
- シェル: shellcheck 準拠

## Agent 構成

xtrade では以下の Agent を使用して責務を分離：

- **ArchAgent** 🧠: アーキテクチャ設計・規約
- **DBAgent** 🗃: データベース・スキーマ管理（Drizzle）
- **AuthAgent** 🔐: 認証・セッション管理（BetterAuth）
- **APIAgent** 🛠: API・ビジネスロジック
- **UIAgent** 🎨: UI・UX
- **TestAgent** 🧪: テスト・品質保証
- **SecurityAgent** 🔒: セキュリティチェック・脆弱性検出
- **DocAgent** 📝: ドキュメント管理

各 Agent の詳細は `.claude/agents/` 配下の設定ファイルを参照。

## 環境構成

| 環境 | URL | データベース |
| --- | --- | --- |
| local | `http://localhost:3000` | Docker Postgres |
| dev | `https://xtrade-dev.tqer39.dev` | Neon xtrade-dev |
| prod | `https://xtrade.tqer39.dev` | Neon xtrade-prod |

### 重要な環境変数

- `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL`: 環境ごとの URL
- `BETTER_AUTH_SECRET`: 環境ごとに異なる値
- `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`: X OAuth
- `DATABASE_URL`: Neon 接続文字列

詳細は `.env.example` と `docs/local-dev.ja.md` を参照。

## インフラ構成（Terraform）

```text
infra/terraform/
├── modules/          # 再利用可能なモジュール（cloudflare, neon, vercel）
├── envs/             # 環境ごとの設定（dev, prod）
└── config.yml        # 共通設定
```

### 管理対象リソース

- **CloudFlare**: `tqer39.dev` ドメインの DNS レコード
- **Neon**: PostgreSQL データベース
- **Vercel**: フロントエンドホスティングとドメイン設定

### Terraform 運用

```bash
just tf -chdir=dev/dns init
just tf -chdir=dev/dns plan
just tf -chdir=dev/dns apply
```

詳細は以下を参照：

- `docs/terraform-environment-variables.ja.md`: Terraform 環境変数
- `docs/github-secrets.ja.md`: GitHub Secrets 設定

## CI/CD

- **PR 作成時**: `terraform plan` を実行、結果をコメント
- **main マージ時**: `terraform apply` を自動実行（dev）
- **DB マイグレーション**: PR では dry-run、main マージ時に自動実行

ワークフローは `.github/workflows/` を参照。

## セキュリティ

- シークレットは絶対にコミットしない
- `.env.local` は Git 管理外
- GitHub Secrets に認証情報を保存

## 参考ドキュメント

- アーキテクチャ: `docs/architecture.ja.md`
- ディレクトリ構成: `docs/directory-structure.ja.md`
- ローカル開発: `docs/local-dev.ja.md`
- GitHub Secrets: `docs/github-secrets.ja.md`
