UPDATE "Course"
SET "category" = CASE
  WHEN "name" ILIKE '%driv%' THEN 'ICT'
  WHEN "name" ILIKE '%mechatronic%' THEN 'MECHATRONICS'
  WHEN "name" ILIKE '%electronic%' THEN 'ELECTRONICS'
  WHEN "name" ILIKE '%electri%' OR "name" ILIKE '%automation%' THEN 'ELECTRICAL'
  ELSE 'ICT'
END;

ALTER TABLE "Course"
ALTER COLUMN "category" SET DEFAULT 'ICT';
