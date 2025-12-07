# =============================================================================
# Stripe Products
# =============================================================================

# Basic プラン商品
resource "stripe_product" "basic" {
  name        = var.basic_product_name
  description = var.basic_product_description
  active      = true

  metadata = {
    environment = var.environment
    plan_type   = "basic"
  }
}

# Premium プラン商品
resource "stripe_product" "premium" {
  name        = var.premium_product_name
  description = var.premium_product_description
  active      = true

  metadata = {
    environment = var.environment
    plan_type   = "premium"
  }
}

# =============================================================================
# Stripe Prices (月額サブスクリプション)
# =============================================================================

# Basic プラン価格（月額）
resource "stripe_price" "basic_monthly" {
  product     = stripe_product.basic.id
  currency    = "jpy"
  unit_amount = var.basic_price_amount
  nickname    = "Basic Monthly"

  recurring {
    interval       = "month"
    interval_count = 1
  }

  metadata = {
    environment = var.environment
    plan_type   = "basic"
    interval    = "monthly"
  }
}

# Premium プラン価格（月額）
resource "stripe_price" "premium_monthly" {
  product     = stripe_product.premium.id
  currency    = "jpy"
  unit_amount = var.premium_price_amount
  nickname    = "Premium Monthly"

  recurring {
    interval       = "month"
    interval_count = 1
  }

  metadata = {
    environment = var.environment
    plan_type   = "premium"
    interval    = "monthly"
  }
}

# =============================================================================
# Stripe Webhook Endpoint
# =============================================================================

resource "stripe_webhook_endpoint" "main" {
  url            = "${var.app_url}/api/stripe/webhook"
  description    = "xtrade ${var.environment} webhook endpoint"
  enabled_events = var.webhook_enabled_events

  metadata = {
    environment = var.environment
  }
}
