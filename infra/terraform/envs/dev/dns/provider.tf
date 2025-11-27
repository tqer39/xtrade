# Google Cloud Provider 設定
provider "google" {
  project = local.gcp_config.project_id
  region  = local.gcp_config.region
}
