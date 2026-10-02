-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'WARDEN', 'STUDENT', 'PARENT', 'MAINTENANCE', 'SECURITY', 'ACCOUNTANT');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('VACANT', 'PARTIALLY_OCCUPIED', 'OCCUPIED', 'MAINTENANCE', 'RESERVED');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('ACTIVE', 'VACATED', 'TRANSFERRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PassType" AS ENUM ('DAY_PASS', 'NIGHT_OUT', 'LONG_LEAVE');

-- CreateEnum
CREATE TYPE "PassStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CHECK_IN', 'CHECK_OUT');

-- CreateEnum
CREATE TYPE "ComplaintCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'FURNITURE', 'INTERNET', 'CLEANLINESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('FULLY_RESOLVED', 'PARTIALLY_RESOLVED', 'NOT_RESOLVED');

-- CreateEnum
CREATE TYPE "FeedbackCategory" AS ENUM ('FOOD', 'STAFF', 'MAINTENANCE', 'CLEANLINESS', 'FACILITIES', 'SECURITY');

-- CreateEnum
CREATE TYPE "VotingType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE');

-- CreateEnum
CREATE TYPE "PollStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('HOSTEL_FEE', 'MESS_FEE', 'SECURITY_DEPOSIT', 'FINE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "FineStatus" AS ENUM ('PENDING', 'PAID', 'WAIVED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'ON_LEAVE', 'OUTSIDE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentStudent" (
    "parentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "isPrimaryContact" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ParentStudent_pkey" PRIMARY KEY ("parentId","studentId")
);

-- CreateTable
CREATE TABLE "WardenHostel" (
    "wardenId" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WardenHostel_pkey" PRIMARY KEY ("wardenId","hostelId")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "admissionYear" INTEGER NOT NULL,
    "guardianName" TEXT NOT NULL,
    "guardianPhone" TEXT NOT NULL,
    "emergencyContact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hostel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "genderCategory" TEXT NOT NULL,
    "address" TEXT,
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "hostelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "numberOfFloors" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "floorNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'VACANT',
    "maintenanceReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "bedNumber" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomAllocation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vacatedAt" TIMESTAMP(3),
    "status" "AllocationStatus" NOT NULL DEFAULT 'ACTIVE',
    "allocatedById" TEXT,

    CONSTRAINT "RoomAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GatePass" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "passType" "PassType" NOT NULL,
    "reason" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "fromDateTime" TIMESTAMP(3) NOT NULL,
    "toDateTime" TIMESTAMP(3) NOT NULL,
    "status" "PassStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectionReason" TEXT,
    "qrToken" TEXT,
    "qrExpiresAt" TIMESTAMP(3),

    CONSTRAINT "GatePass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateActivity" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "gatePassId" TEXT,
    "activityType" "ActivityType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedById" TEXT,
    "remarks" TEXT,

    CONSTRAINT "GateActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "roomId" TEXT,
    "category" "ComplaintCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceAssignment" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "MaintenanceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintRating" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "resolutionStatus" "ResolutionStatus" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyFeedback" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "generalComment" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyFeedbackRating" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "category" "FeedbackCategory" NOT NULL,
    "criterion" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,

    CONSTRAINT "MonthlyFeedbackRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poll" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdById" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL DEFAULT 'All Hostels',
    "votingType" "VotingType" NOT NULL DEFAULT 'SINGLE_CHOICE',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PollStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionText" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "votedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fee" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeType" "FeeType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Fee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "receiptNumber" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionReference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedById" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'VERIFIED',

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fine" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "FineStatus" NOT NULL DEFAULT 'PENDING',
    "issuedById" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Fine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessMenu" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mealType" "MealType" NOT NULL,
    "menuItems" TEXT NOT NULL,
    "publishedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MessMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NightAttendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "markedById" TEXT,
    "remarks" TEXT,

    CONSTRAINT "NightAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'All Hostels',
    "publishedById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentId_key" ON "Student"("studentId");

-- CreateIndex
CREATE INDEX "Student_studentId_idx" ON "Student"("studentId");

-- CreateIndex
CREATE INDEX "Student_department_idx" ON "Student"("department");

-- CreateIndex
CREATE UNIQUE INDEX "Hostel_code_key" ON "Hostel"("code");

-- CreateIndex
CREATE INDEX "Block_hostelId_idx" ON "Block"("hostelId");

-- CreateIndex
CREATE INDEX "Floor_blockId_idx" ON "Floor"("blockId");

-- CreateIndex
CREATE INDEX "Room_floorId_idx" ON "Room"("floorId");

-- CreateIndex
CREATE INDEX "Room_roomNumber_idx" ON "Room"("roomNumber");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE INDEX "Bed_roomId_idx" ON "Bed"("roomId");

-- CreateIndex
CREATE INDEX "Bed_status_idx" ON "Bed"("status");

-- CreateIndex
CREATE INDEX "RoomAllocation_studentId_idx" ON "RoomAllocation"("studentId");

-- CreateIndex
CREATE INDEX "RoomAllocation_bedId_idx" ON "RoomAllocation"("bedId");

-- CreateIndex
CREATE INDEX "RoomAllocation_status_idx" ON "RoomAllocation"("status");

-- CreateIndex
CREATE INDEX "GatePass_studentId_idx" ON "GatePass"("studentId");

-- CreateIndex
CREATE INDEX "GatePass_status_idx" ON "GatePass"("status");

-- CreateIndex
CREATE INDEX "GatePass_passType_idx" ON "GatePass"("passType");

-- CreateIndex
CREATE INDEX "GateActivity_studentId_idx" ON "GateActivity"("studentId");

-- CreateIndex
CREATE INDEX "GateActivity_timestamp_idx" ON "GateActivity"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_ticketNumber_key" ON "Complaint"("ticketNumber");

-- CreateIndex
CREATE INDEX "Complaint_studentId_idx" ON "Complaint"("studentId");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_category_idx" ON "Complaint"("category");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "Complaint"("priority");

-- CreateIndex
CREATE INDEX "MaintenanceAssignment_complaintId_idx" ON "MaintenanceAssignment"("complaintId");

-- CreateIndex
CREATE INDEX "MaintenanceAssignment_assignedToId_idx" ON "MaintenanceAssignment"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintRating_complaintId_key" ON "ComplaintRating"("complaintId");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintRating_complaintId_studentId_key" ON "ComplaintRating"("complaintId", "studentId");

-- CreateIndex
CREATE INDEX "MonthlyFeedback_month_year_idx" ON "MonthlyFeedback"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyFeedback_studentId_month_year_key" ON "MonthlyFeedback"("studentId", "month", "year");

-- CreateIndex
CREATE INDEX "MonthlyFeedbackRating_feedbackId_idx" ON "MonthlyFeedbackRating"("feedbackId");

-- CreateIndex
CREATE INDEX "MonthlyFeedbackRating_category_idx" ON "MonthlyFeedbackRating"("category");

-- CreateIndex
CREATE INDEX "Poll_status_idx" ON "Poll"("status");

-- CreateIndex
CREATE INDEX "Poll_startDate_endDate_idx" ON "Poll"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "PollOption_pollId_idx" ON "PollOption"("pollId");

-- CreateIndex
CREATE INDEX "Vote_pollId_idx" ON "Vote"("pollId");

-- CreateIndex
CREATE INDEX "Vote_optionId_idx" ON "Vote"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_pollId_voterId_key" ON "Vote"("pollId", "voterId");

-- CreateIndex
CREATE INDEX "Fee_studentId_idx" ON "Fee"("studentId");

-- CreateIndex
CREATE INDEX "Fee_status_idx" ON "Fee"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Payment_feeId_idx" ON "Payment"("feeId");

-- CreateIndex
CREATE INDEX "Payment_receiptNumber_idx" ON "Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Fine_studentId_idx" ON "Fine"("studentId");

-- CreateIndex
CREATE INDEX "Fine_status_idx" ON "Fine"("status");

-- CreateIndex
CREATE INDEX "MessMenu_date_idx" ON "MessMenu"("date");

-- CreateIndex
CREATE INDEX "MessMenu_mealType_idx" ON "MessMenu"("mealType");

-- CreateIndex
CREATE INDEX "NightAttendance_studentId_idx" ON "NightAttendance"("studentId");

-- CreateIndex
CREATE INDEX "NightAttendance_date_idx" ON "NightAttendance"("date");

-- CreateIndex
CREATE INDEX "NightAttendance_status_idx" ON "NightAttendance"("status");

-- CreateIndex
CREATE INDEX "Notice_category_idx" ON "Notice"("category");

-- CreateIndex
CREATE INDEX "Notice_isActive_idx" ON "Notice"("isActive");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentStudent" ADD CONSTRAINT "ParentStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WardenHostel" ADD CONSTRAINT "WardenHostel_wardenId_fkey" FOREIGN KEY ("wardenId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WardenHostel" ADD CONSTRAINT "WardenHostel_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_hostelId_fkey" FOREIGN KEY ("hostelId") REFERENCES "Hostel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "Block"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAllocation" ADD CONSTRAINT "RoomAllocation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAllocation" ADD CONSTRAINT "RoomAllocation_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAllocation" ADD CONSTRAINT "RoomAllocation_allocatedById_fkey" FOREIGN KEY ("allocatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GatePass" ADD CONSTRAINT "GatePass_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateActivity" ADD CONSTRAINT "GateActivity_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateActivity" ADD CONSTRAINT "GateActivity_gatePassId_fkey" FOREIGN KEY ("gatePassId") REFERENCES "GatePass"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GateActivity" ADD CONSTRAINT "GateActivity_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceAssignment" ADD CONSTRAINT "MaintenanceAssignment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceAssignment" ADD CONSTRAINT "MaintenanceAssignment_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintRating" ADD CONSTRAINT "ComplaintRating_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintRating" ADD CONSTRAINT "ComplaintRating_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyFeedback" ADD CONSTRAINT "MonthlyFeedback_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyFeedbackRating" ADD CONSTRAINT "MonthlyFeedbackRating_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "MonthlyFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Poll" ADD CONSTRAINT "Poll_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PollOption" ADD CONSTRAINT "PollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "Poll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "PollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "Fee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fine" ADD CONSTRAINT "Fine_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fine" ADD CONSTRAINT "Fine_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessMenu" ADD CONSTRAINT "MessMenu_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NightAttendance" ADD CONSTRAINT "NightAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NightAttendance" ADD CONSTRAINT "NightAttendance_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_publishedById_fkey" FOREIGN KEY ("publishedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
