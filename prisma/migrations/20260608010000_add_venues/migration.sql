-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('RESTAURANT', 'CAFE', 'BAR', 'BAKERY', 'CLUB', 'OTHER');

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "VenueType" NOT NULL DEFAULT 'RESTAURANT',
    "rating" SMALLINT NOT NULL,
    "location" TEXT,
    "price_level" TEXT,
    "note" TEXT,
    "would_return" BOOLEAN,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "venues_user_id_idx" ON "venues"("user_id");

-- CreateIndex
CREATE INDEX "venues_type_idx" ON "venues"("type");

-- AddForeignKey
ALTER TABLE "venues" ADD CONSTRAINT "venues_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
