variable "account_id" {
  description = "Cloudflare Account ID"
  type        = string
  sensitive   = true
}

variable "bucket_name" {
  description = "R2 バケット名"
  type        = string
}

variable "location" {
  description = "R2 バケットのロケーション (APAC, EEUR, ENAM, WEUR, WNAM)"
  type        = string
  default     = "APAC"
}

variable "zone_id" {
  description = "CloudFlare Zone ID（カスタムドメイン設定用）"
  type        = string
  default     = null
  sensitive   = true
}

variable "custom_domain" {
  description = "R2 バケットのカスタムドメイン（例: card-images）"
  type        = string
  default     = null
}
