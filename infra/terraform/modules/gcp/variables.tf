variable "project_id" {
  description = "GCP プロジェクト ID"
  type        = string
}

variable "zone_name" {
  description = "DNS ゾーン名（GCP リソース名）"
  type        = string
}

variable "dns_name" {
  description = "DNS 名（ドメイン名）。末尾にピリオドが必要"
  type        = string
}

variable "description" {
  description = "DNS ゾーンの説明"
  type        = string
  default     = "Managed by Terraform"
}

variable "ttl" {
  description = "DNS レコードの TTL（秒）"
  type        = number
  default     = 300
}

variable "dnssec_enabled" {
  description = "DNSSEC を有効にするか"
  type        = bool
  default     = false
}

variable "prod_subdomain" {
  description = "本番環境のサブドメイン（例: xtrade）"
  type        = string
  default     = ""
}

variable "prod_ip_address" {
  description = "本番環境の IP アドレス（A レコード用）"
  type        = string
  default     = ""
}

variable "prod_cname_target" {
  description = "本番環境の CNAME ターゲット"
  type        = string
  default     = ""
}

variable "dev_subdomain" {
  description = "開発環境のサブドメイン（例: xtrade-dev）"
  type        = string
  default     = ""
}

variable "dev_ip_address" {
  description = "開発環境の IP アドレス（A レコード用）"
  type        = string
  default     = ""
}

variable "dev_cname_target" {
  description = "開発環境の CNAME ターゲット"
  type        = string
  default     = ""
}
