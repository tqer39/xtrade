terraform {
  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "~> 0.12.0"
    }
  }
}

# Neon プロジェクトの作成
resource "neon_project" "this" {
  name      = var.project_name
  region_id = var.region_id

  # プロジェクトの履歴保持期間（秒）
  history_retention_seconds = var.history_retention_seconds

  # クォータ設定
  quota {
    active_time_seconds  = var.quota_active_time_seconds
    compute_time_seconds = var.quota_compute_time_seconds
    written_data_bytes   = var.quota_written_data_bytes
    data_transfer_bytes  = var.quota_data_transfer_bytes
    logical_size_bytes   = var.quota_logical_size_bytes
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
