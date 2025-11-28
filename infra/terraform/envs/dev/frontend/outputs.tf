output "vercel_project_id" {
  description = "Vercel プロジェクト ID"
  value       = module.vercel.project_id
}

output "vercel_project_name" {
  description = "Vercel プロジェクト名"
  value       = module.vercel.project_name
}

output "vercel_deployment_url" {
  description = "Vercel デプロイメント URL"
  value       = module.vercel.deployment_url
}

output "vercel_cname_target" {
  description = "DNS CNAME ターゲット"
  value       = module.vercel.cname_target
}
