variable "project_name" {
  description = "Neon プロジェクト名"
  type        = string
}

variable "region_id" {
  description = "Neon リージョン ID（例: aws-us-east-2）"
  type        = string
  default     = "aws-us-east-2"
}

variable "default_branch_name" {
  description = "デフォルトブランチ名"
  type        = string
  default     = "main"
}

variable "database_name" {
  description = "作成するデータベース名"
  type        = string
  default     = "xtrade"
}

variable "database_owner" {
  description = "データベースオーナー名"
  type        = string
  default     = "xtrade"
}

variable "compute_min_cu" {
  description = "コンピュートの最小 CU（Compute Units）"
  type        = number
  default     = 0.25
}

variable "compute_max_cu" {
  description = "コンピュートの最大 CU（Compute Units）"
  type        = number
  default     = 1
}

variable "suspend_timeout_seconds" {
  description = "アイドル時にコンピュートをサスペンドするまでの秒数（0 = 無効）"
  type        = number
  default     = 300
}

variable "history_retention_seconds" {
  description = "履歴保持期間（秒、無料プランは最大21600秒=6時間）"
  type        = number
  default     = 21600 # 6時間（無料プランの上限）
}

variable "quota_active_time_seconds" {
  description = "アクティブタイムのクォータ（秒、-1 = 無制限）"
  type        = number
  default     = -1
}

variable "quota_compute_time_seconds" {
  description = "コンピュートタイムのクォータ（秒、-1 = 無制限）"
  type        = number
  default     = -1
}

variable "quota_written_data_bytes" {
  description = "書き込みデータのクォータ（バイト、-1 = 無制限）"
  type        = number
  default     = -1
}

variable "quota_data_transfer_bytes" {
  description = "データ転送のクォータ（バイト、-1 = 無制限）"
  type        = number
  default     = -1
}

variable "quota_logical_size_bytes" {
  description = "論理サイズのクォータ（バイト、-1 = 無制限）"
  type        = number
  default     = -1
}
