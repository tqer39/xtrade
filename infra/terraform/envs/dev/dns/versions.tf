terraform {
  required_version = "1.14.5"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "5.16.0"
    }
  }
  backend "s3" {
    bucket  = "terraform-tfstate-tqer39-072693953877-ap-northeast-1"
    key     = "xtrade/infra/terraform/envs/dev/dev-dns.tfstate"
    encrypt = true
    region  = "ap-northeast-1"
  }
}
