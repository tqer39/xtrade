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

# データベースの作成（プロジェクトのデフォルトブランチに作成）
resource "neon_database" "this" {
  project_id = neon_project.this.id
  branch_id  = neon_project.this.default_branch_id
  name       = var.database_name
  owner_name = var.database_owner
}

# コンピュートエンドポイントの作成
resource "neon_endpoint" "this" {
  project_id = neon_project.this.id
  branch_id  = neon_project.this.default_branch_id

  type                     = "read_write"
  autoscaling_limit_min_cu = var.compute_min_cu
  autoscaling_limit_max_cu = var.compute_max_cu

  # サスペンド設定（秒）
  suspend_timeout_seconds = var.suspend_timeout_seconds
}

# ロール（ユーザー）の作成
resource "neon_role" "this" {
  project_id = neon_project.this.id
  branch_id  = neon_project.this.default_branch_id
  name       = var.database_owner
}
