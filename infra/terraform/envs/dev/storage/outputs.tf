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
