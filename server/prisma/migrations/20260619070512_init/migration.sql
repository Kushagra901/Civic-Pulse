-- CreateIndex
CREATE INDEX "Assignment_incidentId_active_idx" ON "Assignment"("incidentId", "active");

-- CreateIndex
CREATE INDEX "Confirmation_userId_type_idx" ON "Confirmation"("userId", "type");

-- CreateIndex
CREATE INDEX "Incident_severityScore_idx" ON "Incident"("severityScore" DESC);

-- CreateIndex
CREATE INDEX "Incident_isFlagged_idx" ON "Incident"("isFlagged");

-- CreateIndex
CREATE INDEX "Report_reportedById_createdAt_idx" ON "Report"("reportedById", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "User_trustScore_idx" ON "User"("trustScore" DESC);
