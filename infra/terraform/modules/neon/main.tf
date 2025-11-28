# Neon プロジェクトの作成
resource "neon_project" "this" {
  name      = var.project_name
  region_id = var.region_id

  # プロジェクトの履歴保持期間（秒）
  history_retention_seconds = var.history_retention_seconds

  # クォータ設定（値が0以上の場合のみ設定）
  dynamic "quota" {
    for_each = var.quota_active_time_seconds >= 0 || var.quota_compute_time_seconds >= 0 || var.quota_written_data_bytes >= 0 || var.quota_data_transfer_bytes >= 0 || var.quota_logical_size_bytes >= 0 ? [1] : []
    content {
      active_time_seconds  = var.quota_active_time_seconds >= 0 ? var.quota_active_time_seconds : null
      compute_time_seconds = var.quota_compute_time_seconds >= 0 ? var.quota_compute_time_seconds : null
      written_data_bytes   = var.quota_written_data_bytes >= 0 ? var.quota_written_data_bytes : null
      data_transfer_bytes  = var.quota_data_transfer_bytes >= 0 ? var.quota_data_transfer_bytes : null
      logical_size_bytes   = var.quota_logical_size_bytes >= 0 ? var.quota_logical_size_bytes : null
    }
  }
}

# ロール（ユーザー）の作成
resource "neon_role" "this" {
  project_id = neon_project.this.id
  branch_id  = neon_project.this.default_branch_id
  name       = var.database_owner
}

# データベースの作成（プロジェクトのデフォルトブランチに作成）
resource "neon_database" "this" {
  project_id = neon_project.this.id
  branch_id  = neon_project.this.default_branch_id
  name       = var.database_name
  owner_name = neon_role.this.name

  depends_on = [neon_role.this]
}

# デフォルトエンドポイントを参照（プロジェクト作成時に自動で作成される）
data "neon_branch_endpoints" "this" {
  project_id = neon_project.this.id
  branch_id  = neon_project.this.default_branch_id
}

locals {
  # デフォルトの read_write エンドポイントを取得
  default_endpoint = [for ep in data.neon_branch_endpoints.this.endpoints : ep if ep.type == "read_write"][0]
}
