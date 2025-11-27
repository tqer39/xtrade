output "project_id" {
  description = "Vercel プロジェクト ID"
  value       = vercel_project.this.id
}

output "project_name" {
  description = "Vercel プロジェクト名"
  value       = vercel_project.this.name
}

output "deployment_url" {
  description = "デプロイメント URL"
  value       = "https://${var.project_name}.vercel.app"
}
