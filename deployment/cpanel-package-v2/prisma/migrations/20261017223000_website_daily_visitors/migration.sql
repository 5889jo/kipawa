CREATE TABLE "WebsiteDailyVisitor" (
    "visitorDate" DATE NOT NULL,
    "visitorHash" CHAR(64) NOT NULL,

    CONSTRAINT "WebsiteDailyVisitor_pkey" PRIMARY KEY ("visitorDate", "visitorHash")
);

CREATE TABLE "WebsiteDailyVisitorCount" (
    "visitorDate" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WebsiteDailyVisitorCount_pkey" PRIMARY KEY ("visitorDate")
);
