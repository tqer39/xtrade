terraform {
  required_version = ">= 1.9"
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
  }
  backend "s3" {
    bucket  = "terraform-tfstate-tqer39-072693953877-ap-northeast-1"
    key     = "xtrade/infra/terraform/envs/dev/dev-frontend.tfstate"
    encrypt = true
    region  = "ap-northeast-1"
  }
}
