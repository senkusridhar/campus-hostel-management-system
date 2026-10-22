export type StudentStatus = 'Active' | 'On Leave' | 'Suspended';

export interface Student {
  id: string;
  studentId: string; // STU2024012
  name: string;
  department: string;
  year: string;
  hostel: string;
  block: string;
  roomNo: string;
  bedNo: string;
  status: StudentStatus;
  phone: string;
  email: string;
  guardianName: string;
  guardianPhone: string;
  avatar?: string;
}

export interface Hostel {
  id: string;
  name: string;
  code: string;
  gender: 'Boys' | 'Girls' | 'Co-Ed' | string;
  address?: string;
  capacity: number;
  occupied: number;
  available: number;
  blocksCount: number;
  floorsCount?: number;
  roomsCount?: number;
  isActive?: boolean;
  wardenName?: string;
  wardenPhone?: string;
  wardenId?: string;
}

export interface Block {
  id: string;
  hostelId: string;
  hostelName: string;
  name: string;
  code?: string;
  genderCategory?: string;
  floorsCount: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds?: number;
  isActive?: boolean;
}

export interface Floor {
  id: string;
  blockId: string;
  blockName: string;
  hostelId?: string;
  hostelName: string;
  floorNumber: number;
  name?: string;
  roomCount: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds?: number;
  isActive?: boolean;
}

export type RoomStatus =
  | 'Vacant'
  | 'Partially Occupied'
  | 'Occupied'
  | 'Full'
  | 'Maintenance'
  | 'Reserved'
  | 'Blocked'
  | 'VACANT'
  | 'PARTIALLY_OCCUPIED'
  | 'OCCUPIED'
  | 'FULL'
  | 'MAINTENANCE'
  | 'RESERVED'
  | 'BLOCKED';

export type AssetCondition =
  | 'GOOD'
  | 'FAIR'
  | 'DAMAGED'
  | 'MISSING'
  | 'REPAIR_REQUIRED'
  | 'Good'
  | 'Fair'
  | 'Damaged'
  | 'Missing'
  | 'Repair Required';

export interface RoomAssetItem {
  id: string;
  roomId: string;
  assetType: string;
  quantity: number;
  condition: AssetCondition;
  serialNumber?: string;
  lastInspectedAt?: string;
  notes?: string;
}

export interface AssignedStudentInfo {
  id: string;
  studentId: string;
  name: string;
  department: string;
  branch?: string;
  academicYear?: string;
  gender?: string;
  bedNo: string;
  bedId?: string;
  allocationId?: string;
  allocatedAt?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  hostelId: string;
  hostelName: string;
  blockId?: string;
  block: string;
  floorId?: string;
  floor: number;
  floorName?: string;
  roomType: string;
  capacity: number;
  occupied: number;
  availableCapacity?: number;
  genderCategory?: string;
  status: RoomStatus;
  maintenanceReason?: string;
  assignedStudents: AssignedStudentInfo[];
  assets: string[];
  detailedAssets?: RoomAssetItem[];
}

export type RoomChangeStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled';

export interface RoomChangeRequestItem {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  department?: string;
  academicYear?: string;
  currentRoomId: string;
  currentRoomNumber: string;
  currentHostelName?: string;
  currentBlockName?: string;
  currentBedNumber?: string;
  preferredRoomId: string;
  preferredRoomNumber: string;
  preferredHostelName?: string;
  preferredBlockName?: string;
  reason: string;
  comment?: string;
  status: RoomChangeStatus;
  wardenRemarks?: string;
  reviewedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomAllocationHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  department?: string;
  gender?: string;
  roomId?: string;
  roomNumber: string;
  hostelName: string;
  blockName: string;
  floorNumber: number;
  bedNumber: string;
  allocatedAt: string;
  vacatedAt?: string;
  status: 'ACTIVE' | 'VACATED' | 'TRANSFERRED' | 'CANCELLED';
  reason?: string;
  allocatedByName?: string;
}

export type GatePassType = 'Day Pass' | 'Night Out' | 'Long Leave';
export type GatePassStatus = 'Pending' | 'Approved' | 'Rejected' | 'Active' | 'Expired' | 'Completed';

export interface GatePass {
  id: string;
  passNo: string;
  studentName: string;
  studentId: string;
  rollNo: string;
  roomNo: string;
  hostel: string;
  type: GatePassType;
  outTime: string;
  expectedInTime: string;
  actualInTime?: string;
  status: GatePassStatus;
  reason: string;
  requestedAt: string;
  approvedBy?: string;
}

export interface GateActivity {
  id: string;
  studentName: string;
  studentId: string;
  rollNo: string;
  hostel: string;
  roomNo: string;
  gate: string;
  type: 'Check-in' | 'Check-out';
  timestamp: string;
  status: 'Approved' | 'Verified' | 'Flagged';
}

export type ComplaintCategory =
  | 'Plumbing'
  | 'Electrical'
  | 'Furniture'
  | 'Internet'
  | 'Cleanliness'
  | 'Food / Mess'
  | 'Security'
  | 'Room'
  | 'Water'
  | 'Other';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent' | 'Critical';
export type ComplaintStatus =
  | 'Open'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'
  | 'Rejected';

export type VoteType = 'UPVOTE' | 'DOWNVOTE';

export interface ComplaintRatingInfo {
  score: number;
  comment?: string;
  resolutionStatus?: string;
  createdAt?: string;
}

export interface Complaint {
  id: string;
  ticketId: string;
  studentName: string;
  studentId: string;
  ownerStudentId?: string;
  room: string;
  hostel: string;
  block?: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  title: string;
  description: string;
  imageUrl?: string;
  assignedStaff?: string;
  assignedStaffId?: string;
  resolutionNotes?: string;
  sla?: string;
  createdAt: string;
  resolvedAt?: string;
  votesCount?: number;
  upvotesCount?: number;
  downvotesCount?: number;
  userVote?: VoteType | null;
  hasVoted?: boolean;
  rating?: ComplaintRatingInfo;
}

export interface FeedbackRatingItem {
  category: string;
  criterion: string;
  rating: number;
}

export interface MonthlyFeedbackRecord {
  id: string;
  studentId: string;
  studentName?: string;
  hostelId?: string;
  hostelName?: string;
  month: number;
  year: number;
  generalComment?: string;
  isAnonymous: boolean;
  createdAt: string;
  ratings: FeedbackRatingItem[];
}

export interface FeedbackAnalyticsData {
  month: number;
  year: number;
  totalResponses: number;
  totalSubmissions?: number;
  categoryAverages: Record<string, number>;
  overallAverage: number;
  averageOverall?: number;
  ratingDistribution: Record<number, number>;
  staffAverages: Record<string, number>;
  complaintMetrics?: {
    averageRating: number;
    totalRatings: number;
    totalUpvotes: number;
    totalDownvotes: number;
    totalComplaints: number;
  };
  recentComments: {
    id: string;
    comment: string;
    isAnonymous: boolean;
    studentName?: string;
    createdAt: string;
    overallScore: number;
  }[];
}

export type FeeStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partially Paid';

export interface FeeRecord {
  id: string;
  receiptNo: string;
  studentName: string;
  studentId: string;
  hostel: string;
  feeType: 'Hostel Fee' | 'Mess Fee' | 'Maintenance Deposit' | 'Late Fine' | 'Damage Fine' | string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: 'UPI' | 'Net Banking' | 'Credit/Debit Card' | 'Challan' | string;
  status: FeeStatus;
  invoiceNumber?: string;
  paidAmount?: number;
  balanceDue?: number;
}

export interface FeeItem {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentDbId?: string;
  studentName: string;
  studentRegNo: string;
  department?: string;
  hostel: string;
  hostelId?: string;
  roomNo?: string;
  feeType: 'Hostel Fee' | 'Mess Fee' | 'Security Deposit' | 'Late Fine' | 'Damage Fine' | 'Other';
  description?: string;
  academicTerm?: string;
  amount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  issueDate: string;
  status: FeeStatus;
  createdAt: string;
  paymentsCount?: number;
}

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  feeId: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  hostel: string;
  feeType: string;
  amount: number;
  paymentMethod: 'UPI' | 'Net Banking' | 'Card' | 'Challan' | 'Cash';
  transactionReference: string;
  paidAt: string;
  verifiedById?: string;
  verifiedByName?: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'FAILED';
  notes?: string;
}

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  feeId: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  department: string;
  hostel: string;
  roomNo: string;
  feeType: string;
  description: string;
  academicTerm: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: FeeStatus;
  payments: Array<{
    receiptNumber: string;
    amount: number;
    paymentMethod: string;
    paidAt: string;
    transactionReference?: string;
  }>;
}

export type FineStatusType = 'PENDING' | 'PAID' | 'WAIVED' | 'OVERDUE' | 'Pending' | 'Paid' | 'Waived' | 'Overdue';

export interface FineRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  hostel: string;
  roomNo: string;
  category: 'Discipline' | 'Property Damage' | 'Curfew Violation' | 'Mess Violation' | 'Noise Complaint' | 'Other';
  reason: string;
  amount: number;
  status: FineStatusType;
  issuedById: string;
  issuedByName: string;
  issuedByRole: string;
  issuedAt: string;
  paidAt?: string | null;
  feeId?: string | null;
  receiptNumber?: string | null;
  waiveReason?: string | null;
}

export interface ReceiptRecord {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  feeId: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  department: string;
  hostel: string;
  roomNo: string;
  amount: number;
  amountInWords: string;
  feeType: string;
  paymentMethod: string;
  transactionReference: string;
  paidAt: string;
  verifiedBy: string;
  status: 'VERIFIED';
  isPersisted?: boolean;
  storage?: string;
}

export interface FinanceOverviewStats {
  totalCollections: number;
  pendingDues: number;
  overdueAmount: number;
  todayCollections: number;
  totalTransactions: number;
  pendingInvoicesCount: number;
  activeFinesCount: number;
  targetCollectionRate: number;
  collectionsByFeeType: Record<string, number>;
  monthlyTrends: Array<{ month: string; collected: number; target: number }>;
}

export interface MessMenuItem {
  name: string;
  category: string;
  description: string;
  isVeg: boolean;
}

export interface MessMenu {
  day: string;
  date: string;
  breakfast: MessMenuItem[];
  lunch: MessMenuItem[];
  snacks: MessMenuItem[];
  dinner: MessMenuItem[];
}

export interface MealRebate {
  id: string;
  studentName: string;
  studentId: string;
  hostel: string;
  roomNo: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  amount: number;
  status: 'Applied' | 'Approved' | 'Processed' | 'Rejected';
  reason: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Outside after curfew' | 'Not marked' | 'On leave';

export interface AttendanceRecord {
  id: string;
  studentName: string;
  studentId: string;
  hostel: string;
  room: string;
  status: AttendanceStatus;
  lastSeen: string;
  remarks?: string;
  date: string;
}

export interface Notice {
  id: string;
  title: string;
  category: 'General' | 'Mess' | 'Maintenance' | 'Discipline' | 'Fees';
  publishedDate: string;
  expiresDate: string;
  audience: 'All Hostels' | 'Boys Hostels' | 'Girls Hostels' | 'Block A Students';
  status: 'Active' | 'Archived' | 'Important';
  content: string;
  publisher: string;
}

export interface Report {
  id: string;
  title: string;
  category: 'Occupancy' | 'Student' | 'Finance' | 'Maintenance' | 'Security' | 'Attendance';
  description: string;
  lastGenerated: string;
  format: 'PDF / CSV';
  recordCount: number;
}

// ==========================================
// PHASE 6: WORKFLOW & OPERATIONAL TYPES
// ==========================================

export interface UserManagementItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  assignedHostelsCount?: number;
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  usersByRole: Record<string, number>;
  totalStudents: number;
  totalHostels: number;
  totalCapacity: number;
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  occupancyRate: number;
  openComplaints: number;
  pendingComplaints: number;
  criticalComplaints: number;
  activeGatePasses: number;
  pendingGatePasses: number;
  pendingFeesCount: number;
  pendingFeesAmount: number;
  totalCollectedAmount: number;
  monthlySatisfactionAvg: number;
  monthlyFeedbackCount: number;
  monthlyFeedbackSummary: {
    averageRating: number;
    totalResponses: number;
    foodRating: number;
    staffRating: number;
    cleanlinessRating: number;
    maintenanceRating: number;
  };
  complaintRatingVotingSummary: {
    totalVotes: number;
    upvotes: number;
    downvotes: number;
    resolvedWithRatingCount: number;
    averageResolutionRating: number;
  };
  pendingRoomChanges: number;
  recentNotices: Array<{
    id: string;
    title: string;
    category: string;
    audience: string;
    publishedDate: string;
    status: string;
    content: string;
    publisher?: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    actor: string;
    role: string;
    timestamp: string;
    details: string;
  }>;
}

export interface ParentWardOverview {
  student: {
    id: string;
    studentId: string;
    name: string;
    email: string;
    phone?: string;
    department: string;
    branch: string;
    academicYear: string;
    gender: string;
    status: string;
  };
  roomAllocation: {
    hasActiveAllocation: boolean;
    hostelName?: string;
    blockName?: string;
    floorNumber?: number;
    roomNumber?: string;
    bedNumber?: string;
    capacity?: number;
    occupied?: number;
    allocatedAt?: string;
    roommates?: Array<{
      name: string;
      studentId: string;
      department: string;
      bedNumber: string;
    }>;
  };
  curfewAttendance: {
    status: string;
    lastVerified: string;
    remarks?: string;
  };
  gatePasses: Array<{
    id: string;
    passNumber: string;
    type: string;
    departureTime: string;
    expectedReturnTime: string;
    status: string;
    reason: string;
  }>;
  fees: {
    status: string;
    totalDue: number;
    paidAmount: number;
    pendingAmount: number;
    lastPaymentDate?: string;
  };
  complaints: Array<{
    id: string;
    ticketNumber: string;
    title: string;
    category: string;
    status: string;
    createdAt: string;
  }>;
  notices: Notice[];
}

export interface StudentSelfServiceOverview {
  profile: {
    id: string;
    studentId: string;
    name: string;
    email: string;
    department: string;
    branch: string;
    academicYear: string;
    gender: string;
  };
  room: {
    hasActiveAllocation: boolean;
    hostelName?: string;
    blockName?: string;
    floorNumber?: number;
    roomNumber?: string;
    bedNumber?: string;
    capacity?: number;
    occupied?: number;
    allocatedAt?: string;
    roommates: Array<{
      name: string;
      studentId: string;
      department: string;
      bedNumber: string;
    }>;
  };
  pendingRoomChange?: {
    id: string;
    preferredRoomNumber: string;
    preferredHostelName?: string;
    reason: string;
    status: string;
    createdAt: string;
  };
  complaintsSummary: {
    myComplaintsCount: number;
    openCount: number;
    resolvedCount: number;
    pendingRatingCount: number;
  };
  monthlyFeedbackStatus: {
    submittedCurrentMonth: boolean;
    currentMonth: number;
    currentYear: number;
    lastSubmittedAt?: string;
    rating?: number;
  };
  curfewAttendance: {
    status: string;
    lastSeen: string;
  };
  gatePassSummary: {
    activePassesCount: number;
    recentStatus: string;
  };
  feesSummary: {
    status: string;
    dueAmount: number;
  };
}

