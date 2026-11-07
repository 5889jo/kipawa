CREATE TABLE "NewsReaction" (
    "newsArticleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsReaction_pkey" PRIMARY KEY ("newsArticleId", "userId")
);

CREATE TABLE "NewsComment" (
    "id" SERIAL NOT NULL,
    "newsArticleId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NewsReaction_newsArticleId_reaction_idx" ON "NewsReaction"("newsArticleId", "reaction");
CREATE INDEX "NewsComment_newsArticleId_createdAt_idx" ON "NewsComment"("newsArticleId", "createdAt");

ALTER TABLE "NewsReaction"
ADD CONSTRAINT "NewsReaction_newsArticleId_fkey"
FOREIGN KEY ("newsArticleId") REFERENCES "NewsArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NewsReaction"
ADD CONSTRAINT "NewsReaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NewsComment"
ADD CONSTRAINT "NewsComment_newsArticleId_fkey"
FOREIGN KEY ("newsArticleId") REFERENCES "NewsArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NewsComment"
ADD CONSTRAINT "NewsComment_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
