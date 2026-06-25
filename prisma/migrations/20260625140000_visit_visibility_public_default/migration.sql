-- Per-visit visibility goes live: public surfaces will now require visibility =
-- PUBLIC. Default flips PRIVATE → PUBLIC so a public profile keeps showing
-- everything unless a trip is explicitly hidden.
ALTER TABLE "visits" ALTER COLUMN "visibility" SET DEFAULT 'PUBLIC';

-- Backfill: every existing visit was created under the old "show all" behaviour
-- (the visibility column was never used for gating), so promote them all to
-- PUBLIC — otherwise current public profiles / feed / demo data would empty out.
UPDATE "visits" SET "visibility" = 'PUBLIC' WHERE "visibility" = 'PRIVATE';
