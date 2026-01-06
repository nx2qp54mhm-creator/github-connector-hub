# Claude Code Setup Guide (Plain English)

This document explains our Claude Code configuration in non-technical terms. It's a companion to `CLAUDE.md` (which is written for Claude to read).

---

## Table of Contents
- [Configuration Files Explained](#configuration-files-explained)
- [Custom Agents](#custom-agents)
- [Glossary](#glossary)
- [Future Explanations](#future-explanations)

---

## Configuration Files Explained

### 1. Permissions (`.claude/settings.local.json`)

**What this file does:**
Think of this as a "pre-approved list" for Claude Code. Normally, when Claude wants to run a command on your computer, it asks for permission first (like an app asking "Allow access?").

**What we configured:**
We added common commands to the "already approved" list, so Claude won't interrupt you asking "Can I run this?" for routine tasks.

**Real-world analogy:**
It's like giving your assistant a key to the supply closet instead of them asking you to unlock it every time they need paper.

**Examples of what's pre-approved:**
- Building your app (`npm run build`)
- Checking for code errors (`npm run lint`)
- Deploying to Supabase (your database/backend service)
- Reading and editing files
- Git commands (saving and sharing code changes)

---

### 2. Ignore File (`.claudeignore`)

**What this file does:**
This tells Claude Code which files to **ignore** when searching through your project. It's like telling someone "don't bother looking in the storage closet" when they're searching for your keys.

**Why this matters:**
Your project has ~153 code files that you wrote, but also has:
- `node_modules/` - Thousands of files from external libraries (not your code)
- Generated files - Automatically created by tools, not hand-written
- Images, fonts, PDFs - Not relevant when searching for code

**What we configured to ignore:**
- The large auto-generated database types file
- Image and font files (`.png`, `.jpg`, `.svg`, etc.)
- README documentation
- The `public/` folder with static assets
- Lock files (dependency tracking files that are very large)

**Benefit:**
When Claude searches your code, it finds relevant results faster and doesn't waste time looking through files that aren't useful.

---

### 3. Project Instructions (`CLAUDE.md`)

**What this file does:**
`CLAUDE.md` is like a "briefing document" that Claude reads before helping you. It tells Claude about your specific project so it doesn't have to figure everything out from scratch each time.

**What's included:**

#### Domain Context (Insurance Knowledge)
We explained what your app actually does:
- Types of coverage (auto, rental, travel, purchase protection)
- Key concepts (policies, benefits, cards, claims)
- Business rules (e.g., "you must pay with the card to get the benefit")

*Why this helps:* Claude gives insurance-relevant suggestions instead of generic ones.

#### UI Component List
Your project already has 50+ pre-built UI components (buttons, forms, modals, etc.). We listed them all.

*Why this helps:* Claude uses existing components instead of suggesting new ones.

#### Architecture Decisions
Documents *why* certain technical choices were made, like when to use different tools for different purposes.

*Why this helps:* Claude follows your existing patterns instead of suggesting conflicting approaches.

#### Common Bug Patterns
Documented frequent problems and their solutions, like:
- Permission errors → Check RLS policies
- Function crashes → Check for Deno vs Node.js issues
- Stale data → Check cache invalidation

*Why this helps:* When you hit a bug, Claude can quickly identify the likely cause.

---

## Custom Agents

Agents are like "specialist modes" for Claude. Instead of being a generalist, Claude can switch into expert mode for specific topics.

### Landing Page Strategist
**File:** `.claude/agents/landing-page-strategist.md`

**What it does:**
Activates when working on landing page design, copywriting, or conversion optimization.

**When to use:**
- "Review my landing page"
- "Help me write better hero copy"
- "How can I improve conversions?"

**What it knows:**
- Visual design principles
- Copywriting frameworks
- Conversion optimization strategies
- UX best practices

---

### Supabase Expert
**File:** `.claude/agents/supabase-expert.md`

**What Supabase is:**
Supabase is the backend service your app uses for:
- User accounts and login (authentication)
- Database (storing all your data)
- Edge Functions (server-side code that runs in the cloud)

**What the agent does:**
When you're working on database or backend tasks, Claude activates this specialist. It includes:
- Pre-written code templates for common tasks
- Debugging checklists (step-by-step troubleshooting)
- Best practices specific to Supabase

**When to use:**
- "Create a new database table"
- "Users can't see their data" (permission issues)
- "Write an Edge Function to send emails"
- "Why is my query slow?"

**Real-world analogy:**
It's like having a specialist consultant on-call. Instead of a general contractor, you're bringing in the plumbing expert when you have plumbing questions.

---

## Glossary

Common terms you'll encounter:

| Term | Plain English Definition |
|------|-------------------------|
| **npm** | A tool that downloads and manages external code libraries your project uses |
| **Build** | Converting your code into a format that can run in web browsers |
| **Lint** | Automatically checking code for common mistakes and style issues |
| **Git** | A system for tracking changes to your code (like "Track Changes" in Word) |
| **Commit** | Saving a snapshot of your code changes with a description |
| **Push** | Uploading your saved changes to GitHub (cloud storage for code) |
| **Pull** | Downloading the latest changes from GitHub |
| **Branch** | A separate copy of your code where you can make changes without affecting the main version |
| **Migration** | A script that changes your database structure (adding tables, columns, etc.) |
| **RLS (Row Level Security)** | Database rules that control who can see/edit which data |
| **Edge Function** | Server-side code that runs in Supabase's cloud (not on your computer) |
| **Deno** | The programming environment Edge Functions use (different from Node.js) |
| **Node.js** | A programming environment for running JavaScript outside browsers |
| **API** | A way for different software to communicate with each other |
| **Component** | A reusable piece of your user interface (like a button or form) |
| **State** | Data that your app remembers while you're using it |
| **Query** | A request to get data from a database |
| **Mutation** | A request to change data in a database |
| **TypeScript** | JavaScript with added safety checks to catch errors before they happen |
| **Tailwind** | A system for styling your app using pre-defined CSS classes |
| **shadcn/ui** | A library of pre-built UI components (buttons, modals, forms, etc.) |

---

## Future Explanations

*This section will be updated as new concepts are explained during our conversations.*

### [Date] - Topic
Explanation will go here.

---

## Quick Reference

| File | Purpose | Analogy |
|------|---------|---------|
| `CLAUDE.md` | Technical instructions for Claude | Employee handbook |
| `CLAUDE-GUIDE.md` | Plain English explanations (this file) | Training guide for you |
| `.claudeignore` | Files Claude should skip | "Do not enter" signs |
| `.claude/settings.local.json` | Pre-approved permissions | Key to the supply closet |
| `.claude/agents/*.md` | Specialist modes | On-call consultants |
