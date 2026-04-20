# MealON v2 🍛

Smart mess management — track meals, split expenses, manage members.

**Stack:** React 18 · Vite · Tailwind CSS · Supabase · TanStack Query · Zustand · Recharts · Vercel

---

## Deploy in 4 steps

### Step 1 — Supabase: run the schema

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste the full contents of `db/schema.sql` → **Run**
3. You'll see a table confirming all 8 tables have RLS enabled

### Step 2 — Supabase: configure auth

1. **Authentication → Providers → Email** → enable **Confirm email**
2. **Authentication → URL Configuration**
   - Site URL: `https://your-app.vercel.app`
   - Add redirect URL: `https://your-app.vercel.app/**`

### Step 3 — Vercel: create project

1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com/new)
3. Vercel auto-detects Vite — no config needed
4. Go to **Settings → Environment Variables** and add:

```
VITE_SUPABASE_URL        = https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY   = eyJhbGciOiJIUzI1...
```

Both values are in: Supabase → **Project Settings → API**

5. Click **Deploy**

### Step 4 — Push to deploy

```bash
git init
git add .
git commit -m "feat: MealON v2 initial"
git remote add origin https://github.com/mehedyk/MealON.git
git push -u origin main
```

Vercel deploys automatically on every push to `main`.

---

## Local development (optional)

```bash
cp .env.example .env.local
# Fill in your Supabase URL and anon key in .env.local

npm install
npm run dev
```

---

## Features

| Module | Description |
|--------|-------------|
| **Auth** | Email signup/login, password reset, email verification |
| **Onboarding** | Create mess (get a 6-char code) or join one |
| **Dashboard** | Live stats: members, meals, expenses, meal rate |
| **Meals** | Monthly grid per member, B/L/D logging, meal-rate calc |
| **Expenses** | Shared expenses by category + member deposits |
| **Balance** | Per-member balance sheet + settlement instructions |
| **Reports** | Recharts analytics + browser print-to-PDF |
| **Menu** | Weekly meal planner grid |
| **Rules** | Mess rules with active/inactive toggle |
| **Voting** | Monthly democratic manager election |
| **Members** | Invite, promote, remove members |
| **Settings** | Rename mess, leave mess, danger zone |

---

## Security

- Row-level security (RLS) on all 8 tables with separate SELECT/INSERT/UPDATE/DELETE policies
- `create_mess` and `join_mess` RPCs validate all inputs server-side
- All client inputs pass through `src/utils/validate.js` before any DB call
- XSS: `sanitizeText()` strips HTML tags from all text inputs
- SQL injection: not possible — Supabase JS client uses parameterized queries
- Security headers in `vercel.json`: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`
- Passwords hashed by Supabase (bcrypt), never accessible in plaintext

---

## Project structure

```
src/
  components/
    auth/         ProtectedRoute
    layout/       AppLayout (sidebar + mobile nav)
    ui/           Logo, Spinner, Alert, Field, Empty, etc.
  hooks/
    useMess.js    Members, dashboard stats, today's meals
    useMeals.js   Monthly grid, upsert/delete meals
    useExpenses.js Expenses, deposits, balance sheet
    useMenu.js    Weekly menu planner
    useRulesAndVoting.js  Rules CRUD + voting
  lib/
    supabase.js   Supabase client
  pages/          One file per route
  store/
    authStore.js  Zustand: user, member, mess, loading
  utils/
    validate.js   All input validation + sanitization
db/
  schema.sql      Complete Supabase schema — run this first
```
