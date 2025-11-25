locals {
  config     = yamldecode(file("../../../config.yml"))
  dns_config = local.config.dns
  gcp_config = local.config.gcp
  env_config = local.config.environments.dev
}

module "dns" {
  source = "../../../modules/gcp"

  # GCP 設定
  project_id = local.gcp_config.project_id

  # DNS ゾーン設定
  zone_name   = local.dns_config.zone_name
  dns_name    = local.dns_config.dns_name
  description = local.dns_config.description
  ttl         = local.dns_config.ttl

  # DNSSEC 設定
  dnssec_enabled = local.dns_config.dnssec_enabled

  # dev 環境のサブドメイン設定
  dev_subdomain = local.env_config.subdomain

  # Vercel の CNAME ターゲットを使用（IP アドレスの代わり）
  # Vercel プロジェクトの設定画面で確認できる CNAME を設定してください
  # 例: cname.vercel-dns.com.
  dev_cname_target = var.dev_cname_target

  # 本番環境は後で設定（現在は dev のみ）
  prod_subdomain    = ""
  prod_cname_target = ""
}
