locals {
  config     = yamldecode(file("../../../config.yml"))
  env_config = local.config.environments.dev
  domain     = local.config.project.domain
}

# frontend の state から CNAME ターゲットを取得
data "terraform_remote_state" "frontend" {
  backend = "s3"
  config = {
    bucket = "terraform-tfstate-tqer39-072693953877-ap-northeast-1"
    key    = "xtrade/infra/terraform/envs/dev/dev-frontend.tfstate"
    region = "ap-northeast-1"
  }
}

module "dns" {
  source = "../../../modules/cloudflare"

  zone_id = var.cloudflare_zone_id

  records = [
    {
      name    = local.env_config.subdomain
      type    = "CNAME"
      content = data.terraform_remote_state.frontend.outputs.vercel_cname_target
      proxied = false
      comment = "xtrade dev environment - Vercel"
    }
  ]
}
