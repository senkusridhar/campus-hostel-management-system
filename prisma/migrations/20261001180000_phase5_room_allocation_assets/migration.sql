-- AlterEnum
ALTER TYPE "RoomStatus" ADD VALUE IF NOT EXISTS 'FULL';
ALTER TYPE "RoomStatus" ADD VALUE IF NOT EXISTS 'BLOCKED';

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RoomChangeStatus') THEN
        CREATE TYPE "RoomChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
    END IF;
END $$;

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssetCondition') THEN
        CREATE TYPE "AssetCondition" AS ENUM ('GOOD', 'FAIR', 'DAMAGED', 'MISSING', 'REPAIR_REQUIRED');
    END IF;
END $$;

-- AlterTable
ALTER TABLE "Block" ADD COLUMN IF NOT EXISTS "genderCategory" TEXT;

-- AlterTable
ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "genderCategory" TEXT;

-- AlterTable
ALTER TABLE "RoomAllocation" ADD COLUMN IF NOT EXISTS "reason" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "RoomAsset" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "assetType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD',
    "serialNumber" TEXT,
    "lastInspectedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "RoomChangeRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "currentRoomId" TEXT NOT NULL,
    "currentBedId" TEXT,
    "preferredRoomId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "status" "RoomChangeStatus" NOT NULL DEFAULT 'PENDING',
    "wardenRemarks" TEXT,
    "reviewedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomChangeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RoomAsset_roomId_idx" ON "RoomAsset"("roomId");
CREATE INDEX IF NOT EXISTS "RoomAsset_condition_idx" ON "RoomAsset"("condition");
CREATE INDEX IF NOT EXISTS "RoomAsset_assetType_idx" ON "RoomAsset"("assetType");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "RoomChangeRequest_studentId_idx" ON "RoomChangeRequest"("studentId");
CREATE INDEX IF NOT EXISTS "RoomChangeRequest_status_idx" ON "RoomChangeRequest"("status");
CREATE INDEX IF NOT EXISTS "RoomChangeRequest_currentRoomId_idx" ON "RoomChangeRequest"("currentRoomId");
CREATE INDEX IF NOT EXISTS "RoomChangeRequest_preferredRoomId_idx" ON "RoomChangeRequest"("preferredRoomId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RoomAsset_roomId_fkey'
    ) THEN
        ALTER TABLE "RoomAsset" ADD CONSTRAINT "RoomAsset_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RoomChangeRequest_studentId_fkey'
    ) THEN
        ALTER TABLE "RoomChangeRequest" ADD CONSTRAINT "RoomChangeRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RoomChangeRequest_currentRoomId_fkey'
    ) THEN
        ALTER TABLE "RoomChangeRequest" ADD CONSTRAINT "RoomChangeRequest_currentRoomId_fkey" FOREIGN KEY ("currentRoomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RoomChangeRequest_preferredRoomId_fkey'
    ) THEN
        ALTER TABLE "RoomChangeRequest" ADD CONSTRAINT "RoomChangeRequest_preferredRoomId_fkey" FOREIGN KEY ("preferredRoomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'RoomChangeRequest_reviewedById_fkey'
    ) THEN
        ALTER TABLE "RoomChangeRequest" ADD CONSTRAINT "RoomChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
