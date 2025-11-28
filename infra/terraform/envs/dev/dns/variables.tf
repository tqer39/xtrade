variable "cloudflare_zone_id" {
  description = "CloudFlare Zone ID（環境変数 TF_VAR_cloudflare_zone_id から設定）"
  type        = string
}

variable "vercel_cname_target" {
  description = "Vercel の CNAME ターゲット（例: cname.vercel-dns.com）"
  type        = string
  default     = "cname.vercel-dns.com"
}
