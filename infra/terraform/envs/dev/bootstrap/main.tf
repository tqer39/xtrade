# 共通設定の読み込み
locals {
  config     = yamldecode(file("../../../config.yml"))
  project    = local.config.project
  aws_config = local.config.aws
}

module "deploy_role" {
  source = "../../../modules/deploy-role"

  aws_account_id = local.aws_config.dev.aws_account_id
  aws_env_name   = local.aws_config.dev.aws_env_name
  app_env_name   = local.aws_config.dev.app_env_name
  organization   = local.project.organization
  repository     = local.project.repository_name
}
