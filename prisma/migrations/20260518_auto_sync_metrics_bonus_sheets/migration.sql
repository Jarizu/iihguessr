-- ============================================
-- Card: add ALSA column for "Average Last Seen At"
-- ============================================
ALTER TABLE "Card" ADD COLUMN "alsaPremier" DOUBLE PRECISION;

-- ============================================
-- SetMetadata: add parentSetCode for bonus sheets (e.g. STA -> STX)
-- ============================================
ALTER TABLE "SetMetadata" ADD COLUMN "parentSetCode" TEXT;
CREATE INDEX "SetMetadata_parentSetCode_idx" ON "SetMetadata"("parentSetCode");

-- ============================================
-- Guess: rename IIH-specific columns to be metric-agnostic; add metric column
-- Note: the underlying DB column names stay IIH-named via @map in schema.prisma,
-- so this migration only adds the new `metric` column and tracking columns.
-- ============================================
ALTER TABLE "Guess" ADD COLUMN "metric" TEXT NOT NULL DEFAULT 'IIH';
CREATE INDEX "Guess_userId_metric_idx" ON "Guess"("userId", "metric");

-- ============================================
-- UserStats: add per-metric breakdown and biggestMiss metric tracking
-- ============================================
ALTER TABLE "UserStats" ADD COLUMN "metricBreakdown" TEXT NOT NULL DEFAULT '{}';
ALTER TABLE "UserStats" ADD COLUMN "biggestMissMetric" TEXT;

-- Backfill: existing UserStats biggest misses are all IIH
UPDATE "UserStats" SET "biggestMissMetric" = 'IIH' WHERE "biggestMissId" IS NOT NULL;
