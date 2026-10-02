import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Campus HMS Database with Phase 3 Authentication & Role-Based Accounts...');

  // Common development password hash for all demo accounts
  const DEMO_PASSWORD = 'CampusHMS@2026';
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. SUPER_ADMIN Demo Account
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@campushms.local' },
    update: { passwordHash },
    create: {
      name: 'Super Administrator',
      email: 'admin@campushms.local',
      passwordHash,
      phone: '+91 98000 00001',
      role: 'SUPER_ADMIN',
    },
  });

  // 2. WARDEN Demo Account
  const wardenUser = await prisma.user.upsert({
    where: { email: 'warden@campushms.local' },
    update: { passwordHash },
    create: {
      name: 'Chief Warden Dr. Ramesh',
      email: 'warden@campushms.local',
      passwordHash,
      phone: '+91 98000 00002',
      role: 'WARDEN',
    },
  });

  // 3. STUDENT Demo Account
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@campushms.local' },
    update: { passwordHash },
    create: {
      name: 'Rahul Kumar (Demo Student)',
      email: 'student@campushms.local',
      passwordHash,
      phone: '+91 98000 00003',
      role: 'STUDENT',
    },
  });

  // 4. PARENT Demo Account
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent@campushms.local' },
    update: { passwordHash },
    create: {
      name: 'Mahesh Kumar (Demo Parent)',
      email: 'parent@campushms.local',
      passwordHash,
      phone: '+91 98000 00004',
      role: 'PARENT',
    },
  });

  // 5. SECURITY Demo Account
  const securityUser = await prisma.user.upsert({
    where: { email: 'security@campushms.local' },
    update: { passwordHash },
    create: {
      name: 'Inspector Ram Singh (Security Desk)',
      email: 'security@campushms.local',
      passwordHash,
      phone: '+91 98000 00005',
      role: 'SECURITY',
    },
  });

  // 6. FINANCE Demo Account
  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@campushms.local' },
    update: { passwordHash },
    create: {
      name: 'Rajiv Malhotra (Accounts Officer)',
      email: 'finance@campushms.local',
      passwordHash,
      phone: '+91 98000 00006',
      role: 'FINANCE',
    },
  });

  // 7. MAINTENANCE Demo Account
  const maintenanceUser = await prisma.user.upsert({
    where: { email: 'maintenance@campushms.local' },
    update: { passwordHash },
    create: {
      name: 'Suresh Kumar (Chief Electrician)',
      email: 'maintenance@campushms.local',
      passwordHash,
      phone: '+91 98000 00007',
      role: 'MAINTENANCE',
    },
  });

  // Hostels
  const hostelA = await prisma.hostel.upsert({
    where: { code: 'BHA' },
    update: {},
    create: {
      name: 'Boys Hostel A',
      code: 'BHA',
      genderCategory: 'Boys',
      capacity: 700,
    },
  });

  const hostelB = await prisma.hostel.upsert({
    where: { code: 'GHA' },
    update: {},
    create: {
      name: 'Girls Hostel A',
      code: 'GHA',
      genderCategory: 'Girls',
      capacity: 680,
    },
  });

  // Warden Assignment
  await prisma.wardenHostel.upsert({
    where: { wardenId_hostelId: { wardenId: wardenUser.id, hostelId: hostelA.id } },
    update: {},
    create: { wardenId: wardenUser.id, hostelId: hostelA.id },
  });

  // Hostel Layout Structure
  let blockA = await prisma.block.findFirst({ where: { hostelId: hostelA.id, name: 'Block A' } });
  if (!blockA) {
    blockA = await prisma.block.create({
      data: {
        hostelId: hostelA.id,
        name: 'Block A',
        code: 'BLK-A',
        numberOfFloors: 4,
      },
    });
  }

  let floor1 = await prisma.floor.findFirst({ where: { blockId: blockA.id, floorNumber: 1 } });
  if (!floor1) {
    floor1 = await prisma.floor.create({
      data: {
        blockId: blockA.id,
        floorNumber: 1,
        name: 'First Floor',
      },
    });
  }

  let room101 = await prisma.room.findFirst({ where: { floorId: floor1.id, roomNumber: '101' } });
  if (!room101) {
    room101 = await prisma.room.create({
      data: {
        floorId: floor1.id,
        roomNumber: '101',
        roomType: 'Double Occupancy',
        capacity: 2,
        status: 'OCCUPIED',
      },
    });
  }

  let bed101A = await prisma.bed.findFirst({ where: { roomId: room101.id, bedNumber: '101-A' } });
  if (!bed101A) {
    bed101A = await prisma.bed.create({
      data: { roomId: room101.id, bedNumber: '101-A', status: 'OCCUPIED' },
    });
  }

  // Student Profile for Demo Student User
  const studentProfile = await prisma.student.upsert({
    where: { studentId: 'STU2024012' },
    update: { userId: studentUser.id },
    create: {
      userId: studentUser.id,
      studentId: 'STU2024012',
      firstName: 'Rahul',
      lastName: 'Kumar',
      gender: 'Male',
      phone: '+91 91234 56789',
      department: 'Computer Science & Engineering',
      branch: 'B.Tech CSE',
      academicYear: '3rd Year',
      admissionYear: 2024,
      guardianName: 'Mahesh Kumar',
      guardianPhone: '+91 98000 00004',
    },
  });

  // Room Allocation for Demo Student
  const existingAllocation = await prisma.roomAllocation.findFirst({ where: { studentId: studentProfile.id } });
  if (!existingAllocation) {
    await prisma.roomAllocation.create({
      data: {
        studentId: studentProfile.id,
        bedId: bed101A.id,
        status: 'ACTIVE',
        allocatedById: superAdmin.id,
      },
    });
  }

  // Parent-Student Relationship
  await prisma.parentStudent.upsert({
    where: { parentId_studentId: { parentId: parentUser.id, studentId: studentProfile.id } },
    update: {},
    create: {
      parentId: parentUser.id,
      studentId: studentProfile.id,
      relationshipType: 'Father',
      isPrimaryContact: true,
    },
  });

  // Demo Gate Pass
  const existingGatePass = await prisma.gatePass.findFirst({ where: { studentId: studentProfile.id } });
  let gatePass = existingGatePass;
  if (!gatePass) {
    gatePass = await prisma.gatePass.create({
      data: {
        studentId: studentProfile.id,
        passType: 'DAY_PASS',
        reason: 'Local bank & book store visit',
        destination: 'City Center',
        fromDateTime: new Date('2026-09-30T08:30:00Z'),
        toDateTime: new Date('2026-09-30T20:00:00Z'),
        status: 'APPROVED',
        approvedById: wardenUser.id,
        approvedAt: new Date(),
      },
    });
  }

  // Demo Gate Activity
  const existingGateActivity = await prisma.gateActivity.findFirst({ where: { studentId: studentProfile.id } });
  if (!existingGateActivity) {
    await prisma.gateActivity.create({
      data: {
        studentId: studentProfile.id,
        gatePassId: gatePass.id,
        activityType: 'CHECK_OUT',
        verifiedById: securityUser.id,
        remarks: 'Verified student ID card & pass',
      },
    });
  }

  // Demo Complaint
  const existingComplaint = await prisma.complaint.findFirst({ where: { ticketNumber: 'TKT-1040' } });
  let complaint = existingComplaint;
  if (!complaint) {
    complaint = await prisma.complaint.create({
      data: {
        ticketNumber: 'TKT-1040',
        studentId: studentProfile.id,
        roomId: room101.id,
        category: 'ELECTRICAL',
        title: 'Ceiling fan regulator sparkling',
        description: 'Fan speed regulator sparks when turned to level 4.',
        priority: 'HIGH',
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    await prisma.maintenanceAssignment.create({
      data: {
        complaintId: complaint.id,
        assignedToId: maintenanceUser.id,
        completedAt: new Date(),
        remarks: 'Replaced fan regulator with new heavy duty modular switch',
      },
    });
  }

  // Demo Fee & Payment
  const existingFee = await prisma.fee.findFirst({ where: { studentId: studentProfile.id } });
  let fee = existingFee;
  if (!fee) {
    fee = await prisma.fee.create({
      data: {
        studentId: studentProfile.id,
        feeType: 'HOSTEL_FEE',
        amount: 45000.0,
        dueDate: new Date('2026-09-15'),
        status: 'Paid',
      },
    });

    await prisma.payment.create({
      data: {
        feeId: fee.id,
        receiptNumber: 'REC-2024-8801',
        amount: 45000.0,
        paymentMethod: 'UPI',
        transactionReference: 'UPI/62819401289/PAY',
        verifiedById: financeUser.id,
        status: 'VERIFIED',
      },
    });
  }

    // Bed 101-B
    let bed101B = await prisma.bed.findFirst({ where: { roomId: room101.id, bedNumber: '101-B' } });
    if (!bed101B) {
      bed101B = await prisma.bed.create({
        data: { roomId: room101.id, bedNumber: '101-B', status: 'OCCUPIED' },
      });
    }

    // Roommate Amit Verma
    const roommateUser = await prisma.user.upsert({
      where: { email: 'amit.verma@campushms.local' },
      update: {},
      create: {
        name: 'Amit Verma',
        email: 'amit.verma@campushms.local',
        passwordHash,
        phone: '+91 98000 00018',
        role: 'STUDENT',
      },
    });

    const roommateProfile = await prisma.student.upsert({
      where: { studentId: 'STU2024018' },
      update: { userId: roommateUser.id },
      create: {
        userId: roommateUser.id,
        studentId: 'STU2024018',
        firstName: 'Amit',
        lastName: 'Verma',
        gender: 'Male',
        phone: '+91 98000 00018',
        department: 'Mechanical Engineering',
        branch: 'B.Tech ME',
        academicYear: '3rd Year',
        admissionYear: 2024,
        guardianName: 'Sanjay Verma',
        guardianPhone: '+91 98000 00019',
      },
    });

    const existingRoommateAlloc = await prisma.roomAllocation.findFirst({ where: { studentId: roommateProfile.id } });
    if (!existingRoommateAlloc) {
      await prisma.roomAllocation.create({
        data: {
          studentId: roommateProfile.id,
          bedId: bed101B.id,
          status: 'ACTIVE',
          allocatedById: superAdmin.id,
        },
      });
    }

    // Complaint Vote & Rating
    const existingVote = await prisma.complaintVote.findFirst({
      where: { complaintId: complaint.id, userId: studentUser.id },
    });
    if (!existingVote) {
      await prisma.complaintVote.create({
        data: {
          complaintId: complaint.id,
          userId: studentUser.id,
          voteType: 'UPVOTE',
        },
      });
    }

    const existingRating = await prisma.complaintRating.findFirst({
      where: { complaintId: complaint.id },
    });
    if (!existingRating) {
      await prisma.complaintRating.create({
        data: {
          complaintId: complaint.id,
          studentId: studentProfile.id,
          score: 5,
          resolutionStatus: 'FULLY_RESOLVED',
          comment: 'Fixed promptly by electrician Suresh Kumar. New switch working perfectly.',
        },
      });
    }

    // Monthly Feedback
    const existingFeedback = await prisma.monthlyFeedback.findFirst({
      where: { studentId: studentProfile.id, month: 10, year: 2026 },
    });
    if (!existingFeedback) {
      const fb = await prisma.monthlyFeedback.create({
        data: {
          studentId: studentProfile.id,
          hostelId: hostelA.id,
          month: 10,
          year: 2026,
          generalComment: 'Overall food quality and mess cleanliness has improved significantly this semester.',
          isAnonymous: true,
        },
      });

      await prisma.monthlyFeedbackRating.createMany({
        data: [
          { feedbackId: fb.id, category: 'FOOD', criterion: 'Food Quality', rating: 4 },
          { feedbackId: fb.id, category: 'FOOD', criterion: 'Mess Hygiene', rating: 5 },
          { feedbackId: fb.id, category: 'STAFF', criterion: 'Staff Behaviour', rating: 5 },
          { feedbackId: fb.id, category: 'CLEANLINESS', criterion: 'Hostel Cleanliness', rating: 4 },
          { feedbackId: fb.id, category: 'MAINTENANCE', criterion: 'Maintenance Response', rating: 4 },
          { feedbackId: fb.id, category: 'EXPERIENCE', criterion: 'Overall Hostel Experience', rating: 5 },
        ],
      });
    }

    // Night Attendance
    const existingAttendance = await prisma.nightAttendance.findFirst({
      where: { studentId: studentProfile.id, date: new Date('2026-10-01') },
    });
    if (!existingAttendance) {
      await prisma.nightAttendance.create({
        data: {
          studentId: studentProfile.id,
          date: new Date('2026-10-01'),
          status: 'PRESENT',
          markedById: wardenUser.id,
          remarks: 'Curfew compliance verified; present in Room 101.',
        },
      });
    }

    // Additional Official Notices
    const noticesToSeed = [
      {
        title: 'Mid-Semester Hostel Curfew & Parent Visiting Guidelines',
        content: 'Visiting hours for parents are Saturday and Sunday from 10:00 AM to 5:00 PM at the visitor lounge.',
        category: 'General',
        audience: 'All Hostels',
      },
      {
        title: 'Mess Menu Revision & Special Festival Dinner Schedule',
        content: 'Special dinner served on the first Sunday of every month. Resident feedback incorporated.',
        category: 'Mess',
        audience: 'Boys Hostels',
      },
      {
        title: 'Semester Hostel Fee Installment Due Date Reminder',
        content: 'Last date for payment of odd semester hostel & mess dues without late penalty is 15th October.',
        category: 'Fees',
        audience: 'All Hostels',
      },
    ];

    for (const n of noticesToSeed) {
      const exists = await prisma.notice.findFirst({ where: { title: n.title } });
      if (!exists) {
        await prisma.notice.create({
          data: {
            title: n.title,
            content: n.content,
            category: n.category,
            audience: n.audience,
            publishedById: superAdmin.id,
            expiresAt: new Date('2026-10-31'),
            isActive: true,
          },
        });
      }
    }

    // Audit Logs
    const auditLogsToSeed = [
      {
        action: 'ROOM_ALLOCATION',
        actor: 'Dr. Ramesh Chandra',
        description: 'Allocated student Rahul Kumar (STU2024012) to Bed 101-A in Boys Hostel A',
        userId: wardenUser.id,
      },
      {
        action: 'COMPLAINT_ASSIGNMENT',
        actor: 'Dr. Ramesh Chandra',
        description: 'Assigned electrician Suresh Kumar to work order ticket TKT-1040',
        userId: wardenUser.id,
      },
      {
        action: 'PAYMENT_VERIFIED',
        actor: 'Rajiv Malhotra',
        description: 'Verified UPI payment ₹45,000 for Rahul Kumar (Receipt: REC-2024-8801)',
        userId: financeUser.id,
      },
      {
        action: 'GATE_PASS_APPROVED',
        actor: 'Dr. Ramesh Chandra',
        description: 'Approved local day pass for Rahul Kumar to City Center',
        userId: wardenUser.id,
      },
    ];

    for (const log of auditLogsToSeed) {
      const exists = await prisma.auditLog.findFirst({ where: { description: log.description } });
      if (!exists) {
        await prisma.auditLog.create({
          data: {
            action: log.action,
            entity: 'OPERATIONS',
            description: log.description,
            userId: log.userId,
          },
        });
      }
    }

  console.log('✅ Demo accounts seeded successfully:');
  console.log('----------------------------------------------------');
  console.log('Password for all demo accounts: CampusHMS@2026');
  console.log('1. SUPER_ADMIN:   admin@campushms.local');
  console.log('2. WARDEN:        warden@campushms.local');
  console.log('3. STUDENT:       student@campushms.local');
  console.log('4. PARENT:        parent@campushms.local');
  console.log('5. SECURITY:      security@campushms.local');
  console.log('6. FINANCE:       finance@campushms.local');
  console.log('7. MAINTENANCE:   maintenance@campushms.local');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
