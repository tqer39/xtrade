locals {
  config     = yamldecode(file("../../../config.yml"))
  env_config = local.config.environments.dev
  r2_config  = local.config.cloudflare.r2.dev
}

module "r2" {
  source = "../../../modules/r2"

  account_id    = var.cloudflare_account_id
  bucket_name   = local.r2_config.bucket_name
  location      = local.r2_config.location
  zone_id       = var.cloudflare_zone_id
  custom_domain = local.r2_config.custom_domain
}
