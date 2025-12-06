# Development tasks for xtrade

# Use bash for all recipes to avoid zsh/sh incompatibilities
set shell := ["bash", "-c"]

# Show available commands
help:
    @just --list

# Setup development environment
setup:
    @echo "Setting up development environment..."
    brew bundle install
    @if command -v mise >/dev/null 2>&1; then \
        echo "→ Installing tools with mise..."; \
        eval "$(mise activate bash)"; \
        mise install; \
    else \
        echo "⚠ mise not found. Please run 'make bootstrap' first."; \
        exit 1; \
    fi
    @if command -v prek >/dev/null 2>&1; then \
        echo "→ Installing pre-commit hooks with prek..."; \
        prek install; \
    else \
        echo "⚠ prek not found. Please run 'brew bundle install' first."; \
        exit 1; \
    fi
    @just setup-env
    @just setup-deps
    @just setup-db
    @echo "✅ Setup complete!"

# Setup environment file
setup-env:
    @echo "→ Setting up environment file..."
    @if [ ! -f .env.local ]; then \
        cp .env.example .env.local; \
        echo "  ✓ Created .env.local from .env.example"; \
        echo "  ⚠ Please update .env.local with your actual values"; \
    else \
        echo "  ✓ .env.local already exists"; \
    fi

# Install Node.js dependencies
setup-deps:
    @echo "→ Installing Node.js dependencies..."
    @if command -v npm >/dev/null 2>&1; then \
        npm install; \
        echo "  ✓ npm install completed"; \
    else \
        echo "  ⚠ npm not found. Please ensure Node.js is installed via mise."; \
        exit 1; \
    fi

# Setup local database
setup-db:
    @echo "→ Setting up local database..."
    @echo "  ℹ For local development, you have two options:"
    @echo "    1. Use Docker Compose: just db-start"
    @echo "    2. Use Neon database: Update DATABASE_URL in .env.local"
    @echo "  After database is ready, run: just db-migrate"

# Setup direnv
setup-direnv:
    @echo "→ Setting up direnv..."
    @if [ ! -f .envrc ]; then \
        cp .envrc.example .envrc; \
        echo "  ✓ Created .envrc from .envrc.example"; \
        echo "  ⚠ Please edit .envrc and run: just direnv-allow"; \
    else \
        echo "  ✓ .envrc already exists"; \
    fi

# Allow direnv for this directory
direnv-allow:
    @echo "→ Allowing direnv for this directory..."
    direnv allow
    @echo "  ✓ direnv allowed"

# Run prek hooks on all files
lint:
    prek run --all-files

# Run specific prek hook
lint-hook hook:
    prek run {{hook}}

# Update prek hooks to latest versions
update-hooks:
    prek autoupdate

# Fix common formatting issues
fix:
    prek run end-of-file-fixer --all-files
    prek run trailing-whitespace --all-files
    prek run markdownlint-cli2 --all-files
    npx textlint --fix "docs/**/*.md" ".claude/**/*.md" "*.md" "infra/**/*.md"

# Clean prek cache
clean:
    @echo "Cleaning prek cache..."
    -prek clean
    @echo "Clean complete!"

# Show mise status
status:
    mise list

# Install mise tools
install:
    mise install

# Update mise tools
update:
    mise upgrade

# Update brew packages
update-brew:
    brew update
    brew bundle install
    brew upgrade

# Development server commands

# Start development server and Drizzle Studio
dev:
    @echo "→ Starting development server and Drizzle Studio..."
    npm run db:studio &
    npm run dev

# Build production application
build:
    @echo "→ Building application..."
    npm run build

# Start production server
start:
    @echo "→ Starting production server..."
    npm start

# AWS and infrastructure commands

# Add AWS profile to aws-vault
aws-add profile:
    @echo "→ Adding AWS profile: {{profile}}"
    aws-vault add {{profile}}

# List AWS profiles in aws-vault
aws-list:
    @echo "→ Listing AWS profiles..."
    aws-vault list

# Execute command with aws-vault
aws-exec profile *args:
    @echo "→ Executing with AWS profile: {{profile}}"
    aws-vault exec {{profile}} -- {{args}}

# Wrap terraform with convenient -chdir handling
# Usage examples:
#   just tf -chdir=dev/bootstrap init -reconfigure
#   just tf -chdir=infra/terraform/envs/dev/bootstrap plan
#   just tf version
tf *args:
    @echo "→ make terraform-cf ARGS='{{args}}'"
    @exec make terraform-cf ARGS="{{args}}"

# Database management commands

# Start local database with Docker Compose
db-start:
    @echo "→ Starting local database..."
    docker compose up -d
    @echo "  ✓ Database started"
    @echo "  ℹ Connection: postgres://xtrade:xtrade@localhost:5432/xtrade"

# Stop local database
db-stop:
    @echo "→ Stopping local database..."
    docker compose down
    @echo "  ✓ Database stopped"

# Show database logs
db-logs:
    docker compose logs -f postgres

# Run database migrations
db-migrate:
    @echo "→ Running database migrations..."
    npm run db:migrate
    @echo "  ✓ Migrations completed"

# Generate migration files
db-generate:
    @echo "→ Generating migration files..."
    npm run db:generate

# Open Drizzle Studio
db-studio:
    @echo "→ Opening Drizzle Studio..."
    npm run db:studio

# Reset database (WARNING: destroys all data)
[confirm("⚠ WARNING: This will destroy all data in the database! Continue? (yes/no)")]
db-reset:
    docker compose down -v
    docker compose up -d
    @echo "  ✓ Database reset completed"
    @echo "→ Waiting for database to be ready..."
    @until docker compose ps | grep -q "healthy"; do sleep 1; done
    @echo "  ✓ Database is healthy"
    @just db-migrate

# Run database seed (local only)
db-seed:
    @echo "→ Running database seed..."
    npm run db:seed

# Setup database with migration and seed
db-setup: db-migrate db-seed
    @echo "✅ Database setup complete!"

# Sync photocard master data from external sources
db-sync-photocard *args:
    @echo "→ Syncing photocard master data..."
    npx tsx scripts/sync-photocard-data.ts {{args}}

# Sync photocard data (dry run)
db-sync-photocard-dry:
    @echo "→ Syncing photocard master data (dry run)..."
    npx tsx scripts/sync-photocard-data.ts --dry-run --verbose

# Sync photocard images from external sources to R2
db-sync-photocard-images *args:
    @echo "→ Syncing photocard images..."
    npx tsx scripts/sync-photocard-images.ts {{args}}

# Sync photocard images (dry run)
db-sync-photocard-images-dry:
    @echo "→ Syncing photocard images (dry run)..."
    npx tsx scripts/sync-photocard-images.ts --dry-run --verbose

# Test commands

# Run all unit tests
test:
    @echo "→ Running unit tests..."
    npm run test:run

# Run unit tests in watch mode
test-watch:
    @echo "→ Running unit tests in watch mode..."
    npm run test

# Run unit tests with coverage
test-coverage:
    @echo "→ Running unit tests with coverage..."
    npm run test:coverage

# Run E2E tests
test-e2e:
    @echo "→ Running E2E tests..."
    npm run test:e2e

# Run E2E tests with UI
test-e2e-ui:
    @echo "→ Running E2E tests with UI..."
    npm run test:e2e:ui

# Install Playwright browsers
test-e2e-install:
    @echo "→ Installing Playwright browsers..."
    npx playwright install chromium --with-deps

# Run all tests (unit + E2E)
test-all: test test-e2e
    @echo "✅ All tests completed!"

# Git Worktree commands

# Worktree directory (relative to repo root)
wt_dir := "../xtrade-worktrees"

# Create a new worktree with a new branch (branch name: name-yymmdd-xxxxxx)
wt-new name:
    #!/usr/bin/env bash
    set -euo pipefail
    suffix="$(date +%y%m%d)-$(openssl rand -hex 3)"
    branch="{{name}}-${suffix}"
    echo "→ Creating worktree: ${branch}"
    mkdir -p {{wt_dir}}
    git worktree add "{{wt_dir}}/${branch}" -b "${branch}"
    echo "→ Installing dependencies..."
    cd "{{wt_dir}}/${branch}" && npm install
    if [ -f .env.local ]; then
        cp .env.local "{{wt_dir}}/${branch}/.env.local"
        echo "  ✓ Copied .env.local"
    fi
    echo "✅ Worktree ready: {{wt_dir}}/${branch}"
    echo "  → Open in VS Code: code {{wt_dir}}/${branch}"

# Create a worktree from an existing branch
wt-add branch:
    @echo "→ Creating worktree from branch: {{branch}}"
    @mkdir -p {{wt_dir}}
    git worktree add {{wt_dir}}/{{branch}} {{branch}}
    @echo "→ Installing dependencies..."
    @cd {{wt_dir}}/{{branch}} && npm install
    @if [ -f .env.local ]; then \
        cp .env.local {{wt_dir}}/{{branch}}/.env.local; \
        echo "  ✓ Copied .env.local"; \
    fi
    @echo "✅ Worktree ready: {{wt_dir}}/{{branch}}"

# List all worktrees
wt-list:
    @git worktree list

# Remove a worktree
wt-rm name:
    @echo "→ Removing worktree: {{name}}"
    git worktree remove {{wt_dir}}/{{name}}
    @echo "✅ Worktree removed"

# Remove a worktree (force)
wt-rm-force name:
    @echo "→ Force removing worktree: {{name}}"
    git worktree remove --force {{wt_dir}}/{{name}}
    @echo "✅ Worktree removed"

# Open worktree in VS Code
wt-code name:
    @code {{wt_dir}}/{{name}}

# Prune stale worktree references
wt-prune:
    @echo "→ Pruning stale worktree references..."
    git worktree prune
    @echo "✅ Pruned"
