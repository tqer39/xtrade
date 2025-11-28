output "project_id" {
  description = "Neon プロジェクト ID"
  value       = neon_project.this.id
}

output "project_name" {
  description = "Neon プロジェクト名"
  value       = neon_project.this.name
}

output "default_branch_id" {
  description = "デフォルトブランチ ID"
  value       = neon_project.this.default_branch_id
}

output "database_name" {
  description = "データベース名"
  value       = neon_database.this.name
}

output "database_owner" {
  description = "データベースオーナー名"
  value       = neon_role.this.name
}

output "endpoint_id" {
  description = "コンピュートエンドポイント ID"
  value       = local.default_endpoint.id
}

output "endpoint_host" {
  description = "コンピュートエンドポイントのホスト名"
  value       = local.default_endpoint.host
}

output "connection_uri" {
  description = "データベース接続 URI（パスワードは含まない）"
  value       = "postgres://${neon_role.this.name}@${local.default_endpoint.host}/${neon_database.this.name}?sslmode=require"
  sensitive   = false
}

output "connection_uri_pooled" {
  description = "プーリング接続 URI（パスワードは含まない）"
  value       = "postgres://${neon_role.this.name}@${local.default_endpoint.host}/${neon_database.this.name}?sslmode=require&pgbouncer=true"
  sensitive   = false
}

output "role_password" {
  description = "データベースロールのパスワード"
  value       = neon_role.this.password
  sensitive   = true
}
