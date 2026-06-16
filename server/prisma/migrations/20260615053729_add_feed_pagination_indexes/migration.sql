-- DropIndex
DROP INDEX "TimelineEvent_incidentId_createdAt_idx";

-- AlterTable
ALTER TABLE "Incident" ADD COLUMN     "isFlagged" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Incident_createdAt_id_idx" ON "Incident"("createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Incident_status_category_idx" ON "Incident"("status", "category");

-- CreateIndex
CREATE INDEX "Incident_credibilityScore_idx" ON "Incident"("credibilityScore" DESC);

-- CreateIndex
CREATE INDEX "TimelineEvent_incidentId_createdAt_idx" ON "TimelineEvent"("incidentId", "createdAt" DESC);
