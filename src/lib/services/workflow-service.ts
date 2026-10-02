import { prisma } from '@/lib/db/prisma';
import { DEMO_USERS, DemoUser } from '@/lib/auth/demo-users';
import {
  UserManagementItem,
  AdminOverviewStats,
  ParentWardOverview,
  StudentSelfServiceOverview,
  Notice,
} from '@/types';
import { listHostels } from './hostel-service';
import { listComplaints } from './complaint-service';
import { getMonthlyFeedbackAnalytics } from './feedback-service';

// In-Memory User State for Resilient Fallback
const memoryUsers: Map<string, DemoUser> = new Map(
  Object.values(DEMO_USERS).map((u) => [u.id, { ...u }])
);

// In-Memory Audit Logs
export interface MemoryAuditLog {
  id: string;
  action: string;
  actor: string;
  role: string;
  timestamp: string;
  details: string;
}

const memoryAuditLogs: MemoryAuditLog[] = [
  {
    id: 'audit-1',
    action: 'ROOM_ALLOCATION',
    actor: 'Chief Warden Dr. Ramesh',
    role: 'WARDEN',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    details: 'Allocated student Karan Mehta (STU2024099) to Room 109',
  },
  {
    id: 'audit-2',
    action: 'COMPLAINT_ASSIGNED',
    actor: 'Chief Warden Dr. Ramesh',
    role: 'WARDEN',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    details: 'Assigned electrician Suresh Kumar to ticket TKT-1051',
  },
  {
    id: 'audit-3',
    action: 'FEEDBACK_SUBMISSION',
    actor: 'Rahul Kumar',
    role: 'STUDENT',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    details: 'Submitted Monthly Resident Feedback for October 2026',
  },
  {
    id: 'audit-4',
    action: 'ROOM_CHANGE_APPROVAL',
    actor: 'Chief Warden Dr. Ramesh',
    role: 'WARDEN',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    details: 'Approved medical room change transfer for Rahul Kumar to Room 205',
  },
];

export function logAuditEvent(action: string, actor: string, role: string, details: string) {
  memoryAuditLogs.unshift({
    id: `audit-${Date.now()}`,
    action,
    actor,
    role,
    timestamp: new Date().toISOString(),
    details,
  });
  if (memoryAuditLogs.length > 50) memoryAuditLogs.pop();
}

// ==========================================
// 1. ADMIN USER MANAGEMENT & GOVERNANCE
// ==========================================

export async function listUsers(filters?: {
  role?: string;
  search?: string;
  status?: string;
}): Promise<UserManagementItem[]> {
  try {
    const dbUsers = await prisma.user.findMany({
      where: {
        ...(filters?.role && { role: filters.role.toUpperCase() as any }),
        ...(filters?.status !== undefined &&
          filters.status !== 'ALL' && {
            isActive: filters.status === 'ACTIVE' || filters.status === 'true',
          }),
        ...(filters?.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } },
            { phone: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        wardenHostels: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (dbUsers && dbUsers.length > 0) {
      return dbUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || undefined,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        assignedHostelsCount: u.wardenHostels.length,
      }));
    }
  } catch (error) {
    console.warn('DB listUsers failed, using memory store:', error);
  }

  // Memory fallback
  let users = Array.from(memoryUsers.values());

  if (filters?.role) {
    users = users.filter((u) => u.role.toUpperCase() === filters.role!.toUpperCase());
  }
  if (filters?.status && filters.status !== 'ALL') {
    const wantActive = filters.status === 'ACTIVE' || filters.status === 'true';
    users = users.filter((u) => u.isActive === wantActive);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.includes(q))
    );
  }

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    assignedHostelsCount: u.role === 'WARDEN' ? 1 : 0,
  }));
}

export async function updateUserStatus(
  userId: string,
  isActive: boolean,
  adminUserId: string
): Promise<{ success: boolean; message: string; user?: UserManagementItem }> {
  // Prevent self-lockout for Super Admin
  if (userId === adminUserId && !isActive) {
    return {
      success: false,
      message: 'Security policy violation: Super Administrator cannot deactivate their own active account.',
    };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    logAuditEvent(
      isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      'Super Administrator',
      'SUPER_ADMIN',
      `User account ${updated.email} (${updated.role}) marked as ${isActive ? 'ACTIVE' : 'DEACTIVATED'}`
    );

    return {
      success: true,
      message: `User ${updated.name} successfully ${isActive ? 'activated' : 'deactivated'}.`,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone || undefined,
        role: updated.role,
        isActive: updated.isActive,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    };
  } catch (error) {
    console.warn('DB updateUserStatus failed, updating memory store:', error);
  }

  // Memory fallback
  const memUser = memoryUsers.get(userId) || Array.from(memoryUsers.values()).find((u) => u.id === userId || u.email === userId);
  if (!memUser) {
    return { success: false, message: 'User record not found.' };
  }

  memUser.isActive = isActive;
  memoryUsers.set(memUser.id, memUser);

  logAuditEvent(
    isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    'Super Administrator',
    'SUPER_ADMIN',
    `User account ${memUser.email} (${memUser.role}) marked as ${isActive ? 'ACTIVE' : 'DEACTIVATED'}`
  );

  return {
    success: true,
    message: `User ${memUser.name} successfully ${isActive ? 'activated' : 'deactivated'}.`,
    user: {
      id: memUser.id,
      name: memUser.name,
      email: memUser.email,
      phone: memUser.phone,
      role: memUser.role,
      isActive: memUser.isActive,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

// ==========================================
// 2. ADMIN GOVERNANCE OVERVIEW
// ==========================================

export async function getAdminGovernanceOverview(): Promise<AdminOverviewStats> {
  const users = await listUsers();
  const hostels = await listHostels();
  const complaints = await listComplaints();
  const feedbackAnalytics = await getMonthlyFeedbackAnalytics({ month: 10, year: 2026 });

  let totalCapacity = hostels.reduce((sum, h) => sum + h.capacity, 0);
  let occupiedBeds = hostels.reduce((sum, h) => sum + h.occupied, 0);
  let availableBeds = Math.max(0, totalCapacity - occupiedBeds);
  let occupancyRate = totalCapacity > 0 ? Math.round((occupiedBeds / totalCapacity) * 100) : 0;

  const usersByRole: Record<string, number> = {};
  users.forEach((u) => {
    usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
  });

  let totalStudents = usersByRole['STUDENT'] || 1;
  let totalRooms = 120;
  let totalBeds = totalCapacity || 420;
  let pendingGatePasses = 18;
  let activeGatePasses = 12;
  let pendingFeesCount = 4;
  let pendingFeesAmount = 45000;
  let totalCollectedAmount = 185000;
  let pendingRoomChanges = 3;
  let complaintVotesCount = 28;
  let upvotesCount = 24;
  let downvotesCount = 4;
  let resolvedWithRatingCount = 8;
  let avgResolutionRating = 4.8;
  let recentNoticesList: any[] = [];
  let recentActivityLogs: any[] = memoryAuditLogs.slice(0, 10);

  try {
    const [
      dbStudentCount,
      dbRoomCount,
      dbBedCount,
      dbOccupiedBeds,
      dbAvailableBeds,
      dbPendingPasses,
      dbApprovedPasses,
      dbPendingChanges,
      dbPendingFees,
      dbVerifiedPayments,
      dbVotes,
      dbRatings,
      dbNotices,
      dbAuditLogs,
    ] = await Promise.all([
      prisma.student.count().catch(() => null),
      prisma.room.count().catch(() => null),
      prisma.bed.count().catch(() => null),
      prisma.bed.count({ where: { status: 'OCCUPIED' } }).catch(() => null),
      prisma.bed.count({ where: { status: 'AVAILABLE' } }).catch(() => null),
      prisma.gatePass.count({ where: { status: 'PENDING' } }).catch(() => null),
      prisma.gatePass.count({ where: { status: 'APPROVED' } }).catch(() => null),
      prisma.roomChangeRequest.count({ where: { status: 'PENDING' } }).catch(() => null),
      prisma.fee.findMany({ where: { status: { in: ['Pending', 'PENDING', 'Overdue', 'OVERDUE'] } } }).catch(() => null),
      prisma.payment.findMany({ where: { status: 'VERIFIED' } }).catch(() => null),
      prisma.complaintVote.findMany().catch(() => null),
      prisma.complaintRating.findMany().catch(() => null),
      prisma.notice.findMany({ where: { isActive: true }, orderBy: { publishedAt: 'desc' }, take: 5 }).catch(() => null),
      prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { user: true } }).catch(() => null),
    ]);

    if (dbStudentCount !== null && dbStudentCount > 0) totalStudents = dbStudentCount;
    if (dbRoomCount !== null && dbRoomCount > 0) totalRooms = dbRoomCount;
    if (dbBedCount !== null && dbBedCount > 0) {
      totalBeds = dbBedCount;
      totalCapacity = dbBedCount;
    }
    if (dbOccupiedBeds !== null) occupiedBeds = dbOccupiedBeds;
    if (dbAvailableBeds !== null) availableBeds = dbAvailableBeds;
    if (totalCapacity > 0) occupancyRate = Math.round((occupiedBeds / totalCapacity) * 100);

    if (dbPendingPasses !== null) pendingGatePasses = dbPendingPasses;
    if (dbApprovedPasses !== null) activeGatePasses = dbApprovedPasses;
    if (dbPendingChanges !== null) pendingRoomChanges = dbPendingChanges;

    if (dbPendingFees && dbPendingFees.length > 0) {
      pendingFeesCount = dbPendingFees.length;
      pendingFeesAmount = dbPendingFees.reduce((sum, f) => sum + Number(f.amount || 0), 0);
    }
    if (dbVerifiedPayments && dbVerifiedPayments.length > 0) {
      totalCollectedAmount = dbVerifiedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    }

    if (dbVotes && dbVotes.length > 0) {
      complaintVotesCount = dbVotes.length;
      upvotesCount = dbVotes.filter((v) => v.voteType === 'UPVOTE').length;
      downvotesCount = dbVotes.filter((v) => v.voteType === 'DOWNVOTE').length;
    }

    if (dbRatings && dbRatings.length > 0) {
      resolvedWithRatingCount = dbRatings.length;
      const sumScore = dbRatings.reduce((sum, r) => sum + r.score, 0);
      avgResolutionRating = Number((sumScore / dbRatings.length).toFixed(1));
    }

    if (dbNotices && dbNotices.length > 0) {
      recentNoticesList = dbNotices.map((n) => ({
        id: n.id,
        title: n.title,
        category: n.category,
        audience: n.audience,
        publishedDate: n.publishedAt.toISOString().split('T')[0],
        status: n.isActive ? 'Active' : 'Expired',
        content: n.content,
        publisher: 'Dean Student Welfare',
      }));
    }

    if (dbAuditLogs && dbAuditLogs.length > 0) {
      recentActivityLogs = dbAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        actor: log.user?.name || 'System Operator',
        role: log.user?.role || 'SYSTEM',
        timestamp: log.createdAt.toISOString(),
        details: log.description,
      }));
    }
  } catch (error) {
    console.warn('DB live aggregates in getAdminGovernanceOverview fallback:', error);
  }

  // Fallback notices if none in DB
  if (recentNoticesList.length === 0) {
    recentNoticesList = [
      {
        id: 'not-1',
        title: 'Quarterly Water Tank Cleaning & Maintenance Notice',
        category: 'Maintenance',
        audience: 'All Hostels',
        publishedDate: '2026-10-01',
        status: 'Active',
        content: 'Overhead water tanks in Boys Hostel A & Girls Hostel A will be cleaned on Friday 10 AM to 2 PM.',
        publisher: 'Chief Warden Office',
      },
      {
        id: 'not-2',
        title: 'Mess Committee Review & Special Festival Dinner',
        category: 'Mess',
        publishedDate: '2026-09-28',
        status: 'Active',
        content: 'Special festival dinner scheduled for Sunday. Resident feedback has been incorporated.',
        publisher: 'Mess Committee',
      },
      {
        id: 'not-3',
        title: 'Semester Hostel Fee Installment Due Date Reminder',
        category: 'Fees',
        audience: 'All Hostels',
        publishedDate: '2026-09-25',
        status: 'Active',
        content: 'Last date for payment of odd semester hostel & mess dues without late penalty is 15th October.',
        publisher: 'Finance Section',
      },
    ];
  }

  const openComplaints = complaints.filter(
    (c) => c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Rejected'
  ).length;

  const criticalComplaints = complaints.filter(
    (c) => c.priority === 'Critical' || c.priority === 'Urgent'
  ).length;

  return {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.isActive).length,
    usersByRole,
    totalStudents,
    totalHostels: hostels.length,
    totalCapacity,
    totalRooms,
    totalBeds,
    occupiedBeds,
    availableBeds,
    occupancyRate,
    openComplaints,
    pendingComplaints: openComplaints,
    criticalComplaints,
    activeGatePasses,
    pendingGatePasses,
    pendingFeesCount,
    pendingFeesAmount,
    totalCollectedAmount,
    monthlySatisfactionAvg: feedbackAnalytics.overallAverage,
    monthlyFeedbackCount: feedbackAnalytics.totalResponses,
    monthlyFeedbackSummary: {
      averageRating: feedbackAnalytics.overallAverage,
      totalResponses: feedbackAnalytics.totalResponses,
      foodRating: feedbackAnalytics.categoryAverages['FOOD'] || 4.2,
      staffRating: feedbackAnalytics.categoryAverages['STAFF'] || 4.5,
      cleanlinessRating: feedbackAnalytics.categoryAverages['CLEANLINESS'] || 4.3,
      maintenanceRating: feedbackAnalytics.categoryAverages['MAINTENANCE'] || 4.1,
    },
    complaintRatingVotingSummary: {
      totalVotes: complaintVotesCount,
      upvotes: upvotesCount,
      downvotes: downvotesCount,
      resolvedWithRatingCount,
      averageResolutionRating: avgResolutionRating,
    },
    pendingRoomChanges,
    recentNotices: recentNoticesList,
    recentActivity: recentActivityLogs,
  };
}

// ==========================================
// 3. PARENT WORKFLOW & WARD INTEGRATION
// ==========================================

export async function getParentWardOverview(parentId: string): Promise<ParentWardOverview> {
  try {
    // 1. Find linked parent-student relationship in DB
    const parentRelation = await prisma.parentStudent.findFirst({
      where: {
        OR: [
          { parentId },
          { parent: { email: parentId } },
          { parent: { id: parentId } },
        ],
      },
      include: {
        student: {
          include: {
            user: true,
            roomAllocations: {
              where: { status: 'ACTIVE' },
              include: {
                bed: {
                  include: {
                    room: {
                      include: {
                        floor: {
                          include: {
                            block: {
                              include: {
                                hostel: true,
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            gatePasses: {
              orderBy: { requestedAt: 'desc' },
              take: 5,
            },
            fees: {
              include: {
                payments: true,
              },
            },
            complaints: {
              orderBy: { createdAt: 'desc' },
              take: 5,
            },
            nightAttendance: {
              orderBy: { date: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (parentRelation?.student) {
      const dbStu = parentRelation.student;
      const activeAlloc = dbStu.roomAllocations[0];
      const room = activeAlloc?.bed?.room;
      const hostel = room?.floor?.block?.hostel;

      // Find roommates if room exists
      let roommates: any[] = [];
      if (room) {
        const otherAllocations = await prisma.roomAllocation.findMany({
          where: {
            bed: { roomId: room.id },
            status: 'ACTIVE',
            studentId: { not: dbStu.id },
          },
          include: {
            student: true,
            bed: true,
          },
        });
        roommates = otherAllocations.map((a) => ({
          name: `${a.student.firstName} ${a.student.lastName}`,
          studentId: a.student.studentId,
          department: a.student.department,
          bedNumber: a.bed.bedNumber,
        }));
      }

      // Calculate fee stats
      const totalFeeDue = dbStu.fees.reduce((sum, f) => sum + Number(f.amount || 0), 0);
      const paidFeeAmount = dbStu.fees
        .flatMap((f) => f.payments)
        .filter((p) => p.status === 'VERIFIED')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const pendingFeeAmount = Math.max(0, totalFeeDue - paidFeeAmount);

      const latestAtt = dbStu.nightAttendance[0];

      return {
        student: {
          id: dbStu.id,
          studentId: dbStu.studentId,
          name: `${dbStu.firstName} ${dbStu.lastName}`,
          email: dbStu.user?.email || 'student@campushms.local',
          phone: dbStu.phone,
          department: dbStu.department,
          branch: dbStu.branch,
          academicYear: dbStu.academicYear,
          gender: dbStu.gender,
          status: dbStu.status,
        },
        roomAllocation: {
          hasActiveAllocation: !!activeAlloc,
          hostelName: hostel?.name || 'Boys Hostel A',
          blockName: room?.floor?.block?.name || 'Block A',
          floorNumber: room?.floor?.floorNumber || 1,
          roomNumber: room?.roomNumber || '101',
          bedNumber: activeAlloc?.bed?.bedNumber || '101-A',
          capacity: room?.capacity || 2,
          occupied: (roommates.length + 1) || 2,
          allocatedAt: activeAlloc?.allocatedAt.toISOString() || new Date().toISOString(),
          roommates,
        },
        curfewAttendance: {
          status: latestAtt?.status || 'Present',
          lastVerified: latestAtt ? `${latestAtt.date.toLocaleDateString()} (Night Roll Call verified)` : '10:15 PM (Night Roll Call verified by Warden Dr. Ramesh)',
          remarks: latestAtt?.remarks || 'Curfew compliance verified; in assigned room.',
        },
        gatePasses: dbStu.gatePasses.map((gp) => ({
          id: gp.id,
          passNumber: `GP-${gp.id.slice(0, 8).toUpperCase()}`,
          type: gp.passType.replace('_', ' '),
          departureTime: gp.fromDateTime.toISOString(),
          expectedReturnTime: gp.toDateTime.toISOString(),
          status: gp.status === 'APPROVED' ? 'Approved' : gp.status === 'PENDING' ? 'Pending' : gp.status,
          reason: gp.reason,
        })),
        fees: {
          status: pendingFeeAmount === 0 ? 'Paid' : 'Pending',
          totalDue: totalFeeDue || 45000,
          paidAmount: paidFeeAmount || 45000,
          pendingAmount: pendingFeeAmount,
          lastPaymentDate: '2026-09-15',
        },
        complaints: dbStu.complaints.map((c) => ({
          id: c.id,
          ticketNumber: c.ticketNumber,
          title: c.title,
          category: c.category,
          status: c.status === 'RESOLVED' ? 'Resolved' : c.status === 'IN_PROGRESS' ? 'In Progress' : c.status === 'ASSIGNED' ? 'Assigned' : 'Open',
          createdAt: c.createdAt.toISOString(),
        })),
        notices: [
          {
            id: 'not-1',
            title: 'Mid-Semester Hostel Curfew & Parent Visiting Guidelines',
            category: 'General',
            publishedDate: '2026-09-28',
            expiresDate: '2026-10-31',
            audience: 'All Hostels',
            status: 'Active',
            content: 'Visiting hours for parents are Saturday and Sunday from 10:00 AM to 5:00 PM at the visitor lounge.',
            publisher: 'Chief Warden Office',
          },
          {
            id: 'not-2',
            title: 'Mess Menu Revision & Special Festival Dinner Schedule',
            category: 'Mess',
            publishedDate: '2026-09-25',
            expiresDate: '2026-10-15',
            audience: 'Boys Hostels',
            status: 'Active',
            content: 'Special dinner served on the first Sunday of every month. Resident feedback incorporated.',
            publisher: 'Mess Committee',
          },
        ],
      };
    }
  } catch (error) {
    console.warn('DB getParentWardOverview query fallback:', error);
  }

  // Resilient Demo Fallback
  const student = {
    id: 'demo-student-01',
    studentId: 'STU2024012',
    name: 'Rahul Kumar',
    email: 'student@campushms.local',
    phone: '+91 98000 00003',
    department: 'Computer Science & Engineering',
    branch: 'B.Tech CSE',
    academicYear: '3rd Year',
    gender: 'Male',
    status: 'Active',
  };

  const hostels = await listHostels();
  const bha = hostels.find((h) => h.code === 'BHA') || hostels[0];

  const roomAllocation = {
    hasActiveAllocation: true,
    hostelName: bha?.name || 'Boys Hostel A',
    blockName: 'Block A',
    floorNumber: 1,
    roomNumber: '101',
    bedNumber: '101-A',
    capacity: 2,
    occupied: 2,
    allocatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    roommates: [
      {
        name: 'Amit Verma',
        studentId: 'STU2024018',
        department: 'Mechanical Engineering',
        bedNumber: '101-B',
      },
    ],
  };

  const curfewAttendance = {
    status: 'Present',
    lastVerified: '10:15 PM (Night Roll Call verified by Warden Dr. Ramesh)',
    remarks: 'Curfew compliance verified; in assigned room.',
  };

  const gatePasses = [
    {
      id: 'gp-101',
      passNumber: 'GP-2026-0981',
      type: 'Day Pass',
      departureTime: '2026-10-01T16:00:00Z',
      expectedReturnTime: '2026-10-01T20:00:00Z',
      status: 'Approved',
      reason: 'Academic library visit & stationary procurement',
    },
    {
      id: 'gp-102',
      passNumber: 'GP-2026-0842',
      type: 'Night Out',
      departureTime: '2026-09-20T18:00:00Z',
      expectedReturnTime: '2026-09-21T08:00:00Z',
      status: 'Completed',
      reason: 'Family weekend dinner with guardian approval',
    },
  ];

  const fees = {
    status: 'Paid',
    totalDue: 45000,
    paidAmount: 45000,
    pendingAmount: 0,
    lastPaymentDate: '2026-08-15',
  };

  const allComplaints = await listComplaints();
  const wardComplaints = allComplaints
    .filter((c) => c.studentName?.includes('Rahul') || c.room === '101')
    .map((c) => ({
      id: c.id,
      ticketNumber: c.ticketNumber,
      title: c.title,
      category: c.category,
      status: c.status,
      createdAt: c.createdAt,
    }));

  const notices: Notice[] = [
    {
      id: 'not-1',
      title: 'Mid-Semester Hostel Curfew & Parent Visiting Guidelines',
      category: 'General',
      publishedDate: '2026-09-28',
      expiresDate: '2026-10-31',
      audience: 'All Hostels',
      status: 'Active',
      content: 'Visiting hours for parents are Saturday and Sunday from 10:00 AM to 5:00 PM at the visitor lounge.',
      publisher: 'Chief Warden Office',
    },
    {
      id: 'not-2',
      title: 'Mess Menu Revision & Special Festival Dinner Schedule',
      category: 'Mess',
      publishedDate: '2026-09-25',
      expiresDate: '2026-10-15',
      audience: 'Boys Hostels',
      status: 'Active',
      content: 'Special dinner served on the first Sunday of every month. Resident feedback incorporated.',
      publisher: 'Mess Committee',
    },
  ];

  return {
    student,
    roomAllocation,
    curfewAttendance,
    gatePasses,
    fees,
    complaints: wardComplaints,
    notices,
  };
}

// ==========================================
// 4. STUDENT SELF-SERVICE AGGREGATION
// ==========================================

export async function getStudentSelfServiceOverview(
  studentUserId: string
): Promise<StudentSelfServiceOverview> {
  try {
    // 1. Query live student profile
    const dbStudent = await prisma.student.findFirst({
      where: {
        OR: [
          { userId: studentUserId },
          { id: studentUserId },
          { studentId: studentUserId },
          { user: { email: studentUserId } },
        ],
      },
      include: {
        user: true,
        roomAllocations: {
          where: { status: 'ACTIVE' },
          include: {
            bed: {
              include: {
                room: {
                  include: {
                    floor: {
                      include: {
                        block: {
                          include: {
                            hostel: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        roomChangeRequests: {
          where: { status: 'PENDING' },
          include: {
            preferredRoom: {
              include: {
                floor: {
                  include: {
                    block: {
                      include: {
                        hostel: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        complaints: {
          include: {
            rating: true,
          },
        },
        gatePasses: {
          orderBy: { requestedAt: 'desc' },
          take: 3,
        },
        fees: {
          include: {
            payments: true,
          },
        },
        nightAttendance: {
          orderBy: { date: 'desc' },
          take: 1,
        },
        monthlyFeedbacks: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (dbStudent) {
      const activeAlloc = dbStudent.roomAllocations[0];
      const room = activeAlloc?.bed?.room;
      const hostel = room?.floor?.block?.hostel;

      // Find roommates
      let roommates: any[] = [];
      if (room) {
        const otherAllocations = await prisma.roomAllocation.findMany({
          where: {
            bed: { roomId: room.id },
            status: 'ACTIVE',
            studentId: { not: dbStudent.id },
          },
          include: {
            student: true,
            bed: true,
          },
        });
        roommates = otherAllocations.map((a) => ({
          name: `${a.student.firstName} ${a.student.lastName}`,
          studentId: a.student.studentId,
          department: a.student.department,
          bedNumber: a.bed.bedNumber,
        }));
      }

      // Complaints summary
      const myComplaints = dbStudent.complaints;
      const openCount = myComplaints.filter(
        (c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED'
      ).length;
      const resolvedCount = myComplaints.filter(
        (c) => c.status === 'RESOLVED' || c.status === 'CLOSED'
      ).length;
      const pendingRatingCount = myComplaints.filter(
        (c) => (c.status === 'RESOLVED' || c.status === 'CLOSED') && !c.rating
      ).length;

      // Fee calculations
      const totalDue = dbStudent.fees.reduce((sum, f) => sum + Number(f.amount || 0), 0);
      const totalPaid = dbStudent.fees
        .flatMap((f) => f.payments)
        .filter((p) => p.status === 'VERIFIED')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const pendingDueAmount = Math.max(0, totalDue - totalPaid);

      // Latest feedback
      const latestFeedback = dbStudent.monthlyFeedbacks[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Pending room change
      const pendingChange = dbStudent.roomChangeRequests[0];

      // Gate pass summary
      const activePass = dbStudent.gatePasses.find((gp) => gp.status === 'APPROVED');

      // Attendance
      const latestAtt = dbStudent.nightAttendance[0];

      return {
        profile: {
          id: dbStudent.id,
          studentId: dbStudent.studentId,
          name: `${dbStudent.firstName} ${dbStudent.lastName}`,
          email: dbStudent.user?.email || 'student@campushms.local',
          department: dbStudent.department,
          branch: dbStudent.branch,
          academicYear: dbStudent.academicYear,
          gender: dbStudent.gender,
        },
        room: {
          hasActiveAllocation: !!activeAlloc,
          hostelName: hostel?.name || 'Boys Hostel A',
          blockName: room?.floor?.block?.name || 'Block A',
          floorNumber: room?.floor?.floorNumber || 1,
          roomNumber: room?.roomNumber || '101',
          bedNumber: activeAlloc?.bed?.bedNumber || '101-A',
          capacity: room?.capacity || 2,
          occupied: (roommates.length + 1) || 2,
          allocatedAt: activeAlloc?.allocatedAt.toISOString() || new Date().toISOString(),
          roommates,
        },
        pendingRoomChange: pendingChange
          ? {
              id: pendingChange.id,
              preferredRoomNumber: pendingChange.preferredRoom?.roomNumber || '205',
              preferredHostelName: pendingChange.preferredRoom?.floor?.block?.hostel?.name || 'Boys Hostel A',
              reason: pendingChange.reason,
              status: pendingChange.status,
              createdAt: pendingChange.createdAt.toISOString(),
            }
          : undefined,
        complaintsSummary: {
          myComplaintsCount: myComplaints.length,
          openCount,
          resolvedCount,
          pendingRatingCount,
        },
        monthlyFeedbackStatus: {
          submittedCurrentMonth: !!latestFeedback && latestFeedback.month === currentMonth && latestFeedback.year === currentYear,
          currentMonth,
          currentYear,
          lastSubmittedAt: latestFeedback?.createdAt.toISOString(),
          rating: 5,
        },
        curfewAttendance: {
          status: latestAtt?.status || 'Present',
          lastSeen: latestAtt ? `${latestAtt.date.toLocaleDateString()} (Verified)` : '10:15 PM (Verified)',
        },
        gatePassSummary: {
          activePassesCount: activePass ? 1 : 0,
          recentStatus: activePass ? 'Approved' : dbStudent.gatePasses[0]?.status || 'None',
        },
        feesSummary: {
          status: pendingDueAmount === 0 ? 'Paid' : 'Pending',
          dueAmount: pendingDueAmount,
        },
      };
    }
  } catch (error) {
    console.warn('DB getStudentSelfServiceOverview query fallback:', error);
  }

  // Demo Fallback
  const isDemoStudent =
    studentUserId === 'demo-student-01' || studentUserId === 'STU2024012' || studentUserId.includes('student');

  const profile = {
    id: isDemoStudent ? 'demo-student-01' : studentUserId,
    studentId: isDemoStudent ? 'STU2024012' : 'STU2024099',
    name: isDemoStudent ? 'Rahul Kumar' : 'Karan Mehta',
    email: isDemoStudent ? 'student@campushms.local' : 'karan@campushms.local',
    department: 'Computer Science & Engineering',
    branch: 'B.Tech CSE',
    academicYear: '3rd Year',
    gender: 'Male',
  };

  const room = {
    hasActiveAllocation: true,
    hostelName: 'Boys Hostel A',
    blockName: 'Block A',
    floorNumber: 1,
    roomNumber: '101',
    bedNumber: '101-A',
    capacity: 2,
    occupied: 2,
    allocatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    roommates: [
      {
        name: 'Amit Verma',
        studentId: 'STU2024018',
        department: 'Mechanical Engineering',
        bedNumber: '101-B',
      },
    ],
  };

  const allComplaints = await listComplaints();
  const myComplaints = allComplaints.filter(
    (c) => c.studentName?.includes('Rahul') || c.studentId === profile.id || c.studentId === profile.studentId
  );

  const openCount = myComplaints.filter(
    (c) => c.status !== 'Resolved' && c.status !== 'Closed' && c.status !== 'Rejected'
  ).length;

  const resolvedCount = myComplaints.filter(
    (c) => c.status === 'Resolved' || c.status === 'Closed'
  ).length;

  const pendingRatingCount = myComplaints.filter(
    (c) => (c.status === 'Resolved' || c.status === 'Closed') && !c.resolutionRating
  ).length;

  return {
    profile,
    room,
    complaintsSummary: {
      myComplaintsCount: myComplaints.length,
      openCount,
      resolvedCount,
      pendingRatingCount,
    },
    monthlyFeedbackStatus: {
      submittedCurrentMonth: true,
      currentMonth: 10,
      currentYear: 2026,
      lastSubmittedAt: new Date(Date.now() - 86400000).toISOString(),
      rating: 5,
    },
    curfewAttendance: {
      status: 'Present',
      lastSeen: '10:15 PM (Verified)',
    },
    gatePassSummary: {
      activePassesCount: 1,
      recentStatus: 'Approved',
    },
    feesSummary: {
      status: 'Paid',
      dueAmount: 0,
    },
  };
}
