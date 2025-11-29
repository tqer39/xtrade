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
}

# 環境変数の設定
resource "vercel_project_environment_variable" "this" {
  for_each = var.environment_variables

  project_id = vercel_project.this.id
  key        = each.key
  value      = each.value
  target     = ["production", "preview", "development"]
}

# カスタムドメインの設定
resource "vercel_project_domain" "this" {
  count = var.custom_domain != "" ? 1 : 0

  project_id = vercel_project.this.id
  domain     = var.custom_domain
}
