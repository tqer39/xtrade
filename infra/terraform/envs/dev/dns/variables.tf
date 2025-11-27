variable "gcp_project_id" {
  description = "GCP プロジェクト ID（環境変数 TF_VAR_gcp_project_id から設定）"
  type        = string
}

variable "dev_cname_target" {
  description = "dev 環境の Vercel CNAME ターゲット（例: cname.vercel-dns.com.）"
  type        = string
  default     = ""
}
