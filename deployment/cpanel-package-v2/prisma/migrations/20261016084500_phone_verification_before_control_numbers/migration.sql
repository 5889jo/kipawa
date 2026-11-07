ALTER TABLE "User"
ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);

WITH latest_account_phone AS (
    SELECT DISTINCT ON ("userId")
        "userId",
        NULLIF(REGEXP_REPLACE(BTRIM("phone"), '[()[:space:].-]', '', 'g'), '') AS "phone"
    FROM "CourseInterest"
    WHERE "userId" IS NOT NULL
      AND NULLIF(BTRIM("phone"), '') IS NOT NULL
    ORDER BY "userId", "updatedAt" DESC, "id" DESC
)
UPDATE "User" AS account
SET "phone" = latest_account_phone."phone"
FROM latest_account_phone
WHERE account."id" = latest_account_phone."userId"
  AND NULLIF(BTRIM(account."phone"), '') IS NULL;

ALTER TABLE "CourseInterest"
    ALTER COLUMN "fullName" DROP NOT NULL,
    ALTER COLUMN "email" DROP NOT NULL,
    ALTER COLUMN "phone" DROP NOT NULL,
    ALTER COLUMN "course" DROP NOT NULL,
    ALTER COLUMN "courseType" DROP NOT NULL;
