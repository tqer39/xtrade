# GCP Workload Identity Setup Guide

[🇯🇵 日本語版](./gcp-workload-identity-setup.ja.md)

This guide explains how to set up Workload Identity Federation to securely access GCP resources from GitHub Actions.

## Overview

Workload Identity Federation enables GitHub Actions to access GCP resources without using service account keys. It uses OIDC (OpenID Connect) to obtain temporary credentials during GitHub Actions execution.

## Benefits

- **Security**: No need to store long-term credentials (service account keys)
- **Simplified Management**: No key rotation or management required
- **Auditing**: Detailed access history tracked in IAM logs

## Prerequisites

- GCP project created
- `gcloud` CLI installed
- IAM admin permissions for the project

## Step 1: Create Service Account

### Using gcloud CLI

```bash
# Set project ID
export PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create github-actions-terraform \
  --project="${PROJECT_ID}" \
  --description="Service account for GitHub Actions Terraform deployments" \
  --display-name="GitHub Actions Terraform"

# Get service account email (this becomes GCP_SERVICE_ACCOUNT)
gcloud iam service-accounts list \
  --project="${PROJECT_ID}" \
  --filter="email:github-actions-terraform@*"
```

### Using GCP Console

1. Go to [GCP Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Click **Create Service Account**
4. Enter the following:
   - **Service account name**: `github-actions-terraform`
   - **Service account ID**: Auto-populated
   - **Description**: GitHub Actions Terraform deployments
5. Click **Create and Continue**
6. Click **Done**
7. Copy the created service account email (e.g., `github-actions-terraform@PROJECT_ID.iam.gserviceaccount.com`)

## Step 2: Create Workload Identity Pool

### Using gcloud CLI

```bash
# Create Workload Identity Pool
gcloud iam workload-identity-pools create github \
  --project="${PROJECT_ID}" \
  --location="global" \
  --description="Workload Identity Pool for GitHub Actions" \
  --display-name="GitHub"

# Verify pool creation
gcloud iam workload-identity-pools describe github \
  --project="${PROJECT_ID}" \
  --location="global"
```

### Using GCP Console

1. Navigate to **IAM & Admin** → **Workload Identity Pools**
2. Click **Create Pool**
3. Enter the following:
   - **Pool name**: `github`
   - **Description**: Workload Identity Pool for GitHub Actions
4. Click **Continue**

## Step 3: Create OIDC Provider

### Using gcloud CLI

```bash
# Create OIDC provider for GitHub
gcloud iam workload-identity-pools providers create-oidc github \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --display-name="GitHub" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'your-github-username'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Get provider full path (this becomes GCP_WORKLOAD_IDENTITY_PROVIDER)
gcloud iam workload-identity-pools providers describe github \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github" \
  --format="value(name)"
```

**Important**: Replace `assertion.repository_owner == 'your-github-username'` with your actual GitHub username or organization name.

### Using GCP Console

1. Go to **Workload Identity Pools** → **github** pool → **Add Provider**
2. Select **OpenID Connect (OIDC)** for **Select a provider**
3. Enter the following:
   - **Provider name**: `github`
   - **Issuer (URL)**: `https://token.actions.githubusercontent.com`
4. Click **Continue**
5. Add the following **Attribute mappings**:
   - `google.subject` = `assertion.sub`
   - `attribute.actor` = `assertion.actor`
   - `attribute.repository` = `assertion.repository`
   - `attribute.repository_owner` = `assertion.repository_owner`
6. Enter the following **Attribute condition**:

   ```text
   assertion.repository_owner == 'your-github-username'
   ```

7. Click **Save**
8. Copy the **Provider ID** from the provider details page

The provider full path will be in this format:

```text
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github
```

## Step 4: Enable Required APIs

Enable the necessary APIs to use Cloud DNS.

```bash
# Enable Cloud DNS API
gcloud services enable dns.googleapis.com --project=${PROJECT_ID}

# Enable Service Usage API (for API usage)
gcloud services enable serviceusage.googleapis.com --project=${PROJECT_ID}

# Enable IAM API (for Workload Identity)
gcloud services enable iam.googleapis.com --project=${PROJECT_ID}

# Verify the APIs are enabled
gcloud services list --enabled --project=${PROJECT_ID} | grep -E '(dns|serviceusage|iam)'
```

### Using GCP Console

1. Navigate to [APIs & Services](https://console.cloud.google.com/apis/library)
2. Search and enable the following APIs:
   - **Cloud DNS API**
   - **Service Usage API**
   - **Identity and Access Management (IAM) API**

## Step 5: Grant Permissions to Service Account

### Grant Cloud DNS Admin Permissions

```bash
# Grant Cloud DNS Admin role
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-terraform@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/dns.admin"

# Grant Service Usage Consumer role (for API usage)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-terraform@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/serviceusage.serviceUsageConsumer"
```

### Grant Workload Identity User Role

```bash
# Create repository-specific binding
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-terraform@${PROJECT_ID}.iam.gserviceaccount.com \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/your-github-username/xtrade"
```

**Important**:

- Replace `PROJECT_NUMBER` with your project number (not project ID)
- Replace `your-github-username` with your actual GitHub username or organization name

To get the project number:

```bash
gcloud projects describe ${PROJECT_ID} --format="value(projectNumber)"
```

## Step 6: Register GitHub Secrets

Register the obtained values as Secrets in your GitHub repository.

### Configure GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

| Secret Name | Example Value | Description |
| -------- | ------ | ---- |
| `GCP_PROJECT_ID` | `xtrade-project` | GCP Project ID |
| `GCP_SERVICE_ACCOUNT` | `github-actions-terraform@xtrade-project.iam.gserviceaccount.com` | Service account email address |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/123456789/locations/global/workloadIdentityPools/github/providers/github` | Workload Identity Provider full path |

## Step 7: Verify Setup

Run a GitHub Actions workflow to verify access to GCP resources.

### Test Workflow

```yaml
name: Test GCP Authentication

on:
  workflow_dispatch:

jobs:
  test-gcp-auth:
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v5

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v3
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Test gcloud command
        run: |
          gcloud config list
          gcloud projects describe ${{ secrets.GCP_PROJECT_ID }}
```

## Troubleshooting

### Issue: Authentication Error

**Error**: `Error: google-github-actions/auth failed with: retry function failed after X attempts`

**Solution**:

1. Verify `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_SERVICE_ACCOUNT` are correct
2. Check Workload Identity User binding is correct
3. Verify repository name is correct (`attribute.repository` condition)

### Issue: Permission Error

**Error**: `Error: PERMISSION_DENIED: The caller does not have permission`

**Solution**:

1. Verify service account has required IAM roles
2. Check if API is enabled:

   ```bash
   gcloud services enable dns.googleapis.com --project=${PROJECT_ID}
   ```

### Issue: Pool or Provider Not Found

**Error**: `Error: Workload identity pool does not exist`

**Solution**:

1. Verify Workload Identity Pool is created:

   ```bash
   gcloud iam workload-identity-pools list --location=global --project=${PROJECT_ID}
   ```

2. Verify provider is created:

   ```bash
   gcloud iam workload-identity-pools providers list \
     --workload-identity-pool=github \
     --location=global \
     --project=${PROJECT_ID}
   ```

## Security Best Practices

1. **Principle of Least Privilege**: Grant only minimum required permissions to service account
2. **Repository Restriction**: Use `attribute.repository` condition to allow access only from specific repositories
3. **Enable Audit Logs**: Enable Cloud Audit Logs to record all access
4. **Regular Review**: Periodically review permissions and access patterns

## Related Documentation

- [GitHub Secrets Configuration](./github-secrets.md)
- [GCP Subdomain Setup Guide](./gcp-subdomain-setup.md)
- [Terraform Environment Variables](./terraform-environment-variables.md)
- [Google Cloud Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
