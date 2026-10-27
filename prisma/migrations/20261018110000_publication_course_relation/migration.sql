ALTER TABLE "Publication"
ADD COLUMN "courseId" INTEGER;

CREATE INDEX "Publication_courseId_idx" ON "Publication"("courseId");

ALTER TABLE "Publication"
ADD CONSTRAINT "Publication_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
