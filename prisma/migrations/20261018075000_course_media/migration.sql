CREATE TABLE "CourseMedia" (
    "id" SERIAL NOT NULL,
    "courseId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseMedia_courseId_sortOrder_id_idx"
ON "CourseMedia"("courseId", "sortOrder", "id");

ALTER TABLE "CourseMedia"
ADD CONSTRAINT "CourseMedia_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
