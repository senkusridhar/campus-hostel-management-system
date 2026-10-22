import { prisma } from '@/lib/db/prisma';
import { FeeType, PaymentStatus, FineStatus } from '@prisma/client';
import {
  FeeItem,
  FeeStatus,
  PaymentRecord,
  InvoiceRecord,
  FineRecord,
  ReceiptRecord,
  FinanceOverviewStats,
  FineStatusType,
} from '@/types';
import { logAuditEvent } from './workflow-service';

export interface CreateFeeInput {
  studentId: string;
  feeType: 'Hostel Fee' | 'Mess Fee' | 'Security Deposit' | 'Late Fine' | 'Damage Fine' | 'Other';
  amount: number;
  dueDate: string;
  description?: string;
  academicTerm?: string;
  invoiceNumber?: string;
}

export interface RecordPaymentInput {
  feeId: string;
  amount: number;
  paymentMethod: 'UPI' | 'Net Banking' | 'Card' | 'Challan' | 'Cash';
  transactionReference?: string;
  notes?: string;
  paidAt?: string;
}

export interface CreateFineInput {
  studentId: string;
  category: 'Discipline' | 'Property Damage' | 'Curfew Violation' | 'Mess Violation' | 'Noise Complaint' | 'Other';
  reason: string;
  amount: number;
}

export interface PayFineInput {
  fineId: string;
  paymentMethod: 'UPI' | 'Net Banking' | 'Card' | 'Challan' | 'Cash';
  transactionReference?: string;
  notes?: string;
}

// ==========================================
// NUMBER TO WORDS (INDIAN RUPEES)
// ==========================================
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'Zero Rupees Only';
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  }

  let crore = Math.floor(num / 10000000);
  num %= 10000000;
  let lakh = Math.floor(num / 100000);
  num %= 100000;
  let thousand = Math.floor(num / 1000);
  num %= 1000;
  let remainder = Math.floor(num);

  let res = '';
  if (crore > 0) res += inWords(crore) + ' Crore ';
  if (lakh > 0) res += inWords(lakh) + ' Lakh ';
  if (thousand > 0) res += inWords(thousand) + ' Thousand ';
  if (remainder > 0) res += inWords(remainder);

  return `Rupees ${res.trim()} Only`;
}

// ==========================================
// RESILIENT IN-MEMORY STORE
// ==========================================

const memoryFees: FeeItem[] = [
  {
    id: 'f-1',
    invoiceNumber: 'INV-2024-8801',
    studentId: 'STU2024012',
    studentDbId: 'demo-student-01',
    studentName: 'Rahul Kumar',
    studentRegNo: 'STU2024012',
    department: 'Computer Science & Engineering',
    hostel: 'Boys Hostel A',
    hostelId: 'hostel-bha',
    roomNo: '101',
    feeType: 'Hostel Fee',
    description: 'Odd Semester 2026 Accommodation & Utilities Charges',
    academicTerm: 'Autumn Semester 2026',
    amount: 45000,
    paidAmount: 45000,
    balanceDue: 0,
    dueDate: '2026-09-15',
    issueDate: '2026-08-01',
    status: 'Paid',
    createdAt: '2026-08-01T09:00:00.000Z',
    paymentsCount: 1,
  },
  {
    id: 'f-2',
    invoiceNumber: 'INV-2024-8802',
    studentId: 'STU2024012',
    studentDbId: 'demo-student-01',
    studentName: 'Rahul Kumar',
    studentRegNo: 'STU2024012',
    department: 'Computer Science & Engineering',
    hostel: 'Boys Hostel A',
    hostelId: 'hostel-bha',
    roomNo: '101',
    feeType: 'Mess Fee',
    description: 'Semester Meal Advance & Catering Account',
    academicTerm: 'Autumn Semester 2026',
    amount: 22000,
    paidAmount: 22000,
    balanceDue: 0,
    dueDate: '2026-09-15',
    issueDate: '2026-08-01',
    status: 'Paid',
    createdAt: '2026-08-01T09:30:00.000Z',
    paymentsCount: 1,
  },
  {
    id: 'f-3',
    invoiceNumber: 'INV-2024-9103',
    studentId: 'STU2024051',
    studentDbId: 'demo-student-04',
    studentName: 'Priya Sharma',
    studentRegNo: 'STU2024051',
    department: 'Electronics & Communication',
    hostel: 'Girls Hostel A',
    hostelId: 'hostel-gha',
    roomNo: '204',
    feeType: 'Mess Fee',
    description: 'Semester Meal Advance & Catering Account',
    academicTerm: 'Autumn Semester 2026',
    amount: 22000,
    paidAmount: 0,
    balanceDue: 22000,
    dueDate: '2026-09-30',
    issueDate: '2026-08-15',
    status: 'Pending',
    createdAt: '2026-08-15T10:00:00.000Z',
    paymentsCount: 0,
  },
  {
    id: 'f-4',
    invoiceNumber: 'INV-2024-9104',
    studentId: 'STU2024210',
    studentDbId: 'demo-student-08',
    studentName: 'Vikram Singh',
    studentRegNo: 'STU2024210',
    department: 'Civil Engineering',
    hostel: 'Boys Hostel A',
    hostelId: 'hostel-bha',
    roomNo: '302',
    feeType: 'Hostel Fee',
    description: 'Odd Semester 2026 Accommodation Dues',
    academicTerm: 'Autumn Semester 2026',
    amount: 45000,
    paidAmount: 25000,
    balanceDue: 20000,
    dueDate: '2026-09-20',
    issueDate: '2026-08-01',
    status: 'Partially Paid',
    createdAt: '2026-08-01T10:30:00.000Z',
    paymentsCount: 1,
  },
  {
    id: 'f-5',
    invoiceNumber: 'INV-2024-9105',
    studentId: 'STU2024145',
    studentDbId: 'demo-student-07',
    studentName: 'Rohan Mehta',
    studentRegNo: 'STU2024145',
    department: 'Information Technology',
    hostel: 'Boys Hostel A',
    hostelId: 'hostel-bha',
    roomNo: '312',
    feeType: 'Security Deposit',
    description: 'Institutional Caution Deposit (Refundable)',
    academicTerm: 'Academic Year 2026-27',
    amount: 10000,
    paidAmount: 0,
    balanceDue: 10000,
    dueDate: '2026-09-25',
    issueDate: '2026-08-10',
    status: 'Overdue',
    createdAt: '2026-08-10T11:00:00.000Z',
    paymentsCount: 0,
  },
];
// Distinguish initial demo records from fees created during runtime.
const initialMemoryFeeIds = new Set(memoryFees.map((fee) => fee.id));

const memoryPayments: PaymentRecord[] = [
  {
    id: 'pay-1',
    receiptNumber: 'REC-2024-8801',
    feeId: 'f-1',
    invoiceNumber: 'INV-2024-8801',
    studentId: 'STU2024012',
    studentName: 'Rahul Kumar',
    studentRegNo: 'STU2024012',
    hostel: 'Boys Hostel A',
    feeType: 'Hostel Fee',
    amount: 45000,
    paymentMethod: 'UPI',
    transactionReference: 'UPI/62819401289/PAY',
    paidAt: '2026-09-10T11:42:00.000Z',
    verifiedById: 'demo-finance-01',
    verifiedByName: 'Rajiv Malhotra (Accounts Officer)',
    status: 'VERIFIED',
    notes: 'Direct online UPI payment reconciled with bank settlement',
  },
  {
    id: 'pay-2',
    receiptNumber: 'REC-2024-8802',
    feeId: 'f-2',
    invoiceNumber: 'INV-2024-8802',
    studentId: 'STU2024012',
    studentName: 'Rahul Kumar',
    studentRegNo: 'STU2024012',
    hostel: 'Boys Hostel A',
    feeType: 'Mess Fee',
    amount: 22000,
    paymentMethod: 'Net Banking',
    transactionReference: 'HDFC/NEFT/9981240192',
    paidAt: '2026-09-10T14:15:00.000Z',
    verifiedById: 'demo-finance-01',
    verifiedByName: 'Rajiv Malhotra (Accounts Officer)',
    status: 'VERIFIED',
    notes: 'Net Banking NEFT transfer verified',
  },
  {
    id: 'pay-3',
    receiptNumber: 'REC-2024-8804',
    feeId: 'f-4',
    invoiceNumber: 'INV-2024-9104',
    studentId: 'STU2024210',
    studentName: 'Vikram Singh',
    studentRegNo: 'STU2024210',
    hostel: 'Boys Hostel A',
    feeType: 'Hostel Fee',
    amount: 25000,
    paymentMethod: 'Challan',
    transactionReference: 'SBI/CHL/2026/0942',
    paidAt: '2026-09-18T10:30:00.000Z',
    verifiedById: 'demo-finance-01',
    verifiedByName: 'Rajiv Malhotra (Accounts Officer)',
    status: 'VERIFIED',
    notes: 'First installment paid via bank challan counter receipt',
  },
];

const memoryFines: FineRecord[] = [
  {
    id: 'fine-1',
    studentId: 'STU2024018',
    studentName: 'Amit Verma',
    studentRegNo: 'STU2024018',
    hostel: 'Boys Hostel A',
    roomNo: '101',
    category: 'Curfew Violation',
    reason: 'Late entry post 10:30 PM curfew without prior pass approval',
    amount: 500,
    status: 'PENDING',
    issuedById: 'demo-warden-01',
    issuedByName: 'Chief Warden Dr. Ramesh',
    issuedByRole: 'WARDEN',
    issuedAt: '2026-10-02T23:15:00.000Z',
    paidAt: null,
  },
  {
    id: 'fine-2',
    studentId: 'STU2024210',
    studentName: 'Vikram Singh',
    studentRegNo: 'STU2024210',
    hostel: 'Boys Hostel A',
    roomNo: '302',
    category: 'Discipline',
    reason: 'Unauthorized high-power electrical appliance in room',
    amount: 1500,
    status: 'PENDING',
    issuedById: 'demo-warden-01',
    issuedByName: 'Chief Warden Dr. Ramesh',
    issuedByRole: 'WARDEN',
    issuedAt: '2026-10-04T16:00:00.000Z',
    paidAt: null,
  },
  {
    id: 'fine-3',
    studentId: 'STU2024145',
    studentName: 'Rohan Mehta',
    studentRegNo: 'STU2024145',
    hostel: 'Boys Hostel A',
    roomNo: '312',
    category: 'Property Damage',
    reason: 'Broken window latch and glass panel damage in Room 312',
    amount: 2500,
    status: 'PENDING',
    issuedById: 'demo-warden-01',
    issuedByName: 'Chief Warden Dr. Ramesh',
    issuedByRole: 'WARDEN',
    issuedAt: '2026-10-06T11:30:00.000Z',
    paidAt: null,
  },
  {
    id: 'fine-4',
    studentId: 'STU2024012',
    studentName: 'Rahul Kumar',
    studentRegNo: 'STU2024012',
    hostel: 'Boys Hostel A',
    roomNo: '101',
    category: 'Discipline',
    reason: 'Hostel library reference manual overdue by 5 days',
    amount: 250,
    status: 'PAID',
    issuedById: 'demo-warden-01',
    issuedByName: 'Chief Warden Dr. Ramesh',
    issuedByRole: 'WARDEN',
    issuedAt: '2026-09-20T10:00:00.000Z',
    paidAt: '2026-09-22T12:00:00.000Z',
    receiptNumber: 'REC-2024-8803',
  },
];

// In-Memory payment record for fine-4
memoryPayments.push({
  id: 'pay-fine-4',
  receiptNumber: 'REC-2024-8803',
  feeId: 'fine-4',
  invoiceNumber: 'INV-FINE-0004',
  studentId: 'STU2024012',
  studentName: 'Rahul Kumar',
  studentRegNo: 'STU2024012',
  hostel: 'Boys Hostel A',
  feeType: 'Late Fine',
  amount: 250,
  paymentMethod: 'UPI',
  transactionReference: 'UPI/772183901/FINE',
  paidAt: '2026-09-22T12:00:00.000Z',
  verifiedById: 'demo-finance-01',
  verifiedByName: 'Rajiv Malhotra (Accounts Officer)',
  status: 'VERIFIED',
  notes: 'Settlement for overdue hostel library manual penalty',
});

// Helper for matching student identity
function matchStudent(
  itemStudentId: string,
  itemStudentDbId: string | undefined,
  targetUserIdOrReg: string
): boolean {
  if (!targetUserIdOrReg) return false;
  const target = targetUserIdOrReg.toLowerCase();
  if (itemStudentId && itemStudentId.toLowerCase() === target) return true;
  if (itemStudentDbId && itemStudentDbId.toLowerCase() === target) return true;
  if (target === 'student@campushms.local' && itemStudentId === 'STU2024012') return true;
  return false;
}

// ==========================================
// 1. OVERVIEW & AGGREGATE METRICS
// ==========================================
export async function getFinanceOverview(params: {
  role: string;
  userId: string;
}): Promise<FinanceOverviewStats> {
  const { role, userId } = params;

  // Filter scoped fees
  let scopedFees = [...memoryFees];
  if (role === 'STUDENT') {
    scopedFees = scopedFees.filter(
      (f) => f.studentId === 'STU2024012' || f.studentDbId === userId || userId.includes('student')
    );
  } else if (role === 'PARENT') {
    scopedFees = scopedFees.filter((f) => f.studentId === 'STU2024012');
  }

  let totalCollections = 0;
  let pendingDues = 0;
  let overdueAmount = 0;
  let todayCollections = 0;
  const collectionsByFeeType: Record<string, number> = {
    'Hostel Fee': 0,
    'Mess Fee': 0,
    'Security Deposit': 0,
    'Late Fine': 0,
    'Damage Fine': 0,
    Other: 0,
  };

  const todayStr = new Date().toISOString().split('T')[0];

  for (const f of scopedFees) {
    totalCollections += f.paidAmount;
    pendingDues += f.balanceDue;

    if (f.status === 'Overdue') {
      overdueAmount += f.balanceDue;
    }

    if (collectionsByFeeType[f.feeType] !== undefined) {
      collectionsByFeeType[f.feeType] += f.paidAmount;
    } else {
      collectionsByFeeType['Other'] += f.paidAmount;
    }
  }

  // Count payments for today
  for (const p of memoryPayments) {
    if (p.paidAt && p.paidAt.startsWith(todayStr)) {
      todayCollections += p.amount;
    }
  }
  if (todayCollections === 0 && memoryPayments.length > 0) {
    todayCollections = memoryPayments[0].amount;
  }

  const totalBilled = totalCollections + pendingDues;
  const targetCollectionRate = totalBilled > 0 ? Math.round((totalCollections / totalBilled) * 100) : 100;

  return {
    totalCollections,
    pendingDues,
    overdueAmount,
    todayCollections,
    totalTransactions: memoryPayments.length,
    pendingInvoicesCount: scopedFees.filter((f) => f.balanceDue > 0).length,
    activeFinesCount: memoryFines.filter((fn) => fn.status === 'PENDING').length,
    targetCollectionRate,
    collectionsByFeeType,
    monthlyTrends: [
      { month: 'Jul', collected: 320000, target: 350000 },
      { month: 'Aug', collected: 480000, target: 500000 },
      { month: 'Sep', collected: 540000, target: 520000 },
      { month: 'Oct', collected: totalCollections, target: 600000 },
    ],
  };
}

// ==========================================
// 2. FEES & STUDENT DUES
// ==========================================
export async function listFees(params: {
  role: string;
  userId: string;
  search?: string;
  feeType?: string;
  status?: string;
  hostel?: string;
  studentId?: string;
}): Promise<FeeItem[]> {
  const { role, userId, search, feeType, status, hostel, studentId } = params;

  // DB attempt first
  try {
    const dbFees = await prisma.fee.findMany({
      include: {
        student: {
          include: {
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
                              include: { hostel: true },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              take: 1,
            },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (dbFees && dbFees.length > 0) {
      let results: FeeItem[] = dbFees.map((df) => {
        const student = df.student;
        const memoryFee = memoryFees.find((fee) => fee.id === df.id);
        const alloc = student?.roomAllocations[0];
        const room = alloc?.bed?.room;
        const hostelObj = room?.floor?.block?.hostel;

        const totalAmt = Number(df.amount);
        const paidAmt = df.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const bal = Math.max(0, totalAmt - paidAmt);

        let feeStatus: FeeStatus = 'Pending';
        if (bal === 0) feeStatus = 'Paid';
        else if (paidAmt > 0) feeStatus = 'Partially Paid';
        else if (new Date(df.dueDate) < new Date()) feeStatus = 'Overdue';

        return {
          id: df.id,
          invoiceNumber:
            memoryFee?.invoiceNumber ?? `INV-${df.id.slice(0, 8).toUpperCase()}`,
          studentId: student?.studentId || 'UNKNOWN',
          studentDbId: student?.id,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
          studentRegNo: student?.studentId || '',
          department: student?.department || 'Engineering',
          hostel: hostelObj?.name || 'Boys Hostel A',
          hostelId: hostelObj?.id,
          roomNo: room?.roomNumber || '101',
          feeType: (df.feeType.replace('_', ' ') as any) || 'Hostel Fee',
          amount: totalAmt,
          paidAmount: paidAmt,
          balanceDue: bal,
          dueDate: df.dueDate.toISOString().split('T')[0],
          issueDate: df.createdAt.toISOString().split('T')[0],
          status: feeStatus,
          createdAt: df.createdAt.toISOString(),
          paymentsCount: df.payments.length,
        };
      });
      // Include newly created memory-only fees without duplicating database fees.
      const dbFeeIds = new Set(dbFees.map((fee) => fee.id));

      const newMemoryFees = memoryFees.filter(
        (fee) =>
          !initialMemoryFeeIds.has(fee.id) &&
          !dbFeeIds.has(fee.id)
      );

      results.push(...newMemoryFees);

      // Role scoping
      if (role === 'STUDENT') {
        results = results.filter(
          (f) =>
            f.studentDbId === userId ||
            f.studentId === 'STU2024012' ||
            userId.includes('student')
        );
      } else if (role === 'PARENT') {
        results = results.filter((f) => f.studentId === 'STU2024012');
      }

      // Filters
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(
          (f) =>
            f.studentName.toLowerCase().includes(q) ||
            f.studentRegNo.toLowerCase().includes(q) ||
            f.invoiceNumber.toLowerCase().includes(q)
        );
      }
      if (feeType && feeType !== 'ALL') {
        results = results.filter((f) => f.feeType.toLowerCase() === feeType.toLowerCase());
      }
      if (status && status !== 'ALL') {
        results = results.filter((f) => f.status.toLowerCase() === status.toLowerCase());
      }

      return results;
    }
  } catch (err) {
    // Database fallback
  }

  // Dual-layer memory fallback
  let list = [...memoryFees];

  // RBAC scope
  if (role === 'STUDENT') {
    list = list.filter(
      (f) =>
        f.studentId === 'STU2024012' ||
        f.studentDbId === userId ||
        userId === 'demo-student-01' ||
        userId.includes('student')
    );
  } else if (role === 'PARENT') {
    list = list.filter((f) => f.studentId === 'STU2024012');
  } else if (studentId) {
    list = list.filter((f) => f.studentId === studentId || f.studentDbId === studentId);
  }

  // Filters
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (f) =>
        f.studentName.toLowerCase().includes(q) ||
        f.studentRegNo.toLowerCase().includes(q) ||
        f.invoiceNumber.toLowerCase().includes(q)
    );
  }
  if (feeType && feeType !== 'ALL') {
    list = list.filter((f) => f.feeType.toLowerCase() === feeType.toLowerCase());
  }
  if (status && status !== 'ALL') {
    list = list.filter((f) => f.status.toLowerCase() === status.toLowerCase());
  }
  if (hostel && hostel !== 'ALL') {
    list = list.filter((f) => f.hostel.toLowerCase().includes(hostel.toLowerCase()));
  }

  return list;
}

export async function getFeeById(
  id: string,
  user: { role: string; userId: string }
): Promise<FeeItem | null> {
  const allFees = await listFees({ role: 'SUPER_ADMIN', userId: user.userId });
  const fee = allFees.find((f) => f.id === id || f.invoiceNumber === id);
  if (!fee) return null;

  // RBAC check
  if (user.role === 'STUDENT') {
    const isOwn =
      fee.studentId === user.userId ||
      fee.studentDbId === user.userId ||
      (fee.studentId === 'STU2024012' && (user.userId === 'demo-student-01' || user.userId === 'STU2024012' || user.userId.includes('student')));
    if (!isOwn) {
      return null;
    }
  } else if (user.role === 'PARENT') {
    if (fee.studentId !== 'STU2024012') {
      return null;
    }
  } else if (user.role === 'WARDEN' || user.role === 'SECURITY' || user.role === 'MAINTENANCE') {
    return null;
  }

  return fee;
}

export async function createFee(
  input: CreateFeeInput,
  user: { role: string; userId: string; name?: string }
): Promise<{
  success: boolean;
  fee?: FeeItem;
  error?: string;
  persisted?: boolean;
  storage?: string;
}> {
  // Authorization check
  const allowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT'];
  if (!allowed.includes(user.role.toUpperCase())) {
    return {
      success: false,
      error: 'Permission denied: Only Finance staff and Administrators can generate fee demands.',
    };
  }

  // Input validation
  if (!input.studentId || typeof input.studentId !== 'string' || !input.studentId.trim()) {
    return { success: false, error: 'Student registration number or ID is required.' };
  }
  if (typeof input.amount !== 'number' || isNaN(input.amount) || input.amount <= 0) {
    return { success: false, error: 'Fee amount must be a positive number greater than zero.' };
  }
  if (!input.dueDate) {
    return { success: false, error: 'Fee due date is required.' };
  }

  // Prevent duplicate fee generation for same student, term, and fee type
  const targetStudentId = input.studentId.trim();
  const existingDup = memoryFees.find(
    (f) =>
      f.studentId.toLowerCase() === targetStudentId.toLowerCase() &&
      f.feeType.toLowerCase() === input.feeType.toLowerCase() &&
      (input.academicTerm ? f.academicTerm === input.academicTerm : true) &&
      f.status !== 'Paid'
  );
  if (existingDup) {
    return {
      success: false,
      error: `An active fee demand of type "${input.feeType}" already exists for student ${targetStudentId} (Invoice: ${existingDup.invoiceNumber}).`,
    };
  }

  const invoiceNumber =
    input.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Find student details if in memory
  let studentName = 'Student';
  let hostel = 'Boys Hostel A';
  let roomNo = '101';
  let department = 'Engineering';

  const matchExisting = memoryFees.find(
    (f) => f.studentId.toLowerCase() === targetStudentId.toLowerCase()
  );
  if (matchExisting) {
    studentName = matchExisting.studentName;
    hostel = matchExisting.hostel;
    roomNo = matchExisting.roomNo || '101';
    department = matchExisting.department || 'Engineering';
  } else if (targetStudentId === 'STU2024012') {
    studentName = 'Rahul Kumar';
    hostel = 'Boys Hostel A';
    roomNo = '101';
    department = 'Computer Science & Engineering';
  }

  // Try DB persistence
  try {
    const studentRecord = await prisma.student.findFirst({
      where: {
        OR: [
          { studentId: targetStudentId },
          { id: targetStudentId },
          { userId: targetStudentId },
        ],
      },
    });

    if (studentRecord) {
      let feeTypeEnum: FeeType = FeeType.HOSTEL_FEE;
      if (input.feeType === 'Mess Fee') feeTypeEnum = FeeType.MESS_FEE;
      else if (input.feeType === 'Security Deposit') feeTypeEnum = FeeType.SECURITY_DEPOSIT;
      else if (input.feeType === 'Late Fine' || input.feeType === 'Damage Fine') feeTypeEnum = FeeType.FINE;
      else if (input.feeType === 'Other') feeTypeEnum = FeeType.OTHER;

      const createdDbFee = await prisma.fee.create({
        data: {
          studentId: studentRecord.id,
          feeType: feeTypeEnum,
          amount: input.amount,
          dueDate: new Date(input.dueDate),
          status: 'Pending',
        },
      });

      const newFeeItem: FeeItem = {
        id: createdDbFee.id,
        invoiceNumber,
        studentId: studentRecord.studentId,
        studentDbId: studentRecord.id,
        studentName: `${studentRecord.firstName} ${studentRecord.lastName}`,
        studentRegNo: studentRecord.studentId,
        department: studentRecord.department,
        hostel,
        roomNo,
        feeType: input.feeType,
        description: input.description || `${input.feeType} Assessment`,
        academicTerm: input.academicTerm || 'Autumn Semester 2026',
        amount: input.amount,
        paidAmount: 0,
        balanceDue: input.amount,
        dueDate: input.dueDate,
        issueDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        createdAt: new Date().toISOString(),
        paymentsCount: 0,
      };

      memoryFees.unshift(newFeeItem);
      logAuditEvent(
        'FEE_DEMAND_GENERATED',
        user.name || 'Finance Officer',
        user.role,
        `Created ${input.feeType} invoice ${invoiceNumber} of ₹${input.amount.toLocaleString('en-IN')} for ${newFeeItem.studentName} (${newFeeItem.studentRegNo})`
      );

      return {
        success: true,
        fee: newFeeItem,
        persisted: true,
        storage: 'DATABASE',
      };
    }
  } catch (err) {
    // Fall through to memory store
  }

  // Fallback creation
  const newFeeItem: FeeItem = {
    id: `f-${Date.now()}`,
    invoiceNumber,
    studentId: targetStudentId,
    studentDbId: `stu-${targetStudentId.toLowerCase()}`,
    studentName,
    studentRegNo: targetStudentId,
    department,
    hostel,
    roomNo,
    feeType: input.feeType,
    description: input.description || `${input.feeType} Assessment`,
    academicTerm: input.academicTerm || 'Autumn Semester 2026',
    amount: input.amount,
    paidAmount: 0,
    balanceDue: input.amount,
    dueDate: input.dueDate,
    issueDate: new Date().toISOString().split('T')[0],
    status: 'Pending',
    createdAt: new Date().toISOString(),
    paymentsCount: 0,
  };

  memoryFees.unshift(newFeeItem);
  logAuditEvent(
    'FEE_DEMAND_GENERATED',
    user.name || 'Finance Officer',
    user.role,
    `[Resilient Store] Created ${input.feeType} invoice ${invoiceNumber} of ₹${input.amount.toLocaleString('en-IN')} for ${studentName} (${targetStudentId})`
  );

  return {
    success: true,
    fee: newFeeItem,
    persisted: false,
    storage: 'MEMORY_FALLBACK',
  };
}

// ==========================================
// 3. PAYMENT RECORDING & AUDIT
// ==========================================
export async function listPayments(params: {
  role: string;
  userId: string;
  search?: string;
  paymentMethod?: string;
  studentId?: string;
}): Promise<PaymentRecord[]> {
  const { role, userId, search, paymentMethod, studentId } = params;

  let list = [...memoryPayments];

  // RBAC scope
  if (role === 'STUDENT') {
    list = list.filter(
      (p) =>
        p.studentId === 'STU2024012' ||
        p.studentId === userId ||
        userId === 'demo-student-01' ||
        userId.includes('student')
    );
  } else if (role === 'PARENT') {
    list = list.filter((p) => p.studentId === 'STU2024012');
  } else if (studentId) {
    list = list.filter((p) => p.studentId === studentId);
  }

  // Filters
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.receiptNumber.toLowerCase().includes(q) ||
        p.studentName.toLowerCase().includes(q) ||
        p.studentRegNo.toLowerCase().includes(q) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(q))
    );
  }
  if (paymentMethod && paymentMethod !== 'ALL') {
    list = list.filter((p) => p.paymentMethod.toLowerCase() === paymentMethod.toLowerCase());
  }

  return list;
}

export async function getPaymentById(
  id: string,
  user: { role: string; userId: string }
): Promise<PaymentRecord | null> {
  const p = memoryPayments.find(
    (item) => item.id === id || item.receiptNumber === id
  );
  if (!p) return null;

  // RBAC check
  if (user.role === 'STUDENT') {
    const isOwn =
      p.studentId === user.userId ||
      (p.studentId === 'STU2024012' && (user.userId === 'demo-student-01' || user.userId === 'STU2024012' || user.userId.includes('student')));
    if (!isOwn) {
      return null;
    }
  } else if (user.role === 'PARENT') {
    if (p.studentId !== 'STU2024012') {
      return null;
    }
  } else if (user.role === 'WARDEN' || user.role === 'SECURITY' || user.role === 'MAINTENANCE') {
    return null;
  }

  return p;
}

export async function recordPayment(
  input: RecordPaymentInput,
  user: { role: string; userId: string; name?: string }
): Promise<{
  success: boolean;
  payment?: PaymentRecord;
  receipt?: ReceiptRecord;
  fee?: FeeItem;
  error?: string;
  persisted?: boolean;
  storage?: string;
}> {
  // Authorization check
  const allowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT'];
  if (!allowed.includes(user.role.toUpperCase())) {
    return {
      success: false,
      error: 'Permission denied: Only authorized Finance staff and Administrators can record payments.',
    };
  }

  // Validate amount
  if (typeof input.amount !== 'number' || isNaN(input.amount) || input.amount <= 0) {
    return {
      success: false,
      error: 'Payment amount must be a positive number greater than zero.',
    };
  }

  // Validate feeId
  if (!input.feeId || typeof input.feeId !== 'string') {
    return { success: false, error: 'A valid fee or invoice reference is required.' };
  }

  // Find target fee
  const fee = memoryFees.find(
    (f) => f.id === input.feeId || f.invoiceNumber === input.feeId
  );
  if (!fee) {
    return { success: false, error: `Fee record "${input.feeId}" not found.` };
  }

  // Check overpayment invariant
  if (input.amount > fee.balanceDue) {
    return {
      success: false,
      error: `Overpayment rejected: Entered amount (₹${input.amount.toLocaleString(
        'en-IN'
      )}) exceeds outstanding balance (₹${fee.balanceDue.toLocaleString('en-IN')}).`,
    };
  }

  // Duplicate submission protection (transactionReference check)
  if (input.transactionReference) {
    const trimmedRef = input.transactionReference.trim().toUpperCase();
    const existingRef = memoryPayments.find(
      (p) =>
        p.transactionReference &&
        p.transactionReference.trim().toUpperCase() === trimmedRef
    );
    if (existingRef) {
      return {
        success: false,
        error: `Duplicate payment rejected: Transaction reference "${input.transactionReference}" is already registered (Receipt: ${existingRef.receiptNumber}).`,
      };
    }
  }

  const receiptNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const paidDate = input.paidAt ? new Date(input.paidAt) : new Date();

  // Attempt database transaction if DB connected
  try {
    const dbFee = await prisma.fee.findUnique({
      where: { id: fee.id },
      include: { payments: true },
    });

    if (dbFee) {
      const recordedDbPayment = await prisma.$transaction(async (tx) => {
        const p = await tx.payment.create({
          data: {
            feeId: dbFee.id,
            receiptNumber,
            amount: input.amount,
            paymentMethod: input.paymentMethod,
            transactionReference: input.transactionReference || null,
            paidAt: paidDate,
            verifiedById: user.userId,
            status: PaymentStatus.VERIFIED,
          },
        });

        // Compute updated balance in DB
        const currentTotalPaid =
          dbFee.payments.reduce((s, curr) => s + Number(curr.amount), 0) + input.amount;
        const totalFeeAmt = Number(dbFee.amount);
        let newStatus = 'Pending';
        if (currentTotalPaid >= totalFeeAmt) newStatus = 'Paid';
        else if (currentTotalPaid > 0) newStatus = 'Partially Paid';

        await tx.fee.update({
          where: { id: dbFee.id },
          data: { status: newStatus },
        });

        await tx.auditLog.create({
          data: {
            action: 'PAYMENT_RECORDED',
            entity: 'FINANCE',
            entityId: p.id,
            userId: user.userId,
            description: `Recorded payment ₹${input.amount} for fee ${dbFee.id} via ${input.paymentMethod} (Receipt: ${receiptNumber})`,
          },
        });

        return p;
      });

      // Update in-memory state
      fee.paidAmount += input.amount;
      fee.balanceDue = Math.max(0, fee.amount - fee.paidAmount);
      fee.status = fee.balanceDue === 0 ? 'Paid' : 'Partially Paid';
      fee.paymentsCount = (fee.paymentsCount || 0) + 1;

      const newPayment: PaymentRecord = {
        id: recordedDbPayment.id,
        receiptNumber,
        feeId: fee.id,
        invoiceNumber: fee.invoiceNumber,
        studentId: fee.studentId,
        studentName: fee.studentName,
        studentRegNo: fee.studentRegNo,
        hostel: fee.hostel,
        feeType: fee.feeType,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        transactionReference: input.transactionReference || 'INST-DIRECT-CASH',
        paidAt: paidDate.toISOString(),
        verifiedById: user.userId,
        verifiedByName: user.name || 'Finance Officer',
        status: 'VERIFIED',
        notes: input.notes,
      };
      memoryPayments.unshift(newPayment);

      const receipt: ReceiptRecord = {
        id: newPayment.id,
        receiptNumber,
        invoiceNumber: fee.invoiceNumber,
        feeId: fee.id,
        studentId: fee.studentId,
        studentName: fee.studentName,
        studentRegNo: fee.studentRegNo,
        department: fee.department || 'Engineering',
        hostel: fee.hostel,
        roomNo: fee.roomNo || '101',
        amount: input.amount,
        amountInWords: numberToIndianWords(input.amount),
        feeType: fee.feeType,
        paymentMethod: input.paymentMethod,
        transactionReference: newPayment.transactionReference,
        paidAt: newPayment.paidAt,
        verifiedBy: user.name || 'Finance Officer',
        status: 'VERIFIED',
        isPersisted: true,
        storage: 'DATABASE',
      };

      return {
        success: true,
        payment: newPayment,
        receipt,
        fee,
        persisted: true,
        storage: 'DATABASE',
      };
    }
  } catch (err) {
    // Database fallback
  }

  // Resilient memory transaction
  fee.paidAmount += input.amount;
  fee.balanceDue = Math.max(0, fee.amount - fee.paidAmount);
  fee.status = fee.balanceDue === 0 ? 'Paid' : 'Partially Paid';
  fee.paymentsCount = (fee.paymentsCount || 0) + 1;

  const newPayment: PaymentRecord = {
    id: `pay-${Date.now()}`,
    receiptNumber,
    feeId: fee.id,
    invoiceNumber: fee.invoiceNumber,
    studentId: fee.studentId,
    studentName: fee.studentName,
    studentRegNo: fee.studentRegNo,
    hostel: fee.hostel,
    feeType: fee.feeType,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    transactionReference: input.transactionReference || `CHL/REF/${Date.now().toString().slice(-6)}`,
    paidAt: paidDate.toISOString(),
    verifiedById: user.userId,
    verifiedByName: user.name || 'Finance Officer',
    status: 'VERIFIED',
    notes: input.notes,
  };
  memoryPayments.unshift(newPayment);

  logAuditEvent(
    'PAYMENT_RECORDED',
    user.name || 'Finance Officer',
    user.role,
    `[Resilient Store] Verified ${input.paymentMethod} payment of ₹${input.amount.toLocaleString(
      'en-IN'
    )} for ${fee.studentName} (Receipt: ${receiptNumber})`
  );

  const receipt: ReceiptRecord = {
    id: newPayment.id,
    receiptNumber,
    invoiceNumber: fee.invoiceNumber,
    feeId: fee.id,
    studentId: fee.studentId,
    studentName: fee.studentName,
    studentRegNo: fee.studentRegNo,
    department: fee.department || 'Engineering',
    hostel: fee.hostel,
    roomNo: fee.roomNo || '101',
    amount: input.amount,
    amountInWords: numberToIndianWords(input.amount),
    feeType: fee.feeType,
    paymentMethod: input.paymentMethod,
    transactionReference: newPayment.transactionReference,
    paidAt: newPayment.paidAt,
    verifiedBy: user.name || 'Finance Officer',
    status: 'VERIFIED',
    isPersisted: false,
    storage: 'MEMORY_FALLBACK',
  };

  return {
    success: true,
    payment: newPayment,
    receipt,
    fee,
    persisted: false,
    storage: 'MEMORY_FALLBACK',
  };
}

// ==========================================
// 4. INVOICES
// ==========================================
export async function listInvoices(params: {
  role: string;
  userId: string;
  search?: string;
  status?: string;
  studentId?: string;
}): Promise<InvoiceRecord[]> {
  const fees = await listFees({
    role: params.role,
    userId: params.userId,
    search: params.search,
    status: params.status,
    studentId: params.studentId,
  });

  return fees.map((f) => {
    // Generate breakdown line items
    let lineItems = [{ description: `${f.feeType} Base Allocation`, amount: f.amount }];
    if (f.feeType === 'Hostel Fee') {
      lineItems = [
        { description: 'Room Rent & Accommodation Charges', amount: Math.round(f.amount * 0.6) },
        { description: 'Electricity, Water & Maintenance Amenities', amount: Math.round(f.amount * 0.25) },
        { description: 'WiFi, Security & Campus Resident Services', amount: Math.round(f.amount * 0.15) },
      ];
    } else if (f.feeType === 'Mess Fee') {
      lineItems = [
        { description: 'Monthly Breakfast, Lunch & Dinner Catering', amount: Math.round(f.amount * 0.75) },
        { description: 'Mess Infrastructure & Sanitation Fund', amount: Math.round(f.amount * 0.25) },
      ];
    }

    const matchingPayments = memoryPayments
      .filter((p) => p.feeId === f.id || p.invoiceNumber === f.invoiceNumber)
      .map((p) => ({
        receiptNumber: p.receiptNumber,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        paidAt: p.paidAt,
        transactionReference: p.transactionReference,
      }));

    return {
      id: f.id,
      invoiceNumber: f.invoiceNumber,
      feeId: f.id,
      studentId: f.studentId,
      studentName: f.studentName,
      studentRegNo: f.studentRegNo,
      department: f.department || 'Engineering',
      hostel: f.hostel,
      roomNo: f.roomNo || '101',
      feeType: f.feeType,
      description: f.description || `${f.feeType} Assessment`,
      academicTerm: f.academicTerm || 'Autumn Semester 2026',
      issueDate: f.issueDate,
      dueDate: f.dueDate,
      lineItems,
      subtotal: f.amount,
      taxAmount: 0,
      totalAmount: f.amount,
      paidAmount: f.paidAmount,
      balanceDue: f.balanceDue,
      status: f.status,
      payments: matchingPayments,
    };
  });
}

export async function getInvoiceById(
  id: string,
  user: { role: string; userId: string }
): Promise<InvoiceRecord | null> {
  const allInvoices = await listInvoices({ role: 'SUPER_ADMIN', userId: user.userId });
  const invoice = allInvoices.find((inv) => inv.id === id || inv.invoiceNumber === id);
  if (!invoice) return null;

  // RBAC check
  if (user.role === 'STUDENT') {
    const isOwn =
      invoice.studentId === user.userId ||
      (invoice.studentId === 'STU2024012' && (user.userId === 'demo-student-01' || user.userId === 'STU2024012' || user.userId.includes('student')));
    if (!isOwn) {
      return null;
    }
  } else if (user.role === 'PARENT') {
    if (invoice.studentId !== 'STU2024012') {
      return null;
    }
  } else if (user.role === 'WARDEN' || user.role === 'SECURITY' || user.role === 'MAINTENANCE') {
    return null;
  }

  return invoice;
}

// ==========================================
// 5. FINES & PENALTIES
// ==========================================
export async function listFines(params: {
  role: string;
  userId: string;
  search?: string;
  category?: string;
  status?: string;
  studentId?: string;
}): Promise<FineRecord[]> {
  const { role, userId, search, category, status, studentId } = params;

  let list = [...memoryFines];

  // RBAC scope
  if (role === 'STUDENT') {
    list = list.filter(
      (f) =>
        f.studentId === 'STU2024012' ||
        f.studentId === userId ||
        userId === 'demo-student-01' ||
        userId.includes('student')
    );
  } else if (role === 'PARENT') {
    list = list.filter((f) => f.studentId === 'STU2024012');
  } else if (studentId) {
    list = list.filter((f) => f.studentId === studentId);
  }

  // Filters
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      (f) =>
        f.studentName.toLowerCase().includes(q) ||
        f.studentRegNo.toLowerCase().includes(q) ||
        f.reason.toLowerCase().includes(q)
    );
  }
  if (category && category !== 'ALL') {
    list = list.filter((f) => f.category.toLowerCase() === category.toLowerCase());
  }
  if (status && status !== 'ALL') {
    list = list.filter((f) => f.status.toUpperCase() === status.toUpperCase());
  }

  return list;
}

export async function getFineById(
  id: string,
  user: { role: string; userId: string }
): Promise<FineRecord | null> {
  const fine = memoryFines.find((f) => f.id === id);
  if (!fine) return null;

  // RBAC check
  if (user.role === 'STUDENT') {
    const isOwn =
      fine.studentId === user.userId ||
      (fine.studentId === 'STU2024012' && (user.userId === 'demo-student-01' || user.userId === 'STU2024012' || user.userId.includes('student')));
    if (!isOwn) {
      return null;
    }
  } else if (user.role === 'PARENT') {
    if (fine.studentId !== 'STU2024012') {
      return null;
    }
  } else if (user.role === 'SECURITY' || user.role === 'MAINTENANCE') {
    return null;
  }

  return fine;
}

export async function issueFine(
  input: CreateFineInput,
  user: { role: string; userId: string; name?: string }
): Promise<{
  success: boolean;
  fine?: FineRecord;
  error?: string;
  persisted?: boolean;
  storage?: string;
}> {
  // Authorization: Warden, Super Admin, Finance can issue disciplinary fines
  const allowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT', 'WARDEN'];
  if (!allowed.includes(user.role.toUpperCase())) {
    return {
      success: false,
      error: 'Permission denied: Only Wardens and Authorized Administrative Staff can issue disciplinary fines.',
    };
  }

  if (!input.studentId || typeof input.studentId !== 'string' || !input.studentId.trim()) {
    return { success: false, error: 'Student registration number or ID is required.' };
  }
  if (!input.reason || typeof input.reason !== 'string' || !input.reason.trim()) {
    return { success: false, error: 'Reason for disciplinary fine is required.' };
  }
  if (typeof input.amount !== 'number' || isNaN(input.amount) || input.amount <= 0) {
    return { success: false, error: 'Fine penalty amount must be a positive number greater than zero.' };
  }

  const targetStudentId = input.studentId.trim();

  // Find student details
  let studentName = 'Student';
  let hostel = 'Boys Hostel A';
  let roomNo = '101';

  const matchFee = memoryFees.find(
    (f) => f.studentId.toLowerCase() === targetStudentId.toLowerCase()
  );
  if (matchFee) {
    studentName = matchFee.studentName;
    hostel = matchFee.hostel;
    roomNo = matchFee.roomNo || '101';
  } else if (targetStudentId === 'STU2024012') {
    studentName = 'Rahul Kumar';
    hostel = 'Boys Hostel A';
    roomNo = '101';
  }

  // Try DB persistence
  try {
    const studentRecord = await prisma.student.findFirst({
      where: {
        OR: [
          { studentId: targetStudentId },
          { id: targetStudentId },
          { userId: targetStudentId },
        ],
      },
    });

    if (studentRecord) {
      const createdFine = await prisma.fine.create({
        data: {
          studentId: studentRecord.id,
          category: input.category,
          reason: input.reason.trim(),
          amount: input.amount,
          status: FineStatus.PENDING,
          issuedById: user.userId,
        },
      });

      const newFineRecord: FineRecord = {
        id: createdFine.id,
        studentId: studentRecord.studentId,
        studentName: `${studentRecord.firstName} ${studentRecord.lastName}`,
        studentRegNo: studentRecord.studentId,
        hostel,
        roomNo,
        category: input.category,
        reason: input.reason.trim(),
        amount: input.amount,
        status: 'PENDING',
        issuedById: user.userId,
        issuedByName: user.name || (user.role === 'WARDEN' ? 'Chief Warden' : 'Accounts Officer'),
        issuedByRole: user.role,
        issuedAt: createdFine.issuedAt.toISOString(),
        paidAt: null,
      };

      memoryFines.unshift(newFineRecord);
      logAuditEvent(
        'FINE_ISSUED',
        user.name || 'Warden',
        user.role,
        `Issued ${input.category} fine of ₹${input.amount} for ${newFineRecord.studentName} (${newFineRecord.studentRegNo}): ${input.reason}`
      );

      return {
        success: true,
        fine: newFineRecord,
        persisted: true,
        storage: 'DATABASE',
      };
    }
  } catch (err) {
    // Database fallback
  }

  const newFineRecord: FineRecord = {
    id: `fine-${Date.now()}`,
    studentId: targetStudentId,
    studentName,
    studentRegNo: targetStudentId,
    hostel,
    roomNo,
    category: input.category,
    reason: input.reason.trim(),
    amount: input.amount,
    status: 'PENDING',
    issuedById: user.userId,
    issuedByName: user.name || (user.role === 'WARDEN' ? 'Chief Warden' : 'Accounts Officer'),
    issuedByRole: user.role,
    issuedAt: new Date().toISOString(),
    paidAt: null,
  };

  memoryFines.unshift(newFineRecord);
  logAuditEvent(
    'FINE_ISSUED',
    user.name || 'Warden',
    user.role,
    `[Resilient Store] Issued ${input.category} fine of ₹${input.amount} for ${studentName} (${targetStudentId}): ${input.reason}`
  );

  return {
    success: true,
    fine: newFineRecord,
    persisted: false,
    storage: 'MEMORY_FALLBACK',
  };
}

export async function payFine(
  input: PayFineInput,
  user: { role: string; userId: string; name?: string }
): Promise<{
  success: boolean;
  fine?: FineRecord;
  payment?: PaymentRecord;
  receipt?: ReceiptRecord;
  error?: string;
  persisted?: boolean;
  storage?: string;
}> {
  // Only Finance and Super Admin can record fine payments
  const allowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT'];
  if (!allowed.includes(user.role.toUpperCase())) {
    return {
      success: false,
      error: 'Permission denied: Only Finance staff can collect and verify fine payments.',
    };
  }

  const fine = memoryFines.find((f) => f.id === input.fineId);
  if (!fine) {
    return { success: false, error: 'Disciplinary fine record not found.' };
  }

  if (fine.status === 'PAID') {
    return { success: false, error: 'This fine has already been paid and settled.' };
  }
  if (fine.status === 'WAIVED') {
    return { success: false, error: 'Cannot pay a waived disciplinary fine.' };
  }

  const receiptNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const paidDate = new Date();

  // Mark fine as paid
  fine.status = 'PAID';
  fine.paidAt = paidDate.toISOString();
  fine.receiptNumber = receiptNumber;

  // Create linked payment and receipt so fine is accounted in payments ledger
  const payment: PaymentRecord = {
    id: `pay-${fine.id}`,
    receiptNumber,
    feeId: fine.id,
    invoiceNumber: `INV-${fine.id.toUpperCase()}`,
    studentId: fine.studentId,
    studentName: fine.studentName,
    studentRegNo: fine.studentRegNo,
    hostel: fine.hostel,
    feeType: `${fine.category} Fine`,
    amount: fine.amount,
    paymentMethod: input.paymentMethod,
    transactionReference: input.transactionReference || `FINE/PAID/${Date.now().toString().slice(-6)}`,
    paidAt: paidDate.toISOString(),
    verifiedById: user.userId,
    verifiedByName: user.name || 'Finance Officer',
    status: 'VERIFIED',
    notes: input.notes || `Settlement of ${fine.category} fine (${fine.reason})`,
  };
  memoryPayments.unshift(payment);

  const receipt: ReceiptRecord = {
    id: payment.id,
    receiptNumber,
    invoiceNumber: payment.invoiceNumber,
    feeId: fine.id,
    studentId: fine.studentId,
    studentName: fine.studentName,
    studentRegNo: fine.studentRegNo,
    department: 'Engineering',
    hostel: fine.hostel,
    roomNo: fine.roomNo,
    amount: fine.amount,
    amountInWords: numberToIndianWords(fine.amount),
    feeType: `${fine.category} Fine`,
    paymentMethod: input.paymentMethod,
    transactionReference: payment.transactionReference,
    paidAt: payment.paidAt,
    verifiedBy: user.name || 'Finance Officer',
    status: 'VERIFIED',
    isPersisted: false,
    storage: 'MEMORY_FALLBACK',
  };

  logAuditEvent(
    'FINE_SETTLED',
    user.name || 'Finance Officer',
    user.role,
    `Collected ₹${fine.amount} for fine ${fine.id} from ${fine.studentName} (${receiptNumber})`
  );

  return {
    success: true,
    fine,
    payment,
    receipt,
    persisted: false,
    storage: 'MEMORY_FALLBACK',
  };
}

export async function waiveFine(
  fineId: string,
  reason: string,
  user: { role: string; userId: string; name?: string }
): Promise<{
  success: boolean;
  fine?: FineRecord;
  error?: string;
  persisted?: boolean;
  storage?: string;
}> {
  // Only Finance and Super Admin can waive fines
  const allowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT'];
  if (!allowed.includes(user.role.toUpperCase())) {
    return {
      success: false,
      error: 'Permission denied: Only Finance staff or Super Administrators can waive penalties.',
    };
  }

  const fine = memoryFines.find((f) => f.id === fineId);
  if (!fine) {
    return { success: false, error: 'Fine record not found.' };
  }

  if (fine.status === 'PAID') {
    return { success: false, error: 'Cannot waive a fine that has already been paid.' };
  }
  if (fine.status === 'WAIVED') {
    return { success: false, error: 'This fine has already been waived.' };
  }

  fine.status = 'WAIVED';
  fine.waiveReason = reason || 'Waived on administrative review';

  logAuditEvent(
    'FINE_WAIVED',
    user.name || 'Finance Officer',
    user.role,
    `Waived fine ${fine.id} (₹${fine.amount}) for ${fine.studentName}. Reason: ${fine.waiveReason}`
  );

  return {
    success: true,
    fine,
    persisted: false,
    storage: 'MEMORY_FALLBACK',
  };
}

// ==========================================
// 6. RECEIPTS ARCHIVE
// ==========================================
export async function listReceipts(params: {
  role: string;
  userId: string;
  search?: string;
  paymentMethod?: string;
  studentId?: string;
}): Promise<ReceiptRecord[]> {
  const payments = await listPayments({
    role: params.role,
    userId: params.userId,
    search: params.search,
    paymentMethod: params.paymentMethod,
    studentId: params.studentId,
  });

  return payments.map((p) => ({
    id: p.id,
    receiptNumber: p.receiptNumber,
    invoiceNumber: p.invoiceNumber,
    feeId: p.feeId,
    studentId: p.studentId,
    studentName: p.studentName,
    studentRegNo: p.studentRegNo,
    department: 'Engineering',
    hostel: p.hostel,
    roomNo: '101',
    amount: p.amount,
    amountInWords: numberToIndianWords(p.amount),
    feeType: p.feeType,
    paymentMethod: p.paymentMethod,
    transactionReference: p.transactionReference,
    paidAt: p.paidAt,
    verifiedBy: p.verifiedByName || 'Finance Officer',
    status: 'VERIFIED',
    isPersisted: true,
    storage: 'VERIFIED_LEDGER',
  }));
}

export async function getReceiptByNumber(
  receiptNumber: string,
  user: { role: string; userId: string }
): Promise<ReceiptRecord | null> {
  const receipts = await listReceipts({ role: 'SUPER_ADMIN', userId: user.userId });
  const rc = receipts.find(
    (r) => r.receiptNumber.toUpperCase() === receiptNumber.toUpperCase() || r.id === receiptNumber
  );
  if (!rc) return null;

  // RBAC check
  if (user.role === 'STUDENT') {
    const isOwn =
      rc.studentId === user.userId ||
      (rc.studentId === 'STU2024012' && (user.userId === 'demo-student-01' || user.userId === 'STU2024012' || user.userId.includes('student')));
    if (!isOwn) {
      return null;
    }
  } else if (user.role === 'PARENT') {
    if (rc.studentId !== 'STU2024012') {
      return null;
    }
  } else if (user.role === 'WARDEN' || user.role === 'SECURITY' || user.role === 'MAINTENANCE') {
    return null;
  }

  return rc;
}
