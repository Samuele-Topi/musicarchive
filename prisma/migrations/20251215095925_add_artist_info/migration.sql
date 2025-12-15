-- CreateTable
CREATE TABLE "ArtistInfo" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "imageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
