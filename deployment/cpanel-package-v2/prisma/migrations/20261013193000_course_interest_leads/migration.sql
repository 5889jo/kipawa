CREATE TABLE "CourseInterest" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "nationality" TEXT,
    "address" TEXT NOT NULL,
    "educationLevel" TEXT NOT NULL,
    "course" TEXT NOT NULL,
    "centrePreference" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseInterest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseInterest_course_createdAt_idx" ON "CourseInterest"("course", "createdAt");
