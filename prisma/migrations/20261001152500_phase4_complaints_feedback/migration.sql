-- AlterEnum
ALTER TYPE "ComplaintCategory" ADD VALUE IF NOT EXISTS 'FOOD_MESS';
ALTER TYPE "ComplaintCategory" ADD VALUE IF NOT EXISTS 'SECURITY';
ALTER TYPE "ComplaintCategory" ADD VALUE IF NOT EXISTS 'ROOM';
ALTER TYPE "ComplaintCategory" ADD VALUE IF NOT EXISTS 'WATER';

-- AlterEnum
ALTER TYPE "ComplaintPriority" ADD VALUE IF NOT EXISTS 'URGENT';

-- AlterEnum
ALTER TYPE "ComplaintStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';

-- AlterEnum
ALTER TYPE "FeedbackCategory" ADD VALUE IF NOT EXISTS 'EXPERIENCE';
ALTER TYPE "FeedbackCategory" ADD VALUE IF NOT EXISTS 'GENERAL';

-- CreateEnum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VoteType') THEN
        CREATE TYPE "VoteType" AS ENUM ('UPVOTE', 'DOWNVOTE');
    END IF;
END $$;

-- AlterTable
ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "hostelId" TEXT;
ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "blockId" TEXT;
ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Complaint" ADD COLUMN IF NOT EXISTS "resolutionNotes" TEXT;

-- AlterTable
ALTER TABLE "MonthlyFeedback" ADD COLUMN IF NOT EXISTS "hostelId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ComplaintVote" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteType" "VoteType" NOT NULL DEFAULT 'UPVOTE',
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ComplaintVote_complaintId_userId_key" ON "ComplaintVote"("complaintId", "userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Complaint_hostelId_idx" ON "Complaint"("hostelId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "MonthlyFeedback_hostelId_idx" ON "MonthlyFeedback"("hostelId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Complaint_hostelId_fkey'
    ) THEN
        ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Complaint_blockId_fkey'
    ) THEN
        ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'MonthlyFeedback_hostelId_fkey'
    ) THEN
        ALTER TABLE "MonthlyFeedback" ADD CONSTRAINT "MonthlyFeedback_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ComplaintVote_complaintId_fkey'
    ) THEN
        ALTER TABLE "ComplaintVote" ADD CONSTRAINT "ComplaintVote_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ComplaintVote_userId_fkey'
    ) THEN
        ALTER TABLE "ComplaintVote" ADD CONSTRAINT "ComplaintVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
