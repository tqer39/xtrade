# 共通設定の読み込み
locals {
  config        = yamldecode(file("../../../config.yml"))
  env_config    = local.config.environments.dev
  vercel_config = local.config.vercel.dev
  github        = local.config.github
  domain        = local.config.project.domain
  app_url       = "https://${local.env_config.subdomain}.${local.domain}"
}

# 認証関連のシークレット（TF_VAR_ 環境変数から取得）
variable "better_auth_secret" {
  description = "BetterAuth のシークレットキー"
  type        = string
  sensitive   = true
}

variable "twitter_client_id" {
  description = "X (Twitter) OAuth クライアント ID"
  type        = string
  sensitive   = true
}

variable "twitter_client_secret" {
  description = "X (Twitter) OAuth クライアントシークレット"
  type        = string
  sensitive   = true
}

variable "admin_twitter_username" {
  description = "管理者の X ユーザー名（@なし）- ホワイトリスト機能の管理者"
  type        = string
  sensitive   = true
  default     = ""
}

# Vercel プロジェクトの作成
module "vercel" {
  source = "../../../modules/vercel"

  project_name     = local.vercel_config.project_name
  framework        = local.vercel_config.framework
  build_command    = local.vercel_config.build_command
  output_directory = local.vercel_config.output_directory
  install_command  = local.vercel_config.install_command

  # GitHub リポジトリ設定
  repository_owner  = local.github.repository_owner
  repository_name   = local.github.repository_name
  production_branch = "main"

  # カスタムドメイン
  custom_domain = "${local.env_config.subdomain}.${local.domain}"

  # 環境変数（database からの参照）
  environment_variables = {
    DATABASE_URL           = data.terraform_remote_state.database.outputs.database_connection_uri_pooled
    DATABASE_URL_UNPOOLED  = data.terraform_remote_state.database.outputs.database_connection_uri
    NODE_ENV               = "production"
    BETTER_AUTH_URL        = local.app_url
    NEXT_PUBLIC_APP_URL    = local.app_url
    BETTER_AUTH_SECRET     = var.better_auth_secret
    TWITTER_CLIENT_ID      = var.twitter_client_id
    TWITTER_CLIENT_SECRET  = var.twitter_client_secret
    ADMIN_TWITTER_USERNAME = var.admin_twitter_username
  }
}

# database の outputs を参照
data "terraform_remote_state" "database" {
  backend = "s3"
  config = {
    bucket = "terraform-tfstate-tqer39-072693953877-ap-northeast-1"
    key    = "xtrade/infra/terraform/envs/dev/dev-database.tfstate"
    region = "ap-northeast-1"
  }
}
