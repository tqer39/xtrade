# =============================================================================
# Product Outputs
# =============================================================================

output "basic_product_id" {
  description = "Basic プランの Product ID"
  value       = stripe_product.basic.id
}

output "premium_product_id" {
  description = "Premium プランの Product ID"
  value       = stripe_product.premium.id
}

# =============================================================================
# Price Outputs
# =============================================================================

output "basic_price_id" {
  description = "Basic プラン（月額）の Price ID"
  value       = stripe_price.basic_monthly.id
}

output "premium_price_id" {
  description = "Premium プラン（月額）の Price ID"
  value       = stripe_price.premium_monthly.id
}

# =============================================================================
# Webhook Outputs
# =============================================================================

output "webhook_endpoint_id" {
  description = "Webhook エンドポイント ID"
  value       = stripe_webhook_endpoint.main.id
}

output "webhook_endpoint_secret" {
  description = "Webhook エンドポイントのシークレット（署名検証用）"
  value       = stripe_webhook_endpoint.main.secret
  sensitive   = true
}

output "webhook_endpoint_url" {
  description = "Webhook エンドポイント URL"
  value       = stripe_webhook_endpoint.main.url
}
