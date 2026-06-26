-- ranking.place Pro: €1/mo supporter subscription + cosmetic accent colour.
-- Purely additive (new nullable / defaulted columns) → safe to run on the live
-- DB with no downtime and no backfill.
ALTER TABLE "users" ADD COLUMN "is_pro" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "pro_since" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" TEXT;
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" TEXT;
ALTER TABLE "users" ADD COLUMN "accent_color" TEXT;

-- Unique linkage so a Stripe customer/subscription maps to exactly one user.
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");
CREATE UNIQUE INDEX "users_stripe_subscription_id_key" ON "users"("stripe_subscription_id");
