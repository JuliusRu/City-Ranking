-- CreateTable
CREATE TABLE "feedback" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "username" TEXT,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feedback_created_at_idx" ON "feedback"("created_at");

-- Security backstop: keep RLS enabled on every public table (project invariant).
-- The app connects as `postgres` (owner) and bypasses RLS; anon/authenticated
-- are denied by both RLS (enabled, no policy) and revoked grants. Mirrors
-- 20260624000000_rls_new_tables.
DO $$
BEGIN
  EXECUTE 'ALTER TABLE feedback ENABLE ROW LEVEL SECURITY';
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON TABLE feedback FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON TABLE feedback FROM authenticated';
  END IF;
END $$;
