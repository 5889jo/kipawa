ALTER TABLE "CourseInterest"
ADD COLUMN "courseId" INTEGER;

WITH course_matches AS (
    SELECT "name", MIN("id") AS "courseId", COUNT(*) AS "matchCount"
    FROM "Course"
    GROUP BY "name"
),
matched_courses AS (
    SELECT
        interest."id",
        course_match."courseId",
        ROW_NUMBER() OVER (
            PARTITION BY interest."userId", course_match."courseId"
            ORDER BY interest."createdAt" DESC, interest."id" DESC
        ) AS "rank"
    FROM "CourseInterest" AS interest
    JOIN course_matches AS course_match ON course_match."name" = interest."course"
    WHERE interest."userId" IS NOT NULL
      AND interest."status" <> 'application_declined'
      AND course_match."matchCount" = 1
)
UPDATE "CourseInterest" AS interest
SET "courseId" = CASE WHEN matched."rank" = 1 THEN matched."courseId" ELSE NULL END
FROM matched_courses AS matched
WHERE interest."id" = matched."id";

ALTER TABLE "CourseInterest"
ADD CONSTRAINT "CourseInterest_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "CourseInterest_courseId_idx"
ON "CourseInterest"("courseId");

CREATE UNIQUE INDEX "CourseInterest_userId_courseId_active_key"
ON "CourseInterest"("userId", "courseId")
WHERE "userId" IS NOT NULL
  AND "courseId" IS NOT NULL
  AND "status" <> 'application_declined';
