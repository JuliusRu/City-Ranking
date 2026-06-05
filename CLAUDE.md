# City Ranking App

Personal city ranking/tracking app built with Next.js.

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **ORM**: Prisma (direct PostgreSQL connection)
- **Database**: Supabase PostgreSQL (free tier, Europe)
- **3D Globe**: CesiumJS
- **Styling**: Tailwind CSS
- **Deployment**: Coolify (Dockerfile-based), domain: www.ranking.place

## Development
- `npm run dev` — starts on port 3001 (3000 is occupied)
- `npm run build` — production build
- `npx prisma db push` — push schema to database
- `npm run db:seed` — seed with initial data

## Architecture
- Prisma connects as `postgres` (owns the tables → bypasses RLS); all app DB access goes through Prisma via the Next.js `/api/*` routes
- The Supabase **Data API (PostgREST) should be disabled** — the app never uses `/rest/v1`, only GoTrue (`/auth/v1`) for client-side auth. Verify in Supabase → Settings → API; if it's ever re-enabled, RLS below is the backstop.
- RLS is enabled on **all** public tables, including `_prisma_migrations`. Tables have **no policies** → the API roles (`anon`/`authenticated`) are denied everything; only `postgres` (table owner) gets through. `_prisma_migrations` additionally has anon/authenticated grants revoked (see migration `20260605000000_secure_prisma_migrations_rls`).
- `.env` / `.env.local` contain database credentials (gitignored)

## Key Directories
- `src/components/globe/` — CesiumJS globe viewer and related UI
- `src/lib/` — utilities (rating colors, Prisma client, etc.)
- `prisma/` — schema and seed script
