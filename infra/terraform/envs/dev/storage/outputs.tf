output "r2_bucket_name" {
  description = "R2 バケット名"
  value       = module.r2.bucket_name
}

output "r2_bucket_id" {
  description = "R2 バケット ID"
  value       = module.r2.bucket_id
}

output "r2_public_url" {
  description = "R2 バケットのパブリック URL（カスタムドメイン）"
  value       = module.r2.public_url
}

output "r2_endpoint" {
  description = "R2 S3互換エンドポイント（GitHub Secrets設定用）"
  value       = module.r2.r2_endpoint
  sensitive   = true
}
