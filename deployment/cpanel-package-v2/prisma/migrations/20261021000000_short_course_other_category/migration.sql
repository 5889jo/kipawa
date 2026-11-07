UPDATE "Course"
SET "category" = 'OTHER'
WHERE "courseType" = 'Short Course'
  AND (
    "category" IS NULL
    OR BTRIM("category") = ''
    OR "category" NOT IN ('ICT', 'ELECTRICAL', 'ELECTRONICS', 'MECHATRONICS', 'OTHER')
  );
