# GCP Subdomain Setup Guide

[🇯🇵 日本語版](./gcp-subdomain-setup.ja.md)

This guide explains how to create and configure subdomains using Google Cloud Platform (GCP) Cloud DNS for the xtrade project.

## Overview

For the xtrade project, we need to configure the following subdomains:

- `xtrade.tqer39.dev` - Production environment
- `xtrade-dev.tqer39.dev` - Development environment

These subdomains will point to Vercel deployments.

## Prerequisites

Before starting, ensure you have:

- **GCP Account** with billing enabled
- **Domain ownership** - You must own `tqer39.dev` domain
- **gcloud CLI** installed and configured
- **Terraform** installed (optional, for infrastructure as code)
- **Appropriate permissions** - DNS Administrator role or equivalent

## Step 1: Create a GCP Project (If Not Exists)

### Using gcloud CLI

```bash
# Set project variables
export PROJECT_ID="xtrade-project"
export PROJECT_NAME="xtrade"

# Create project
gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"

# Set as active project
gcloud config set project $PROJECT_ID

# Enable billing (required for Cloud DNS)
# You need to link a billing account via GCP Console
```

### Using GCP Console

1. Go to [GCP Console](https://console.cloud.google.com/)
2. Click on the project dropdown → **New Project**
3. Enter project name: `xtrade`
4. Click **Create**
5. Enable billing for the project

## Step 2: Enable Cloud DNS API

### Using gcloud CLI

```bash
# Enable Cloud DNS API
gcloud services enable dns.googleapis.com

# Verify API is enabled
gcloud services list --enabled | grep dns
```

### Using GCP Console

1. Navigate to **APIs & Services** → **Library**
2. Search for "Cloud DNS API"
3. Click **Enable**

## Step 3: Create a Managed DNS Zone

### Using gcloud CLI

```bash
# Create DNS zone for tqer39.dev
gcloud dns managed-zones create tqer39-dev \
  --description="DNS zone for tqer39.dev domain" \
  --dns-name="tqer39.dev." \
  --visibility=public

# Verify zone creation
gcloud dns managed-zones describe tqer39-dev
```

**Important Notes:**

- The DNS name must end with a period (`.`)
- Zone name (`tqer39-dev`) must be unique within the project
- Visibility is `public` for internet-accessible domains

### Using GCP Console

1. Navigate to **Network Services** → **Cloud DNS**
2. Click **Create Zone**
3. Fill in the details:
   - **Zone type**: Public
   - **Zone name**: `tqer39-dev`
   - **DNS name**: `tqer39.dev.`
   - **Description**: DNS zone for tqer39.dev domain
   - **DNSSEC**: Off (or On if desired)
4. Click **Create**

## Step 4: Update Domain Registrar Name Servers

After creating the DNS zone, you need to update your domain registrar's name servers.

### Get Name Server Records

```bash
# Get name servers for the zone
gcloud dns managed-zones describe tqer39-dev \
  --format="value(nameServers)"
```

Example output:

```text
ns-cloud-a1.googledomains.com.
ns-cloud-a2.googledomains.com.
ns-cloud-a3.googledomains.com.
ns-cloud-a4.googledomains.com.
```

### Update at Domain Registrar

1. Log in to your domain registrar (where you purchased `tqer39.dev`)
2. Find DNS/Name Server settings
3. Replace existing name servers with GCP name servers
4. Save changes

**Note:** DNS propagation can take 24-48 hours, but usually completes within a few hours.

## Step 5: Create Subdomain DNS Records

### Option A: Using gcloud CLI

#### For Production (xtrade.tqer39.dev)

```bash
# Create A record pointing to Vercel
# First, get Vercel's IP address from your Vercel project settings
export VERCEL_IP="76.76.21.21"  # Example IP

# Create DNS record
gcloud dns record-sets create xtrade.tqer39.dev. \
  --zone="tqer39-dev" \
  --type="A" \
  --ttl="300" \
  --rrdatas="$VERCEL_IP"
```

#### For Development (xtrade-dev.tqer39.dev)

```bash
# Create A record for dev environment
gcloud dns record-sets create xtrade-dev.tqer39.dev. \
  --zone="tqer39-dev" \
  --type="A" \
  --ttl="300" \
  --rrdatas="$VERCEL_IP"
```

#### Using CNAME Records (Alternative)

```bash
# If Vercel provides a CNAME target instead
export VERCEL_CNAME="cname.vercel-dns.com."

# Create CNAME record for production
gcloud dns record-sets create xtrade.tqer39.dev. \
  --zone="tqer39-dev" \
  --type="CNAME" \
  --ttl="300" \
  --rrdatas="$VERCEL_CNAME"

# Create CNAME record for development
gcloud dns record-sets create xtrade-dev.tqer39.dev. \
  --zone="tqer39-dev" \
  --type="CNAME" \
  --ttl="300" \
  --rrdatas="$VERCEL_CNAME"
```

### Option B: Using GCP Console

1. Navigate to **Cloud DNS** → Select zone `tqer39-dev`
2. Click **Add Record Set**
3. Fill in the details:
   - **DNS Name**: `xtrade` (for xtrade.tqer39.dev)
   - **Resource Record Type**: `A` or `CNAME`
   - **TTL**: `5` minutes (`300` seconds)
   - **IPv4 Address** or **Canonical name**: Vercel IP/CNAME
4. Click **Create**
5. Repeat for `xtrade-dev` subdomain

### Option C: Using Terraform (Recommended)

Create a Terraform configuration file:

```hcl
# infra/terraform/modules/dns/main.tf

resource "google_dns_managed_zone" "tqer39_dev" {
  name        = "tqer39-dev"
  dns_name    = "tqer39.dev."
  description = "DNS zone for tqer39.dev domain"
  visibility  = "public"
}

resource "google_dns_record_set" "xtrade_prod" {
  managed_zone = google_dns_managed_zone.tqer39_dev.name
  name         = "xtrade.tqer39.dev."
  type         = "A"
  ttl          = 300
  rrdatas      = [var.vercel_ip_prod]
}

resource "google_dns_record_set" "xtrade_dev" {
  managed_zone = google_dns_managed_zone.tqer39_dev.name
  name         = "xtrade-dev.tqer39.dev."
  type         = "A"
  ttl          = 300
  rrdatas      = [var.vercel_ip_dev]
}
```

Apply Terraform:

```bash
cd infra/terraform/modules/dns
terraform init
terraform plan
terraform apply
```

## Step 6: Verify DNS Configuration

### Using dig

```bash
# Check production subdomain
dig xtrade.tqer39.dev

# Check development subdomain
dig xtrade-dev.tqer39.dev

# Verify name servers
dig NS tqer39.dev
```

### Using nslookup

```bash
# Check production subdomain
nslookup xtrade.tqer39.dev

# Check development subdomain
nslookup xtrade-dev.tqer39.dev
```

### Online Tools

- [DNS Checker](https://dnschecker.org/)
- [What's My DNS](https://www.whatsmydns.net/)

Enter your subdomain to verify global DNS propagation.

## Step 7: Configure Vercel Custom Domains

After DNS records are configured, add the custom domains in Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `xtrade` project
3. Go to **Settings** → **Domains**
4. Add domains:
   - Production: `xtrade.tqer39.dev`
   - Development: `xtrade-dev.tqer39.dev`
5. Vercel will automatically detect and verify the DNS configuration

## Common Issues & Solutions

### Issue: DNS records not propagating

**Symptoms:** `dig` or `nslookup` returns no results

**Solutions:**

1. **Wait for propagation**: DNS changes can take up to 48 hours
2. **Clear local DNS cache**:

   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches

   # Windows
   ipconfig /flushdns
   ```

3. **Verify record creation**:

   ```bash
   gcloud dns record-sets list --zone="tqer39-dev"
   ```

### Issue: Name servers not updated at registrar

**Symptoms:** Domain still points to old name servers

**Solutions:**

1. Verify name servers at registrar match GCP name servers
2. Wait for registrar propagation (can take 24 hours)
3. Check for typos in name server entries

### Issue: DNSSEC validation errors

**Symptoms:** Domain not resolving with DNSSEC enabled

**Solutions:**

1. Disable DNSSEC at registrar temporarily
2. Enable DNSSEC in Cloud DNS zone
3. Copy DS records from GCP to registrar
4. Wait for propagation

### Issue: Vercel domain verification fails

**Symptoms:** Vercel shows "Invalid Configuration"

**Solutions:**

1. Ensure DNS records are propagated (use `dig` to verify)
2. Check that A/CNAME record points to correct Vercel target
3. Remove and re-add domain in Vercel
4. Wait a few minutes and retry verification

## Security Best Practices

1. **Enable DNSSEC**: Protects against DNS spoofing

   ```bash
   gcloud dns managed-zones update tqer39-dev \
     --dnssec-state=on
   ```

2. **Restrict Zone Access**: Use IAM roles to limit who can modify DNS records

   ```bash
   gcloud dns managed-zones add-iam-policy-binding tqer39-dev \
     --member="user:admin@example.com" \
     --role="roles/dns.admin"
   ```

3. **Enable Audit Logging**: Track DNS changes
   - Navigate to **IAM & Admin** → **Audit Logs**
   - Enable logging for Cloud DNS

4. **Use Terraform**: Infrastructure as Code ensures consistency and version control

## Cost Considerations

**Cloud DNS Pricing:**

- **Hosted Zone**: $0.20 per zone per month
- **Queries**: $0.40 per million queries (first 1 billion queries/month)
- **Free Tier**: First 25 managed zones are free

**Estimated Monthly Cost:**

- For xtrade project: ~$0.20-$1.00/month (depending on traffic)

## Next Steps

1. Configure SSL/TLS certificates in Vercel (automatic with custom domains)
2. Set up monitoring for DNS availability
3. Document DNS configuration in `infra/terraform/`
4. Add DNS records to version control

## Related Documentation

- [Terraform Configuration](./terraform-environment-variables.md)
- [GitHub Secrets Setup](./github-secrets.md)
- [GCP Cloud DNS Documentation](https://cloud.google.com/dns/docs)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/custom-domains)
