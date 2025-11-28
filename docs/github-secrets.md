# GitHub Secrets Configuration

[🇯🇵 日本語版](./github-secrets.ja.md)

This document lists all the GitHub Secrets required for the xtrade project's CI/CD workflows.

## Required Secrets

### Database

| Secret Name | Description | Used In | Required |
| -------- | ---- | ------ | -------- |
| `DATABASE_URL_DEV` | Neon database connection URL for dev environment (pooled) | `db-migrate-dev.yml` | Yes |

**How to get**: Retrieve from Neon dashboard or Terraform output after applying the database module.

**Format**: `postgresql://[user]:[password]@[host]/[database]?sslmode=require`

### Terraform

| Secret Name | Description | Used In | Required |
| -------- | ---- | ------ | -------- |
| `NEON_API_KEY` | Neon API key for Terraform | `terraform-dev.yml` | Yes |
| `VERCEL_API_TOKEN` | Vercel API token for Terraform | `terraform-dev.yml` | Yes |
| `CLOUDFLARE_API_TOKEN` | CloudFlare API token (for DNS management) | `terraform-dev.yml` | Yes |
| `CLOUDFLARE_ACCOUNT_ID` | CloudFlare Account ID | `terraform-dev.yml` | Yes |
| `SLACK_WEBHOOK_DEV` | Slack webhook URL for dev environment notifications | `terraform-dev.yml` | No |

**How to get**:

- Neon: [Neon Console](https://console.neon.tech/) → Account Settings → API Keys
- Vercel: [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token
- CloudFlare API Token: [CloudFlare Dashboard](https://dash.cloudflare.com/profile/api-tokens) → Create Token → Use "Edit zone DNS" template
- CloudFlare Account ID: [CloudFlare Dashboard](https://dash.cloudflare.com/) → Account menu in top right → Account ID, or on the Overview page of any domain
- Slack: [Slack API](https://api.slack.com/messaging/webhooks)

**Note**: `CLOUDFLARE_ZONE_ID` is automatically retrieved via Terraform data source, so it does not need to be configured.

### GitHub Apps

| Secret Name | Description | Used In | Required |
| -------- | ---- | ------ | -------- |
| `GHA_APP_ID` | GitHub App ID for automated commits | `update-license-year.yml` | No |
| `GHA_APP_PRIVATE_KEY` | GitHub App private key | `update-license-year.yml` | No |

**How to get**: Create a GitHub App in repository settings and generate a private key.

### AI/LLM

| Secret Name | Description | Used In | Required |
| -------- | ---- | ------ | -------- |
| `OPENAI_API_KEY` | OpenAI API key for PR description generation | `generate-pr-description.yml` | No |

**How to get**: [OpenAI Platform](https://platform.openai.com/api-keys)

### Automatic Secrets

These secrets are automatically provided by GitHub Actions and do not need to be configured:

| Secret Name | Description | Used In |
| -------- | ---- | ------ |
| `GITHUB_TOKEN` | Automatically generated token for GitHub API access | All workflows |

## How to Configure Secrets

### Repository Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

### Environment-Specific Secrets

For production environments, consider using GitHub Environments:

1. Go to **Settings** → **Environments**
2. Create a new environment (e.g., `production`)
3. Add environment-specific secrets
4. Configure deployment protection rules if needed

## Security Best Practices

1. **Rotation**: Regularly rotate API keys and tokens
2. **Least Privilege**: Grant minimum necessary permissions to each token
3. **Monitoring**: Monitor secret usage in workflow runs
4. **Never Commit**: Never commit secrets to the repository
5. **Use Environments**: Use GitHub Environments for production secrets with protection rules

## Verification

To verify that secrets are properly configured:

1. Check workflow runs in the **Actions** tab
2. Look for error messages related to missing secrets
3. Ensure all required secrets are set before running workflows

## Troubleshooting

### Secret Not Available

**Error**: `Error: Input required and not supplied: [secret-name]`

**Solution**: Verify that the secret is set in repository settings with the exact name.

### Invalid Secret Value

**Error**: Authentication or connection failures

**Solution**:

1. Verify the secret value is correct
2. Check for extra whitespace or newlines
3. Regenerate the token/key if necessary

### Permission Denied

**Error**: `Error: Resource not accessible by integration`

**Solution**: Check that the token has sufficient permissions for the required operations.

## Related Documentation

- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Terraform Environment Variables](./terraform-environment-variables.md)
- [Neon Database Setup](../infra/terraform/envs/dev/database/README.md)
