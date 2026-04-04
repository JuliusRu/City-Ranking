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
- Prisma connects as `postgres` superuser (bypasses RLS)
- Supabase Data API is disabled — all DB access goes through Prisma
- RLS is enabled on all tables with permissive policies for `postgres` role
- `.env` / `.env.local` contain database credentials (gitignored)

## Key Directories
- `src/components/globe/` — CesiumJS globe viewer and related UI
- `src/lib/` — utilities (rating colors, Prisma client, etc.)
- `prisma/` — schema and seed script
