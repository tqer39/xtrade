# Google Cloud Provider 設定
provider "google" {
  project = var.gcp_project_id
  region  = local.gcp_config.region
}
