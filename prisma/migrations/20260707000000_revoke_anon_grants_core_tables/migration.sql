-- Security fix: Supabase advisors 0026_pg_graphql_anon_table_exposed and
-- 0027_pg_graphql_authenticated_table_exposed on the four ORIGINAL public
-- tables (cities, user_settings, users, visits).
--
-- Why only these four: they were created by early Prisma migrations (0_init /
-- 20260528120000) BEFORE we adopted the "revoke Data-API grants on every table"
-- practice. Every table created since (districts, venues, follows, visit_likes,
-- visit_comments, feedback, …) already had anon/authenticated grants revoked in
-- 20260624000000_rls_new_tables and 20260625120000_add_feedback. Supabase's
-- ALTER DEFAULT PRIVILEGES auto-grants SELECT to anon/authenticated on new
-- tables, which is why these four still carried the grant and showed up in the
-- GraphQL introspection schema.
--
-- RLS is already ENABLED (no policies) on all four, so no rows ever leak; this
-- migration removes the remaining table-level GRANT so the objects also drop out
-- of the GraphQL/PostgREST schema (defence in depth, and it silences the lints).
-- The app connects as `postgres` (table owner), which bypasses BOTH grants and
-- RLS, so nothing in the app breaks. Mirrors 20260624000000_rls_new_tables.

DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'cities',
    'user_settings',
    'users',
    'visits'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    -- Idempotent: RLS is expected to be on already (enabled via the 2026-06-05
    -- dashboard hardening); re-enabling is a harmless no-op.
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
