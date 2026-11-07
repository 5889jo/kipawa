ALTER TABLE "CourseInterest"
ADD COLUMN "formFeeTransactionReference" TEXT,
ADD COLUMN "formFeeVerifiedAmount" INTEGER;

CREATE UNIQUE INDEX "CourseInterest_formFeeTransactionReference_key"
ON "CourseInterest"("formFeeTransactionReference");
