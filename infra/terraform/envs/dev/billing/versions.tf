terraform {
  required_version = "1.14.4"
  required_providers {
    stripe = {
      source  = "lukasaron/stripe"
      version = ">= 3.4.1"
    }
  }
  backend "s3" {
    bucket  = "terraform-tfstate-tqer39-072693953877-ap-northeast-1"
    key     = "xtrade/infra/terraform/envs/dev/dev-billing.tfstate"
    encrypt = true
    region  = "ap-northeast-1"
  }
}
