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

## プロジェクト構造とモジュール構成

xtrade はモノレポ構成で、フロントエンド・バックエンド・インフラをすべてこのリポジトリで管理する。

### ディレクトリ構成

```text
xtrade/
├── app/              # Next.js App Router（フロントエンド + API）
├── src/              # 共通ライブラリ、DB、ドメインサービス、認証
├── terraform/        # インフラ構成（IaC）
│   ├── modules/      # 再利用可能な Terraform モジュール
│   ├── environments/ # 環境ごとの設定（dev / prod）
│   └── global/       # グローバルリソース（DNS など）
├── docs/             # ドキュメント
├── .github/          # GitHub Actions、CODEOWNERS、PR テンプレート
├── .claude/          # Claude Code Agent 設定
└── scripts/          # 開発用スクリプト
```

### 各ディレクトリの役割

- **app/**: Next.js App Router ベースの xtrade 本体。API と UI を含む。
- **src/**: 共通ライブラリ、DB レイヤ、ドメインサービス、認証など。
- **terraform/**: Terraform による IaC。GCP DNS、Vercel プロジェクト、環境変数の管理。
- **docs/**: セットアップと使用方法の日本語ドキュメント。
- **.github/**: ワークフロー、`CODEOWNERS`、ラベル、PR テンプレート。
- **.claude/**: Claude Code の Agent 設定ファイル。
- **scripts/**: 開発用スクリプト（効果音再生など）。
- **設定ファイル**: `.editorconfig`、`.pre-commit-config.yaml`、`.prettierrc`、`.tool-versions`。

## ビルド・テスト・開発コマンド

- `make bootstrap`: Homebrew のインストール（macOS/Linux のみ）。
- `brew bundle install`: `Brewfile` から開発ツールをインストール。
- `just setup`: mise によるツールプロビジョニング、AI CLI のインストール、pre-commit のインストール。
- `just lint`: すべてのファイルに対して pre-commit チェックを実行。
- `just fix`: 一般的な自動修正を適用（EOF、空白、Markdown）。
- `just update-brew` / `just update` / `just update-hooks`: パッケージ、ツール、フックの更新。

## コーディングスタイルと命名規則

- インデント: `.editorconfig` に従う
  - デフォルト: 2 スペース
  - Python: 4 スペース
  - `Makefile`: タブ
  - 改行: LF、ファイル末尾に改行を入れる
- フォーマット: Prettier（`.prettierrc` で設定）、markdownlint、yamllint。
- テキスト品質: cspell、textlint（Markdown 用）。
- ファイル名: 可能な限り小文字とハイフンを使用。
- シェル: shellcheck に準拠。
- YAML/JSON: 有効かつリント可能であること。

## テストガイドライン

- この boilerplate はリントに重点を置いており、ユニットテストフレームワークは事前設定されていない。
- コードを追加する場合、`tests/` 配下にテストを配置し、エコシステムの規範に従う：
  - JavaScript: `__tests__/` または `*.test.ts`
  - Python: `tests/test_*.py`（pytest 使用）
- PR を開く前に `just lint` が通ることを確認。
- 新しい言語を追加する場合は、必要に応じて CI も追加。

## コミットと Pull Request ガイドライン

- コミット: 短く、命令形。絵文字はオプション（`git log` を参照）。
- 該当する場合は `#123` で issue を参照。
- PR: テンプレートを使用。説明は簡潔に。理由を含める。
- 視覚的な変更の場合はスクリーンショットや出力を含める。
- CI: GitHub Actions で pre-commit を実行。`CODEOWNERS` が自動でレビューをリクエスト。

## セキュリティと設定のヒント

- シークレットをコミットしない。フックが AWS 認証情報や秘密鍵を検出する。
- GitHub Actions は PR 説明生成のために `OPENAI_API_KEY` が必要。
- ツールバージョンは mise で管理（`.tool-versions`、Node.js はピン留め）。

## Claude Code 使用時の追加指示

- 上記ガイドラインに従い、差分を最小限に保つ。
- ツールを変更する際はドキュメントを更新する。
- ローカルで `just lint` を実行し、ワークフローが正常であることを確認する。
- VS Code と Claude Code の統合を活用し、効率的に作業する。

## xtrade 開発用 Agent 構成

xtrade では、Claude Code の Sub Agent を活用して責務を分離した開発を行う。
各 Agent は明確な責任範囲を持ち、相互に依存しながらも独立して動作する。

### Agent 一覧と責務

#### 1. ArchAgent（アーキテクチャ設計・規約）🧠

**役割**: xtrade 全体のアーキテクチャと開発規約を設計・維持する。

**担当範囲**:

- `README.md`, `docs/architecture.md`, `docs/api.md`
- Next.js 構成（App Router、Route Handlers のパス設計）
- `src/` 以下のレイヤ分けルール（`lib/`, `db/`, `modules/` など）
- コーディング規約（eslint / prettier 設定の方針）
- 依存ライブラリの選定（Drizzle / @neondatabase/serverless / BetterAuth など）

**禁止事項**:

- 具体的な API 実装や UI 実装への直接的な変更
- ドメインロジックの大幅な改修（他の Agent にタスクとして指示）

#### 2. DBAgent（データベース・スキーマ管理）🗃

**役割**: Neon + Drizzle の DB 周りを一手に引き受ける。

**担当範囲**:

- `src/db/schema.ts`, `src/db/drizzle.ts`, `drizzle.config.ts`
- `drizzle/` 配下のマイグレーション生成・適用
- インデックス・enum 定義
- 将来の read replica 対応

**禁止事項**:

- API のビジネスロジック実装
- UI 実装
- 既存テーブルの破壊的変更時は必ずコメントで移行方針を記載

#### 3. AuthAgent（認証・セッション管理）🔐

**役割**: BetterAuth の設定と X OAuth の配線を全て担当する。

**担当範囲**:

- `src/lib/auth.ts`（BetterAuth サーバ設定）
- `src/lib/auth-client.ts`（React クライアント）
- `app/api/auth/[...all]/route.ts`
- `.env.example` への必要な環境変数追記
- セッション取得ヘルパー

**禁止事項**:

- Neon Auth や他の認証基盤の使用
- ドメインロジック（トレード / ルームなど）
- DB スキーマ本体の変更（DBAgent と連携）

#### 4. APIAgent（API・ビジネスロジック）🛠

**役割**: 取引ステートマシンを守りつつ、Route Handlers で API を実装する。

**担当範囲**:

- `app/api/trades/**/*.ts`
- `app/api/rooms/**/*.ts`
- `app/api/reports/**/*.ts`
- `src/modules/**/service.ts`（ドメインサービス層）

**禁止事項**:

- Drizzle のスキーマ定義変更（DBAgent 経由）
- UI 実装
- Auth 設定の大幅変更
- 状態遷移ロジックを勝手に変更（`docs/architecture.md` のステートマシン定義と整合必須）

#### 5. UIAgent（UI・UX）🎨

**役割**: 最低限の UI をサクサク組む。ユーザーフローを途切れなく繋ぐ。

**担当範囲**:

- `app/**/page.tsx`
- 共通レイアウト・ナビ（`app/layout.tsx`）
- UI コンポーネント（`src/components/**`）
- BetterAuth クライアント API を使ったログインボタンなど

**禁止事項**:

- 複雑なビジネスロジック（取引状態の判定など）
- DB 直接アクセス（API 経由 or server component での db 呼び出しに限定）
- デザインはシンプル優先（Tailwind クラスを増やしすぎない）

#### 6. TestAgent（テスト・品質保証）🧪

**役割**: ユースケース単位で壊れてないかを担保する。

**担当範囲**:

- Unit テスト：`src/modules/**/__tests__/*.test.ts`
- API テスト：`app/api/**/__tests__/*.test.ts`
- E2E（必要なら）：Playwright or Cypress のセットアップ
- lint / typecheck 用の npm script

**禁止事項**:

- ビジネスロジックそのものの大量実装
- UI 変更（必要な最低限の修正はあり）

**優先順位**:

- まずは「認証＋トレード作成＋ルーム開始」の E2E を最優先でテスト化
- テストのない複雑ロジックを見つけたら TODO を残す

### Agent 間の依存関係

```mermaid
flowchart LR
    Arch[ArchAgent<br/>設計・規約] --> DBA[DBAgent<br/>Drizzle/Neon]
    Arch --> Auth[AuthAgent<br/>BetterAuth/X OAuth]
    Arch --> API[APIAgent<br/>Route Handlers/ロジック]
    Arch --> UI[UIAgent<br/>UI/UX]

    DBA --> API
    Auth --> API

    API --> Test[TestAgent<br/>E2E/Unit/Lint]
    UI  --> Test
```

### Agent 利用時の注意事項

- 各 Agent は `.claude/agents/` 配下に設定ファイルを持つ
- Agent をまたぐ変更が必要な場合は、必ず関連 Agent にコメントで指示を残す
- 設計変更は必ず `docs/` に反映する
- 詳細は `docs/agents/` 配下の各 Agent ドキュメントを参照

### タスクと担当 Agent の目安

- Next.js プロジェクトの構成を決めたい / 変更したい
  → **ArchAgent**

- Drizzle スキーマを追加・変更したい / マイグレーションを作りたい
  → **DBAgent**

- BetterAuth や X ログインの設定を追加・変更したい
  → **AuthAgent**

- `/api/trades` / `/api/rooms` などの API を実装・修正したい
  → **APIAgent**

- 画面（page.tsx）やコンポーネントの UI を作りたい・直したい
  → **UIAgent**

- テスト（Unit / API / E2E）や lint 周りを整えたい
  → **TestAgent**

## 環境構成とドメイン設定

xtrade は local / dev / prod の3環境で運用する。

### 環境ごとの URL

| 環境 | APP URL | 備考 |
| --- | --- | --- |
| local | `http://localhost:3000` | 開発用、X OAuth もここに向ける |
| dev | `https://xtrade-dev.tqer39.dev` | ステージング・動作確認用 |
| prod | `https://xtrade.tqer39.dev` | 本番 |

**重要**: dev と prod でホスト名を分けることで、Cookie と OAuth のコールバックで事故を防ぐ。

### BetterAuth / X OAuth の環境変数

#### 1. BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL

**local**:

```bash
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**dev**:

```bash
BETTER_AUTH_URL=https://xtrade-dev.tqer39.dev
NEXT_PUBLIC_APP_URL=https://xtrade-dev.tqer39.dev
```

**prod**:

```bash
BETTER_AUTH_URL=https://xtrade.tqer39.dev
NEXT_PUBLIC_APP_URL=https://xtrade.tqer39.dev
```

#### 2. X OAuth コールバック URL

Twitter（X）の Developer Portal で登録する callback URL：

- **local**: `http://localhost:3000/api/auth/callback/twitter`
- **dev**: `https://xtrade-dev.tqer39.dev/api/auth/callback/twitter`
- **prod**: `https://xtrade.tqer39.dev/api/auth/callback/twitter`

**運用方針**: MVP では 1 つの X アプリに複数 callback URL を登録する。

### DNS / Vercel 構成

```mermaid
flowchart TD
  subgraph DNS[tqer39.dev DNS]
    A[xtrade.tqer39.dev] --> V[Vercel project xtrade]
    B[xtrade-dev.tqer39.dev] --> V
  end

  subgraph Vercel[xtrade プロジェクト]
    V1[Production env<br/>https://xtrade.tqer39.dev]
    V2[Preview/Dev env<br/>https://xtrade-dev.tqer39.dev]
  end

  subgraph Local
    L[localhost:3000<br/>next dev]
  end
```

- **local**: `next dev` で `localhost:3000`
- **dev**: Vercel の Preview/Dev 環境 + `xtrade-dev.tqer39.dev` を紐付け
- **prod**: Vercel の Production 環境 + `xtrade.tqer39.dev` を紐付け

### データベース（Neon）構成

DB はドメインとは独立して環境ごとに分離：

| 環境 | DATABASE_URL | 備考 |
| --- | --- | --- |
| local | `postgres://xtrade:xtrade@localhost:5432/xtrade` | Docker の Postgres |
| dev | `postgres://...neon-dev-url...` | Neon の xtrade-dev ブランチ |
| prod | `postgres://...neon-prod-url...` | Neon の xtrade-prod ブランチ |

**運用方針**: `.env` ファイルで環境ごとに `DATABASE_URL` を切り替える。

### 環境変数管理のベストプラクティス

1. `.env.example` にすべての必要な環境変数を記載
2. `.env.local` は Git 管理外（`.gitignore` に追加済み）
3. Vercel 環境変数は Web UI で設定
4. 環境ごとに異なる値は明確にコメント

### セキュリティ考慮事項

- `BETTER_AUTH_SECRET` は環境ごとに異なる値を使用
- `TWITTER_CLIENT_SECRET` は絶対にコミットしない
- `DATABASE_URL` に含まれる認証情報は `.env.local` のみに記載
- Vercel の環境変数は暗号化されて保存される

## インフラ構成（IaC）

xtrade のインフラは Terraform で管理する。すべてのインフラ構成をコードで定義し、再現可能性を確保する。

### Terraform ディレクトリ構成

```text
terraform/
├── modules/           # 再利用可能なモジュール
│   ├── dns/          # GCP Cloud DNS モジュール
│   ├── vercel/       # Vercel プロジェクト・ドメインモジュール
│   └── neon/         # Neon DB（将来的に API 対応したら）
├── environments/      # 環境ごとの設定
│   ├── dev/          # dev 環境（xtrade-dev.tqer39.dev）
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   └── prod/         # prod 環境（xtrade.tqer39.dev）
│       ├── main.tf
│       ├── variables.tf
│       └── terraform.tfvars
└── global/           # グローバルリソース
    ├── dns.tf        # tqer39.dev の DNS ゾーン
    └── backend.tf    # Terraform state 管理
```

### 管理対象リソース

#### 1. GCP Cloud DNS

- **リソース**: `tqer39.dev` の DNS ゾーン
- **レコード**:
  - `xtrade.tqer39.dev` → Vercel の prod 環境
  - `xtrade-dev.tqer39.dev` → Vercel の dev 環境

#### 2. Vercel

- **プロジェクト**: `xtrade`
- **カスタムドメイン**:
  - Production: `xtrade.tqer39.dev`
  - Preview/Dev: `xtrade-dev.tqer39.dev`
- **環境変数**:
  - `BETTER_AUTH_URL`
  - `BETTER_AUTH_SECRET`
  - `TWITTER_CLIENT_ID` / `TWITTER_CLIENT_SECRET`
  - `DATABASE_URL`

#### 3. Terraform State 管理

- **バックエンド**: GCS（Google Cloud Storage）
- **State ファイル**: `gs://xtrade-terraform-state/`
- **ロック**: GCS のロック機能を使用

### Terraform 運用フロー

```bash
# 初期化
cd terraform/environments/dev
terraform init

# プラン確認
terraform plan

# 適用
terraform apply

# 環境変数の更新（例）
terraform apply -var="better_auth_secret=new-secret"
```

### セキュリティ考慮事項

1. **Secrets 管理**
   - `terraform.tfvars` は `.gitignore` に追加
   - センシティブな値は `sensitive = true` を設定
   - 実行時に環境変数で渡す（`TF_VAR_` prefix）

2. **State ファイル**
   - GCS バックエンドで暗号化
   - アクセス権限は必要最小限に

3. **Provider 認証**
   - GCP: Service Account の JSON キー（環境変数 `GOOGLE_APPLICATION_CREDENTIALS`）
   - Vercel: API トークン（環境変数 `VERCEL_API_TOKEN`）

### Terraform Provider バージョン

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}
```

### CI/CD との統合

GitHub Actions で Terraform の plan / apply を自動化：

- **PR 作成時**: `terraform plan` を実行し、結果をコメント
- **main マージ時**: `terraform apply` を自動実行（dev 環境）
- **リリースタグ**: `terraform apply` を実行（prod 環境）

詳細は `.github/workflows/terraform.yml` を参照。
