ALTER TABLE "TrainingCentre"
ADD COLUMN "type" TEXT NOT NULL DEFAULT 'Training centre',
ADD COLUMN "focus" TEXT NOT NULL DEFAULT 'Vocational training';

ALTER TABLE "NewsArticle"
ADD COLUMN "category" TEXT NOT NULL DEFAULT 'News';

CREATE TABLE "ContactInquiry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactInquiry_createdAt_idx" ON "ContactInquiry"("createdAt");
