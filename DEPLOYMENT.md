# Deployment Guide

## Architecture

```
User → Cloudflare (DNS/SSL) → Coolify (Docker) → Next.js App → Supabase (PostgreSQL)
```

- **Domain**: `www.ranking.place` (registered via spaceship.com)
- **DNS/CDN**: Cloudflare
- **Hosting**: Coolify (Dockerfile-based deployment)
- **Database**: Supabase PostgreSQL (Europe, free tier)
- **Framework**: Next.js 16 + Prisma ORM

## Environment Variables

Set these in Coolify:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql://postgres:[URL-ENCODED-PASSWORD]@db.gvrocksdppdidkqwbrsx.supabase.co:5432/postgres` |
| `NEXT_PUBLIC_APP_URL` | `https://www.ranking.place` |

> **Note**: The database password contains `/` and `+` — these must be URL-encoded as `%2F` and `%2B` in the connection string.

## Supabase

- **Project ref**: `gvrocksdppdidkqwbrsx`
- **Region**: Europe
- **RLS**: Disabled (single-user app for now)
- **Data API**: Disabled (using Prisma direct connection)

## Database Commands

```bash
# Push schema changes to database
npx prisma db push

# Seed the database (creates user, 28 cities, 39 visits)
npm run db:seed

# Open Prisma Studio (visual database browser)
npm run db:studio

# Generate Prisma client after schema changes
npx prisma generate
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Local env files (.env, .env.local) are gitignored
# They should contain DATABASE_URL pointing to Supabase
```

## Docker Build

The app uses a multi-stage Dockerfile:
1. **deps** — installs node_modules + generates Prisma client
2. **builder** — builds the Next.js standalone app
3. **runner** — minimal production image on port 3000

## Deployment Checklist

- [ ] Set environment variables in Coolify (`DATABASE_URL`, `NEXT_PUBLIC_APP_URL`)
- [ ] Verify Coolify builds from Dockerfile successfully
- [ ] Verify Cloudflare DNS points `www.ranking.place` to Coolify server
- [ ] Verify SSL works (should be handled by Cloudflare)
- [ ] Test production site at `https://www.ranking.place`
- [ ] Rotate Supabase API keys (they were exposed during setup)
- [ ] Remove debug overlay in `GlobeWrapper.tsx`
- [ ] Remove `console.log` statements in globe components
