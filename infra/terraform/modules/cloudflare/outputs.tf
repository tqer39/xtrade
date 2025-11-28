output "records" {
  description = "作成された DNS レコード"
  value = {
    for k, v in cloudflare_dns_record.this : k => {
      id      = v.id
      name    = v.name
      type    = v.type
      content = v.content
      proxied = v.proxied
    }
  }
}

output "fqdns" {
  description = "作成された FQDN のリスト"
  value       = [for r in cloudflare_dns_record.this : r.name]
}
