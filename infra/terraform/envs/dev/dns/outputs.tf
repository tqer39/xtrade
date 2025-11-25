output "zone_name" {
  description = "DNS ゾーン名"
  value       = module.dns.zone_name
}

output "dns_name" {
  description = "DNS 名"
  value       = module.dns.dns_name
}

output "name_servers" {
  description = "ネームサーバーリスト（ドメインレジストラで設定してください）"
  value       = module.dns.name_servers
}

output "dev_fqdn" {
  description = "dev 環境の FQDN"
  value       = module.dns.dev_fqdn
}
