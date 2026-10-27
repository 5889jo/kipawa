CREATE TABLE "LearnerNotification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "courseInterestId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "LearnerNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LearnerNotification_userId_readAt_createdAt_idx"
ON "LearnerNotification"("userId", "readAt", "createdAt");

CREATE INDEX "LearnerNotification_courseInterestId_idx"
ON "LearnerNotification"("courseInterestId");

ALTER TABLE "LearnerNotification"
ADD CONSTRAINT "LearnerNotification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LearnerNotification"
ADD CONSTRAINT "LearnerNotification_courseInterestId_fkey"
FOREIGN KEY ("courseInterestId") REFERENCES "CourseInterest"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
