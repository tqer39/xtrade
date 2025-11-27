output "zone_name" {
  description = "DNS ゾーン名"
  value       = google_dns_managed_zone.main.name
}

output "dns_name" {
  description = "DNS 名"
  value       = google_dns_managed_zone.main.dns_name
}

output "name_servers" {
  description = "ネームサーバーリスト（ドメインレジストラで設定する必要があります）"
  value       = google_dns_managed_zone.main.name_servers
}

output "zone_id" {
  description = "DNS ゾーン ID"
  value       = google_dns_managed_zone.main.id
}

output "prod_fqdn" {
  description = "本番環境の FQDN"
  value       = var.prod_subdomain != "" ? "${var.prod_subdomain}.${trimsuffix(var.dns_name, ".")}" : null
}

output "dev_fqdn" {
  description = "開発環境の FQDN"
  value       = var.dev_subdomain != "" ? "${var.dev_subdomain}.${trimsuffix(var.dns_name, ".")}" : null
}
