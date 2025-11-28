variable "project_name" {
  description = "Vercel プロジェクト名"
  type        = string
}

variable "framework" {
  description = "フレームワーク（nextjs, react, vue など）"
  type        = string
  default     = "nextjs"
}

variable "repository_owner" {
  description = "GitHub リポジトリのオーナー名"
  type        = string
}

variable "repository_name" {
  description = "GitHub リポジトリ名"
  type        = string
}

variable "production_branch" {
  description = "本番デプロイ用のブランチ名"
  type        = string
  default     = "main"
}

variable "build_command" {
  description = "ビルドコマンド"
  type        = string
  default     = "npm run build"
}

variable "output_directory" {
  description = "ビルド出力ディレクトリ"
  type        = string
  default     = ".next"
}

variable "install_command" {
  description = "依存関係インストールコマンド"
  type        = string
  default     = "npm install"
}

variable "environment_variables" {
  description = "環境変数（key-value ペア）"
  type        = map(string)
  default     = {}
}
