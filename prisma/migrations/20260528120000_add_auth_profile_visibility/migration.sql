-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'FRIENDS', 'PUBLIC');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth_id" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "public_profile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE';

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

