-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "following_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_likes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "follows_follower_id_idx" ON "follows"("follower_id");

-- CreateIndex
CREATE INDEX "follows_following_id_idx" ON "follows"("following_id");

-- CreateIndex
CREATE UNIQUE INDEX "follows_follower_id_following_id_key" ON "follows"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "visit_likes_visit_id_idx" ON "visit_likes"("visit_id");

-- CreateIndex
CREATE UNIQUE INDEX "visit_likes_user_id_visit_id_key" ON "visit_likes"("user_id", "visit_id");

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_likes" ADD CONSTRAINT "visit_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_likes" ADD CONSTRAINT "visit_likes_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

