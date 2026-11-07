CREATE TABLE "OrganizationMember" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "nameSw" TEXT,
    "position" TEXT NOT NULL,
    "positionSw" TEXT,
    "biography" TEXT NOT NULL DEFAULT '',
    "biographySw" TEXT,
    "qualifications" TEXT,
    "qualificationsSw" TEXT,
    "responsibilities" TEXT,
    "responsibilitiesSw" TEXT,
    "imageUrl" TEXT,
    "managerId" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrganizationMember_managerId_sortOrder_id_idx"
ON "OrganizationMember"("managerId", "sortOrder", "id");

CREATE INDEX "OrganizationMember_isPublished_managerId_sortOrder_idx"
ON "OrganizationMember"("isPublished", "managerId", "sortOrder");

ALTER TABLE "OrganizationMember"
ADD CONSTRAINT "OrganizationMember_managerId_fkey"
FOREIGN KEY ("managerId") REFERENCES "OrganizationMember"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
