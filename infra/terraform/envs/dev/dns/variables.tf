variable "cloudflare_zone_id" {
  description = "CloudFlare Zone ID（環境変数 TF_VAR_cloudflare_zone_id または CLOUDFLARE_ZONE_ID で設定）"
  type        = string
  sensitive   = true
}
