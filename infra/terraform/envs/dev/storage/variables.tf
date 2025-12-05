variable "cloudflare_account_id" {
  description = "CloudFlare Account ID（環境変数 TF_VAR_cloudflare_account_id で設定）"
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  description = "CloudFlare Zone ID（環境変数 TF_VAR_cloudflare_zone_id で設定）"
  type        = string
  sensitive   = true
}
