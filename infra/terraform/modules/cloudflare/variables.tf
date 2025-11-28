variable "zone_id" {
  description = "CloudFlare Zone ID"
  type        = string
}

variable "records" {
  description = "DNS レコードのリスト"
  type = list(object({
    name    = string
    type    = string
    content = string
    ttl     = optional(number, 1) # 1 = auto
    proxied = optional(bool, false)
    comment = optional(string, "")
  }))
  default = []
}
