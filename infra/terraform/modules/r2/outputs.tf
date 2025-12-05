output "bucket_name" {
  description = "R2 バケット名"
  value       = cloudflare_r2_bucket.this.name
}

output "bucket_id" {
  description = "R2 バケット ID"
  value       = cloudflare_r2_bucket.this.id
}

output "public_url" {
  description = "R2 バケットのパブリック URL"
  value       = var.custom_domain != null ? "https://${var.custom_domain}" : null
}
