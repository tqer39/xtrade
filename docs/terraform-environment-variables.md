# Terraform Environment Variables Management Guide

[🇯🇵 日本語版](./terraform-environment-variables.ja.md)

This document explains how to manage Terraform environment variables using direnv.

## Overview

The xtrade project uses **direnv** for environment variable management. This allows automatic loading/unloading of different environment variables per directory.

## direnv Basics

### What is direnv

direnv is a tool that automatically loads environment variables when entering a directory and unloads them when leaving.

### How It Works

1. Place `.envrc` file in directory
2. Allow with `direnv allow`
3. Environment variables automatically load when entering directory
4. Environment variables automatically unload when leaving directory

## Usage Patterns with Terraform

### Pattern 1: Manage at Project Root (All Environments)

**Recommendation**: ⭐⭐⭐⭐⭐ (Easiest)

```bash
# Project root
/Users/you/workspace/xtrade/
├── .envrc              # ← Place here
├── .envrc.example
└── infra/terraform/...
```

**Setup**:

```bash
cd /Users/you/workspace/xtrade
cp .envrc.example .envrc
vim .envrc  # Configure API keys
direnv allow
```

**.envrc Example**:

```bash
# AWS Vault Profile
export AWS_VAULT_PROFILE=xtrade-dev
export AWS_REGION=ap-northeast-1

# Neon API Key
export NEON_API_KEY=neon_api_xxxxxxxxxxxxx

# Auto-load as Terraform variable
export TF_VAR_neon_api_key="${NEON_API_KEY}"
```

**Advantages**:

- Configure once for entire project
- `just tf` commands work from any directory

**Disadvantages**:

- Cannot switch variables per environment (dev/prod)

### Pattern 2: Place .envrc per Environment (Separate Management)

**Recommendation**: ⭐⭐⭐⭐ (For strict environment separation)

```bash
infra/terraform/envs/
├── dev/
│   ├── .envrc              # ← For dev environment
│   ├── .envrc.example
│   └── database/
│       └── main.tf
└── prod/
    ├── .envrc              # ← For prod environment
    ├── .envrc.example
    └── database/
        └── main.tf
```

**Setup**:

```bash
# dev environment
cd infra/terraform/envs/dev
cp .envrc.example .envrc
vim .envrc  # Configure dev API keys
direnv allow

# prod environment
cd infra/terraform/envs/prod
cp .envrc.example .envrc
vim .envrc  # Configure prod API keys
direnv allow
```

**Advantages**:

- Can use different API keys per environment
- Reduces risk of accidentally operating on wrong environment

**Disadvantages**:

- Requires individual configuration per environment

### Pattern 3: Place .envrc per Module (Finest Granularity)

**Recommendation**: ⭐⭐⭐ (Special cases only)

```bash
infra/terraform/envs/dev/
├── database/
│   ├── .envrc              # ← database-specific
│   └── main.tf
├── vercel/
│   ├── .envrc              # ← vercel-specific
│   └── main.tf
└── dns/
    ├── .envrc              # ← dns-specific
    └── main.tf
```

**Advantages**:

- Can define only necessary environment variables per module

**Disadvantages**:

- Management becomes complex

## Terraform Variable Auto-loading

### TF_VAR_ Prefix

Terraform automatically recognizes environment variables starting with `TF_VAR_` as variables.

**Example**:

```bash
# .envrc
export NEON_API_KEY=neon_api_xxxxxxxxxxxxx
export TF_VAR_neon_api_key="${NEON_API_KEY}"
```

```hcl
# variables.tf
variable "neon_api_key" {
  description = "Neon API Key"
  type        = string
  sensitive   = true
}

# provider.tf
provider "neon" {
  api_key = var.neon_api_key
}
```

### Using Environment Variables Directly

Some providers directly recognize specific environment variable names.

**Neon Example**:

```bash
# .envrc
export NEON_API_KEY=neon_api_xxxxxxxxxxxxx
```

```hcl
# provider.tf
provider "neon" {
  # Automatically uses NEON_API_KEY environment variable
}
```

## Practical Example: Neon Database Setup

### Step 1: Obtain API Key

1. Log in to [Neon Console](https://console.neon.tech/)
2. Account Settings → API Keys → Generate new API key
3. Copy API key

### Step 2: Configure .envrc

```bash
# Configure at project root (recommended)
cd /Users/you/workspace/xtrade
cp .envrc.example .envrc
vim .envrc
```

**.envrc**:

```bash
# AWS Vault Profile
export AWS_VAULT_PROFILE=xtrade-dev
export AWS_REGION=ap-northeast-1

# Neon API Key (paste actual key here)
export NEON_API_KEY=neon_api_xxxxxxxxxxxxx

# Auto-load as Terraform variable
export TF_VAR_neon_api_key="${NEON_API_KEY}"
```

### Step 3: Enable direnv

```bash
direnv allow
```

### Step 4: Verify Environment Variables

```bash
echo $NEON_API_KEY
# → neon_api_xxxxxxxxxxxxx

echo $TF_VAR_neon_api_key
# → neon_api_xxxxxxxxxxxxx
```

### Step 5: Execute Terraform

```bash
# Can run from any directory
just tf -chdir=infra/terraform/envs/dev/database init
just tf -chdir=infra/terraform/envs/dev/database plan
just tf -chdir=infra/terraform/envs/dev/database apply
```

## Troubleshooting

### Environment Variables Not Loading

```bash
# Check direnv status
direnv status

# Reload .envrc
direnv allow
```

### Different Environment Variable Taking Priority

```bash
# Check environment variable priority
env | grep NEON_API_KEY

# Display only direnv environment variables
direnv export bash | grep NEON_API_KEY
```

### .envrc Not Loading Automatically

```bash
# Check if direnv hook is enabled
echo $DIRENV_ACTIVE
# → Should return 1 if enabled

# Check shell configuration (.zshrc or .bashrc)
# Following line is needed:
# eval "$(direnv hook zsh)"  # for zsh
# eval "$(direnv hook bash)" # for bash
```

## Security Best Practices

### 1. Don't Include .envrc in Version Control

```bash
# Verify it's in .gitignore
cat .gitignore | grep .envrc
# → Should include .envrc
```

### 2. Provide .envrc.example

```bash
# Create .envrc.example as template
cp .envrc .envrc.example

# Remove actual keys and replace with placeholders
vim .envrc.example
```

### 3. Manage API Keys by Environment Variable Name

```bash
# ❌ Bad: Hardcoded
export NEON_API_KEY=neon_api_1234567890abcdef

# ✅ Good: Retrieve from password manager
export NEON_API_KEY=$(op read "op://Private/Neon API Key/credential")
```

## Summary

| Pattern | Recommendation | Use Case |
| -------- | ------ | ------------ |
| Project root | ⭐⭐⭐⭐⭐ | Solo development, single environment |
| Per environment | ⭐⭐⭐⭐ | Team development, dev/prod separation |
| Per module | ⭐⭐⭐ | Complex module structure |

**xtrade Recommendation**: Manage `.envrc` at project root, separate by environment as needed.
