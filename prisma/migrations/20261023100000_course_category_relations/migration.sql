CREATE TABLE "CourseCategory" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSw" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseCategory_pkey" PRIMARY KEY ("code")
);

INSERT INTO "CourseCategory" ("code", "name", "nameSw", "sortOrder", "updatedAt")
VALUES
    ('ICT', 'ICT', 'TEHAMA', 0, CURRENT_TIMESTAMP),
    ('ELECTRICAL', 'Electrical', 'Umeme', 1, CURRENT_TIMESTAMP),
    ('ELECTRONICS', 'Electronics', 'Elektroniki', 2, CURRENT_TIMESTAMP),
    ('MECHATRONICS', 'Mechatronics', 'Mekatroniki', 3, CURRENT_TIMESTAMP),
    ('OTHER', 'Other', 'Nyingine', 4, CURRENT_TIMESTAMP);

UPDATE "Course"
SET "category" = CASE
    WHEN upper(trim("category")) IN ('ICT', 'ELECTRICAL', 'ELECTRONICS', 'MECHATRONICS', 'OTHER')
        THEN upper(trim("category"))
    WHEN "courseType" = 'Short Course' THEN 'OTHER'
    ELSE 'ICT'
END;

CREATE TEMPORARY TABLE "CourseDuplicateMap" AS
WITH normalized_courses AS (
    SELECT
        "id",
        "courseType",
        "category",
        COALESCE(
            NULLIF(lower(regexp_replace("name", '[^[:alnum:]]', '', 'g')), ''),
            lower("slug")
        ) AS "normalizedName",
        row_number() OVER (
            PARTITION BY
                "courseType",
                "category",
                COALESCE(
                    NULLIF(lower(regexp_replace("name", '[^[:alnum:]]', '', 'g')), ''),
                    lower("slug")
                )
            ORDER BY "updatedAt" DESC, "createdAt", "id"
        ) AS "position"
    FROM "Course"
)
SELECT duplicate."id" AS "duplicateId", canonical."id" AS "canonicalId"
FROM normalized_courses AS duplicate
JOIN normalized_courses AS canonical
    ON canonical."courseType" = duplicate."courseType"
    AND canonical."category" = duplicate."category"
    AND canonical."normalizedName" = duplicate."normalizedName"
    AND canonical."position" = 1
WHERE duplicate."position" > 1;

WITH duplicate_values AS (
    SELECT
        duplicate_map."canonicalId",
        (array_agg(duplicate."nameSw" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."nameSw" IS NOT NULL))[1] AS "nameSw",
        (array_agg(duplicate."levelSw" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."levelSw" IS NOT NULL))[1] AS "levelSw",
        (array_agg(duplicate."durationSw" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."durationSw" IS NOT NULL))[1] AS "durationSw",
        (array_agg(duplicate."description" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."description" IS NOT NULL))[1] AS "description",
        (array_agg(duplicate."descriptionSw" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."descriptionSw" IS NOT NULL))[1] AS "descriptionSw",
        (array_agg(duplicate."startDate" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."startDate" IS NOT NULL))[1] AS "startDate",
        (array_agg(duplicate."endDate" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."endDate" IS NOT NULL))[1] AS "endDate",
        (array_agg(duplicate."publishedFrom" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."publishedFrom" IS NOT NULL))[1] AS "publishedFrom",
        (array_agg(duplicate."publishedUntil" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."publishedUntil" IS NOT NULL))[1] AS "publishedUntil",
        (array_agg(duplicate."fee" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."fee" IS NOT NULL))[1] AS "fee",
        (array_agg(duplicate."imageUrl" ORDER BY duplicate."updatedAt" DESC) FILTER (WHERE duplicate."imageUrl" IS NOT NULL))[1] AS "imageUrl"
    FROM "CourseDuplicateMap" AS duplicate_map
    JOIN "Course" AS duplicate ON duplicate."id" = duplicate_map."duplicateId"
    GROUP BY duplicate_map."canonicalId"
)
UPDATE "Course" AS canonical
SET
    "nameSw" = COALESCE(canonical."nameSw", duplicate_values."nameSw"),
    "levelSw" = COALESCE(canonical."levelSw", duplicate_values."levelSw"),
    "durationSw" = COALESCE(canonical."durationSw", duplicate_values."durationSw"),
    "description" = COALESCE(canonical."description", duplicate_values."description"),
    "descriptionSw" = COALESCE(canonical."descriptionSw", duplicate_values."descriptionSw"),
    "startDate" = COALESCE(canonical."startDate", duplicate_values."startDate"),
    "endDate" = COALESCE(canonical."endDate", duplicate_values."endDate"),
    "publishedFrom" = COALESCE(canonical."publishedFrom", duplicate_values."publishedFrom"),
    "publishedUntil" = COALESCE(canonical."publishedUntil", duplicate_values."publishedUntil"),
    "fee" = COALESCE(canonical."fee", duplicate_values."fee"),
    "imageUrl" = COALESCE(canonical."imageUrl", duplicate_values."imageUrl")
FROM duplicate_values
WHERE canonical."id" = duplicate_values."canonicalId";

INSERT INTO "CentreCourse" ("centreId", "courseId")
SELECT link."centreId", duplicate_map."canonicalId"
FROM "CentreCourse" AS link
JOIN "CourseDuplicateMap" AS duplicate_map
    ON duplicate_map."duplicateId" = link."courseId"
ON CONFLICT ("centreId", "courseId") DO NOTHING;

DELETE FROM "CentreCourse" AS link
USING "CourseDuplicateMap" AS duplicate_map
WHERE link."courseId" = duplicate_map."duplicateId";

UPDATE "CourseMedia" AS media
SET "courseId" = duplicate_map."canonicalId"
FROM "CourseDuplicateMap" AS duplicate_map
WHERE media."courseId" = duplicate_map."duplicateId";

WITH mapped_interests AS (
    SELECT
        interest."id",
        duplicate_map."canonicalId",
        interest."userId",
        interest."status",
        row_number() OVER (
            PARTITION BY duplicate_map."canonicalId", interest."userId"
            ORDER BY (interest."status" = 'application_declined'), interest."createdAt", interest."id"
        ) AS "position",
        EXISTS (
            SELECT 1
            FROM "CourseInterest" AS existing_interest
            WHERE existing_interest."userId" = interest."userId"
                AND existing_interest."courseId" = duplicate_map."canonicalId"
                AND existing_interest."status" <> 'application_declined'
        ) AS "hasCanonicalActiveInterest"
    FROM "CourseInterest" AS interest
    JOIN "CourseDuplicateMap" AS duplicate_map
        ON duplicate_map."duplicateId" = interest."courseId"
)
UPDATE "CourseInterest" AS interest
SET "courseId" = CASE
    WHEN mapped_interests."userId" IS NOT NULL
        AND mapped_interests."status" <> 'application_declined'
        AND (mapped_interests."hasCanonicalActiveInterest" OR mapped_interests."position" > 1)
        THEN NULL
    ELSE mapped_interests."canonicalId"
END
FROM mapped_interests
WHERE interest."id" = mapped_interests."id";

UPDATE "Publication" AS publication
SET "courseId" = duplicate_map."canonicalId"
FROM "CourseDuplicateMap" AS duplicate_map
WHERE publication."courseId" = duplicate_map."duplicateId";

DELETE FROM "Course" AS course
USING "CourseDuplicateMap" AS duplicate_map
WHERE course."id" = duplicate_map."duplicateId";

ALTER TABLE "Course"
ADD CONSTRAINT "Course_category_fkey"
FOREIGN KEY ("category") REFERENCES "CourseCategory"("code")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CentreCourse"
DROP CONSTRAINT "CentreCourse_courseId_fkey";

ALTER TABLE "CentreCourse"
ADD CONSTRAINT "CentreCourse_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Course_courseType_category_normalizedName_key"
ON "Course" (
    "courseType",
    "category",
    (COALESCE(NULLIF(lower(regexp_replace("name", '[^[:alnum:]]', '', 'g')), ''), lower("slug")))
);

CREATE INDEX "Course_category_idx" ON "Course"("category");
CREATE INDEX "CourseCategory_sortOrder_code_idx" ON "CourseCategory"("sortOrder", "code");

DROP TABLE "CourseDuplicateMap";
