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

- ルート: 開発ツールとドキュメント。アプリランタイムはまだない。
- `.github/`: ワークフロー、`CODEOWNERS`、ラベル、PR テンプレート。
- `docs/`: セットアップと使用方法の日本語ドキュメント。
- `Makefile`、`justfile`、`Brewfile`: 環境構築とタスク実行。
- 設定: `.editorconfig`、`.pre-commit-config.yaml`、`.prettierrc`、`.tool-versions`。

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
