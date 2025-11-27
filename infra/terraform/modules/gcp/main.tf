# DNS Managed Zone
resource "google_dns_managed_zone" "main" {
  name        = var.zone_name
  dns_name    = var.dns_name
  description = var.description
  project     = var.project_id

  visibility = "public"

  dynamic "dnssec_config" {
    for_each = var.dnssec_enabled ? [1] : []
    content {
      state = "on"
    }
  }
}

# A record for production subdomain
resource "google_dns_record_set" "prod_a" {
  count = var.prod_subdomain != "" && var.prod_ip_address != "" ? 1 : 0

  managed_zone = google_dns_managed_zone.main.name
  name         = "${var.prod_subdomain}.${var.dns_name}"
  type         = "A"
  ttl          = var.ttl
  rrdatas      = [var.prod_ip_address]
  project      = var.project_id
}

# CNAME record for production subdomain
resource "google_dns_record_set" "prod_cname" {
  count = var.prod_subdomain != "" && var.prod_cname_target != "" ? 1 : 0

  managed_zone = google_dns_managed_zone.main.name
  name         = "${var.prod_subdomain}.${var.dns_name}"
  type         = "CNAME"
  ttl          = var.ttl
  rrdatas      = [var.prod_cname_target]
  project      = var.project_id
}

# A record for dev subdomain
resource "google_dns_record_set" "dev_a" {
  count = var.dev_subdomain != "" && var.dev_ip_address != "" ? 1 : 0

  managed_zone = google_dns_managed_zone.main.name
  name         = "${var.dev_subdomain}.${var.dns_name}"
  type         = "A"
  ttl          = var.ttl
  rrdatas      = [var.dev_ip_address]
  project      = var.project_id
}

# CNAME record for dev subdomain
resource "google_dns_record_set" "dev_cname" {
  count = var.dev_subdomain != "" && var.dev_cname_target != "" ? 1 : 0

  managed_zone = google_dns_managed_zone.main.name
  name         = "${var.dev_subdomain}.${var.dns_name}"
  type         = "CNAME"
  ttl          = var.ttl
  rrdatas      = [var.dev_cname_target]
  project      = var.project_id
}
