/**
 * Phase 5 Comprehensive Verification & Test Suite
 * Campus Hostel Management System (HMS)
 */

async function runPhase5Tests() {
  const BASE_URL = 'http://localhost:3000';
  console.log('====================================================');
  console.log('RUNNING PHASE 5: HOSTEL, FLOOR, ROOM & ALLOCATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
    }
  }

  // 1. Helper to log in and get session cookie
  async function loginAs(email: string, role: string): Promise<string> {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'CampusHMS@2026',
        portalRole: role,
      }),
    });
    const setCookie = res.headers.get('set-cookie');
    return setCookie?.split(';')[0] || '';
  }

  // Obtain cookies
  const adminCookie = await loginAs('admin@campushms.local', 'SUPER_ADMIN');
  const wardenCookie = await loginAs('warden@campushms.local', 'WARDEN');
  const studentCookie = await loginAs('student@campushms.local', 'STUDENT');
  const maintenanceCookie = await loginAs('maintenance@campushms.local', 'MAINTENANCE');
  const parentCookie = await loginAs('parent@campushms.local', 'PARENT');

  assert(Boolean(adminCookie), '1. Super Admin authenticated with HTTP-only session');
  assert(Boolean(wardenCookie), '1. Warden authenticated with HTTP-only session');
  assert(Boolean(studentCookie), '1. Student authenticated with HTTP-only session');
  assert(Boolean(maintenanceCookie), '1. Maintenance staff authenticated with HTTP-only session');

  // ==========================================
  // 2. HOSTEL MANAGEMENT TESTS
  // ==========================================
  console.log('\n--- 2. HOSTEL MANAGEMENT ---');
  let createdHostelId = '';
  try {
    // List Hostels
    const listRes = await fetch(`${BASE_URL}/api/hostels`, {
      headers: { Cookie: adminCookie },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, '2.1 List hostels returns HTTP 200');
    assert(Array.isArray(listData.hostels), '2.1 Hostels array returned');
    assert(listData.hostels.length >= 2, '2.1 Pre-seeded hostels (Boys Hostel A, Girls Hostel A) exist');

    // Create New Hostel as Super Admin
    const createRes = await fetch(`${BASE_URL}/api/hostels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: 'International Scholars Hostel',
        code: 'ISH',
        genderCategory: 'Co-Ed',
        address: 'North Extension Campus',
        capacity: 250,
        isActive: true,
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, '2.2 Super Admin can register new hostel (HTTP 201)');
    assert(createData.success === true, '2.2 Hostel creation returns success');
    assert(createData.hostel?.code === 'ISH', '2.2 Created hostel code is ISH');
    createdHostelId = createData.hostel?.id;

    // Student cannot create hostel (RBAC 403)
    const studentCreateRes = await fetch(`${BASE_URL}/api/hostels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        name: 'Unauthorized Hostel',
        code: 'UNAUTH',
        genderCategory: 'Boys',
        capacity: 100,
      }),
    });
    assert(studentCreateRes.status === 403, '2.3 Student cannot create hostel (RBAC 403 Forbidden)');

    // Update Hostel Details
    const updateRes = await fetch(`${BASE_URL}/api/hostels/${createdHostelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        capacity: 280,
        address: 'North Extension Campus - Wing B',
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, '2.4 Super Admin can update hostel capacity and address');
    assert(updateData.hostel?.capacity === 280, '2.4 Hostel capacity successfully updated to 280');
  } catch (err) {
    assert(false, `Hostel management test failed: ${err}`);
  }

  // ==========================================
  // 3. BLOCK MANAGEMENT TESTS
  // ==========================================
  console.log('\n--- 3. BLOCK MANAGEMENT ---');
  let createdBlockId = '';
  try {
    const listRes = await fetch(`${BASE_URL}/api/blocks`, {
      headers: { Cookie: wardenCookie },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, '3.1 List blocks returns HTTP 200');
    assert(Array.isArray(listData.blocks), '3.1 Blocks array returned');
    assert(listData.blocks.length >= 3, '3.1 Seeded blocks exist');

    // Create New Block
    const createRes = await fetch(`${BASE_URL}/api/blocks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        hostelId: createdHostelId || 'hostel-bha',
        name: 'Block International A',
        code: 'BLK-INT-A',
        numberOfFloors: 3,
        genderCategory: 'Co-Ed',
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, '3.2 Warden can create new block (HTTP 201)');
    assert(createData.block?.name === 'Block International A', '3.2 Block name matches');
    createdBlockId = createData.block?.id;
  } catch (err) {
    assert(false, `Block management test failed: ${err}`);
  }

  // ==========================================
  // 4. FLOOR MANAGEMENT TESTS
  // ==========================================
  console.log('\n--- 4. FLOOR MANAGEMENT ---');
  let createdFloorId = '';
  try {
    const listRes = await fetch(`${BASE_URL}/api/floors`, {
      headers: { Cookie: wardenCookie },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, '4.1 List floors returns HTTP 200');
    assert(Array.isArray(listData.floors), '4.1 Floors array returned');

    // Create New Floor
    const createRes = await fetch(`${BASE_URL}/api/floors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        blockId: createdBlockId || 'blk-a1',
        floorNumber: 1,
        name: 'First Floor Scholars Wing',
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, '4.2 Warden can register floor layout (HTTP 201)');
    assert(createData.floor?.floorNumber === 1, '4.2 Floor number registered');
    createdFloorId = createData.floor?.id;
  } catch (err) {
    assert(false, `Floor management test failed: ${err}`);
  }

  // ==========================================
  // 5. ROOM MANAGEMENT & MATRIX TESTS
  // ==========================================
  console.log('\n--- 5. ROOM MANAGEMENT & MATRIX ---');
  let testRoomId = '';
  try {
    // List Rooms with Filter
    const listRes = await fetch(`${BASE_URL}/api/rooms`, {
      headers: { Cookie: wardenCookie },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, '5.1 List rooms returns HTTP 200');
    assert(Array.isArray(listData.rooms), '5.1 Rooms array returned');
    assert(listData.rooms.length >= 5, '5.1 Rooms seeded in matrix');

    // Create New Room
    const createRes = await fetch(`${BASE_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        floorId: createdFloorId || 'flr-bha-1',
        roomNumber: '109',
        roomType: 'Double Occupancy',
        capacity: 2,
        genderCategory: 'Boys',
        status: 'VACANT',
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, '5.2 Warden can register new room with auto-beds and assets (HTTP 201)');
    assert(createData.room?.roomNumber === '109', '5.2 Room number is 109');
    assert(createData.room?.status === 'VACANT', '5.2 Initial room status is VACANT');
    assert(createData.room?.capacity === 2, '5.2 Room capacity is 2');
    testRoomId = createData.room?.id;

    // Retrieve Room by ID
    const getRes = await fetch(`${BASE_URL}/api/rooms/${testRoomId}`, {
      headers: { Cookie: wardenCookie },
    });
    const getData = await getRes.json();
    assert(getRes.status === 200, '5.3 Get room details by ID succeeds');
    assert(getData.room?.id === testRoomId, '5.3 Retrieved room ID matches');
    assert(getData.room?.occupied === 0, '5.3 Unallocated room has 0 occupied count');
    assert(getData.room?.availableCapacity === 2, '5.3 Available capacity matches 2');
  } catch (err) {
    assert(false, `Room management test failed: ${err}`);
  }

  // ==========================================
  // 6. ROOM ASSETS / INVENTORY TESTS
  // ==========================================
  console.log('\n--- 6. ROOM ASSETS & INVENTORY ---');
  let createdAssetId = '';
  try {
    const listAssetRes = await fetch(`${BASE_URL}/api/rooms/${testRoomId || 'rm-101'}/assets`, {
      headers: { Cookie: wardenCookie },
    });
    const listAssetData = await listAssetRes.json();
    assert(listAssetRes.status === 200, '6.1 List room assets returns HTTP 200');
    assert(Array.isArray(listAssetData.assets), '6.1 Assets array returned');

    // Add new asset
    const addAssetRes = await fetch(`${BASE_URL}/api/rooms/${testRoomId || 'rm-101'}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        assetType: 'Modular Bookshelf',
        quantity: 2,
        condition: 'GOOD',
        serialNumber: 'BS-109-01',
        notes: 'Pre-inspected prior to academic allotment',
      }),
    });
    const addAssetData = await addAssetRes.json();
    assert(addAssetRes.status === 201, '6.2 Warden/Maintenance can register room asset');
    assert(addAssetData.asset?.assetType === 'Modular Bookshelf', '6.2 Asset type matches');
    createdAssetId = addAssetData.asset?.id;

    // Update asset condition to DAMAGED
    const updateAssetRes = await fetch(`${BASE_URL}/api/rooms/${testRoomId || 'rm-101'}/assets`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: maintenanceCookie },
      body: JSON.stringify({
        assetId: createdAssetId,
        condition: 'DAMAGED',
        notes: 'Shelf bracket loose, needs repair dispatch',
      }),
    });
    const updateAssetData = await updateAssetRes.json();
    assert(updateAssetRes.status === 200, '6.3 Maintenance staff can update asset condition to DAMAGED');
    assert(updateAssetData.asset?.condition === 'DAMAGED', '6.3 Asset condition updated');
  } catch (err) {
    assert(false, `Room assets test failed: ${err}`);
  }

  // ==========================================
  // 7. ROOM MAINTENANCE TOGGLE & BLOCKING
  // ==========================================
  console.log('\n--- 7. ROOM MAINTENANCE STATUS & BLOCKING ---');
  try {
    // Mark room under maintenance
    const maintRes = await fetch(`${BASE_URL}/api/rooms/${testRoomId || 'rm-109'}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        action: 'SET_MAINTENANCE',
        isMaintenance: true,
        reason: 'Wall whitewash and bathroom tile repairs',
      }),
    });
    const maintData = await maintRes.json();
    assert(maintRes.status === 200, '7.1 Room can be placed under MAINTENANCE');
    assert(maintData.room?.status === 'MAINTENANCE', '7.1 Room status changed to MAINTENANCE');

    // Attempt to allocate student to room under maintenance (MUST FAIL)
    const allocBlockedRes = await fetch(`${BASE_URL}/api/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'STU2024099',
        roomId: testRoomId || 'rm-109',
        reason: 'Test allocation during maintenance',
      }),
    });
    const allocBlockedData = await allocBlockedRes.json();
    assert(allocBlockedRes.status === 400, '7.2 Allocation is blocked when room is under MAINTENANCE (HTTP 400)');
    assert(
      allocBlockedData.error?.includes('MAINTENANCE') || allocBlockedData.error?.includes('unavailable'),
      '7.2 Error explanation mentions maintenance restriction'
    );

    // Complete maintenance and restore room
    const restoreRes = await fetch(`${BASE_URL}/api/rooms/${testRoomId || 'rm-109'}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        action: 'SET_MAINTENANCE',
        isMaintenance: false,
      }),
    });
    const restoreData = await restoreRes.json();
    assert(restoreRes.status === 200, '7.3 Room maintenance marked completed');
    assert(restoreData.room?.status === 'VACANT', '7.3 Room status correctly recalculated to VACANT');
  } catch (err) {
    assert(false, `Room maintenance test failed: ${err}`);
  }

  // ==========================================
  // 8. STUDENT ALLOCATION & VALIDATIONS
  // ==========================================
  console.log('\n--- 8. STUDENT ALLOCATION & INVARIANTS ---');
  try {
    // 8.1 Allocate student Karan Mehta (STU2024099) to Room 109
    const allocRes = await fetch(`${BASE_URL}/api/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'STU2024099',
        roomId: testRoomId || 'rm-109',
        reason: 'Fresh semester accommodation allotment',
      }),
    });
    const allocData = await allocRes.json();
    assert(allocRes.status === 201, '8.1 Student successfully allocated to vacant room (HTTP 201)');
    assert(allocData.success === true, '8.1 Allocation returned success');
    assert(allocData.allocation?.roomNumber === '109', '8.1 Allocated room is 109');
    assert(allocData.room?.occupied === 1, '8.1 Room occupied count incremented to 1');
    assert(
      allocData.room?.status === 'PARTIALLY_OCCUPIED',
      '8.1 Room status automatically transitioned to PARTIALLY_OCCUPIED'
    );

    // 8.2 Duplicate active allocation prevention (Student cannot be allocated twice)
    const dupAllocRes = await fetch(`${BASE_URL}/api/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'STU2024099',
        roomId: 'rm-103',
        reason: 'Duplicate allocation attempt',
      }),
    });
    const dupAllocData = await dupAllocRes.json();
    assert(dupAllocRes.status === 400, '8.2 Duplicate active allocation prevented (HTTP 400)');
    assert(
      dupAllocData.error?.includes('already actively allocated'),
      '8.2 Error message highlights existing active allocation'
    );

    // 8.3 Gender restriction validation (Male student into Girls room MUST FAIL)
    const genderMismatchRes = await fetch(`${BASE_URL}/api/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'stu-demo-03', // Male
        roomId: 'rm-g102', // Girls room
        reason: 'Gender mismatch test',
      }),
    });
    const genderMismatchData = await genderMismatchRes.json();
    assert(genderMismatchRes.status === 400, '8.3 Gender restriction enforced (Male -> Girls Room rejected)');

    // 8.4 Allocate 2nd student (stu-demo-07 Rohan Sen) into Room 109 to reach FULL capacity
    const secondAllocRes = await fetch(`${BASE_URL}/api/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'stu-demo-07',
        roomId: testRoomId || 'rm-109',
        reason: 'Second bed allotment',
      }),
    });
    const secondAllocData = await secondAllocRes.json();
    assert(secondAllocRes.status === 201, '8.4 Second student allocated to Room 109');
    assert(secondAllocData.room?.occupied === 2, '8.4 Room 109 reached capacity (2/2)');
    assert(
      secondAllocData.room?.status === 'OCCUPIED' || secondAllocData.room?.status === 'FULL',
      '8.4 Room status transitioned to OCCUPIED/FULL'
    );

    // 8.5 Capacity overflow protection (Cannot allocate 3rd student into 2-bed room)
    const overflowRes = await fetch(`${BASE_URL}/api/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'stu-demo-08',
        roomId: testRoomId || 'rm-109',
        reason: 'Over-capacity test',
      }),
    });
    const overflowData = await overflowRes.json();
    assert(overflowRes.status === 400, '8.5 Over-capacity allocation blocked (occupied <= capacity invariant enforced)');
    assert(overflowData.error?.includes('FULL capacity'), '8.5 Error message states room is at FULL capacity');
  } catch (err) {
    assert(false, `Student allocation test failed: ${err}`);
  }

  // ==========================================
  // 9. STUDENT DEALLOCATION TESTS
  // ==========================================
  console.log('\n--- 9. STUDENT DEALLOCATION ---');
  try {
    const deallocRes = await fetch(`${BASE_URL}/api/allocations/deallocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'stu-demo-07',
        reason: 'Semester checkout',
      }),
    });
    const deallocData = await deallocRes.json();
    assert(deallocRes.status === 200, '9.1 Warden can deallocate resident (HTTP 200)');
    assert(deallocData.success === true, '9.1 Deallocation succeeds');

    // Verify room status dropped back to PARTIALLY_OCCUPIED
    const roomCheckRes = await fetch(`${BASE_URL}/api/rooms/${testRoomId || 'rm-109'}`, {
      headers: { Cookie: wardenCookie },
    });
    const roomCheckData = await roomCheckRes.json();
    assert(roomCheckData.room?.occupied === 1, '9.2 Room occupancy decreased to 1');
    assert(
      roomCheckData.room?.status === 'PARTIALLY_OCCUPIED',
      '9.2 Room status automatically updated to PARTIALLY_OCCUPIED'
    );
  } catch (err) {
    assert(false, `Deallocation test failed: ${err}`);
  }

  // ==========================================
  // 10. ROOM CHANGE REQUEST WORKFLOW
  // ==========================================
  console.log('\n--- 10. ROOM CHANGE REQUEST & WARDEN APPROVAL ---');
  let createdChangeRequestId = '';
  try {
    // 10.1 Student submits room change request to Room 205
    const submitChangeRes = await fetch(`${BASE_URL}/api/room-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        preferredRoomId: 'rm-205',
        reason: 'Medical ground floor preference and quiet study wing',
        comment: 'Physician certificate provided',
      }),
    });
    const submitChangeData = await submitChangeRes.json();
    assert(submitChangeRes.status === 201, '10.1 Student can submit room change request (HTTP 201)');
    assert(submitChangeData.success === true, '10.1 Request created successfully');
    assert(submitChangeData.request?.status === 'PENDING', '10.1 Initial status is PENDING');
    assert(submitChangeData.request?.preferredRoomNumber === '205', '10.1 Preferred room number is 205');
    createdChangeRequestId = submitChangeData.request?.id;

    // 10.2 Student cannot submit multiple pending requests
    const dupChangeRes = await fetch(`${BASE_URL}/api/room-changes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        preferredRoomId: 'rm-103',
        reason: 'Second concurrent change request attempt',
      }),
    });
    const dupChangeData = await dupChangeRes.json();
    assert(dupChangeRes.status === 400, '10.2 Multiple pending requests prevented for same student');
    assert(
      dupChangeData.error?.includes('already have an active pending room change request'),
      '10.2 Error message notes existing pending request'
    );

    // 10.3 Warden reviews and APPROVES room change request
    const approveRes = await fetch(`${BASE_URL}/api/room-changes/${createdChangeRequestId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        decision: 'APPROVED',
        wardenRemarks: 'Approved based on submitted medical recommendation and verified bed vacancy.',
      }),
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, '10.3 Warden can approve room change request (HTTP 200)');
    assert(approveData.success === true, '10.3 Approval returns success');
    assert(approveData.request?.status === 'APPROVED', '10.3 Request marked as APPROVED');

    // 10.4 Verify old room allocation ended as TRANSFERRED and new allocation created in Room 205
    const studentRoomRes = await fetch(`${BASE_URL}/api/student/room`, {
      headers: { Cookie: studentCookie },
    });
    const studentRoomData = await studentRoomRes.json();
    assert(studentRoomData.hasActiveAllocation === true, '10.4 Student has active allocation');
    assert(
      studentRoomData.roomDetails?.roomNumber === '205',
      '10.4 Student current room successfully transferred to Room 205'
    );
    assert(
      studentRoomData.history.some((h: any) => h.status === 'TRANSFERRED'),
      '10.4 Previous room allocation recorded as TRANSFERRED in history'
    );
  } catch (err) {
    assert(false, `Room change request test failed: ${err}`);
  }

  // ==========================================
  // 11. ALLOCATION HISTORY LEDGER
  // ==========================================
  console.log('\n--- 11. ALLOCATION HISTORY LEDGER ---');
  try {
    const historyRes = await fetch(`${BASE_URL}/api/allocations/history`, {
      headers: { Cookie: wardenCookie },
    });
    const historyData = await historyRes.json();
    assert(historyRes.status === 200, '11.1 Allocation history API returns HTTP 200');
    assert(Array.isArray(historyData.history), '11.1 History records array returned');
    assert(historyData.history.length >= 3, '11.1 Contains multiple historical transitions');
    assert(
      historyData.history.every((h: any) => h.studentName && h.roomNumber && h.allocatedAt),
      '11.1 History records have complete metadata (student, room, bed, dates, status)'
    );
  } catch (err) {
    assert(false, `Allocation history test failed: ${err}`);
  }

  // ==========================================
  // 12. WARDEN ROOM STATS & STUDENT DASHBOARD
  // ==========================================
  console.log('\n--- 12. DASHBOARD APIS ---');
  try {
    // Warden Stats API
    const statsRes = await fetch(`${BASE_URL}/api/warden/room-stats`, {
      headers: { Cookie: wardenCookie },
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200, '12.1 Warden room stats API returns HTTP 200');
    assert(statsData.stats?.totalRooms >= 5, '12.1 Total rooms stat is accurate');
    assert(statsData.stats?.totalBeds >= 10, '12.1 Total beds stat is accurate');
    assert(statsData.stats?.occupiedBeds >= 1, '12.1 Occupied beds stat is tracked');
    assert(
      statsData.stats?.availableBeds === statsData.stats?.totalBeds - statsData.stats?.occupiedBeds,
      '12.1 Available beds equals totalBeds - occupiedBeds'
    );

    // Student Room Info API
    const studentInfoRes = await fetch(`${BASE_URL}/api/student/room`, {
      headers: { Cookie: studentCookie },
    });
    const studentInfoData = await studentInfoRes.json();
    assert(studentInfoRes.status === 200, '12.2 Student room info API returns HTTP 200');
    assert(studentInfoData.roomDetails !== null, '12.2 Student room details populated');
    assert(Array.isArray(studentInfoData.roommates), '12.2 Roommates array returned');
  } catch (err) {
    assert(false, `Dashboard APIs test failed: ${err}`);
  }

  console.log('\n====================================================');
  console.log(`PHASE 5 TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================');

  if (passed === total) {
    console.log('🎉 ALL PHASE 5 TESTS COMPLETED AND VERIFIED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} TESTS FAILED. PLEASE INVESTIGATE.`);
    process.exit(1);
  }
}

runPhase5Tests();
