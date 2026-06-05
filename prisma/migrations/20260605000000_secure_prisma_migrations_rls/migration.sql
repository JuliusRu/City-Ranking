-- Security fix: Supabase advisor "rls_disabled_in_public" on public._prisma_migrations.
-- Prisma creates this bookkeeping table without RLS, and Supabase grants the
-- public Data API roles (anon/authenticated) full access to it. With our anon key
-- now public (client-side auth), anyone could read/modify/TRUNCATE the migration
-- ledger and break future `prisma migrate deploy`.
--
-- The `postgres` role OWNS this table and the app connects as `postgres`, so it
-- bypasses RLS — Prisma migrations keep working. anon/authenticated are denied
-- twice: by RLS (enabled, no policy) and by revoked grants.

ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;

-- Portable: the anon/authenticated roles only exist on Supabase, not on a plain
-- local Postgres dev DB. Guard the REVOKE so this migration runs everywhere.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "_prisma_migrations" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "_prisma_migrations" FROM authenticated;
  END IF;
END $$;
