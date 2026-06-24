-- Security backstop: keep RLS enabled on EVERY public table (per the project's
-- architecture invariant). The districts/venues/follows/likes/comments tables
-- were created by plain Prisma migrations, which don't enable RLS — so on
-- Supabase the Data API roles (anon/authenticated) would have access if the Data
-- API were ever re-enabled. The app connects as `postgres` (table owner), which
-- bypasses RLS, so nothing breaks; anon/authenticated are denied twice: by RLS
-- (enabled, no policy) and by revoked grants. Mirrors 20260605000000.

DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'districts',
    'visit_districts',
    'venues',
    'follows',
    'visit_likes',
    'visit_comments'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    -- anon/authenticated only exist on Supabase, not on a plain local dev DB.
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I FROM anon', t);
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE format('REVOKE ALL ON TABLE %I FROM authenticated', t);
    END IF;
  END LOOP;
END $$;
