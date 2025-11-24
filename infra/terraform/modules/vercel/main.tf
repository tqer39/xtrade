terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
}

# Vercel プロジェクトの作成
resource "vercel_project" "this" {
  name      = var.project_name
  framework = var.framework

  # GitHub リポジトリ連携
  git_repository = {
    type              = "github"
    repo              = "${var.repository_owner}/${var.repository_name}"
    production_branch = var.production_branch
  }

  # ビルド設定
  build_command    = var.build_command
  output_directory = var.output_directory
  install_command  = var.install_command

  # 自動デプロイ設定
  auto_assign_custom_domains = true
}

# 環境変数の設定
resource "vercel_project_environment_variable" "this" {
  for_each = var.environment_variables

  project_id = vercel_project.this.id
  key        = each.key
  value      = each.value
  target     = ["production", "preview", "development"]
}
