output "neon_project_id" {
  description = "Neon プロジェクト ID"
  value       = module.neon.project_id
}

output "neon_project_name" {
  description = "Neon プロジェクト名"
  value       = module.neon.project_name
}

output "database_connection_uri" {
  description = "データベース接続 URI（パスワードなし）"
  value       = module.neon.connection_uri
}

output "database_connection_uri_pooled" {
  description = "プーリング接続 URI（パスワードなし）"
  value       = module.neon.connection_uri_pooled
}

output "database_password" {
  description = "データベースパスワード（Vercel 環境変数に設定）"
  value       = module.neon.role_password
  sensitive   = true
}

output "vercel_env_vars" {
  description = "Vercel に設定する環境変数のテンプレート"
  value = {
    DATABASE_URL          = "${replace(module.neon.connection_uri_pooled, "postgres://xtrade@", "postgres://xtrade:PASSWORD@")}"
    DATABASE_URL_UNPOOLED = "${replace(module.neon.connection_uri, "postgres://xtrade@", "postgres://xtrade:PASSWORD@")}"
  }
}
