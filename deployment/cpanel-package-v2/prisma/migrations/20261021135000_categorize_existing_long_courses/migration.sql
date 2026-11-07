UPDATE "Course"
SET "category" = CASE "slug"
  WHEN 'electronics-el' THEN 'ELECTRONICS'
  WHEN 'information-and-communication-technology-ict' THEN 'ICT'
  WHEN 'electrical-installation-and-automation-ela' THEN 'ELECTRICAL'
  WHEN 'multimedia-and-film-technology' THEN 'ICT'
  ELSE "category"
END
WHERE "courseType" = 'Long Course'
  AND "slug" IN (
    'electronics-el',
    'information-and-communication-technology-ict',
    'electrical-installation-and-automation-ela',
    'multimedia-and-film-technology'
  );
