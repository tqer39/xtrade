# 共通設定の読み込み
locals {
  config      = yamldecode(file("../../../config.yml"))
  env_config  = local.config.environments.dev
  neon_config = local.config.neon.dev
}

# Neon データベースの作成
module "neon" {
  source = "../../../modules/neon"

  project_name              = local.neon_config.project_name
  region_id                 = local.env_config.neon_region
  database_name             = local.neon_config.database_name
  database_owner            = local.neon_config.database_owner
  compute_min_cu            = local.neon_config.compute_min_cu
  compute_max_cu            = local.neon_config.compute_max_cu
  suspend_timeout_seconds   = local.neon_config.suspend_timeout_seconds
  history_retention_seconds = local.neon_config.history_retention_seconds
}
