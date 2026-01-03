#!/bin/bash
# Switch between Supabase environments
# Usage: ./scripts/switch-env.sh [dev|staging|prod]

set -e

ENV=$1
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

case $ENV in
  dev|development)
    echo "Switching to DEVELOPMENT environment..."
    PROJECT_REF=$(grep VITE_SUPABASE_PROJECT_ID "$PROJECT_DIR/.env.development" | cut -d'"' -f2)
    if [ "$PROJECT_REF" = "YOUR_DEV_PROJECT_ID" ]; then
      echo "ERROR: Development environment not configured."
      echo "Please update .env.development with your dev Supabase project credentials."
      exit 1
    fi
    ;;
  staging)
    echo "Switching to STAGING environment..."
    if [ ! -f "$PROJECT_DIR/.env.staging" ]; then
      echo "ERROR: .env.staging file not found."
      echo "Create a staging Supabase project and configure .env.staging first."
      exit 1
    fi
    PROJECT_REF=$(grep VITE_SUPABASE_PROJECT_ID "$PROJECT_DIR/.env.staging" | cut -d'"' -f2)
    ;;
  prod|production)
    echo "Switching to PRODUCTION environment..."
    PROJECT_REF=$(grep VITE_SUPABASE_PROJECT_ID "$PROJECT_DIR/.env.production" | cut -d'"' -f2)
    ;;
  *)
    echo "Usage: $0 [dev|staging|prod]"
    echo ""
    echo "Environments:"
    echo "  dev, development  - Development environment"
    echo "  staging           - Staging environment"
    echo "  prod, production  - Production environment"
    exit 1
    ;;
esac

echo "Linking Supabase to project: $PROJECT_REF"
cd "$PROJECT_DIR"

# Update supabase config
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "Successfully switched to $ENV environment!"
echo "Project: $PROJECT_REF"
echo ""
echo "Next steps:"
echo "  - Run 'supabase db push' to apply migrations"
echo "  - Run 'npm run dev' to start the dev server"
