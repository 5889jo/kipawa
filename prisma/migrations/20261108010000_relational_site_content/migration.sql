ALTER TABLE "CourseCategory"
ADD COLUMN "description" TEXT NOT NULL DEFAULT '',
ADD COLUMN "descriptionSw" TEXT;

CREATE TABLE "CourseCategoryTopic" (
    "id" SERIAL NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleSw" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CourseCategoryTopic_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CourseCategoryTopic_categoryCode_fkey"
        FOREIGN KEY ("categoryCode") REFERENCES "CourseCategory"("code")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CourseCategoryTopic_categoryCode_title_key"
ON "CourseCategoryTopic"("categoryCode", "title");
CREATE INDEX "CourseCategoryTopic_categoryCode_sortOrder_id_idx"
ON "CourseCategoryTopic"("categoryCode", "sortOrder", "id");

CREATE TABLE "FaqEntry" (
    "id" SERIAL NOT NULL,
    "question" TEXT NOT NULL,
    "questionSw" TEXT,
    "answer" TEXT NOT NULL,
    "answerSw" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FaqEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FaqEntry_question_key" ON "FaqEntry"("question");
CREATE INDEX "FaqEntry_isPublished_sortOrder_id_idx"
ON "FaqEntry"("isPublished", "sortOrder", "id");

CREATE TABLE "LabArea" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameSw" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LabArea_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LabArea_slug_key" ON "LabArea"("slug");
CREATE INDEX "LabArea_sortOrder_id_idx" ON "LabArea"("sortOrder", "id");

CREATE TABLE "Lab" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "areaId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "nameSw" TEXT,
    "category" TEXT NOT NULL,
    "categorySw" TEXT,
    "description" TEXT NOT NULL,
    "descriptionSw" TEXT,
    "coverImageUrl" TEXT NOT NULL,
    "featuredImageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lab_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Lab_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "LabArea"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Lab_slug_key" ON "Lab"("slug");
CREATE INDEX "Lab_areaId_isPublished_sortOrder_id_idx"
ON "Lab"("areaId", "isPublished", "sortOrder", "id");

CREATE TABLE "LabTopic" (
    "id" SERIAL NOT NULL,
    "labId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "titleSw" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LabTopic_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LabTopic_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LabTopic_labId_title_key" ON "LabTopic"("labId", "title");
CREATE INDEX "LabTopic_labId_sortOrder_id_idx" ON "LabTopic"("labId", "sortOrder", "id");

CREATE TABLE "LabImage" (
    "id" SERIAL NOT NULL,
    "labId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabImage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LabImage_labId_fkey" FOREIGN KEY ("labId") REFERENCES "Lab"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "LabImage_labId_url_key" ON "LabImage"("labId", "url");
CREATE INDEX "LabImage_labId_sortOrder_id_idx" ON "LabImage"("labId", "sortOrder", "id");

INSERT INTO "LabArea" ("slug", "name", "sortOrder", "updatedAt") VALUES
('ict-computer', 'ICT and Computer Labs', 0, CURRENT_TIMESTAMP),
('electronics', 'Electronics Labs', 1, CURRENT_TIMESTAMP),
('electrical', 'Electrical Labs', 2, CURRENT_TIMESTAMP),
('mechatronics', 'Mechatronics Labs', 3, CURRENT_TIMESTAMP);

INSERT INTO "Lab" ("slug", "areaId", "name", "category", "description", "coverImageUrl", "sortOrder", "updatedAt")
SELECT seed."slug", area."id", seed."name", seed."category", seed."description", seed."coverImageUrl", seed."sortOrder", CURRENT_TIMESTAMP
FROM (VALUES
    ('multimedia', 'ict-computer', 'Multimedia Lab', 'Digital media and creativity',
     'Create and refine digital media through practical work with visual design, image editing, audio and video.',
     'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1200&q=85', 0),
    ('web-design', 'ict-computer', 'Web Design Lab', 'Web and digital experiences',
     'Plan and build accessible, responsive websites while learning how design and technology work together.',
     'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=85', 1),
    ('computer-maintenance', 'ict-computer', 'Computer Maintenance Lab', 'Computer hardware and support',
     'Learn how to care for computer equipment, identify common faults and carry out basic maintenance safely.',
     'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85', 2),
    ('electronics', 'electronics', 'Electronics Labs', 'Electronics',
     'Understand how electronic systems work by learning about components, circuits, and technical troubleshooting.',
     '/labs/electronics lab.jpg', 0),
    ('electrical', 'electrical', 'Electrical Labs', 'Electrical technology',
     'Explore electrical systems through practical learning focused on safe installation, maintenance, and automation.',
     'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=85', 0),
    ('mechatronics', 'mechatronics', 'Mechatronics Labs', 'Integrated technology',
     'Discover how mechanical, electrical, electronic, and control technologies work together in modern systems.',
     'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=85', 0)
) AS seed("slug", "areaSlug", "name", "category", "description", "coverImageUrl", "sortOrder")
JOIN "LabArea" AS area ON area."slug" = seed."areaSlug";

INSERT INTO "LabTopic" ("labId", "title", "sortOrder", "updatedAt")
SELECT lab."id", topic."title", topic."sortOrder", CURRENT_TIMESTAMP
FROM (VALUES
    ('multimedia', 'Graphics and visual communication', 0),
    ('multimedia', 'Audio and video production fundamentals', 1),
    ('multimedia', 'Editing and preparing digital media projects', 2),
    ('web-design', 'Web page structure and styling', 0),
    ('web-design', 'Responsive design and usability', 1),
    ('web-design', 'Building and publishing a small website', 2),
    ('computer-maintenance', 'Computer components and safe handling', 0),
    ('computer-maintenance', 'Basic diagnosis and troubleshooting', 1),
    ('computer-maintenance', 'Preventive maintenance and user support', 2),
    ('electronics', 'Electronic components and circuits', 0),
    ('electronics', 'Measurement and testing techniques', 1),
    ('electronics', 'Fault-finding and repair principles', 2),
    ('electrical', 'Electrical safety and tools', 0),
    ('electrical', 'Wiring and installation practice', 1),
    ('electrical', 'Circuit testing and measurements', 2),
    ('electrical', 'Fault-finding and maintenance', 3),
    ('mechatronics', 'Electromechanical systems', 0),
    ('mechatronics', 'Sensors and control fundamentals', 1),
    ('mechatronics', 'Automation and applied problem-solving', 2)
) AS topic("slug", "title", "sortOrder")
JOIN "Lab" AS lab ON lab."slug" = topic."slug";

INSERT INTO "FaqEntry" ("question", "answer", "sortOrder", "updatedAt") VALUES
('How do I find a course?', 'Browse the courses page or use the website search to look up a programme.', 0, CURRENT_TIMESTAMP),
('How do I request a course booking?', 'Short courses: create or sign in to a learner account, open an announced course, and submit a request. The centre will call to confirm your phone number. Wait for the centre to issue an official control number before paying the TSh 5,000 application form fee. Upload the payment screenshot in your dashboard; after staff verify it, complete the application there. A request is not a confirmed place. Long courses and diploma programmes: apply through VET-MIS; the centre website does not submit that application.', 1, CURRENT_TIMESTAMP),
('How can I contact the centre?', 'Use the contact form on the Contact Us page. Published phone, email, address, and map details appear there when configured.', 2, CURRENT_TIMESTAMP),
('Where can I find publications and news?', 'Open Publications for downloadable resources and News for announcements and updates.', 3, CURRENT_TIMESTAMP);

INSERT INTO "SiteSetting" ("key", "value", "updatedAt") VALUES
('site.physicalAddress', 'Karakata, Kipawa Ward, Ilala District, Dar es Salaam, Tanzania (near Julius Nyerere International Airport)', CURRENT_TIMESTAMP),
('site.postalAddress', 'P.O. Box 40040, Dar es Salaam, Tanzania', CURRENT_TIMESTAMP),
('site.contactPhone', '+255 22 284 3360 / +255 22 284 3363', CURRENT_TIMESTAMP),
('site.contactEmail', 'kict@veta.go.tz', CURRENT_TIMESTAMP),
('site.mapUrl', 'https://www.google.com/maps/place/VETA+Kipawa-+ICT+CENTER/@-6.8524503,39.2112337,17.43z/data=!4m6!3m5!1s0x185c49c47717d247:0x7216aaad4e9f7ba3!8m2!3d-6.8523213!4d39.210794!16s%2Fg%2F11b6gp5v0m', CURRENT_TIMESTAMP),
('site.mapEmbedUrl', 'https://maps.google.com/maps?q=-6.8523213%2C39.210794&z=17&output=embed', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "CourseCategory" ("code", "name", "nameSw", "sortOrder", "updatedAt") VALUES
('ICT', 'ICT', 'TEHAMA', 0, CURRENT_TIMESTAMP),
('ELECTRICAL', 'Electrical', 'Umeme', 1, CURRENT_TIMESTAMP),
('ELECTRONICS', 'Electronics', 'Elektroniki', 2, CURRENT_TIMESTAMP),
('MECHATRONICS', 'Mechatronics', 'Mekatroniki', 3, CURRENT_TIMESTAMP),
('OTHER', 'Other', 'Nyingine', 4, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

UPDATE "CourseCategory" SET "description" = seed."description"
FROM (VALUES
    ('ICT', 'Build practical digital skills with focused training in computing, software and information technology.'),
    ('ELECTRICAL', 'Develop focused electrical skills through practical instruction in safe installation, testing and maintenance.'),
    ('ELECTRONICS', 'Learn practical electronics through guided work with components, circuits and test equipment.'),
    ('MECHATRONICS', 'Explore practical skills combining mechanical systems, electrical components and basic automation.'),
    ('OTHER', 'Browse focused short-course training in additional practical and vocational areas.')
) AS seed("code", "description")
WHERE "CourseCategory"."code" = seed."code"
AND "CourseCategory"."description" = '';

INSERT INTO "CourseCategoryTopic" ("categoryCode", "title", "sortOrder", "updatedAt")
SELECT topic."categoryCode", topic."title", topic."sortOrder", CURRENT_TIMESTAMP
FROM (VALUES
    ('ICT', 'Computer applications and digital productivity', 0),
    ('ICT', 'Networking and internet services', 1),
    ('ICT', 'Software, web and digital tools', 2),
    ('ICT', 'Practical ICT support and troubleshooting', 3),
    ('ELECTRICAL', 'Electrical safety and tools', 0),
    ('ELECTRICAL', 'Wiring and installation practice', 1),
    ('ELECTRICAL', 'Circuit testing and measurements', 2),
    ('ELECTRICAL', 'Fault-finding and maintenance', 3),
    ('ELECTRONICS', 'Electronic components and circuits', 0),
    ('ELECTRONICS', 'Measurement and testing instruments', 1),
    ('ELECTRONICS', 'Assembly and soldering practice', 2),
    ('ELECTRONICS', 'Safe troubleshooting and equipment care', 3),
    ('MECHATRONICS', 'Mechanical systems and workshop practice', 0),
    ('MECHATRONICS', 'Motors, actuators and electrical components', 1),
    ('MECHATRONICS', 'Sensors and introductory controls', 2),
    ('MECHATRONICS', 'Basic automation and maintenance', 3),
    ('OTHER', 'Course-specific practical skills', 0),
    ('OTHER', 'Guided hands-on activities', 1),
    ('OTHER', 'Workplace methods and safe practice', 2),
    ('OTHER', 'Applied exercises based on the course topic', 3)
) AS topic("categoryCode", "title", "sortOrder")
ON CONFLICT ("categoryCode", "title") DO NOTHING;

DO $$
DECLARE
    lab_images TEXT;
BEGIN
    SELECT "value" INTO lab_images FROM "SiteSetting" WHERE "key" = 'labs.images';
    IF lab_images IS NOT NULL THEN
        UPDATE "Lab" AS lab
        SET "featuredImageUrl" = settings."value"::jsonb #>> ARRAY[lab."slug", 'featured']
        FROM "SiteSetting" AS settings
        WHERE settings."key" = 'labs.images'
          AND jsonb_typeof(settings."value"::jsonb) = 'object'
          AND jsonb_typeof(settings."value"::jsonb #> ARRAY[lab."slug"]) = 'object'
          AND settings."value"::jsonb #>> ARRAY[lab."slug", 'featured'] ~ '^/uploads/labs/[\w-]+\.(jpg|png|webp)$';

        INSERT INTO "LabImage" ("labId", "url", "sortOrder")
        SELECT lab."id", image."url", image."sortOrder"
        FROM "SiteSetting" AS settings
        JOIN "Lab" AS lab ON true
        CROSS JOIN LATERAL jsonb_array_elements_text(
            CASE
                WHEN jsonb_typeof(settings."value"::jsonb #> ARRAY[lab."slug", 'related']) = 'array'
                THEN settings."value"::jsonb #> ARRAY[lab."slug", 'related']
                ELSE '[]'::jsonb
            END
        ) WITH ORDINALITY AS image("url", "sortOrder")
        WHERE settings."key" = 'labs.images'
          AND jsonb_typeof(settings."value"::jsonb) = 'object'
          AND image."url" ~ '^/uploads/labs/[\w-]+\.(jpg|png|webp)$'
        ON CONFLICT ("labId", "url") DO NOTHING;

        DELETE FROM "SiteSetting" WHERE "key" = 'labs.images';
    END IF;
END $$;
