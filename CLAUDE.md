# Policy Pocket - Claude Code Instructions

## Project Overview
Policy Pocket is an insurance coverage intelligence system built with React 18, TypeScript, Vite, and Supabase. It helps users understand and manage their insurance coverage through document analysis and AI assistance.

## Domain Context

### Insurance Coverage Types
- **Auto Insurance**: Collision, comprehensive, liability, uninsured motorist
- **Rental Car Coverage**: CDW/LDW, liability, personal effects
- **Travel Protection**: Trip cancellation, baggage, emergency assistance
- **Purchase Protection**: Extended warranty, return protection, price protection
- **Cell Phone Protection**: Damage, theft, loss coverage from credit cards

### Key Entities
- **Users**: Authenticated users with profiles and coverage data
- **Policies**: Insurance documents uploaded and parsed for coverage details
- **Cards**: Credit cards with associated benefits (rental, travel, purchase protection)
- **Benefits**: Specific coverage items tied to cards (e.g., rental CDW, extended warranty)
- **Claims**: User-initiated coverage claims against their policies/cards

### Business Rules
- Benefits are tied to specific credit cards and have eligibility requirements
- Coverage often requires paying with the associated card
- Rental car coverage varies by card tier (basic, premium, reserve)
- Travel benefits may require booking through specific channels
- Confidence scores indicate extraction accuracy from policy documents

### Data Relationships
```
User -> Cards (many) -> Benefits (many per card)
User -> Policies (many) -> Extracted Coverage Data
Benefits -> Coverage Categories (rental, travel, purchase, etc.)
```

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives)
- **State**: Zustand, TanStack Query
- **Backend**: Supabase (Auth, Postgres, Edge Functions)
- **Worker**: PDF extraction service on Railway
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion

## Project Structure
```
src/
├── components/     # React components (use shadcn patterns)
│   ├── ui/         # shadcn/ui base components
│   ├── admin/      # Admin panel components
│   ├── onboarding/ # User onboarding flow
│   └── icons/      # Custom icon components
├── hooks/          # Custom React hooks
├── services/       # Business logic and API calls
├── pages/          # Route-level page components
├── types/          # TypeScript type definitions
├── lib/            # Utility functions
└── data/           # Static data files

supabase/
├── functions/      # Edge Functions (Deno runtime)
└── migrations/     # Database migrations

worker/             # Node.js PDF extraction worker (separate project)
scripts/            # Environment setup and switching utilities
```

## Code Conventions
- Use TypeScript strict mode
- Components use functional style with hooks
- Prefer shadcn/ui components from `@/components/ui/`
- Use Zod schemas for runtime validation
- Use TanStack Query for server state (queries, mutations)
- Use Zustand for client-side state
- Use `@/` path alias for all imports (configured in tsconfig)

## Common Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint check
npm run preview      # Preview production build

# Environment management
./scripts/switch-env.sh dev|staging|prod   # Switch environments
./scripts/setup-dev-env.sh                 # Set up new dev environment
```

## Environment Management
Project supports multiple environments via .env files:
- `.env.development` - Local development
- `.env.staging` - Staging environment
- `.env.production` - Production environment
- `.env` - Local overrides (gitignored)

Required environment variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Database
- Supabase Postgres with Row Level Security (RLS) policies
- Migrations stored in `supabase/migrations/`
- Types are generated from Supabase schema in `src/integrations/supabase/types.ts`

## Important Patterns

### Component Creation
- New UI primitives go in `src/components/ui/`
- Feature components go in appropriate subdirectory of `src/components/`
- Use Radix UI primitives via shadcn/ui when available

### API Calls
- Use Supabase client from `@/integrations/supabase/client`
- Wrap in TanStack Query hooks for caching and state management
- Handle errors gracefully with toast notifications

### Styling
- Use Tailwind utility classes
- Custom theme colors defined in `tailwind.config.ts` (includes "covered" brand palette)
- Animations available via `animate-*` classes

### Edge Functions (Deno)
- Located in `supabase/functions/`
- Use Deno runtime, NOT Node.js
- Deploy with `npx supabase functions deploy <function-name>`

### Worker Service
- The `worker/` directory is a separate Node.js project
- Has its own package.json and dependencies
- Deployed to Railway for PDF processing

## When Making Changes
- Run `npm run lint` before committing
- Test across environments using `./scripts/switch-env.sh`
- Edge Functions use Deno - don't use Node.js APIs there
- Keep components small and focused
- Add TypeScript types for all new data structures

## Testing Considerations
- Test auth flows in development environment first
- Use Supabase dashboard to verify database changes
- Check RLS policies when debugging permission issues

## UI Component Inventory

shadcn/ui components already installed in `src/components/ui/`:
```
accordion, alert-dialog, alert, aspect-ratio, avatar, badge,
breadcrumb, button, calendar, card, carousel, chart, checkbox,
collapsible, command, context-menu, dialog, drawer, dropdown-menu,
form, hover-card, input-otp, input, label, menubar, navigation-menu,
pagination, popover, progress, radio-group, resizable, scroll-area,
select, separator, sheet, sidebar, skeleton, slider, sonner, switch,
table, tabs, textarea, toast, toaster, toggle-group, toggle, tooltip
```

**Always use existing components before adding new ones.** Check this list first when building new features.

## Architecture Decisions

### State Management
- **Zustand** for client-side UI state (modals, sidebar, local preferences)
- **TanStack Query** for server state (API data, caching, mutations)
- Never mix these - server data goes through TanStack Query

### Edge Functions vs Worker
- **Edge Functions (Deno)**: Quick operations, auth-dependent, low latency needs
- **Worker (Node.js on Railway)**: PDF processing, heavy computation, long-running tasks

## Policy Document Processing

### smart-worker Edge Function
Located at `supabase/functions/smart-worker/index.ts`, this function handles AI-powered extraction of insurance policy data.

**Capabilities:**
- Extracts structured data from PDFs and images (PNG, JPEG)
- Supports auto, home, and renters insurance policies
- Uses Claude Sonnet 4 for intelligent extraction
- Background processing with `EdgeRuntime.waitUntil`
- Returns confidence scores (0.0-1.0) for extraction quality

**Flow:**
1. User uploads document → stored in `insurance-documents` bucket
2. Record created in `policy_documents` table with `processing_status: "pending"`
3. Frontend calls `smart-worker` with `document_id`
4. Function updates status to `"processing"`, extracts data via Claude API
5. Extracted data saved to `auto_policies` (or home/renters equivalent)
6. Status updated to `"completed"` or `"failed"`
7. Frontend polls `processing_status` until complete, then refetches data

**Extracted Fields (Auto Policy):**
- Insurance company, policy number, dates
- Collision & comprehensive coverage (with deductibles)
- Liability limits (bodily injury, property damage)
- Medical payments, uninsured motorist
- Rental reimbursement, roadside assistance
- Premium amount and frequency

**Required Secrets:**
- `ANTHROPIC_API_KEY` - For Claude API access

**Deploy:**
```bash
npx supabase functions deploy smart-worker
```

### Storage Bucket
- **Bucket:** `insurance-documents`
- **File size limit:** 10MB
- **Allowed types:** PDF, PNG, JPEG
- **RLS:** User-scoped (files stored in `{user_id}/` folder)

### Email Confirmation (send-confirmation-email)
Located at `supabase/functions/send-confirmation-email/index.ts`.

**Features:**
- Sends branded Policy Pocket emails via Resend API
- Supports signup, password reset, and email change
- Compatible with Supabase Auth Hooks for automatic triggering

**Required Secrets:**
- `RESEND_API_KEY` - For Resend email service
- `SITE_URL` - Base URL for confirmation links

### Component Patterns
- Feature components in `src/components/[feature]/`
- Page components in `src/pages/`
- Shared UI primitives in `src/components/ui/`
- Custom hooks in `src/hooks/`

## Common Bug Patterns

### RLS Policy Issues
- Symptom: Data not loading or 403 errors
- Check: `user_id` column matches `auth.uid()` in policy
- Debug: Use Supabase dashboard SQL editor with `set role authenticated`

### Edge Function Errors
- Symptom: Function crashes or import errors
- Check: Using Deno APIs, not Node.js (no `require`, use `import`)
- Check: CORS headers present in response

### State Sync Issues
- Symptom: Stale data after mutations
- Fix: Call `queryClient.invalidateQueries(['key'])` after mutations
- Check: Query keys match between query and invalidation

### Auth Flow Issues
- Symptom: Redirect loops or auth state not persisting
- Check: Supabase client initialization
- Check: Auth listener cleanup in useEffect
