# Cloudflare R2 バケット
resource "cloudflare_r2_bucket" "this" {
  account_id = var.account_id
  name       = var.bucket_name
  location   = var.location
}

# カスタムドメイン用 DNS レコード（オプション）
resource "cloudflare_dns_record" "r2_custom_domain" {
  count = var.custom_domain != null && var.zone_id != null ? 1 : 0

  zone_id = var.zone_id
  name    = var.custom_domain
  type    = "CNAME"
  content = "${var.account_id}.r2.cloudflarestorage.com"
  ttl     = 1    # Auto（proxied=true の場合は自動）
  proxied = true # プロキシ必須（R2カスタムドメイン要件）
  comment = "R2 bucket custom domain for ${var.bucket_name}"
}
