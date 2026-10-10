-- CreateTable
CREATE TABLE "SetRating" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "setCode" TEXT NOT NULL,
    "fun" INTEGER NOT NULL,
    "experience" TEXT NOT NULL,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ratedWhileCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SetRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SetRating_setCode_idx" ON "SetRating"("setCode");

-- CreateIndex
CREATE UNIQUE INDEX "SetRating_userId_setCode_key" ON "SetRating"("userId", "setCode");

-- AddForeignKey
ALTER TABLE "SetRating" ADD CONSTRAINT "SetRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetRating" ADD CONSTRAINT "SetRating_setCode_fkey" FOREIGN KEY ("setCode") REFERENCES "SetMetadata"("setCode") ON DELETE CASCADE ON UPDATE CASCADE;

