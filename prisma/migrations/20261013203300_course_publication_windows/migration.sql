ALTER TABLE "Course"
ADD COLUMN "publishedFrom" TIMESTAMP(3),
ADD COLUMN "publishedUntil" TIMESTAMP(3);

ALTER TABLE "CourseInterest"
ADD COLUMN "courseType" TEXT NOT NULL DEFAULT 'Long Course';

UPDATE "CourseInterest" AS interest
SET "courseType" = 'Short Course'
WHERE EXISTS (
  SELECT 1
  FROM "Course" AS course
  WHERE course."name" = interest."course"
    AND course."courseType" = 'Short Course'
);
