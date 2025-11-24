# Local Development Setup

[🇯🇵 日本語版](./local-dev.ja.md)

This guide walks you through setting up the xtrade project for local development.

## Prerequisites

Before starting, ensure you have the following installed:

- **macOS or Linux** - Windows users should use WSL2
- **Homebrew** - Package manager for macOS/Linux
- **Git** - Version control system

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/tqer39/xtrade.git
cd xtrade
```

### 2. Bootstrap Development Tools

Install Homebrew packages (first time only):

```bash
make bootstrap
```

This installs:

- `mise` - Tool version manager
- `direnv` - Environment variable manager
- Other development tools from `Brewfile`

### 3. Run Setup

Run the complete setup process:

```bash
just setup
```

This command will:

1. Install tools via mise (Node.js, Terraform, prek)
2. Install prek hooks
3. Create `.env.local` from `.env.example`
4. Install npm dependencies
5. Setup local database

### 4. Configure Environment Variables

Edit `.env.local` with your actual values:

```bash
# Database connection (required for local development)
DATABASE_URL="postgresql://user:password@localhost:5432/xtrade"

# BetterAuth configuration (required for authentication)
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-key-here"

# X (Twitter) OAuth credentials (optional for local dev)
TWITTER_CLIENT_ID="your-client-id"
TWITTER_CLIENT_SECRET="your-client-secret"
```

**How to get X OAuth credentials:**

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new app or use existing one
3. Navigate to "Keys and tokens"
4. Copy Client ID and Client Secret

### 5. Setup Local Database

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker-compose up -d

# Run migrations
npm run db:migrate

# Open Drizzle Studio (optional)
npm run db:studio
```

#### Option B: Using Existing PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Create database
createdb xtrade

# Update .env.local with your connection string
# DATABASE_URL="postgresql://user:password@localhost:5432/xtrade"

# Run migrations
npm run db:migrate
```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at:

- **Web app**: `http://localhost:3000`
- **API endpoints**: `http://localhost:3000/api/*`

**Health check:**

```bash
curl http://localhost:3000/api/health
```

## Available Commands

### Development

| Command | Description |
| -------- | ---- |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run typecheck` | Run TypeScript type checking |

### Database

| Command | Description |
| -------- | ---- |
| `npm run db:generate` | Generate migration files from schema |
| `npm run db:migrate` | Apply migrations to database |
| `npm run db:studio` | Open Drizzle Studio (database GUI) |

### Code Quality

| Command | Description |
| -------- | ---- |
| `just lint` | Run all linters (prek) |
| `just fix` | Auto-fix formatting issues |
| `npm run lint` | Run Next.js ESLint |

### Justfile Commands

| Command | Description |
| -------- | ---- |
| `just setup` | Complete setup process |
| `just setup-env` | Create .env.local from template |
| `just setup-deps` | Install npm dependencies |
| `just setup-db` | Setup local database |
| `just lint` | Run prek checks |
| `just fix` | Auto-fix common issues |

## Development Workflow

### Making Schema Changes

1. **Edit schema file:**

   ```bash
   vim src/db/schema.ts
   ```

2. **Generate migration:**

   ```bash
   npm run db:generate
   ```

3. **Review migration:**

   ```bash
   ls -la src/db/migrations/
   ```

4. **Apply migration:**

   ```bash
   npm run db:migrate
   ```

### Pre-PR Checklist

Before submitting a pull request, ensure all checks pass:

```bash
# Run linters
just lint

# Run type checking
npm run typecheck

# Build successfully
npm run build
```

### Code Formatting

The project uses prek (pre-commit hooks) for automatic formatting:

```bash
# Format all files
just fix

# Format staged files only (happens automatically on commit)
git commit
```

## Common Issues & Solutions

### Issue: `mise` not found

**Solution:**

```bash
# Run bootstrap first
make bootstrap

# Or install mise manually
brew install mise
```

### Issue: Node.js version mismatch

**Solution:**

```bash
# Install correct Node.js version via mise
mise install nodejs@24

# Verify version
node --version
```

### Issue: Database connection failed

**Solutions:**

1. **Check PostgreSQL is running:**

   ```bash
   # For Docker
   docker ps | grep postgres

   # For local installation
   pg_isready
   ```

2. **Verify DATABASE_URL in .env.local:**

   ```bash
   cat .env.local | grep DATABASE_URL
   ```

3. **Test connection:**

   ```bash
   psql $DATABASE_URL
   ```

### Issue: Migration failed

**Solutions:**

1. **Check migration files:**

   ```bash
   ls -la src/db/migrations/
   ```

2. **Reset database (development only):**

   ```bash
   # Drop and recreate database
   dropdb xtrade
   createdb xtrade

   # Run migrations again
   npm run db:migrate
   ```

### Issue: Port already in use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use a different port
PORT=3001 npm run dev
```

### Issue: prek hooks not running

**Solutions:**

1. **Reinstall hooks:**

   ```bash
   prek install
   ```

2. **Check prek configuration:**

   ```bash
   cat .pre-commit-config.yaml
   ```

3. **Run manually:**

   ```bash
   prek run --all-files
   ```

### Issue: Environment variables not loading

**Solution:**

```bash
# Verify .env.local exists
ls -la .env.local

# Check direnv is working (if using direnv)
direnv allow

# Restart development server
npm run dev
```

## Optional: Using direnv for Environment Management

If you want automatic environment variable loading:

1. **Create .envrc:**

   ```bash
   cp .envrc.example .envrc
   vim .envrc
   ```

2. **Allow direnv:**

   ```bash
   direnv allow
   ```

3. **Verify variables are loaded:**

   ```bash
   echo $DATABASE_URL
   ```

## Working with Terraform (Infrastructure)

### Prerequisites

- AWS credentials configured (for S3 backend)
- Terraform installed via mise

### Setup Terraform

```bash
# Navigate to dev environment
cd infra/terraform/envs/dev/database

# Initialize Terraform
just tf -chdir=infra/terraform/envs/dev/database init

# Plan changes
just tf -chdir=infra/terraform/envs/dev/database plan

# Apply (creates Neon database)
just tf -chdir=infra/terraform/envs/dev/database apply
```

See [Terraform Environment Variables](./terraform-environment-variables.md) for more details.

## Testing Authentication Flow

### Mock Authentication (Development)

For quick testing without X OAuth setup:

1. **Create a mock session in your code:**

   ```typescript
   // For development only
   const mockSession = {
     user: {
       id: 'test-user-id',
       name: 'Test User',
       email: 'test@example.com'
     }
   }
   ```

### Real X OAuth (Staging/Production)

1. Configure X OAuth credentials in `.env.local`
2. Visit `http://localhost:3000/api/auth/signin/twitter`
3. Complete OAuth flow
4. You'll be redirected back to the application

## Next Steps

- Read [Architecture Documentation](./architecture.md)
- Review [Directory Structure](./directory-structure.md)
- Check [GitHub Secrets Configuration](./github-secrets.md) for CI/CD setup

## Getting Help

- **Issues**: Check existing [GitHub Issues](https://github.com/tqer39/xtrade/issues)
- **Documentation**: Browse other docs in the `docs/` directory
- **Code**: Review `.claude/agents/` for agent-specific guidelines
