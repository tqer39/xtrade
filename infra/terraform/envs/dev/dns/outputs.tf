output "dns_records" {
  description = "作成された DNS レコード"
  value       = module.dns.records
}

output "dev_fqdn" {
  description = "dev 環境の FQDN"
  value       = "${local.env_config.subdomain}.${local.domain}"
}
