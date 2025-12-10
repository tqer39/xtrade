# Stripe API キーは環境変数 TF_VAR_stripe_api_key から取得
variable "stripe_api_key" {
  description = "Stripe Secret API Key"
  type        = string
  sensitive   = true
}

provider "stripe" {
  api_key = var.stripe_api_key
}
