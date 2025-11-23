provider "aws" {
  region = local.region.apne1
  default_tags {
    tags = merge(local.aws_config.dev, {
      "${local.project.name}:source_path" = "./infra/terraform/envs/${local.aws_config.dev.env}/bootstrap"
    })
  }
}
