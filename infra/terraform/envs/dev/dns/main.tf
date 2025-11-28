locals {
  config     = yamldecode(file("../../../config.yml"))
  env_config = local.config.environments.dev
  domain     = local.config.project.domain
}

module "dns" {
  source = "../../../modules/cloudflare"

  zone_id = var.cloudflare_zone_id

  records = [
    {
      name    = local.env_config.subdomain
      type    = "CNAME"
      content = var.vercel_cname_target
      proxied = false
      comment = "xtrade dev environment - Vercel"
    }
  ]
}
