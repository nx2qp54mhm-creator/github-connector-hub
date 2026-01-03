# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/5cd76752-293f-476e-8b41-334855dba83b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/5cd76752-293f-476e-8b41-334855dba83b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Backend & Auth)

## Environment Setup

This project uses separate environments for development, staging, and production.

### Environment Files

| File | Purpose | Git Status |
|------|---------|------------|
| `.env.example` | Template with all required variables | Committed |
| `.env.development` | Development environment config | Committed (template) |
| `.env.production` | Production environment config | Committed |
| `.env.local` | Local overrides (your secrets) | Gitignored |

### Setting Up a Development Environment

1. **Create a new Supabase project** for development at [supabase.com](https://supabase.com)

2. **Run the setup script:**
   ```sh
   ./scripts/setup-dev-env.sh
   ```

   Or manually:
   ```sh
   # Copy and edit the development config
   cp .env.development .env.local
   # Edit .env.local with your dev Supabase credentials

   # Link Supabase CLI to your dev project
   supabase link --project-ref YOUR_DEV_PROJECT_ID

   # Apply database migrations
   supabase db push

   # Deploy Edge Functions
   supabase functions deploy coverage-assistant
   supabase functions deploy extract-benefits
   ```

3. **Set Edge Function secrets** in Supabase Dashboard:
   - Go to Project Settings > Vault
   - Add `ANTHROPIC_API_KEY` with your API key

### Switching Environments

```sh
# Switch to development
./scripts/switch-env.sh dev

# Switch to production
./scripts/switch-env.sh prod

# Switch to staging (if configured)
./scripts/switch-env.sh staging
```

### Railway Worker (Production)

The PDF extraction worker runs on Railway. Environment variables needed:
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WORKER_SECRET`

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/5cd76752-293f-476e-8b41-334855dba83b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
