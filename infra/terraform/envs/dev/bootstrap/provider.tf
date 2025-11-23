provider "aws" {
  region = local.config.aws.region
  default_tags {
    tags = {
      env                                        = local.config.environments.dev.name
      product                                    = local.config.project.name
      repository                                 = local.config.project.repository
      IaC                                        = local.config.aws.IaC
      "${local.config.project.name}:source_path" = "./infra/terraform/envs/${local.config.environments.dev.name}/bootstrap"
    }
  }
}
