variable "environment" {
  description = "環境名（dev, prod）"
  type        = string
}

variable "app_url" {
  description = "アプリケーション URL（例: https://xtrade-dev.tqer39.dev）"
  type        = string
}

variable "basic_product_name" {
  description = "Basic プランの商品名"
  type        = string
  default     = "xtrade Basic"
}

variable "basic_product_description" {
  description = "Basic プランの商品説明"
  type        = string
  default     = "xtrade Basic プラン - マッチング制限緩和"
}

variable "basic_price_amount" {
  description = "Basic プランの月額料金（日本円）"
  type        = number
  default     = 200
}

variable "premium_product_name" {
  description = "Premium プランの商品名"
  type        = string
  default     = "xtrade Premium"
}

variable "premium_product_description" {
  description = "Premium プランの商品説明"
  type        = string
  default     = "xtrade Premium プラン - 全機能解放"
}

variable "premium_price_amount" {
  description = "Premium プランの月額料金（日本円）"
  type        = number
  default     = 400
}

variable "webhook_enabled_events" {
  description = "Webhook で有効にするイベントリスト"
  type        = list(string)
  default = [
    "checkout.session.completed",
    "checkout.session.expired",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.resumed",
    "invoice.paid",
    "invoice.payment_failed",
    "invoice.payment_action_required",
  ]
}
