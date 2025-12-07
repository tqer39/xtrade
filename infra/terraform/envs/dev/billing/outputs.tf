# =============================================================================
# Stripe Outputs
# =============================================================================

output "basic_product_id" {
  description = "Basic プランの Product ID"
  value       = module.stripe.basic_product_id
}

output "basic_price_id" {
  description = "Basic プラン（月額）の Price ID"
  value       = module.stripe.basic_price_id
}

output "premium_product_id" {
  description = "Premium プランの Product ID"
  value       = module.stripe.premium_product_id
}

output "premium_price_id" {
  description = "Premium プラン（月額）の Price ID"
  value       = module.stripe.premium_price_id
}

output "webhook_endpoint_id" {
  description = "Webhook エンドポイント ID"
  value       = module.stripe.webhook_endpoint_id
}

output "webhook_endpoint_secret" {
  description = "Webhook エンドポイントのシークレット（署名検証用）"
  value       = module.stripe.webhook_endpoint_secret
  sensitive   = true
}

output "webhook_endpoint_url" {
  description = "Webhook エンドポイント URL"
  value       = module.stripe.webhook_endpoint_url
}
