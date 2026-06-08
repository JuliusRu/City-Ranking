-- CreateEnum
CREATE TYPE "DistrictFrequency" AS ENUM ('PASSED_THROUGH', 'FEW_TIMES', 'A_LOT', 'BASED_HERE');

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "external_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_districts" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "frequency" "DistrictFrequency" NOT NULL DEFAULT 'FEW_TIMES',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_districts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "districts_city_id_idx" ON "districts"("city_id");

-- CreateIndex
CREATE UNIQUE INDEX "districts_city_id_name_key" ON "districts"("city_id", "name");

-- CreateIndex
CREATE INDEX "visit_districts_visit_id_idx" ON "visit_districts"("visit_id");

-- CreateIndex
CREATE INDEX "visit_districts_district_id_idx" ON "visit_districts"("district_id");

-- CreateIndex
CREATE UNIQUE INDEX "visit_districts_visit_id_district_id_key" ON "visit_districts"("visit_id", "district_id");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_districts" ADD CONSTRAINT "visit_districts_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_districts" ADD CONSTRAINT "visit_districts_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
