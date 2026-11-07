WITH ranked_requests AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "userId"
            ORDER BY "createdAt" DESC, "id" DESC
        ) AS "rank"
    FROM "CourseInterest"
    WHERE "userId" IS NOT NULL
      AND "status" NOT IN ('application_declined', 'superseded')
)
UPDATE "CourseInterest" AS interest
SET "status" = 'superseded'
FROM ranked_requests AS ranked
WHERE interest."id" = ranked."id"
  AND ranked."rank" > 1;

DROP INDEX "CourseInterest_userId_courseId_active_key";

CREATE UNIQUE INDEX "CourseInterest_userId_active_key"
ON "CourseInterest"("userId")
WHERE "userId" IS NOT NULL
  AND "status" NOT IN ('application_declined', 'superseded');
