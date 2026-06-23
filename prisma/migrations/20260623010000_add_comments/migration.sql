-- CreateTable
CREATE TABLE "visit_comments" (
    "id" TEXT NOT NULL,
    "visit_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visit_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visit_comments_visit_id_idx" ON "visit_comments"("visit_id");

-- CreateIndex
CREATE INDEX "visit_comments_user_id_idx" ON "visit_comments"("user_id");

-- AddForeignKey
ALTER TABLE "visit_comments" ADD CONSTRAINT "visit_comments_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_comments" ADD CONSTRAINT "visit_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

