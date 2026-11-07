UPDATE "Course"
SET "category" = CASE "slug"
  WHEN 'basic-mechatronics' THEN 'MECHATRONICS'
  WHEN 'basic-mobile-phone-technician' THEN 'ELECTRONICS'
  WHEN 'computer-application' THEN 'ICT'
  WHEN 'electrical-installation-intermediate' THEN 'ELECTRICAL'
  WHEN 'fundamental-electronics' THEN 'ELECTRONICS'
  WHEN 'electrical-beginner' THEN 'ELECTRICAL'
  WHEN 'computer-repair-maintenance' THEN 'ICT'
  WHEN 'customer-care' THEN 'OTHER'
  WHEN 'graphics-design-video-production' THEN 'ICT'
  WHEN 'electrical-advance' THEN 'ELECTRICAL'
  WHEN 'basic-driving' THEN 'OTHER'
  ELSE "category"
END
WHERE "courseType" = 'Short Course'
  AND "slug" IN (
    'basic-mechatronics',
    'basic-mobile-phone-technician',
    'computer-application',
    'electrical-installation-intermediate',
    'fundamental-electronics',
    'electrical-beginner',
    'computer-repair-maintenance',
    'customer-care',
    'graphics-design-video-production',
    'electrical-advance',
    'basic-driving'
  );
