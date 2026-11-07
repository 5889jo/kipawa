ALTER TABLE "CourseInterest"
ADD COLUMN "userId" INTEGER,
ADD COLUMN "controlNumber" TEXT,
ADD COLUMN "paymentProofPath" TEXT,
ADD COLUMN "paymentProofUploadedAt" TIMESTAMP(3),
ADD COLUMN "proofReviewedAt" TIMESTAMP(3),
ADD COLUMN "proofFeedback" TEXT,
ADD COLUMN "applicationSubmittedAt" TIMESTAMP(3),
ADD COLUMN "applicationFeedback" TEXT,
ADD COLUMN "emergencyContactName" TEXT,
ADD COLUMN "emergencyContactPhone" TEXT,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "educationLevel" DROP NOT NULL;

ALTER TABLE "CourseInterest"
ADD CONSTRAINT "CourseInterest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "CourseInterest_userId_createdAt_idx"
ON "CourseInterest"("userId", "createdAt");
