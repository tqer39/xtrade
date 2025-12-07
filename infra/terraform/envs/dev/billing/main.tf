# =============================================================================
# 共通設定の読み込み
# =============================================================================

locals {
  config     = yamldecode(file("../../../config.yml"))
  env_config = local.config.environments.dev
  stripe     = local.config.stripe.dev
  domain     = local.config.project.domain
  app_url    = "https://${local.env_config.subdomain}.${local.domain}"
}

# =============================================================================
# Stripe モジュール
# =============================================================================

module "stripe" {
  source = "../../../modules/stripe"

  environment = local.env_config.name
  app_url     = local.app_url

  # Basic プラン設定
  basic_product_name        = local.stripe.basic.product_name
  basic_product_description = local.stripe.basic.product_description
  basic_price_amount        = local.stripe.basic.price_amount

  # Premium プラン設定
  premium_product_name        = local.stripe.premium.product_name
  premium_product_description = local.stripe.premium.product_description
  premium_price_amount        = local.stripe.premium.price_amount
}
