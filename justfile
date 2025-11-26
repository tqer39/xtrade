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
        prek install; \
    else \
        echo "⚠ mise not found. Please run 'make bootstrap' first."; \
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

# Start development server
dev:
    @echo "→ Starting development server..."
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
    @if [ ! -d "drizzle" ] || [ ! -f "drizzle/meta/_journal.json" ]; then \
        echo "  ℹ No migrations found, generating first..."; \
        npm run db:generate; \
    fi
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
db-reset:
    @echo "⚠ WARNING: This will destroy all data in the database!"
    @read -p "Are you sure? (yes/no): " confirm; \
    if [ "$$confirm" = "yes" ]; then \
        docker compose down -v; \
        docker compose up -d; \
        echo "  ✓ Database reset completed"; \
        echo "  ℹ Run 'just db-migrate' to apply migrations"; \
    else \
        echo "  ✓ Cancelled"; \
    fi
