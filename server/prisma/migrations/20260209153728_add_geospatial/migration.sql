/*
  Warnings:

  - You are about to drop the column `areaCode` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `lat` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `lng` on the `Incident` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Incident` table. All the data in the column will be lost.
  - The `status` column on the `Incident` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `severityScore` on the `Incident` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `credibilityScore` on the `Incident` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - Added the required column `location` to the `Incident` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Incident` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- DropForeignKey
ALTER TABLE "Incident" DROP CONSTRAINT "Incident_createdById_fkey";

-- AlterTable
ALTER TABLE "Incident" DROP COLUMN "areaCode",
DROP COLUMN "lat",
DROP COLUMN "lng",
DROP COLUMN "updatedAt",
ADD COLUMN     "clusterConfidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "location" geography(Point,4326) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'REPORTED',
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "severityScore" SET DEFAULT 1,
ALTER COLUMN "severityScore" SET DATA TYPE INTEGER,
ALTER COLUMN "credibilityScore" SET DEFAULT 0,
ALTER COLUMN "credibilityScore" SET DATA TYPE INTEGER,
ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Incident" ADD CONSTRAINT "Incident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
