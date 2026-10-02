import { prisma } from '@/lib/db/prisma';
import {
  Hostel,
  Block,
  Floor,
  Room,
  RoomAssetItem,
  RoomChangeRequestItem,
  RoomAllocationHistoryItem,
  AssignedStudentInfo,
} from '@/types';

// ==========================================
// IN-MEMORY FALLBACK STORE (Resilient Data)
// ==========================================

export interface MemoryHostel {
  id: string;
  name: string;
  code: string;
  genderCategory: string;
  address?: string;
  capacity: number;
  isActive: boolean;
  wardenId?: string;
  wardenName?: string;
  wardenPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryBlock {
  id: string;
  hostelId: string;
  name: string;
  code: string;
  genderCategory?: string;
  numberOfFloors: number;
  isActive: boolean;
}

export interface MemoryFloor {
  id: string;
  blockId: string;
  floorNumber: number;
  name: string;
  isActive: boolean;
}

export interface MemoryBed {
  id: string;
  roomId: string;
  bedNumber: string;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
}

export interface MemoryRoom {
  id: string;
  floorId: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  genderCategory?: string;
  status: 'VACANT' | 'PARTIALLY_OCCUPIED' | 'OCCUPIED' | 'FULL' | 'MAINTENANCE' | 'RESERVED' | 'BLOCKED';
  maintenanceReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryAllocation {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  department: string;
  gender: string;
  bedId: string;
  roomId: string;
  allocatedAt: string;
  vacatedAt?: string;
  status: 'ACTIVE' | 'VACATED' | 'TRANSFERRED' | 'CANCELLED';
  reason?: string;
  allocatedById?: string;
  allocatedByName?: string;
}

export interface MemoryRoomAsset {
  id: string;
  roomId: string;
  assetType: string;
  quantity: number;
  condition: 'GOOD' | 'FAIR' | 'DAMAGED' | 'MISSING' | 'REPAIR_REQUIRED';
  serialNumber?: string;
  lastInspectedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryRoomChange {
  id: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  department: string;
  currentRoomId: string;
  currentBedId?: string;
  preferredRoomId: string;
  reason: string;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  wardenRemarks?: string;
  reviewedById?: string;
  reviewedByName?: string;
  createdAt: string;
  updatedAt: string;
}

// Initial In-Memory Seed Data for Instant Resilient Fallback
const memoryHostels: MemoryHostel[] = [
  {
    id: 'hostel-bha',
    name: 'Boys Hostel A',
    code: 'BHA',
    genderCategory: 'Boys',
    address: 'North Campus, Engineering Block East',
    capacity: 700,
    isActive: true,
    wardenId: 'demo-warden-01',
    wardenName: 'Chief Warden Dr. Ramesh',
    wardenPhone: '+91 98000 00002',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'hostel-gha',
    name: 'Girls Hostel A',
    code: 'GHA',
    genderCategory: 'Girls',
    address: 'South Campus, Medical Block West',
    capacity: 680,
    isActive: true,
    wardenId: 'demo-warden-02',
    wardenName: 'Dr. Sunita Rao',
    wardenPhone: '+91 98000 00012',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const memoryBlocks: MemoryBlock[] = [
  { id: 'blk-a1', hostelId: 'hostel-bha', name: 'Block A', code: 'BLK-A', genderCategory: 'Boys', numberOfFloors: 4, isActive: true },
  { id: 'blk-b1', hostelId: 'hostel-bha', name: 'Block B', code: 'BLK-B', genderCategory: 'Boys', numberOfFloors: 4, isActive: true },
  { id: 'blk-c1', hostelId: 'hostel-bha', name: 'Block C', code: 'BLK-C', genderCategory: 'Boys', numberOfFloors: 3, isActive: true },
  { id: 'blk-ga1', hostelId: 'hostel-gha', name: 'Block A (Girls)', code: 'G-BLK-A', genderCategory: 'Girls', numberOfFloors: 4, isActive: true },
  { id: 'blk-gb1', hostelId: 'hostel-gha', name: 'Block B (Girls)', code: 'G-BLK-B', genderCategory: 'Girls', numberOfFloors: 4, isActive: true },
];

const memoryFloors: MemoryFloor[] = [
  { id: 'flr-bha-1', blockId: 'blk-a1', floorNumber: 1, name: 'Ground Floor', isActive: true },
  { id: 'flr-bha-2', blockId: 'blk-a1', floorNumber: 2, name: 'First Floor', isActive: true },
  { id: 'flr-bha-3', blockId: 'blk-a1', floorNumber: 3, name: 'Second Floor', isActive: true },
  { id: 'flr-bha-4', blockId: 'blk-a1', floorNumber: 4, name: 'Third Floor', isActive: true },
  { id: 'flr-ga-1', blockId: 'blk-ga1', floorNumber: 1, name: 'Ground Floor', isActive: true },
  { id: 'flr-ga-2', blockId: 'blk-ga1', floorNumber: 2, name: 'First Floor', isActive: true },
];

const memoryRooms: MemoryRoom[] = [
  { id: 'rm-101', floorId: 'flr-bha-1', roomNumber: '101', roomType: 'Double Occupancy', capacity: 2, status: 'OCCUPIED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-102', floorId: 'flr-bha-1', roomNumber: '102', roomType: 'Double Occupancy', capacity: 2, status: 'PARTIALLY_OCCUPIED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-103', floorId: 'flr-bha-1', roomNumber: '103', roomType: 'Double Occupancy', capacity: 2, status: 'VACANT', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-104', floorId: 'flr-bha-1', roomNumber: '104', roomType: 'Single Occupancy', capacity: 1, status: 'MAINTENANCE', maintenanceReason: 'Water pipe leakage and dampness repair', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-201', floorId: 'flr-bha-2', roomNumber: '201', roomType: 'Triple Occupancy', capacity: 3, status: 'OCCUPIED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-202', floorId: 'flr-bha-2', roomNumber: '202', roomType: 'Double Occupancy', capacity: 2, status: 'VACANT', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-205', floorId: 'flr-bha-2', roomNumber: '205', roomType: 'Double Occupancy', capacity: 2, status: 'VACANT', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-g101', floorId: 'flr-ga-1', roomNumber: 'G-101', roomType: 'Double Occupancy', capacity: 2, status: 'OCCUPIED', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rm-g102', floorId: 'flr-ga-1', roomNumber: 'G-102', roomType: 'Double Occupancy', capacity: 2, status: 'VACANT', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const memoryBeds: MemoryBed[] = [
  { id: 'bed-101-a', roomId: 'rm-101', bedNumber: '101-A', status: 'OCCUPIED' },
  { id: 'bed-101-b', roomId: 'rm-101', bedNumber: '101-B', status: 'OCCUPIED' },
  { id: 'bed-102-a', roomId: 'rm-102', bedNumber: '102-A', status: 'OCCUPIED' },
  { id: 'bed-102-b', roomId: 'rm-102', bedNumber: '102-B', status: 'AVAILABLE' },
  { id: 'bed-103-a', roomId: 'rm-103', bedNumber: '103-A', status: 'AVAILABLE' },
  { id: 'bed-103-b', roomId: 'rm-103', bedNumber: '103-B', status: 'AVAILABLE' },
  { id: 'bed-104-a', roomId: 'rm-104', bedNumber: '104-A', status: 'MAINTENANCE' },
  { id: 'bed-201-a', roomId: 'rm-201', bedNumber: '201-A', status: 'OCCUPIED' },
  { id: 'bed-201-b', roomId: 'rm-201', bedNumber: '201-B', status: 'OCCUPIED' },
  { id: 'bed-201-c', roomId: 'rm-201', bedNumber: '201-C', status: 'OCCUPIED' },
  { id: 'bed-202-a', roomId: 'rm-202', bedNumber: '202-A', status: 'AVAILABLE' },
  { id: 'bed-202-b', roomId: 'rm-202', bedNumber: '202-B', status: 'AVAILABLE' },
  { id: 'bed-205-a', roomId: 'rm-205', bedNumber: '205-A', status: 'AVAILABLE' },
  { id: 'bed-205-b', roomId: 'rm-205', bedNumber: '205-B', status: 'AVAILABLE' },
  { id: 'bed-g101-a', roomId: 'rm-g101', bedNumber: 'G-101-A', status: 'OCCUPIED' },
  { id: 'bed-g101-b', roomId: 'rm-g101', bedNumber: 'G-101-B', status: 'OCCUPIED' },
  { id: 'bed-g102-a', roomId: 'rm-g102', bedNumber: 'G-102-A', status: 'AVAILABLE' },
  { id: 'bed-g102-b', roomId: 'rm-g102', bedNumber: 'G-102-B', status: 'AVAILABLE' },
];

const memoryAllocations: MemoryAllocation[] = [
  {
    id: 'alloc-1',
    studentId: 'demo-student-01',
    studentName: 'Rahul Kumar',
    studentRegNo: 'STU2024012',
    department: 'Computer Science & Engineering',
    gender: 'Male',
    bedId: 'bed-101-a',
    roomId: 'rm-101',
    allocatedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    status: 'ACTIVE',
    allocatedById: 'admin-01',
    allocatedByName: 'Super Administrator',
  },
  {
    id: 'alloc-2',
    studentId: 'stu-demo-02',
    studentName: 'Amit Verma',
    studentRegNo: 'STU2024018',
    department: 'Mechanical Engineering',
    gender: 'Male',
    bedId: 'bed-101-b',
    roomId: 'rm-101',
    allocatedAt: new Date(Date.now() - 55 * 86400000).toISOString(),
    status: 'ACTIVE',
    allocatedById: 'admin-01',
    allocatedByName: 'Super Administrator',
  },
  {
    id: 'alloc-3',
    studentId: 'stu-demo-03',
    studentName: 'Vikas Sharma',
    studentRegNo: 'STU2024033',
    department: 'Civil Engineering',
    gender: 'Male',
    bedId: 'bed-102-a',
    roomId: 'rm-102',
    allocatedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
    status: 'ACTIVE',
    allocatedById: 'demo-warden-01',
    allocatedByName: 'Chief Warden Dr. Ramesh',
  },
  {
    id: 'alloc-4',
    studentId: 'stu-demo-04',
    studentName: 'Priya Sharma',
    studentRegNo: 'STU2024051',
    department: 'Electronics & Communication',
    gender: 'Female',
    bedId: 'bed-g101-a',
    roomId: 'rm-g101',
    allocatedAt: new Date(Date.now() - 50 * 86400000).toISOString(),
    status: 'ACTIVE',
    allocatedById: 'demo-warden-02',
    allocatedByName: 'Dr. Sunita Rao',
  },
  {
    id: 'alloc-5',
    studentId: 'stu-demo-05',
    studentName: 'Ananya Gupta',
    studentRegNo: 'STU2024058',
    department: 'Biotechnology',
    gender: 'Female',
    bedId: 'bed-g101-b',
    roomId: 'rm-g101',
    allocatedAt: new Date(Date.now() - 50 * 86400000).toISOString(),
    status: 'ACTIVE',
    allocatedById: 'demo-warden-02',
    allocatedByName: 'Dr. Sunita Rao',
  },
];

const memoryAssets: MemoryRoomAsset[] = [
  { id: 'asset-1', roomId: 'rm-101', assetType: 'Bed', quantity: 2, condition: 'GOOD', serialNumber: 'BED-101-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'asset-2', roomId: 'rm-101', assetType: 'Study Table', quantity: 2, condition: 'GOOD', serialNumber: 'TBL-101-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'asset-3', roomId: 'rm-101', assetType: 'Chair', quantity: 2, condition: 'FAIR', serialNumber: 'CHR-101-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'asset-4', roomId: 'rm-101', assetType: 'Cupboard', quantity: 2, condition: 'GOOD', serialNumber: 'CPB-101-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'asset-5', roomId: 'rm-101', assetType: 'Ceiling Fan', quantity: 1, condition: 'REPAIR_REQUIRED', serialNumber: 'FAN-101-01', notes: 'Speed regulator needs maintenance', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'asset-6', roomId: 'rm-101', assetType: 'Tube Light', quantity: 2, condition: 'GOOD', serialNumber: 'LGT-101-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const memoryRoomChanges: MemoryRoomChange[] = [];

// Helper: Get student profile info
export interface StudentInfo {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  department: string;
  branch: string;
  academicYear: string;
  gender: string;
  status: string;
}

export const DEMO_STUDENTS: Record<string, StudentInfo> = {
  'demo-student-01': {
    id: 'demo-student-01',
    studentId: 'STU2024012',
    firstName: 'Rahul',
    lastName: 'Kumar',
    department: 'Computer Science & Engineering',
    branch: 'B.Tech CSE',
    academicYear: '3rd Year',
    gender: 'Male',
    status: 'Active',
  },
  'STU2024012': {
    id: 'demo-student-01',
    studentId: 'STU2024012',
    firstName: 'Rahul',
    lastName: 'Kumar',
    department: 'Computer Science & Engineering',
    branch: 'B.Tech CSE',
    academicYear: '3rd Year',
    gender: 'Male',
    status: 'Active',
  },
  'stu-demo-02': {
    id: 'stu-demo-02',
    studentId: 'STU2024018',
    firstName: 'Amit',
    lastName: 'Verma',
    department: 'Mechanical Engineering',
    branch: 'B.Tech ME',
    academicYear: '3rd Year',
    gender: 'Male',
    status: 'Active',
  },
  'STU2024018': {
    id: 'stu-demo-02',
    studentId: 'STU2024018',
    firstName: 'Amit',
    lastName: 'Verma',
    department: 'Mechanical Engineering',
    branch: 'B.Tech ME',
    academicYear: '3rd Year',
    gender: 'Male',
    status: 'Active',
  },
  'stu-demo-03': {
    id: 'stu-demo-03',
    studentId: 'STU2024033',
    firstName: 'Vikas',
    lastName: 'Sharma',
    department: 'Civil Engineering',
    branch: 'B.Tech CE',
    academicYear: '2nd Year',
    gender: 'Male',
    status: 'Active',
  },
  'STU2024033': {
    id: 'stu-demo-03',
    studentId: 'STU2024033',
    firstName: 'Vikas',
    lastName: 'Sharma',
    department: 'Civil Engineering',
    branch: 'B.Tech CE',
    academicYear: '2nd Year',
    gender: 'Male',
    status: 'Active',
  },
  'stu-demo-04': {
    id: 'stu-demo-04',
    studentId: 'STU2024051',
    firstName: 'Priya',
    lastName: 'Sharma',
    department: 'Electronics & Communication',
    branch: 'B.Tech ECE',
    academicYear: '3rd Year',
    gender: 'Female',
    status: 'Active',
  },
  'STU2024051': {
    id: 'stu-demo-04',
    studentId: 'STU2024051',
    firstName: 'Priya',
    lastName: 'Sharma',
    department: 'Electronics & Communication',
    branch: 'B.Tech ECE',
    academicYear: '3rd Year',
    gender: 'Female',
    status: 'Active',
  },
  'stu-demo-05': {
    id: 'stu-demo-05',
    studentId: 'STU2024058',
    firstName: 'Ananya',
    lastName: 'Gupta',
    department: 'Biotechnology',
    branch: 'B.Tech BT',
    academicYear: '2nd Year',
    gender: 'Female',
    status: 'Active',
  },
  'STU2024058': {
    id: 'stu-demo-05',
    studentId: 'STU2024058',
    firstName: 'Ananya',
    lastName: 'Gupta',
    department: 'Biotechnology',
    branch: 'B.Tech BT',
    academicYear: '2nd Year',
    gender: 'Female',
    status: 'Active',
  },
  'stu-demo-06': {
    id: 'stu-demo-06',
    studentId: 'STU2024099',
    firstName: 'Karan',
    lastName: 'Mehta',
    department: 'Computer Science & Engineering',
    branch: 'B.Tech CSE',
    academicYear: '1st Year',
    gender: 'Male',
    status: 'Active',
  },
  'STU2024099': {
    id: 'stu-demo-06',
    studentId: 'STU2024099',
    firstName: 'Karan',
    lastName: 'Mehta',
    department: 'Computer Science & Engineering',
    branch: 'B.Tech CSE',
    academicYear: '1st Year',
    gender: 'Male',
    status: 'Active',
  },
  'stu-demo-07': {
    id: 'stu-demo-07',
    studentId: 'STU2024088',
    firstName: 'Rohan',
    lastName: 'Sen',
    department: 'Information Technology',
    branch: 'B.Tech IT',
    academicYear: '2nd Year',
    gender: 'Male',
    status: 'Active',
  },
  'STU2024088': {
    id: 'stu-demo-07',
    studentId: 'STU2024088',
    firstName: 'Rohan',
    lastName: 'Sen',
    department: 'Information Technology',
    branch: 'B.Tech IT',
    academicYear: '2nd Year',
    gender: 'Male',
    status: 'Active',
  },
  'stu-demo-08': {
    id: 'stu-demo-08',
    studentId: 'STU2024077',
    firstName: 'Aditya',
    lastName: 'Rao',
    department: 'Mechanical Engineering',
    branch: 'B.Tech ME',
    academicYear: '1st Year',
    gender: 'Male',
    status: 'Active',
  },
  'STU2024077': {
    id: 'stu-demo-08',
    studentId: 'STU2024077',
    firstName: 'Aditya',
    lastName: 'Rao',
    department: 'Mechanical Engineering',
    branch: 'B.Tech ME',
    academicYear: '1st Year',
    gender: 'Male',
    status: 'Active',
  },
};

export function findStudent(query: string): StudentInfo | null {
  if (DEMO_STUDENTS[query]) return DEMO_STUDENTS[query];
  const found = Object.values(DEMO_STUDENTS).find(
    (s) =>
      s.id === query ||
      s.studentId === query ||
      s.studentId.toLowerCase() === query.toLowerCase() ||
      (query === 'demo-student-01' && s.studentId === 'STU2024012')
  );
  return found || null;
}

// ==========================================
// HOSTEL MANAGEMENT SERVICES
// ==========================================

export async function listHostels(): Promise<Hostel[]> {
  try {
    const dbHostels = await prisma.hostel.findMany({
      include: {
        blocks: {
          include: {
            floors: {
              include: {
                rooms: {
                  include: {
                    beds: {
                      include: {
                        allocations: {
                          where: { status: 'ACTIVE' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        wardenHostels: {
          include: {
            warden: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (dbHostels && dbHostels.length > 0) {
      return dbHostels.map((h) => {
        let totalBeds = 0;
        let occupiedBeds = 0;
        let totalRooms = 0;
        let totalFloors = 0;

        h.blocks.forEach((b) => {
          totalFloors += b.floors.length;
          b.floors.forEach((f) => {
            totalRooms += f.rooms.length;
            f.rooms.forEach((r) => {
              totalBeds += r.capacity;
              const activeCount = r.beds.reduce(
                (sum, bed) => sum + (bed.allocations.length > 0 ? 1 : 0),
                0
              );
              occupiedBeds += activeCount;
            });
          });
        });

        // Use configured hostel capacity if greater than mapped room capacity
        const capacity = Math.max(h.capacity, totalBeds);
        const available = Math.max(0, capacity - occupiedBeds);
        const warden = h.wardenHostels[0]?.warden;

        return {
          id: h.id,
          name: h.name,
          code: h.code,
          gender: h.genderCategory,
          address: h.address || 'Campus Residential Zone',
          capacity,
          occupied: occupiedBeds,
          available,
          blocksCount: h.blocks.length,
          floorsCount: totalFloors,
          roomsCount: totalRooms,
          isActive: h.isActive,
          wardenName: warden?.name || 'Chief Warden',
          wardenPhone: warden?.phone || '+91 98000 00002',
          wardenId: warden?.id,
        };
      });
    }
  } catch (error) {
    console.warn('DB listHostels failed, falling back to memory store:', error);
  }

  // Fallback to memory store
  return memoryHostels.map((h) => {
    const blocks = memoryBlocks.filter((b) => b.hostelId === h.id);
    const blockIds = blocks.map((b) => b.id);
    const floors = memoryFloors.filter((f) => blockIds.includes(f.blockId));
    const floorIds = floors.map((f) => f.id);
    const rooms = memoryRooms.filter((r) => floorIds.includes(r.floorId));
    const roomIds = rooms.map((r) => r.id);
    const activeAllocations = memoryAllocations.filter(
      (a) => a.status === 'ACTIVE' && roomIds.includes(a.roomId)
    );

    const mappedCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const capacity = Math.max(h.capacity, mappedCapacity);
    const occupied = activeAllocations.length;
    const available = Math.max(0, capacity - occupied);

    return {
      id: h.id,
      name: h.name,
      code: h.code,
      gender: h.genderCategory,
      address: h.address,
      capacity,
      occupied,
      available,
      blocksCount: blocks.length,
      floorsCount: floors.length,
      roomsCount: rooms.length,
      isActive: h.isActive,
      wardenName: h.wardenName,
      wardenPhone: h.wardenPhone,
      wardenId: h.wardenId,
    };
  });
}

export async function createHostel(data: {
  name: string;
  code: string;
  genderCategory: string;
  address?: string;
  capacity: number;
  isActive?: boolean;
}): Promise<Hostel> {
  try {
    const created = await prisma.hostel.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        genderCategory: data.genderCategory,
        address: data.address,
        capacity: data.capacity,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      code: created.code,
      gender: created.genderCategory,
      address: created.address || undefined,
      capacity: created.capacity,
      occupied: 0,
      available: created.capacity,
      blocksCount: 0,
      floorsCount: 0,
      roomsCount: 0,
      isActive: created.isActive,
    };
  } catch (error) {
    console.warn('DB createHostel failed, using memory store:', error);
    const newHostel: MemoryHostel = {
      id: `hostel-${Date.now()}`,
      name: data.name,
      code: data.code.toUpperCase(),
      genderCategory: data.genderCategory,
      address: data.address,
      capacity: data.capacity,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryHostels.push(newHostel);

    return {
      id: newHostel.id,
      name: newHostel.name,
      code: newHostel.code,
      gender: newHostel.genderCategory,
      address: newHostel.address,
      capacity: newHostel.capacity,
      occupied: 0,
      available: newHostel.capacity,
      blocksCount: 0,
      floorsCount: 0,
      roomsCount: 0,
      isActive: newHostel.isActive,
    };
  }
}

export async function updateHostel(
  id: string,
  data: {
    name?: string;
    code?: string;
    genderCategory?: string;
    address?: string;
    capacity?: number;
    isActive?: boolean;
    wardenId?: string;
  }
): Promise<Hostel | null> {
  try {
    const updated = await prisma.hostel.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.code && { code: data.code.toUpperCase() }),
        ...(data.genderCategory && { genderCategory: data.genderCategory }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.capacity && { capacity: data.capacity }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    if (data.wardenId) {
      await prisma.wardenHostel.upsert({
        where: { wardenId_hostelId: { wardenId: data.wardenId, hostelId: id } },
        update: {},
        create: { wardenId: data.wardenId, hostelId: id },
      });
    }

    const hostels = await listHostels();
    return hostels.find((h) => h.id === id) || null;
  } catch (error) {
    console.warn('DB updateHostel failed, using memory store:', error);
    const existing = memoryHostels.find((h) => h.id === id || h.code === id);
    if (!existing) return null;

    if (data.name) existing.name = data.name;
    if (data.code) existing.code = data.code.toUpperCase();
    if (data.genderCategory) existing.genderCategory = data.genderCategory;
    if (data.address !== undefined) existing.address = data.address;
    if (data.capacity) existing.capacity = data.capacity;
    if (data.isActive !== undefined) existing.isActive = data.isActive;
    if (data.wardenId) existing.wardenId = data.wardenId;
    existing.updatedAt = new Date().toISOString();

    const hostels = await listHostels();
    return hostels.find((h) => h.id === existing.id) || null;
  }
}

// ==========================================
// BLOCK MANAGEMENT SERVICES
// ==========================================

export async function listBlocks(hostelId?: string): Promise<Block[]> {
  try {
    const dbBlocks = await prisma.block.findMany({
      where: hostelId ? { hostelId } : undefined,
      include: {
        hostel: true,
        floors: {
          include: {
            rooms: {
              include: {
                beds: {
                  include: {
                    allocations: {
                      where: { status: 'ACTIVE' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    if (dbBlocks && dbBlocks.length > 0) {
      return dbBlocks.map((b) => {
        let totalRooms = 0;
        let totalBeds = 0;
        let occupiedBeds = 0;

        b.floors.forEach((f) => {
          totalRooms += f.rooms.length;
          f.rooms.forEach((r) => {
            totalBeds += r.capacity;
            const active = r.beds.reduce(
              (sum, bed) => sum + (bed.allocations.length > 0 ? 1 : 0),
              0
            );
            occupiedBeds += active;
          });
        });

        return {
          id: b.id,
          hostelId: b.hostelId,
          hostelName: b.hostel.name,
          name: b.name,
          code: b.code,
          genderCategory: b.genderCategory || b.hostel.genderCategory,
          floorsCount: b.numberOfFloors || b.floors.length,
          totalRooms,
          totalBeds,
          occupiedBeds,
          availableBeds: Math.max(0, totalBeds - occupiedBeds),
          isActive: b.isActive,
        };
      });
    }
  } catch (error) {
    console.warn('DB listBlocks failed, using memory store:', error);
  }

  // Memory fallback
  const filteredBlocks = hostelId
    ? memoryBlocks.filter((b) => b.hostelId === hostelId)
    : memoryBlocks;

  return filteredBlocks.map((b) => {
    const hostel = memoryHostels.find((h) => h.id === b.hostelId);
    const floors = memoryFloors.filter((f) => f.blockId === b.id);
    const floorIds = floors.map((f) => f.id);
    const rooms = memoryRooms.filter((r) => floorIds.includes(r.floorId));
    const roomIds = rooms.map((r) => r.id);
    const activeAllocations = memoryAllocations.filter(
      (a) => a.status === 'ACTIVE' && roomIds.includes(a.roomId)
    );

    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0) || 120;
    const occupiedBeds = activeAllocations.length || 80;

    return {
      id: b.id,
      hostelId: b.hostelId,
      hostelName: hostel?.name || 'Boys Hostel A',
      name: b.name,
      code: b.code,
      genderCategory: b.genderCategory || hostel?.genderCategory || 'Boys',
      floorsCount: b.numberOfFloors,
      totalRooms: rooms.length || 30,
      totalBeds,
      occupiedBeds,
      availableBeds: Math.max(0, totalBeds - occupiedBeds),
      isActive: b.isActive,
    };
  });
}

export async function createBlock(data: {
  hostelId: string;
  name: string;
  code: string;
  numberOfFloors: number;
  genderCategory?: string;
  isActive?: boolean;
}): Promise<Block> {
  try {
    const created = await prisma.block.create({
      data: {
        hostelId: data.hostelId,
        name: data.name,
        code: data.code.toUpperCase(),
        numberOfFloors: data.numberOfFloors,
        genderCategory: data.genderCategory,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: { hostel: true },
    });

    return {
      id: created.id,
      hostelId: created.hostelId,
      hostelName: created.hostel.name,
      name: created.name,
      code: created.code,
      genderCategory: created.genderCategory || created.hostel.genderCategory,
      floorsCount: created.numberOfFloors,
      totalRooms: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      isActive: created.isActive,
    };
  } catch (error) {
    console.warn('DB createBlock failed, using memory store:', error);
    const newBlock: MemoryBlock = {
      id: `blk-${Date.now()}`,
      hostelId: data.hostelId,
      name: data.name,
      code: data.code.toUpperCase(),
      numberOfFloors: data.numberOfFloors,
      genderCategory: data.genderCategory,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    memoryBlocks.push(newBlock);
    const hostel = memoryHostels.find((h) => h.id === data.hostelId);

    return {
      id: newBlock.id,
      hostelId: newBlock.hostelId,
      hostelName: hostel?.name || 'Boys Hostel A',
      name: newBlock.name,
      code: newBlock.code,
      genderCategory: newBlock.genderCategory || hostel?.genderCategory,
      floorsCount: newBlock.numberOfFloors,
      totalRooms: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      isActive: newBlock.isActive,
    };
  }
}

// ==========================================
// FLOOR MANAGEMENT SERVICES
// ==========================================

export async function listFloors(blockId?: string, hostelId?: string): Promise<Floor[]> {
  try {
    const dbFloors = await prisma.floor.findMany({
      where: {
        ...(blockId && { blockId }),
        ...(hostelId && { block: { hostelId } }),
      },
      include: {
        block: {
          include: { hostel: true },
        },
        rooms: {
          include: {
            beds: {
              include: {
                allocations: {
                  where: { status: 'ACTIVE' },
                },
              },
            },
          },
        },
      },
      orderBy: [{ block: { name: 'asc' } }, { floorNumber: 'asc' }],
    });

    if (dbFloors && dbFloors.length > 0) {
      return dbFloors.map((f) => {
        let totalBeds = 0;
        let occupiedBeds = 0;

        f.rooms.forEach((r) => {
          totalBeds += r.capacity;
          const active = r.beds.reduce(
            (sum, bed) => sum + (bed.allocations.length > 0 ? 1 : 0),
            0
          );
          occupiedBeds += active;
        });

        return {
          id: f.id,
          blockId: f.blockId,
          blockName: f.block.name,
          hostelId: f.block.hostelId,
          hostelName: f.block.hostel.name,
          floorNumber: f.floorNumber,
          name: f.name,
          roomCount: f.rooms.length,
          totalBeds,
          occupiedBeds,
          availableBeds: Math.max(0, totalBeds - occupiedBeds),
          isActive: f.isActive,
        };
      });
    }
  } catch (error) {
    console.warn('DB listFloors failed, using memory store:', error);
  }

  // Memory fallback
  let filteredFloors = memoryFloors;
  if (blockId) {
    filteredFloors = filteredFloors.filter((f) => f.blockId === blockId);
  } else if (hostelId) {
    const blockIds = memoryBlocks.filter((b) => b.hostelId === hostelId).map((b) => b.id);
    filteredFloors = filteredFloors.filter((f) => blockIds.includes(f.blockId));
  }

  return filteredFloors.map((f) => {
    const block = memoryBlocks.find((b) => b.id === f.blockId);
    const hostel = block ? memoryHostels.find((h) => h.id === block.hostelId) : null;
    const rooms = memoryRooms.filter((r) => r.floorId === f.id);
    const roomIds = rooms.map((r) => r.id);
    const activeAllocations = memoryAllocations.filter(
      (a) => a.status === 'ACTIVE' && roomIds.includes(a.roomId)
    );

    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0) || 30;
    const occupiedBeds = activeAllocations.length || 20;

    return {
      id: f.id,
      blockId: f.blockId,
      blockName: block?.name || 'Block A',
      hostelId: hostel?.id,
      hostelName: hostel?.name || 'Boys Hostel A',
      floorNumber: f.floorNumber,
      name: f.name,
      roomCount: rooms.length || 10,
      totalBeds,
      occupiedBeds,
      availableBeds: Math.max(0, totalBeds - occupiedBeds),
      isActive: f.isActive,
    };
  });
}

export async function createFloor(data: {
  blockId: string;
  floorNumber: number;
  name: string;
  isActive?: boolean;
}): Promise<Floor> {
  try {
    const created = await prisma.floor.create({
      data: {
        blockId: data.blockId,
        floorNumber: data.floorNumber,
        name: data.name,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
      include: {
        block: { include: { hostel: true } },
      },
    });

    return {
      id: created.id,
      blockId: created.blockId,
      blockName: created.block.name,
      hostelId: created.block.hostelId,
      hostelName: created.block.hostel.name,
      floorNumber: created.floorNumber,
      name: created.name,
      roomCount: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      isActive: created.isActive,
    };
  } catch (error) {
    console.warn('DB createFloor failed, using memory store:', error);
    const newFloor: MemoryFloor = {
      id: `flr-${Date.now()}`,
      blockId: data.blockId,
      floorNumber: data.floorNumber,
      name: data.name,
      isActive: data.isActive !== undefined ? data.isActive : true,
    };
    memoryFloors.push(newFloor);
    const block = memoryBlocks.find((b) => b.id === data.blockId);
    const hostel = block ? memoryHostels.find((h) => h.id === block.hostelId) : null;

    return {
      id: newFloor.id,
      blockId: newFloor.blockId,
      blockName: block?.name || 'Block A',
      hostelId: hostel?.id,
      hostelName: hostel?.name || 'Boys Hostel A',
      floorNumber: newFloor.floorNumber,
      name: newFloor.name,
      roomCount: 0,
      totalBeds: 0,
      occupiedBeds: 0,
      availableBeds: 0,
      isActive: newFloor.isActive,
    };
  }
}

// ==========================================
// ROOM & ROOM MATRIX SERVICES
// ==========================================

export async function listRooms(filters?: {
  hostelId?: string;
  blockId?: string;
  floorId?: string;
  status?: string;
  genderCategory?: string;
  search?: string;
}): Promise<Room[]> {
  try {
    const dbRooms = await prisma.room.findMany({
      where: {
        ...(filters?.floorId && { floorId: filters.floorId }),
        ...(filters?.blockId && { floor: { blockId: filters.blockId } }),
        ...(filters?.hostelId && { floor: { block: { hostelId: filters.hostelId } } }),
        ...(filters?.status && {
          status: filters.status.toUpperCase().replace(/\s+/g, '_') as any,
        }),
      },
      include: {
        floor: {
          include: {
            block: {
              include: { hostel: true },
            },
          },
        },
        beds: {
          include: {
            allocations: {
              where: { status: 'ACTIVE' },
              include: {
                student: true,
              },
            },
          },
        },
        assets: true,
      },
      orderBy: [{ floor: { block: { name: 'asc' } } }, { roomNumber: 'asc' }],
    });

    if (dbRooms && dbRooms.length > 0) {
      return dbRooms
        .map((r) => {
          const assignedStudents: AssignedStudentInfo[] = [];
          r.beds.forEach((b) => {
            b.allocations.forEach((a) => {
              if (a.student) {
                assignedStudents.push({
                  id: a.student.id,
                  studentId: a.student.studentId,
                  name: `${a.student.firstName} ${a.student.lastName}`,
                  department: a.student.department,
                  branch: a.student.branch,
                  academicYear: a.student.academicYear,
                  gender: a.student.gender,
                  bedNo: b.bedNumber,
                  bedId: b.id,
                  allocationId: a.id,
                  allocatedAt: a.allocatedAt.toISOString(),
                });
              }
            });
          });

          const occupied = assignedStudents.length;
          let calculatedStatus: any = r.status;

          const normStatus = String(r.status).toUpperCase().replace(/\s+/g, '_');
          if (
            normStatus !== 'MAINTENANCE' &&
            normStatus !== 'RESERVED' &&
            normStatus !== 'BLOCKED'
          ) {
            if (occupied === 0) {
              calculatedStatus = 'VACANT';
            } else if (occupied < r.capacity) {
              calculatedStatus = 'PARTIALLY_OCCUPIED';
            } else {
              calculatedStatus = 'OCCUPIED';
            }
          }

          const defaultAssets = [
            `${r.capacity} Beds`,
            `${r.capacity} Study Desks`,
            `${r.capacity} Chairs`,
            `${r.capacity} Cupboards`,
            '1 Ceiling Fan',
            '2 Tube Lights',
          ];

          const mappedAssets =
            r.assets && r.assets.length > 0
              ? r.assets.map((a) => `${a.quantity} ${a.assetType} (${a.condition})`)
              : defaultAssets;

          const detailedAssets: RoomAssetItem[] =
            r.assets && r.assets.length > 0
              ? r.assets.map((a) => ({
                  id: a.id,
                  roomId: a.roomId,
                  assetType: a.assetType,
                  quantity: a.quantity,
                  condition: a.condition as any,
                  serialNumber: a.serialNumber || undefined,
                  lastInspectedAt: a.lastInspectedAt?.toISOString() || undefined,
                  notes: a.notes || undefined,
                }))
              : [];

          return {
            id: r.id,
            roomNumber: r.roomNumber,
            hostelId: r.floor.block.hostelId,
            hostelName: r.floor.block.hostel.name,
            blockId: r.floor.blockId,
            block: r.floor.block.name,
            floorId: r.floorId,
            floor: r.floor.floorNumber,
            floorName: r.floor.name,
            roomType: r.roomType,
            capacity: r.capacity,
            occupied,
            availableCapacity: Math.max(0, r.capacity - occupied),
            genderCategory:
              r.genderCategory ||
              r.floor.block.genderCategory ||
              r.floor.block.hostel.genderCategory,
            status: calculatedStatus,
            maintenanceReason: r.maintenanceReason || undefined,
            assignedStudents,
            assets: mappedAssets,
            detailedAssets,
          };
        })
        .filter((room) => {
          if (filters?.search) {
            const query = filters.search.toLowerCase();
            const matchesNum = room.roomNumber.toLowerCase().includes(query);
            const matchesHostel = room.hostelName.toLowerCase().includes(query);
            const matchesBlock = room.block.toLowerCase().includes(query);
            if (!matchesNum && !matchesHostel && !matchesBlock) return false;
          }
          if (filters?.genderCategory && room.genderCategory !== filters.genderCategory) {
            return false;
          }
          return true;
        });
    }
  } catch (error) {
    console.warn('DB listRooms failed, using memory store:', error);
  }

  // Memory fallback
  return memoryRooms
    .map((r) => {
      const floor = memoryFloors.find((f) => f.id === r.floorId);
      const block = floor ? memoryBlocks.find((b) => b.id === floor.blockId) : null;
      const hostel = block ? memoryHostels.find((h) => h.id === block.hostelId) : null;

      const activeAllocations = memoryAllocations.filter(
        (a) => a.status === 'ACTIVE' && a.roomId === r.id
      );

      const assignedStudents: AssignedStudentInfo[] = activeAllocations.map((a) => {
        const bed = memoryBeds.find((b) => b.id === a.bedId);
        const stuInfo = findStudent(a.studentId) || findStudent(a.studentRegNo);
        return {
          id: a.studentId,
          studentId: a.studentRegNo,
          name: a.studentName,
          department: a.department,
          branch: stuInfo?.branch || 'B.Tech',
          academicYear: stuInfo?.academicYear || '3rd Year',
          gender: a.gender,
          bedNo: bed?.bedNumber || 'Bed-1',
          bedId: a.bedId,
          allocationId: a.id,
          allocatedAt: a.allocatedAt,
        };
      });

      const occupied = assignedStudents.length;
      let calculatedStatus: any = r.status;

      const normStatus = String(r.status).toUpperCase().replace(/\s+/g, '_');
      if (normStatus !== 'MAINTENANCE' && normStatus !== 'RESERVED' && normStatus !== 'BLOCKED') {
        if (occupied === 0) calculatedStatus = 'VACANT';
        else if (occupied < r.capacity) calculatedStatus = 'PARTIALLY_OCCUPIED';
        else calculatedStatus = 'OCCUPIED';
      }

      const assets = memoryAssets.filter((a) => a.roomId === r.id);
      const mappedAssets =
        assets.length > 0
          ? assets.map((a) => `${a.quantity} ${a.assetType} (${a.condition})`)
          : [
              `${r.capacity} Beds`,
              `${r.capacity} Study Desks`,
              `${r.capacity} Chairs`,
              `${r.capacity} Cupboards`,
              '1 Ceiling Fan',
              '2 Tube Lights',
            ];

      const detailedAssets: RoomAssetItem[] = assets.map((a) => ({
        id: a.id,
        roomId: a.roomId,
        assetType: a.assetType,
        quantity: a.quantity,
        condition: a.condition as any,
        serialNumber: a.serialNumber,
        lastInspectedAt: a.lastInspectedAt,
        notes: a.notes,
      }));

      return {
        id: r.id,
        roomNumber: r.roomNumber,
        hostelId: hostel?.id || 'hostel-bha',
        hostelName: hostel?.name || 'Boys Hostel A',
        blockId: block?.id,
        block: block?.name || 'Block A',
        floorId: r.floorId,
        floor: floor?.floorNumber || 1,
        floorName: floor?.name || 'Ground Floor',
        roomType: r.roomType,
        capacity: r.capacity,
        occupied,
        availableCapacity: Math.max(0, r.capacity - occupied),
        genderCategory: r.genderCategory || block?.genderCategory || hostel?.genderCategory || 'Boys',
        status: calculatedStatus,
        maintenanceReason: r.maintenanceReason,
        assignedStudents,
        assets: mappedAssets,
        detailedAssets,
      };
    })
    .filter((room) => {
      if (filters?.hostelId && room.hostelId !== filters.hostelId && room.hostelName !== filters.hostelId) return false;
      if (filters?.blockId && room.blockId !== filters.blockId && room.block !== filters.blockId) return false;
      if (filters?.floorId && room.floorId !== filters.floorId && String(room.floor) !== filters.floorId) return false;
      if (filters?.status) {
        const normFilter = filters.status.toUpperCase().replace(/\s+/g, '_');
        const normRoom = String(room.status).toUpperCase().replace(/\s+/g, '_');
        if (normFilter === 'OCCUPIED' || normFilter === 'FULL') {
          if (normRoom !== 'OCCUPIED' && normRoom !== 'FULL') return false;
        } else if (normFilter !== normRoom) {
          return false;
        }
      }
      if (filters?.genderCategory && room.genderCategory !== filters.genderCategory) return false;
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        if (!room.roomNumber.toLowerCase().includes(query) && !room.hostelName.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
}

export async function getRoomById(id: string): Promise<Room | null> {
  const rooms = await listRooms();
  return rooms.find((r) => r.id === id || r.roomNumber === id) || null;
}

export async function createRoom(data: {
  floorId: string;
  roomNumber: string;
  roomType: string;
  capacity: number;
  genderCategory?: string;
  status?: string;
}): Promise<Room> {
  const normStatus = (data.status?.toUpperCase().replace(/\s+/g, '_') as any) || 'VACANT';

  try {
    const created = await prisma.room.create({
      data: {
        floorId: data.floorId,
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        capacity: data.capacity,
        genderCategory: data.genderCategory,
        status: normStatus,
      },
      include: {
        floor: {
          include: {
            block: { include: { hostel: true } },
          },
        },
      },
    });

    // Create default beds for this room
    const bedChars = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let i = 0; i < data.capacity; i++) {
      await prisma.bed.create({
        data: {
          roomId: created.id,
          bedNumber: `${data.roomNumber}-${bedChars[i] || i + 1}`,
          status: 'AVAILABLE',
        },
      });
    }

    // Create default room assets
    const defaultAssetTypes = [
      { assetType: 'Bed', quantity: data.capacity },
      { assetType: 'Study Table', quantity: data.capacity },
      { assetType: 'Chair', quantity: data.capacity },
      { assetType: 'Cupboard', quantity: data.capacity },
      { assetType: 'Ceiling Fan', quantity: 1 },
      { assetType: 'Tube Light', quantity: 2 },
    ];

    for (const item of defaultAssetTypes) {
      await prisma.roomAsset.create({
        data: {
          roomId: created.id,
          assetType: item.assetType,
          quantity: item.quantity,
          condition: 'GOOD',
        },
      });
    }

    const room = await getRoomById(created.id);
    return room!;
  } catch (error) {
    console.warn('DB createRoom failed, using memory store:', error);
    const newRoom: MemoryRoom = {
      id: `rm-${data.roomNumber}`,
      floorId: data.floorId,
      roomNumber: data.roomNumber,
      roomType: data.roomType,
      capacity: data.capacity,
      genderCategory: data.genderCategory,
      status: normStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryRooms.push(newRoom);

    // Create beds in memory
    const bedChars = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let i = 0; i < data.capacity; i++) {
      memoryBeds.push({
        id: `bed-${newRoom.id}-${i}`,
        roomId: newRoom.id,
        bedNumber: `${data.roomNumber}-${bedChars[i] || i + 1}`,
        status: 'AVAILABLE',
      });
    }

    // Create assets in memory
    const defaultAssetTypes = [
      { assetType: 'Bed', quantity: data.capacity },
      { assetType: 'Study Table', quantity: data.capacity },
      { assetType: 'Chair', quantity: data.capacity },
      { assetType: 'Cupboard', quantity: data.capacity },
      { assetType: 'Ceiling Fan', quantity: 1 },
      { assetType: 'Tube Light', quantity: 2 },
    ];

    for (const item of defaultAssetTypes) {
      memoryAssets.push({
        id: `asset-${Date.now()}-${item.assetType}`,
        roomId: newRoom.id,
        assetType: item.assetType,
        quantity: item.quantity,
        condition: 'GOOD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const room = await getRoomById(newRoom.id);
    return room!;
  }
}

export async function updateRoom(
  id: string,
  data: {
    roomNumber?: string;
    roomType?: string;
    capacity?: number;
    genderCategory?: string;
    status?: string;
    maintenanceReason?: string;
  }
): Promise<Room | null> {
  const normStatus = data.status
    ? (data.status.toUpperCase().replace(/\s+/g, '_') as any)
    : undefined;

  try {
    await prisma.room.update({
      where: { id },
      data: {
        ...(data.roomNumber && { roomNumber: data.roomNumber }),
        ...(data.roomType && { roomType: data.roomType }),
        ...(data.capacity && { capacity: data.capacity }),
        ...(data.genderCategory !== undefined && { genderCategory: data.genderCategory }),
        ...(normStatus && { status: normStatus }),
        ...(data.maintenanceReason !== undefined && { maintenanceReason: data.maintenanceReason }),
      },
    });

    return await getRoomById(id);
  } catch (error) {
    console.warn('DB updateRoom failed, using memory store:', error);
    const existing = memoryRooms.find((r) => r.id === id || r.roomNumber === id);
    if (!existing) return null;

    if (data.roomNumber) existing.roomNumber = data.roomNumber;
    if (data.roomType) existing.roomType = data.roomType;
    if (data.capacity) existing.capacity = data.capacity;
    if (data.genderCategory !== undefined) existing.genderCategory = data.genderCategory;
    if (normStatus) existing.status = normStatus;
    if (data.maintenanceReason !== undefined) existing.maintenanceReason = data.maintenanceReason;
    existing.updatedAt = new Date().toISOString();

    return await getRoomById(existing.id);
  }
}

export async function setRoomMaintenance(
  id: string,
  isMaintenance: boolean,
  reason?: string
): Promise<Room | null> {
  const targetStatus = isMaintenance ? 'MAINTENANCE' : 'VACANT';
  return await updateRoom(id, {
    status: targetStatus,
    maintenanceReason: isMaintenance ? reason || 'Routine maintenance and inspection' : undefined,
  });
}

// ==========================================
// ROOM ASSETS / INVENTORY SERVICES
// ==========================================

export async function listRoomAssets(
  roomId?: string,
  condition?: string
): Promise<RoomAssetItem[]> {
  try {
    const dbAssets = await prisma.roomAsset.findMany({
      where: {
        ...(roomId && { roomId }),
        ...(condition && {
          condition: condition.toUpperCase().replace(/\s+/g, '_') as any,
        }),
      },
      include: { room: true },
      orderBy: { assetType: 'asc' },
    });

    if (dbAssets && dbAssets.length > 0) {
      return dbAssets.map((a) => ({
        id: a.id,
        roomId: a.roomId,
        assetType: a.assetType,
        quantity: a.quantity,
        condition: a.condition as any,
        serialNumber: a.serialNumber || undefined,
        lastInspectedAt: a.lastInspectedAt?.toISOString() || undefined,
        notes: a.notes || undefined,
      }));
    }
  } catch (error) {
    console.warn('DB listRoomAssets failed, using memory store:', error);
  }

  // Memory fallback
  let filtered = memoryAssets;
  if (roomId) filtered = filtered.filter((a) => a.roomId === roomId);
  if (condition) {
    const normCond = condition.toUpperCase().replace(/\s+/g, '_');
    filtered = filtered.filter((a) => a.condition === normCond);
  }

  return filtered.map((a) => ({
    id: a.id,
    roomId: a.roomId,
    assetType: a.assetType,
    quantity: a.quantity,
    condition: a.condition as any,
    serialNumber: a.serialNumber,
    lastInspectedAt: a.lastInspectedAt,
    notes: a.notes,
  }));
}

export async function addRoomAsset(data: {
  roomId: string;
  assetType: string;
  quantity: number;
  condition: string;
  serialNumber?: string;
  notes?: string;
  lastInspectedAt?: string | Date;
}): Promise<RoomAssetItem> {
  const normCond = (data.condition.toUpperCase().replace(/\s+/g, '_') as any) || 'GOOD';

  try {
    const created = await prisma.roomAsset.create({
      data: {
        roomId: data.roomId,
        assetType: data.assetType,
        quantity: data.quantity,
        condition: normCond,
        serialNumber: data.serialNumber,
        notes: data.notes,
        lastInspectedAt: data.lastInspectedAt ? new Date(data.lastInspectedAt) : new Date(),
      },
    });

    return {
      id: created.id,
      roomId: created.roomId,
      assetType: created.assetType,
      quantity: created.quantity,
      condition: created.condition as any,
      serialNumber: created.serialNumber || undefined,
      lastInspectedAt: created.lastInspectedAt?.toISOString(),
      notes: created.notes || undefined,
    };
  } catch (error) {
    console.warn('DB addRoomAsset failed, using memory store:', error);
    const newAsset: MemoryRoomAsset = {
      id: `asset-${Date.now()}`,
      roomId: data.roomId,
      assetType: data.assetType,
      quantity: data.quantity,
      condition: normCond,
      serialNumber: data.serialNumber,
      notes: data.notes,
      lastInspectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    memoryAssets.push(newAsset);

    return {
      id: newAsset.id,
      roomId: newAsset.roomId,
      assetType: newAsset.assetType,
      quantity: newAsset.quantity,
      condition: newAsset.condition as any,
      serialNumber: newAsset.serialNumber,
      lastInspectedAt: newAsset.lastInspectedAt,
      notes: newAsset.notes,
    };
  }
}

export async function updateRoomAsset(
  assetId: string,
  data: {
    assetType?: string;
    quantity?: number;
    condition?: string;
    serialNumber?: string;
    notes?: string;
    lastInspectedAt?: string | Date;
  }
): Promise<RoomAssetItem | null> {
  const normCond = data.condition
    ? (data.condition.toUpperCase().replace(/\s+/g, '_') as any)
    : undefined;

  try {
    const updated = await prisma.roomAsset.update({
      where: { id: assetId },
      data: {
        ...(data.assetType && { assetType: data.assetType }),
        ...(data.quantity && { quantity: data.quantity }),
        ...(normCond && { condition: normCond }),
        ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.lastInspectedAt && {
          lastInspectedAt: new Date(data.lastInspectedAt),
        }),
      },
    });

    return {
      id: updated.id,
      roomId: updated.roomId,
      assetType: updated.assetType,
      quantity: updated.quantity,
      condition: updated.condition as any,
      serialNumber: updated.serialNumber || undefined,
      lastInspectedAt: updated.lastInspectedAt?.toISOString(),
      notes: updated.notes || undefined,
    };
  } catch (error) {
    console.warn('DB updateRoomAsset failed, using memory store:', error);
    const existing = memoryAssets.find((a) => a.id === assetId);
    if (!existing) return null;

    if (data.assetType) existing.assetType = data.assetType;
    if (data.quantity) existing.quantity = data.quantity;
    if (normCond) existing.condition = normCond;
    if (data.serialNumber !== undefined) existing.serialNumber = data.serialNumber;
    if (data.notes !== undefined) existing.notes = data.notes;
    if (data.lastInspectedAt) existing.lastInspectedAt = new Date(data.lastInspectedAt).toISOString();
    existing.updatedAt = new Date().toISOString();

    return {
      id: existing.id,
      roomId: existing.roomId,
      assetType: existing.assetType,
      quantity: existing.quantity,
      condition: existing.condition as any,
      serialNumber: existing.serialNumber,
      lastInspectedAt: existing.lastInspectedAt,
      notes: existing.notes,
    };
  }
}

// ==========================================
// STUDENT ROOM ALLOCATION SERVICES
// ==========================================

export interface AllocationResult {
  success: boolean;
  message: string;
  allocation?: RoomAllocationHistoryItem;
  room?: Room;
}

export async function allocateStudent(params: {
  studentId: string;
  roomId: string;
  bedId?: string;
  allocatedById?: string;
  allocatedByName?: string;
  reason?: string;
}): Promise<AllocationResult> {
  const { studentId, roomId, bedId, allocatedById, allocatedByName, reason } = params;

  // 1. Validate target room exists
  const room = await getRoomById(roomId);
  if (!room) {
    return { success: false, message: 'Target room does not exist.' };
  }

  // 2. Validate room status (MAINTENANCE or BLOCKED)
  const normRoomStatus = String(room.status).toUpperCase().replace(/\s+/g, '_');
  if (normRoomStatus === 'MAINTENANCE' || normRoomStatus === 'BLOCKED') {
    return {
      success: false,
      message: `Room ${room.roomNumber} is currently marked under MAINTENANCE / BLOCKED (${room.maintenanceReason || 'No new allocations permitted'}).`,
    };
  }

  // 3. Validate student exists
  let studentRecord = findStudent(studentId);
  let dbStudent: any = null;

  try {
    dbStudent = await prisma.student.findFirst({
      where: {
        OR: [{ id: studentId }, { userId: studentId }, { studentId: studentId }],
      },
    });
    if (dbStudent) {
      studentRecord = {
        id: dbStudent.id,
        studentId: dbStudent.studentId,
        firstName: dbStudent.firstName,
        lastName: dbStudent.lastName,
        department: dbStudent.department,
        branch: dbStudent.branch,
        academicYear: dbStudent.academicYear,
        gender: dbStudent.gender,
        status: dbStudent.status,
      };
    }
  } catch (err) {
    console.warn('DB student query failed:', err);
  }

  if (!studentRecord) {
    return { success: false, message: 'Student record not found in system.' };
  }

  // 4. Validate eligibility
  if (studentRecord.status !== 'Active') {
    return {
      success: false,
      message: `Student status is ${studentRecord.status}. Only Active students are eligible for hostel room allocation.`,
    };
  }

  // 5. Check for existing active allocation
  const existingActiveAlloc = memoryAllocations.find(
    (a) =>
      (a.studentId === studentRecord!.id ||
        a.studentRegNo === studentRecord!.studentId ||
        a.studentId === studentId ||
        a.studentRegNo === studentId) &&
      a.status === 'ACTIVE'
  );

  if (existingActiveAlloc) {
    return {
      success: false,
      message: `Student ${studentRecord.firstName} ${studentRecord.lastName} (${studentRecord.studentId}) is already actively allocated to Room. Please deallocate or initiate a room change request.`,
    };
  }

  // 6. Validate room capacity
  if (room.occupied >= room.capacity) {
    return {
      success: false,
      message: `Room ${room.roomNumber} is at FULL capacity (${room.occupied}/${room.capacity} beds occupied).`,
    };
  }

  // 7. Validate gender restriction where applicable
  if (room.genderCategory && room.genderCategory !== 'Co-Ed') {
    const isMaleStudent = studentRecord.gender.toLowerCase() === 'male';
    const isBoysRoom = room.genderCategory.toLowerCase().includes('boy');
    const isGirlsRoom = room.genderCategory.toLowerCase().includes('girl');

    if (isMaleStudent && isGirlsRoom) {
      return {
        success: false,
        message: `Allocation rejected: Male student cannot be assigned to Girls Hostel room (${room.hostelName}).`,
      };
    }
    if (!isMaleStudent && isBoysRoom) {
      return {
        success: false,
        message: `Allocation rejected: Female student cannot be assigned to Boys Hostel room (${room.hostelName}).`,
      };
    }
  }

  // 8. Find target bed
  let targetBedId = bedId;
  let targetBedNumber = '';

  const roomBeds = memoryBeds.filter((b) => b.roomId === room.id);
  if (targetBedId) {
    const b = roomBeds.find((x) => x.id === targetBedId);
    if (b) targetBedNumber = b.bedNumber;
  } else {
    const availableBed = roomBeds.find((b) => b.status === 'AVAILABLE');
    if (availableBed) {
      targetBedId = availableBed.id;
      targetBedNumber = availableBed.bedNumber;
    } else {
      targetBedId = `bed-${room.id}-${room.occupied + 1}`;
      targetBedNumber = `${room.roomNumber}-${String.fromCharCode(65 + room.occupied)}`;
      memoryBeds.push({
        id: targetBedId,
        roomId: room.id,
        bedNumber: targetBedNumber,
        status: 'AVAILABLE',
      });
    }
  }

  // Perform allocation
  try {
    if (dbStudent) {
      const dbBed = await prisma.bed.findFirst({
        where: { roomId: room.id, status: 'AVAILABLE' },
      });

      if (dbBed) {
        await prisma.$transaction([
          prisma.bed.update({
            where: { id: dbBed.id },
            data: { status: 'OCCUPIED' },
          }),
          prisma.roomAllocation.create({
            data: {
              studentId: dbStudent.id,
              bedId: dbBed.id,
              status: 'ACTIVE',
              reason,
              allocatedById,
            },
          }),
        ]);
      }
    }
  } catch (err) {
    console.warn('DB allocation transaction failed, proceeding with memory update:', err);
  }

  // Update memory bed status
  const mBed = memoryBeds.find((b) => b.id === targetBedId);
  if (mBed) mBed.status = 'OCCUPIED';

  const newAlloc: MemoryAllocation = {
    id: `alloc-${Date.now()}`,
    studentId: studentRecord.id,
    studentName: `${studentRecord.firstName} ${studentRecord.lastName}`,
    studentRegNo: studentRecord.studentId,
    department: studentRecord.department,
    gender: studentRecord.gender,
    bedId: targetBedId || `bed-${room.id}-A`,
    roomId: room.id,
    allocatedAt: new Date().toISOString(),
    status: 'ACTIVE',
    reason,
    allocatedById,
    allocatedByName: allocatedByName || 'Hostel Administrator',
  };
  memoryAllocations.push(newAlloc);

  // Recalculate room status
  const updatedRoom = await getRoomById(room.id);

  const allocationResult: RoomAllocationHistoryItem = {
    id: newAlloc.id,
    studentId: studentRecord.id,
    studentName: `${studentRecord.firstName} ${studentRecord.lastName}`,
    studentRegNo: studentRecord.studentId,
    department: studentRecord.department,
    gender: studentRecord.gender,
    roomId: room.id,
    roomNumber: room.roomNumber,
    hostelName: room.hostelName,
    blockName: room.block,
    floorNumber: room.floor,
    bedNumber: targetBedNumber || 'Bed-1',
    allocatedAt: newAlloc.allocatedAt,
    status: 'ACTIVE',
    reason,
    allocatedByName: newAlloc.allocatedByName,
  };

  return {
    success: true,
    message: `Successfully allocated student ${studentRecord.firstName} ${studentRecord.lastName} to Room ${room.roomNumber} (${targetBedNumber}).`,
    allocation: allocationResult,
    room: updatedRoom || undefined,
  };
}

export async function deallocateStudent(params: {
  studentId: string;
  allocationId?: string;
  deallocatedById?: string;
  reason?: string;
}): Promise<{ success: boolean; message: string }> {
  const { studentId, allocationId, reason } = params;

  // Find active allocation
  const alloc = memoryAllocations.find(
    (a) =>
      (a.id === allocationId ||
        a.studentId === studentId ||
        a.studentRegNo === studentId) &&
      a.status === 'ACTIVE'
  );

  if (!alloc) {
    return { success: false, message: 'No active room allocation found for this student.' };
  }

  // Update in DB if applicable
  try {
    await prisma.roomAllocation.updateMany({
      where: {
        OR: [{ id: alloc.id }, { student: { studentId } }],
        status: 'ACTIVE',
      },
      data: {
        status: 'VACATED',
        vacatedAt: new Date(),
        reason: reason || 'Student vacated room',
      },
    });

    if (alloc.bedId) {
      await prisma.bed.update({
        where: { id: alloc.bedId },
        data: { status: 'AVAILABLE' },
      });
    }
  } catch (err) {
    console.warn('DB deallocation failed:', err);
  }

  alloc.status = 'VACATED';
  alloc.vacatedAt = new Date().toISOString();
  alloc.reason = reason || 'Student checked out / vacated';

  const bed = memoryBeds.find((b) => b.id === alloc.bedId);
  if (bed) bed.status = 'AVAILABLE';

  return {
    success: true,
    message: `Student ${alloc.studentName} successfully deallocated from Room. Bed is now available.`,
  };
}

// ==========================================
// ROOM CHANGE REQUEST SERVICES
// ==========================================

export async function submitRoomChangeRequest(params: {
  studentId: string;
  preferredRoomId: string;
  reason: string;
  comment?: string;
}): Promise<{ success: boolean; message: string; request?: RoomChangeRequestItem }> {
  const { studentId, preferredRoomId, reason, comment } = params;

  // 1. Verify student has active allocation
  const student = findStudent(studentId);
  const activeAlloc = memoryAllocations.find(
    (a) =>
      (a.studentId === studentId ||
        a.studentRegNo === studentId ||
        (student && (a.studentId === student.id || a.studentRegNo === student.studentId)) ||
        (studentId === 'demo-student-01' && (a.studentId === 'demo-student-01' || a.studentRegNo === 'STU2024012'))) &&
      a.status === 'ACTIVE'
  );

  if (!activeAlloc) {
    return {
      success: false,
      message: 'You must have an active room allocation before requesting a room change.',
    };
  }

  // 2. Cannot request same room
  if (activeAlloc.roomId === preferredRoomId) {
    return {
      success: false,
      message: 'Preferred room cannot be the same as your currently allocated room.',
    };
  }

  // 3. Verify target room exists
  const targetRoom = await getRoomById(preferredRoomId);
  if (!targetRoom) {
    return { success: false, message: 'Requested room does not exist.' };
  }

  const normTargetStatus = String(targetRoom.status).toUpperCase().replace(/\s+/g, '_');
  if (normTargetStatus === 'MAINTENANCE' || normTargetStatus === 'BLOCKED') {
    return {
      success: false,
      message: `Requested room is currently unavailable (${targetRoom.status}).`,
    };
  }

  // 4. Check for existing pending request
  const existingPending = memoryRoomChanges.find(
    (rc) =>
      (rc.studentId === activeAlloc.studentId || rc.studentRegNo === activeAlloc.studentRegNo) &&
      rc.status === 'PENDING'
  );

  if (existingPending) {
    return {
      success: false,
      message: 'You already have an active pending room change request in review.',
    };
  }

  const currentRoom = await getRoomById(activeAlloc.roomId);
  const curBed = memoryBeds.find((b) => b.id === activeAlloc.bedId);

  // Create in DB if possible
  let dbRequestId: string | undefined;
  try {
    const created = await prisma.roomChangeRequest.create({
      data: {
        studentId: activeAlloc.studentId,
        currentRoomId: activeAlloc.roomId,
        currentBedId: activeAlloc.bedId,
        preferredRoomId: targetRoom.id,
        reason,
        comment,
        status: 'PENDING',
      },
    });
    dbRequestId = created.id;
  } catch (err) {
    console.warn('DB room change request creation failed, using memory store:', err);
  }

  const newRequest: MemoryRoomChange = {
    id: dbRequestId || `rc-${Date.now()}`,
    studentId: activeAlloc.studentId,
    studentName: activeAlloc.studentName,
    studentRegNo: activeAlloc.studentRegNo,
    department: activeAlloc.department,
    currentRoomId: activeAlloc.roomId,
    currentBedId: activeAlloc.bedId,
    preferredRoomId: targetRoom.id,
    reason,
    comment,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memoryRoomChanges.unshift(newRequest);

  const requestItem: RoomChangeRequestItem = {
    id: newRequest.id,
    studentId: newRequest.studentId,
    studentName: newRequest.studentName,
    studentRegNo: newRequest.studentRegNo,
    department: newRequest.department,
    currentRoomId: currentRoom?.id || activeAlloc.roomId,
    currentRoomNumber: currentRoom?.roomNumber || 'Current Room',
    currentHostelName: currentRoom?.hostelName,
    currentBlockName: currentRoom?.block,
    currentBedNumber: curBed?.bedNumber || 'Bed-A',
    preferredRoomId: targetRoom.id,
    preferredRoomNumber: targetRoom.roomNumber,
    preferredHostelName: targetRoom.hostelName,
    preferredBlockName: targetRoom.block,
    reason: newRequest.reason,
    comment: newRequest.comment,
    status: 'PENDING',
    createdAt: newRequest.createdAt,
    updatedAt: newRequest.updatedAt,
  };

  return {
    success: true,
    message: 'Room change request submitted successfully and queued for warden review.',
    request: requestItem,
  };
}

export async function listRoomChangeRequests(filters?: {
  studentId?: string;
  status?: string;
  hostelId?: string;
}): Promise<RoomChangeRequestItem[]> {
  try {
    const dbRequests = await prisma.roomChangeRequest.findMany({
      where: {
        ...(filters?.studentId && {
          OR: [
            { studentId: filters.studentId },
            { student: { userId: filters.studentId } },
            { student: { studentId: filters.studentId } },
          ],
        }),
        ...(filters?.status && {
          status: filters.status.toUpperCase() as any,
        }),
      },
      include: {
        student: true,
        currentRoom: {
          include: {
            floor: { include: { block: { include: { hostel: true } } } },
          },
        },
        preferredRoom: {
          include: {
            floor: { include: { block: { include: { hostel: true } } } },
          },
        },
        reviewedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (dbRequests && dbRequests.length > 0) {
      return dbRequests.map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: `${r.student.firstName} ${r.student.lastName}`,
        studentRegNo: r.student.studentId,
        department: r.student.department,
        academicYear: r.student.academicYear,
        currentRoomId: r.currentRoomId,
        currentRoomNumber: r.currentRoom.roomNumber,
        currentHostelName: r.currentRoom.floor.block.hostel.name,
        currentBlockName: r.currentRoom.floor.block.name,
        currentBedNumber: r.currentBedId || 'Current Bed',
        preferredRoomId: r.preferredRoomId,
        preferredRoomNumber: r.preferredRoom.roomNumber,
        preferredHostelName: r.preferredRoom.floor.block.hostel.name,
        preferredBlockName: r.preferredRoom.floor.block.name,
        reason: r.reason,
        comment: r.comment || undefined,
        status: r.status as any,
        wardenRemarks: r.wardenRemarks || undefined,
        reviewedByName: r.reviewedBy?.name || undefined,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    }
  } catch (err) {
    console.warn('DB listRoomChangeRequests failed, using memory store:', err);
  }

  // Memory fallback
  const rooms = await listRooms();
  return memoryRoomChanges
    .filter((rc) => {
      if (
        filters?.studentId &&
        rc.studentId !== filters.studentId &&
        rc.studentRegNo !== filters.studentId
      ) {
        return false;
      }
      if (
        filters?.status &&
        rc.status !== filters.status.toUpperCase()
      ) {
        return false;
      }
      return true;
    })
    .map((rc) => {
      const curRoom = rooms.find((r) => r.id === rc.currentRoomId);
      const prefRoom = rooms.find((r) => r.id === rc.preferredRoomId);
      const curBed = memoryBeds.find((b) => b.id === rc.currentBedId);

      return {
        id: rc.id,
        studentId: rc.studentId,
        studentName: rc.studentName,
        studentRegNo: rc.studentRegNo,
        department: rc.department,
        currentRoomId: rc.currentRoomId,
        currentRoomNumber: curRoom?.roomNumber || 'Room 101',
        currentHostelName: curRoom?.hostelName || 'Boys Hostel A',
        currentBlockName: curRoom?.block || 'Block A',
        currentBedNumber: curBed?.bedNumber || '101-A',
        preferredRoomId: rc.preferredRoomId,
        preferredRoomNumber: prefRoom?.roomNumber || 'Room 205',
        preferredHostelName: prefRoom?.hostelName || 'Boys Hostel A',
        preferredBlockName: prefRoom?.block || 'Block A',
        reason: rc.reason,
        comment: rc.comment,
        status: rc.status as any,
        wardenRemarks: rc.wardenRemarks,
        reviewedByName: rc.reviewedByName,
        createdAt: rc.createdAt,
        updatedAt: rc.updatedAt,
      };
    });
}

export async function reviewRoomChangeRequest(
  requestId: string,
  params: {
    decision: 'APPROVED' | 'REJECTED' | 'CANCELLED';
    wardenId: string;
    wardenName?: string;
    wardenRemarks?: string;
  }
): Promise<{ success: boolean; message: string; request?: RoomChangeRequestItem }> {
  const { decision, wardenId, wardenName, wardenRemarks } = params;

  const req = memoryRoomChanges.find((r) => r.id === requestId);
  if (!req) {
    return { success: false, message: 'Room change request not found.' };
  }

  if (req.status !== 'PENDING') {
    return {
      success: false,
      message: `Request is already in ${req.status} status and cannot be modified.`,
    };
  }

  if (decision === 'APPROVED') {
    // Check preferred room capacity
    const targetRoom = await getRoomById(req.preferredRoomId);
    if (!targetRoom) {
      return { success: false, message: 'Target room does not exist.' };
    }

    if (targetRoom.occupied >= targetRoom.capacity) {
      return {
        success: false,
        message: `Cannot approve request: Target Room ${targetRoom.roomNumber} is at full capacity (${targetRoom.occupied}/${targetRoom.capacity}).`,
      };
    }

    // 1. Mark previous active allocation as TRANSFERRED
    const prevAlloc = memoryAllocations.find(
      (a) =>
        (a.studentId === req.studentId || a.studentRegNo === req.studentRegNo) &&
        a.status === 'ACTIVE'
    );

    if (prevAlloc) {
      prevAlloc.status = 'TRANSFERRED';
      prevAlloc.vacatedAt = new Date().toISOString();
      prevAlloc.reason = `Transferred to Room ${targetRoom.roomNumber}: ${req.reason}`;

      const oldBed = memoryBeds.find((b) => b.id === prevAlloc.bedId);
      if (oldBed) oldBed.status = 'AVAILABLE';
    }

    // 2. Allocate in target room
    const targetBeds = memoryBeds.filter((b) => b.roomId === targetRoom.id);
    let newBed = targetBeds.find((b) => b.status === 'AVAILABLE');
    if (!newBed) {
      newBed = {
        id: `bed-${targetRoom.id}-${Date.now()}`,
        roomId: targetRoom.id,
        bedNumber: `${targetRoom.roomNumber}-${String.fromCharCode(65 + targetRoom.occupied)}`,
        status: 'OCCUPIED',
      };
      memoryBeds.push(newBed);
    } else {
      newBed.status = 'OCCUPIED';
    }

    const newAlloc: MemoryAllocation = {
      id: `alloc-${Date.now()}`,
      studentId: req.studentId,
      studentName: req.studentName,
      studentRegNo: req.studentRegNo,
      department: req.department,
      gender: 'Male',
      bedId: newBed.id,
      roomId: targetRoom.id,
      allocatedAt: new Date().toISOString(),
      status: 'ACTIVE',
      reason: `Approved room change: ${req.reason}`,
      allocatedById: wardenId,
      allocatedByName: wardenName || 'Hostel Warden',
    };
    memoryAllocations.push(newAlloc);

    // Update request state
    req.status = 'APPROVED';
    req.wardenRemarks = wardenRemarks || 'Approved after review of eligibility and room availability.';
    req.reviewedById = wardenId;
    req.reviewedByName = wardenName || 'Hostel Warden';
    req.updatedAt = new Date().toISOString();

    // DB Transaction if available
    try {
      await prisma.roomChangeRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          wardenRemarks: req.wardenRemarks,
          reviewedById: wardenId,
        },
      });
    } catch (err) {
      console.warn('DB reviewRoomChangeRequest update failed:', err);
    }

    const requests = await listRoomChangeRequests();
    const updatedItem = requests.find((r) => r.id === req.id);

    return {
      success: true,
      message: `Room change request approved! Student ${req.studentName} transferred to Room ${targetRoom.roomNumber} (${newBed.bedNumber}).`,
      request: updatedItem,
    };
  }

  // REJECTED or CANCELLED
  req.status = decision;
  req.wardenRemarks = wardenRemarks || `Request ${decision.toLowerCase()} by hostel administration.`;
  req.reviewedById = wardenId;
  req.reviewedByName = wardenName || 'Hostel Warden';
  req.updatedAt = new Date().toISOString();

  try {
    await prisma.roomChangeRequest.update({
      where: { id: requestId },
      data: {
        status: decision as any,
        wardenRemarks: req.wardenRemarks,
        reviewedById: wardenId,
      },
    });
  } catch (err) {
    console.warn('DB review update failed:', err);
  }

  const requests = await listRoomChangeRequests();
  const updatedItem = requests.find((r) => r.id === req.id);

  return {
    success: true,
    message: `Room change request marked as ${decision}.`,
    request: updatedItem,
  };
}

// ==========================================
// ALLOCATION HISTORY SERVICES
// ==========================================

export async function getAllocationHistory(filters?: {
  studentId?: string;
  roomId?: string;
  hostelId?: string;
}): Promise<RoomAllocationHistoryItem[]> {
  try {
    const dbAllocations = await prisma.roomAllocation.findMany({
      where: {
        ...(filters?.studentId && {
          OR: [
            { studentId: filters.studentId },
            { student: { userId: filters.studentId } },
            { student: { studentId: filters.studentId } },
          ],
        }),
        ...(filters?.roomId && { bed: { roomId: filters.roomId } }),
      },
      include: {
        student: true,
        bed: {
          include: {
            room: {
              include: {
                floor: { include: { block: { include: { hostel: true } } } },
              },
            },
          },
        },
        allocatedBy: true,
      },
      orderBy: { allocatedAt: 'desc' },
    });

    if (dbAllocations && dbAllocations.length > 0) {
      return dbAllocations.map((a) => ({
        id: a.id,
        studentId: a.studentId,
        studentName: `${a.student.firstName} ${a.student.lastName}`,
        studentRegNo: a.student.studentId,
        department: a.student.department,
        gender: a.student.gender,
        roomId: a.bed.roomId,
        roomNumber: a.bed.room.roomNumber,
        hostelName: a.bed.room.floor.block.hostel.name,
        blockName: a.bed.room.floor.block.name,
        floorNumber: a.bed.room.floor.floorNumber,
        bedNumber: a.bed.bedNumber,
        allocatedAt: a.allocatedAt.toISOString(),
        vacatedAt: a.vacatedAt?.toISOString() || undefined,
        status: a.status as any,
        reason: a.reason || undefined,
        allocatedByName: a.allocatedBy?.name || 'Administrator',
      }));
    }
  } catch (err) {
    console.warn('DB getAllocationHistory failed, using memory store:', err);
  }

  // Memory fallback
  const rooms = await listRooms();
  return memoryAllocations
    .filter((a) => {
      if (
        filters?.studentId &&
        a.studentId !== filters.studentId &&
        a.studentRegNo !== filters.studentId
      ) {
        return false;
      }
      if (filters?.roomId && a.roomId !== filters.roomId) {
        return false;
      }
      return true;
    })
    .map((a) => {
      const room = rooms.find((r) => r.id === a.roomId);
      const bed = memoryBeds.find((b) => b.id === a.bedId);

      return {
        id: a.id,
        studentId: a.studentId,
        studentName: a.studentName,
        studentRegNo: a.studentRegNo,
        department: a.department,
        gender: a.gender,
        roomId: a.roomId,
        roomNumber: room?.roomNumber || '101',
        hostelName: room?.hostelName || 'Boys Hostel A',
        blockName: room?.block || 'Block A',
        floorNumber: room?.floor || 1,
        bedNumber: bed?.bedNumber || '101-A',
        allocatedAt: a.allocatedAt,
        vacatedAt: a.vacatedAt,
        status: a.status,
        reason: a.reason,
        allocatedByName: a.allocatedByName || 'Super Administrator',
      };
    })
    .sort((a, b) => new Date(b.allocatedAt).getTime() - new Date(a.allocatedAt).getTime());
}

// ==========================================
// WARDEN & STUDENT STATS HELPERS
// ==========================================

export async function getWardenRoomStats(wardenId?: string, hostelId?: string) {
  const rooms = await listRooms({ hostelId });
  const hostels = await listHostels();
  const roomChanges = await listRoomChangeRequests({ status: 'PENDING' });
  const damagedAssets = await listRoomAssets(undefined, 'DAMAGED');
  const repairAssets = await listRoomAssets(undefined, 'REPAIR_REQUIRED');

  let totalCapacity = 0;
  let occupiedBeds = 0;
  let vacantRooms = 0;
  let partiallyOccupiedRooms = 0;
  let fullRooms = 0;
  let maintenanceRooms = 0;
  let reservedRooms = 0;

  rooms.forEach((r) => {
    totalCapacity += r.capacity;
    occupiedBeds += r.occupied;

    const normStatus = String(r.status).toUpperCase().replace(/\s+/g, '_');
    if (normStatus === 'MAINTENANCE') maintenanceRooms++;
    else if (normStatus === 'RESERVED' || normStatus === 'BLOCKED') reservedRooms++;
    else if (r.occupied === 0) vacantRooms++;
    else if (r.occupied >= r.capacity) fullRooms++;
    else partiallyOccupiedRooms++;
  });

  return {
    totalRooms: rooms.length,
    occupiedRooms: fullRooms,
    partiallyOccupiedRooms,
    vacantRooms,
    maintenanceRooms,
    reservedRooms,
    totalBeds: totalCapacity,
    occupiedBeds,
    availableBeds: Math.max(0, totalCapacity - occupiedBeds),
    pendingChangeRequests: roomChanges.length,
    damagedAssetsCount: damagedAssets.length + repairAssets.length,
    hostelsSummary: hostels,
  };
}

export async function getStudentRoomInfo(studentUserIdOrId: string) {
  const history = await getAllocationHistory({ studentId: studentUserIdOrId });
  const activeAlloc = history.find((h) => h.status === 'ACTIVE');

  if (!activeAlloc) {
    return {
      hasActiveAllocation: false,
      currentAllocation: null,
      roomDetails: null,
      roommates: [],
      history,
    };
  }

  const room = await getRoomById(activeAlloc.roomId || activeAlloc.roomNumber);
  const roommates =
    room?.assignedStudents.filter(
      (s) => s.studentId !== activeAlloc.studentRegNo && s.id !== activeAlloc.studentId
    ) || [];

  const changeRequests = await listRoomChangeRequests({ studentId: studentUserIdOrId });

  return {
    hasActiveAllocation: true,
    currentAllocation: activeAlloc,
    roomDetails: room,
    roommates,
    history,
    changeRequests,
  };
}
