output "neon_project_id" {
  description = "Neon プロジェクト ID"
  value       = module.neon.project_id
}

output "neon_project_name" {
  description = "Neon プロジェクト名"
  value       = module.neon.project_name
}

output "database_connection_uri" {
  description = "データベース接続 URI（パスワード含む）"
  value       = module.neon.connection_uri
  sensitive   = true
}

output "database_connection_uri_pooled" {
  description = "プーリング接続 URI（パスワード含む）"
  value       = module.neon.connection_uri_pooled
  sensitive   = true
}

output "database_password" {
  description = "データベースパスワード（Vercel 環境変数に設定）"
  value       = module.neon.role_password
  sensitive   = true
}
