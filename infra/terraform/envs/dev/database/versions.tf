terraform {
  required_version = "1.14.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.21.0"
    }
  }
  required_providers {
    neon = {
      source  = "kislerdm/neon"
      version = "0.12.0"
    }
  }
  backend "s3" {
    bucket  = "terraform-tfstate-tqer39-072693953877-ap-northeast-1"
    key     = "xtrade/infra/terraform/envs/dev/dev-database.tfstate"
    encrypt = true
    region  = "ap-northeast-1"
  }
}
