import { prisma } from '@/lib/db/prisma';

export interface CreateComplaintInput {
  studentId: string;
  hostelId?: string;
  blockId?: string;
  roomId?: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface UpdateComplaintInput {
  status?: string;
  assignedToId?: string;
  resolutionNotes?: string;
  title?: string;
  description?: string;
}

export interface RateComplaintInput {
  score: number;
  comment?: string;
  resolutionStatus?: 'FULLY_RESOLVED' | 'PARTIALLY_RESOLVED' | 'NOT_RESOLVED';
}

export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export interface MemoryVote {
  userId: string;
  voteType: VoteType;
}

// In-Memory store fallback for demo & resilient execution
export interface MemoryComplaint {
  id: string;
  ticketNumber: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  hostelId: string;
  hostelName: string;
  blockId?: string;
  roomId: string;
  roomNumber: string;
  category: string;
  priority: string;
  status: string;
  title: string;
  description: string;
  imageUrl?: string;
  resolutionNotes?: string;
  assignedToId?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  votes: MemoryVote[];
  rating?: {
    score: number;
    comment?: string;
    resolutionStatus: string;
    createdAt: string;
  };
}

const memoryComplaints: MemoryComplaint[] = [
  {
    id: 'comp-1040',
    ticketNumber: 'TKT-1040',
    studentId: 'demo-student-01',
    studentName: 'Rahul Kumar',
    studentRegNo: 'STU2024012',
    hostelId: 'hostel-bha',
    hostelName: 'Boys Hostel A',
    roomId: 'room-101',
    roomNumber: '101',
    category: 'ELECTRICAL',
    priority: 'HIGH',
    status: 'RESOLVED',
    title: 'Ceiling fan regulator sparkling and malfunctioning',
    description: 'Fan speed regulator sparks when turned to level 4 and vibrates violently.',
    resolutionNotes: 'Replaced fan regulator switchboard with new 4-step modular regulator.',
    assignedToId: 'demo-maintenance-01',
    assignedToName: 'Suresh Kumar (Electrician)',
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    votes: [{ userId: 'demo-student-01', voteType: 'UPVOTE' }],
    rating: {
      score: 5,
      comment: 'Replaced on the same day. Great and prompt service!',
      resolutionStatus: 'FULLY_RESOLVED',
      createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
  },
  {
    id: 'comp-1041',
    ticketNumber: 'TKT-1041',
    studentId: 'demo-student-02',
    studentName: 'Vikram Singh',
    studentRegNo: 'STU2024045',
    hostelId: 'hostel-bha',
    hostelName: 'Boys Hostel A',
    roomId: 'room-204',
    roomNumber: '204',
    category: 'PLUMBING',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    title: 'Bathroom pipe leakage in 2nd Floor common washroom',
    description: 'Continuous water leakage from overhead pipe causing water stagnation on 2nd floor.',
    assignedToId: 'demo-maintenance-01',
    assignedToName: 'Suresh Kumar (Electrician)',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    votes: [
      { userId: 'demo-student-02', voteType: 'UPVOTE' },
      { userId: 'demo-student-03', voteType: 'UPVOTE' },
    ],
  },
  {
    id: 'comp-1042',
    ticketNumber: 'TKT-1042',
    studentId: 'demo-student-03',
    studentName: 'Amit Sharma',
    studentRegNo: 'STU2024089',
    hostelId: 'hostel-bha',
    hostelName: 'Boys Hostel A',
    roomId: 'room-310',
    roomNumber: '310',
    category: 'INTERNET',
    priority: 'MEDIUM',
    status: 'OPEN',
    title: 'Wi-Fi Access Point 3B dropping packets intermittently',
    description: 'Hostel Wi-Fi disconnects every 10 minutes during evening peak study hours.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    votes: [
      { userId: 'demo-student-01', voteType: 'UPVOTE' },
      { userId: 'demo-student-03', voteType: 'UPVOTE' },
    ],
  },
  {
    id: 'comp-1043',
    ticketNumber: 'TKT-1043',
    studentId: 'demo-student-01',
    studentName: 'Rahul Kumar',
    studentRegNo: 'STU2024012',
    hostelId: 'hostel-bha',
    hostelName: 'Boys Hostel A',
    roomId: 'room-101',
    roomNumber: '101',
    category: 'WATER',
    priority: 'HIGH',
    status: 'UNDER_REVIEW',
    title: 'Water purifier filter replacement on 1st floor',
    description: 'RO water dispenser is showing red replace-filter indicator light.',
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    votes: [{ userId: 'demo-student-01', voteType: 'UPVOTE' }],
  },
  {
    id: 'comp-1044',
    ticketNumber: 'TKT-1044',
    studentId: 'demo-student-04',
    studentName: 'Priya Sharma',
    studentRegNo: 'STU2024056',
    hostelId: 'hostel-gha',
    hostelName: 'Girls Hostel A',
    roomId: 'room-105',
    roomNumber: '105',
    category: 'FOOD_MESS',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    title: 'Mess food quality feedback regarding dinner rotis',
    description: 'Rotis served in Tuesday dinner were undercooked.',
    resolutionNotes: 'Notified mess head chef. New kneading and baking temperature standards enforced.',
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    votes: [
      { userId: 'demo-student-04', voteType: 'UPVOTE' },
      { userId: 'demo-student-05', voteType: 'UPVOTE' },
    ],
    rating: {
      score: 4,
      comment: 'Addressed immediately by the mess manager.',
      resolutionStatus: 'FULLY_RESOLVED',
      createdAt: new Date().toISOString(),
    },
  },
  {
    id: 'comp-1045',
    ticketNumber: 'TKT-1045',
    studentId: 'demo-student-02',
    studentName: 'Vikram Singh',
    studentRegNo: 'STU2024045',
    hostelId: 'hostel-bha',
    hostelName: 'Boys Hostel A',
    roomId: 'room-204',
    roomNumber: '204',
    category: 'FURNITURE',
    priority: 'LOW',
    status: 'RESOLVED',
    title: 'Study table drawer handle broken',
    description: 'Drawer handle is loose and detached on left side.',
    resolutionNotes: 'Fitted new wooden handle and tightened brackets.',
    createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: new Date().toISOString(),
    votes: [{ userId: 'demo-student-02', voteType: 'UPVOTE' }],
  },
];

let ticketCounter = 1050;

function formatCategoryName(category: string): string {
  const map: Record<string, string> = {
    PLUMBING: 'Plumbing',
    ELECTRICAL: 'Electrical',
    FURNITURE: 'Furniture',
    INTERNET: 'Internet',
    CLEANLINESS: 'Cleanliness',
    FOOD_MESS: 'Food / Mess',
    SECURITY: 'Security',
    ROOM: 'Room',
    WATER: 'Water',
    OTHER: 'Other',
  };
  return map[category.toUpperCase()] || category;
}

function formatPriorityName(priority: string): string {
  const map: Record<string, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
    URGENT: 'Urgent',
    CRITICAL: 'Critical',
  };
  return map[priority.toUpperCase()] || priority;
}

function formatStatusName(status: string): string {
  const map: Record<string, string> = {
    OPEN: 'Open',
    UNDER_REVIEW: 'Under Review',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved',
    CLOSED: 'Closed',
    REJECTED: 'Rejected',
  };
  return map[status.toUpperCase()] || status;
}

/**
 * List complaints with filtering and support voting metadata
 */
export async function listComplaints(params: {
  studentId?: string;
  role?: string;
  category?: string;
  priority?: string;
  status?: string;
  search?: string;
  sortBy?: 'votes' | 'date' | 'priority';
  currentUserId?: string;
} = {}) {
  let list = [...memoryComplaints];

  // Student sees own complaints when requested
  if (params.studentId) {
    list = list.filter((c) => c.studentId === params.studentId);
  }

  if (params.category && params.category !== 'All') {
    const norm = params.category.toUpperCase().replace(/\s+/g, '_').replace('/', '_');
    list = list.filter(
      (c) =>
        c.category.toUpperCase() === norm ||
        formatCategoryName(c.category).toLowerCase() === params.category!.toLowerCase()
    );
  }

  if (params.priority && params.priority !== 'All') {
    list = list.filter(
      (c) =>
        c.priority.toUpperCase() === params.priority!.toUpperCase() ||
        formatPriorityName(c.priority).toLowerCase() === params.priority!.toLowerCase()
    );
  }

  if (params.status && params.status !== 'All') {
    list = list.filter(
      (c) =>
        c.status.toUpperCase() === params.status!.toUpperCase().replace(/\s+/g, '_') ||
        formatStatusName(c.status).toLowerCase() === params.status!.toLowerCase()
    );
  }

  if (params.search) {
    const q = params.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.ticketNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.studentName.toLowerCase().includes(q) ||
        c.roomNumber.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (params.sortBy === 'votes') {
    list.sort((a, b) => {
      const aUp = a.votes.filter((v) => v.voteType === 'UPVOTE').length;
      const bUp = b.votes.filter((v) => v.voteType === 'UPVOTE').length;
      return bUp - aUp;
    });
  } else {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  return list.map((c) => {
    const upvotesCount = c.votes.filter((v) => v.voteType === 'UPVOTE').length;
    const downvotesCount = c.votes.filter((v) => v.voteType === 'DOWNVOTE').length;
    const userVoteObj = params.currentUserId ? c.votes.find((v) => v.userId === params.currentUserId) : null;
    const userVote = userVoteObj ? userVoteObj.voteType : null;

    return {
      id: c.id,
      ticketId: c.ticketNumber,
      ticketNumber: c.ticketNumber,
      studentName: c.studentName,
      studentId: c.studentRegNo,
      ownerStudentId: c.studentId,
      room: c.roomNumber,
      hostel: c.hostelName,
      category: formatCategoryName(c.category),
      priority: formatPriorityName(c.priority),
      status: formatStatusName(c.status),
      title: c.title,
      description: c.description,
      imageUrl: c.imageUrl,
      assignedStaff: c.assignedToName,
      assignedStaffId: c.assignedToId,
      resolutionNotes: c.resolutionNotes,
      sla: c.priority === 'URGENT' || c.priority === 'HIGH' ? '12 Hours' : '24 Hours',
      createdAt: c.createdAt,
      resolvedAt: c.resolvedAt,
      votesCount: upvotesCount - downvotesCount,
      upvotesCount,
      downvotesCount,
      userVote,
      hasVoted: Boolean(userVote),
      rating: c.rating,
      resolutionRating: c.rating,
    };
  });
}

/**
 * Get a single complaint by ID
 */
export async function getComplaintById(id: string, currentUserId?: string) {
  const c = memoryComplaints.find((item) => item.id === id || item.ticketNumber === id);
  if (!c) return null;

  const upvotesCount = c.votes.filter((v) => v.voteType === 'UPVOTE').length;
  const downvotesCount = c.votes.filter((v) => v.voteType === 'DOWNVOTE').length;
  const userVoteObj = currentUserId ? c.votes.find((v) => v.userId === currentUserId) : null;
  const userVote = userVoteObj ? userVoteObj.voteType : null;

  return {
    id: c.id,
    ticketId: c.ticketNumber,
    studentName: c.studentName,
    studentId: c.studentRegNo,
    ownerStudentId: c.studentId,
    room: c.roomNumber,
    hostel: c.hostelName,
    category: formatCategoryName(c.category),
    priority: formatPriorityName(c.priority),
    status: formatStatusName(c.status),
    title: c.title,
    description: c.description,
    imageUrl: c.imageUrl,
    assignedStaff: c.assignedToName,
    assignedStaffId: c.assignedToId,
    resolutionNotes: c.resolutionNotes,
    sla: c.priority === 'URGENT' || c.priority === 'HIGH' ? '12 Hours' : '24 Hours',
    createdAt: c.createdAt,
    resolvedAt: c.resolvedAt,
    votesCount: upvotesCount - downvotesCount,
    upvotesCount,
    downvotesCount,
    userVote,
    hasVoted: Boolean(userVote),
    rating: c.rating,
  };
}

/**
 * Create a new complaint
 */
export async function createComplaint(
  input: CreateComplaintInput,
  studentProfile?: { name: string; studentId: string; roomNumber?: string; hostelName?: string }
) {
  ticketCounter++;
  const ticketNumber = `TKT-${ticketCounter}`;

  const newComp: MemoryComplaint = {
    id: `comp-${ticketCounter}`,
    ticketNumber,
    studentId: input.studentId,
    studentName: studentProfile?.name || 'Rahul Kumar',
    studentRegNo: studentProfile?.studentId || 'STU2024012',
    hostelId: input.hostelId || 'hostel-bha',
    hostelName: studentProfile?.hostelName || 'Boys Hostel A',
    roomId: input.roomId || 'room-101',
    roomNumber: studentProfile?.roomNumber || '101',
    category: input.category.toUpperCase().replace(/\s+/g, '_').replace('/', '_'),
    priority: input.priority.toUpperCase(),
    status: 'OPEN',
    title: input.title.trim(),
    description: input.description.trim(),
    imageUrl: input.imageUrl,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    votes: [{ userId: input.studentId, voteType: 'UPVOTE' }], // auto-supported by creator
  };

  memoryComplaints.unshift(newComp);
  return getComplaintById(newComp.id, input.studentId);
}

/**
 * Update complaint details, status, maintenance assignment
 */
export async function updateComplaint(
  id: string,
  input: UpdateComplaintInput,
  actor: { role: string; userId: string; name?: string }
) {
  const c = memoryComplaints.find((item) => item.id === id || item.ticketNumber === id);
  if (!c) return { error: 'Complaint not found.' };

  // Permission checks
  if (actor.role === 'STUDENT') {
    if (c.studentId !== actor.userId) {
      return { error: 'You are not authorized to modify another student\'s complaint.' };
    }
    // Student can only update title/desc when OPEN or close when RESOLVED
    if (input.status && input.status.toUpperCase() === 'CLOSED' && c.status === 'RESOLVED') {
      c.status = 'CLOSED';
    } else if (c.status === 'OPEN') {
      if (input.title) c.title = input.title;
      if (input.description) c.description = input.description;
    } else if (input.status && input.status.toUpperCase() !== c.status) {
      return { error: 'Students can only close resolved complaints or edit open tickets.' };
    }
  } else if (actor.role === 'MAINTENANCE') {
    // Maintenance staff can accept (IN_PROGRESS), resolve (RESOLVED), add notes
    if (input.status) {
      const targetStatus = input.status.toUpperCase().replace(/\s+/g, '_');
      if (targetStatus === 'IN_PROGRESS' || targetStatus === 'RESOLVED') {
        c.status = targetStatus;
        if (targetStatus === 'RESOLVED') {
          c.resolvedAt = new Date().toISOString();
        }
      }
    }
    if (input.resolutionNotes) {
      c.resolutionNotes = input.resolutionNotes;
    }
  } else if (actor.role === 'SUPER_ADMIN' || actor.role === 'WARDEN') {
    // Warden / Super Admin has full lifecycle control
    if (input.status) {
      c.status = input.status.toUpperCase().replace(/\s+/g, '_');
      if (c.status === 'RESOLVED' && !c.resolvedAt) {
        c.resolvedAt = new Date().toISOString();
      }
    }
    if (input.assignedToId) {
      c.assignedToId = input.assignedToId;
      c.assignedToName = input.assignedToId === 'demo-maintenance-01' ? 'Suresh Kumar (Electrician)' : 'Assigned Technician';
      if (c.status === 'OPEN' || c.status === 'UNDER_REVIEW') {
        c.status = 'ASSIGNED';
      }
    }
    if (input.resolutionNotes) {
      c.resolutionNotes = input.resolutionNotes;
    }
  } else {
    return { error: 'Your role is not authorized to update complaints.' };
  }

  c.updatedAt = new Date().toISOString();
  return { success: true, complaint: await getComplaintById(c.id) };
}

/**
 * Add or change a vote on a complaint (UPVOTE / DOWNVOTE)
 */
export async function voteComplaint(
  complaintId: string,
  userId: string,
  voteType: VoteType = 'UPVOTE'
) {
  const c = memoryComplaints.find((item) => item.id === complaintId || item.ticketNumber === complaintId);
  if (!c) return { error: 'Complaint not found.' };

  const existingVoteIndex = c.votes.findIndex((v) => v.userId === userId);

  if (existingVoteIndex >= 0) {
    const existing = c.votes[existingVoteIndex];
    if (existing.voteType === voteType) {
      // Duplicate identical vote
      return {
        error: `You have already ${voteType.toLowerCase()}d this complaint.`,
        alreadyVoted: true,
        userVote: existing.voteType,
        hasVoted: true,
      };
    }
    // Change vote (e.g. from UPVOTE to DOWNVOTE)
    c.votes[existingVoteIndex].voteType = voteType;
  } else {
    c.votes.push({ userId, voteType });
  }

  const upvotesCount = c.votes.filter((v) => v.voteType === 'UPVOTE').length;
  const downvotesCount = c.votes.filter((v) => v.voteType === 'DOWNVOTE').length;

  return {
    success: true,
    votesCount: upvotesCount - downvotesCount,
    upvotesCount,
    downvotesCount,
    userVote: voteType,
    hasVoted: true,
  };
}

/**
 * Remove a vote from a complaint
 */
export async function removeVoteComplaint(complaintId: string, userId: string) {
  const c = memoryComplaints.find((item) => item.id === complaintId || item.ticketNumber === complaintId);
  if (!c) return { error: 'Complaint not found.' };

  const existingVoteIndex = c.votes.findIndex((v) => v.userId === userId);
  if (existingVoteIndex === -1) {
    return { error: 'You have not voted on this complaint.' };
  }

  c.votes.splice(existingVoteIndex, 1);

  const upvotesCount = c.votes.filter((v) => v.voteType === 'UPVOTE').length;
  const downvotesCount = c.votes.filter((v) => v.voteType === 'DOWNVOTE').length;

  return {
    success: true,
    votesCount: upvotesCount - downvotesCount,
    upvotesCount,
    downvotesCount,
    userVote: null,
    hasVoted: false,
  };
}

/**
 * Rate a resolved complaint (1 to 5 stars + optional comment)
 */
export async function rateComplaint(
  complaintId: string,
  studentId: string,
  input: RateComplaintInput
) {
  const c = memoryComplaints.find((item) => item.id === complaintId || item.ticketNumber === complaintId);
  if (!c) return { error: 'Complaint not found.' };

  // Only the complaint owner can rate
  if (c.studentId !== studentId) {
    return { error: 'Only the student who submitted the complaint can rate its resolution.' };
  }

  // Must be resolved or closed
  if (c.status !== 'RESOLVED' && c.status !== 'CLOSED') {
    return { error: 'Resolution rating is only available after the complaint has been marked as Resolved.' };
  }

  // Check duplicate rating
  if (c.rating) {
    return { error: 'You have already submitted a rating for this resolution.' };
  }

  // Validate score bounds
  const score = Math.round(Number(input.score));
  if (isNaN(score) || score < 1 || score > 5) {
    return { error: 'Rating score must be an integer between 1 and 5 stars.' };
  }

  c.rating = {
    score,
    comment: input.comment?.trim(),
    resolutionStatus: input.resolutionStatus || 'FULLY_RESOLVED',
    createdAt: new Date().toISOString(),
  };

  return { success: true, rating: c.rating };
}
