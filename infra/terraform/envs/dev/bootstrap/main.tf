# 共通設定の読み込み
locals {
  config = yamldecode(file("../../../config.yml"))
}

module "deploy_role" {
  source = "../../../modules/deploy-role"

  aws_account_id = local.config.aws.account_id
  aws_env_name   = local.config.aws.env_name
  app_env_name   = local.config.environments.dev.name
  organization   = local.config.project.organization
  repository     = local.config.project.repository
}
