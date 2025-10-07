# MealON
MealON (formerly Mess Management) — ready-to-deploy Vite + React + Tailwind frontend with Supabase integration.

## Notes
- Supabase config must be provided in Vercel environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- The database schema is available at `db/schema.sql`. Run it in your Supabase project.

## Deploy
1. Upload this repo to GitHub.
2. Connect repo to Vercel and deploy (Vite auto-detected).
3. Add Supabase env vars in Vercel dashboard.
