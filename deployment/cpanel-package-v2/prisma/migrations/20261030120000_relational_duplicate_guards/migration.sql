-- Prevent duplicate relationship rows and duplicate course media attachments.
-- Existing exact duplicate media rows are safe to collapse because they point to
-- the same course and the same stored URL.
DELETE FROM "CourseMedia" AS duplicate
USING "CourseMedia" AS canonical
WHERE duplicate."id" > canonical."id"
  AND duplicate."courseId" = canonical."courseId"
  AND duplicate."url" = canonical."url";

CREATE UNIQUE INDEX "District_regionId_name_key"
ON "District"("regionId", "name");

CREATE UNIQUE INDEX "TrainingCentre_districtId_name_key"
ON "TrainingCentre"("districtId", "name");

CREATE UNIQUE INDEX "CourseMedia_courseId_url_key"
ON "CourseMedia"("courseId", "url");
