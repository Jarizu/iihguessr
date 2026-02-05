-- AlterTable Card: Rename iwdPremier to iihPremier
ALTER TABLE "Card" RENAME COLUMN "iwdPremier" TO "iihPremier";

-- AlterTable Guess: Rename IWD columns to IIH
ALTER TABLE "Guess" RENAME COLUMN "cardAIwd" TO "cardAIih";
ALTER TABLE "Guess" RENAME COLUMN "cardBIwd" TO "cardBIih";
ALTER TABLE "Guess" RENAME COLUMN "iwdDifference" TO "iihDifference";

-- Drop and recreate indices with new names
DROP INDEX IF EXISTS "Card_iwdPremier_idx";
CREATE INDEX "Card_iihPremier_idx" ON "Card"("iihPremier");

DROP INDEX IF EXISTS "Guess_userId_iwdDifference_idx";
CREATE INDEX "Guess_userId_iihDifference_idx" ON "Guess"("userId", "iihDifference");
