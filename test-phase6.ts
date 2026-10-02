import { Role } from '@prisma/client';

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition: boolean, message: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    failed++;
    console.error(`❌ FAIL: ${message}`);
  }
}

async function loginAndGetCookie(email: string, role: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'CampusHMS@2026',
      portalRole: role,
    }),
  });

  const cookie = res.headers.get('set-cookie');
  if (!cookie) {
    throw new Error(`Failed to login for ${email} with role ${role}, status: ${res.status}`);
  }

  // Extract session token
  const match = cookie.match(/hms_session=([^;]+)/);
  return match ? `hms_session=${match[1]}` : cookie;
}

async function runPhase6Tests() {
  console.log('====================================================');
  console.log('RUNNING PHASE 6: OPERATIONAL WORKFLOW INTEGRATION SUITE');
  console.log('====================================================\n');

  let adminCookie = '';
  let wardenCookie = '';
  let studentCookie = '';
  let parentCookie = '';
  let maintenanceCookie = '';
  let securityCookie = '';
  let financeCookie = '';

  try {
    // 1. Authenticate all 7 roles with HTTP-Only sessions
    adminCookie = await loginAndGetCookie('admin@campushms.local', 'SUPER_ADMIN');
    assert(!!adminCookie, '1. Super Admin authenticated with HTTP-only session');

    wardenCookie = await loginAndGetCookie('warden@campushms.local', 'WARDEN');
    assert(!!wardenCookie, '1. Warden authenticated with HTTP-only session');

    studentCookie = await loginAndGetCookie('student@campushms.local', 'STUDENT');
    assert(!!studentCookie, '1. Student authenticated with HTTP-only session');

    parentCookie = await loginAndGetCookie('parent@campushms.local', 'PARENT');
    assert(!!parentCookie, '1. Parent authenticated with HTTP-only session');

    maintenanceCookie = await loginAndGetCookie('maintenance@campushms.local', 'MAINTENANCE');
    assert(!!maintenanceCookie, '1. Maintenance staff authenticated with HTTP-only session');

    securityCookie = await loginAndGetCookie('security@campushms.local', 'SECURITY');
    assert(!!securityCookie, '1. Security desk staff authenticated with HTTP-only session');

    financeCookie = await loginAndGetCookie('finance@campushms.local', 'FINANCE');
    assert(!!financeCookie, '1. Finance officer authenticated with HTTP-only session');
  } catch (err) {
    console.error('Initial login setup failed:', err);
    process.exit(1);
  }

  // ==========================================
  // 2. ADMIN OPERATIONAL CONTROL & USER MANAGEMENT
  // ==========================================
  console.log('\n--- 2. ADMIN OPERATIONAL CONTROL & USER GOVERNANCE ---');
  try {
    // 2.1 List all users
    const listUsersRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: adminCookie },
    });
    const listUsersData = await listUsersRes.json();
    assert(listUsersRes.status === 200, '2.1 Super Admin can list users (HTTP 200)');
    assert(Array.isArray(listUsersData.users), '2.1 Users array is returned');
    assert(listUsersData.users.length >= 7, '2.1 All system accounts present in user ledger');
    assert(
      listUsersData.users.every((u: any) => u.passwordHash === undefined),
      '2.1 Password hashes are never exposed in user management API'
    );

    // 2.2 Filter users by role
    const wardenFilterRes = await fetch(`${BASE_URL}/api/admin/users?role=WARDEN`, {
      headers: { Cookie: adminCookie },
    });
    const wardenFilterData = await wardenFilterRes.json();
    assert(wardenFilterRes.status === 200, '2.2 Role-based user filter succeeds (HTTP 200)');
    assert(
      wardenFilterData.users.every((u: any) => u.role === 'WARDEN'),
      '2.2 Filtered results strictly contain WARDEN role accounts'
    );

    // 2.3 Non-admin blocked from listing users
    const studentUserRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: studentCookie },
    });
    assert(studentUserRes.status === 403, '2.3 Student denied access to /api/admin/users (RBAC 403)');

    const wardenUserRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: wardenCookie },
    });
    assert(wardenUserRes.status === 403, '2.3 Warden denied access to /api/admin/users (RBAC 403)');

    // 2.4 Super Admin activates / deactivates user
    const deactivateRes = await fetch(`${BASE_URL}/api/admin/users/demo-security-01`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ isActive: false }),
    });
    const deactivateData = await deactivateRes.json();
    assert(deactivateRes.status === 200, '2.4 Super Admin can deactivate user account (HTTP 200)');
    assert(deactivateData.user?.isActive === false, '2.4 User status updated to deactivated (isActive = false)');

    // Restore user
    const activateRes = await fetch(`${BASE_URL}/api/admin/users/demo-security-01`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ isActive: true }),
    });
    const activateData = await activateRes.json();
    assert(activateRes.status === 200, '2.4 Super Admin can restore active user account');
    assert(activateData.user?.isActive === true, '2.4 User status restored to active');

    // 2.5 Self-lockout protection
    const selfDeactivateRes = await fetch(`${BASE_URL}/api/admin/users/demo-super-admin-01`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ isActive: false }),
    });
    assert(selfDeactivateRes.status === 400, '2.5 Self-lockout protection prevents Super Admin deactivating own account');

    // 2.6 Admin Governance Overview
    const adminOverviewRes = await fetch(`${BASE_URL}/api/admin/overview`, {
      headers: { Cookie: adminCookie },
    });
    const adminOverviewData = await adminOverviewRes.json();
    assert(adminOverviewRes.status === 200, '2.6 Admin governance overview returns HTTP 200');
    assert(adminOverviewData.overview?.totalUsers >= 7, '2.6 Total users count accurately computed');
    assert(adminOverviewData.overview?.totalHostels >= 2, '2.6 Total hostels count integrated');
    assert(adminOverviewData.overview?.totalCapacity >= 1000, '2.6 Total capacity aggregated from hostel inventory');
  } catch (err) {
    assert(false, `Admin operational control tests failed: ${err}`);
  }

  // ==========================================
  // 3. WARDEN OPERATIONAL WORKFLOW
  // ==========================================
  console.log('\n--- 3. WARDEN OPERATIONAL WORKFLOW ---');
  try {
    // 3.1 Warden Room Stats API
    const roomStatsRes = await fetch(`${BASE_URL}/api/warden/room-stats`, {
      headers: { Cookie: wardenCookie },
    });
    const roomStatsData = await roomStatsRes.json();
    assert(roomStatsRes.status === 200, '3.1 Warden can fetch live room and bed occupancy stats');
    assert(roomStatsData.stats?.totalRooms >= 5, '3.1 Total rooms tracked in warden scope');
    assert(roomStatsData.stats?.totalBeds >= 10, '3.1 Total beds tracked');

    // 3.2 Warden view complaints
    const complaintsRes = await fetch(`${BASE_URL}/api/complaints`, {
      headers: { Cookie: wardenCookie },
    });
    const complaintsData = await complaintsRes.json();
    assert(complaintsRes.status === 200, '3.2 Warden can review hostel complaints list');
    assert(Array.isArray(complaintsData.complaints), '3.2 Complaints array returned');

    // 3.3 Warden view monthly feedback analytics
    const feedbackRes = await fetch(`${BASE_URL}/api/monthly-feedback/analytics?month=10&year=2026`, {
      headers: { Cookie: wardenCookie },
    });
    const feedbackData = await feedbackRes.json();
    assert(feedbackRes.status === 200, '3.3 Warden permitted access to hostel feedback analytics');
    assert(feedbackData.analytics?.averageOverall > 0, '3.3 Overall feedback satisfaction computed');

    // 3.4 Warden view allocation history ledger
    const historyRes = await fetch(`${BASE_URL}/api/allocations/history`, {
      headers: { Cookie: wardenCookie },
    });
    const historyData = await historyRes.json();
    assert(historyRes.status === 200, '3.4 Warden can inspect room allocation history ledger');
    assert(historyData.history.length >= 3, '3.4 Historical allocation records populated');
  } catch (err) {
    assert(false, `Warden operational workflow tests failed: ${err}`);
  }

  // ==========================================
  // 4. STUDENT SELF-SERVICE WORKFLOW
  // ==========================================
  console.log('\n--- 4. STUDENT SELF-SERVICE WORKFLOW ---');
  try {
    // 4.1 Student Overview Endpoint
    const studentOverviewRes = await fetch(`${BASE_URL}/api/student/overview`, {
      headers: { Cookie: studentCookie },
    });
    const studentOverviewData = await studentOverviewRes.json();
    assert(studentOverviewRes.status === 200, '4.1 Student can fetch unified self-service overview');
    assert(studentOverviewData.profile?.name === 'Rahul Kumar', '4.1 Profile name is Rahul Kumar');
    assert(studentOverviewData.profile?.studentId === 'STU2024012', '4.1 Profile reg number matches');
    assert(studentOverviewData.room?.hasActiveAllocation === true, '4.1 Active room allocation verified');
    assert(studentOverviewData.room?.roommates?.length >= 1, '4.1 Roommates list populated');
    assert(studentOverviewData.curfewAttendance?.status === 'Present', '4.1 Curfew attendance status tracked');

    // 4.2 Student Own Room API
    const studentRoomRes = await fetch(`${BASE_URL}/api/student/room`, {
      headers: { Cookie: studentCookie },
    });
    const studentRoomData = await studentRoomRes.json();
    assert(studentRoomRes.status === 200, '4.2 Student can view current room and bed allocation');
    assert(studentRoomData.roomDetails?.roomNumber !== undefined, '4.2 Current room number is present');

    // 4.3 Student cannot view another student's private data without permission
    const unauthorizedRoomRes = await fetch(`${BASE_URL}/api/student/room?studentId=stu-demo-04`, {
      headers: { Cookie: studentCookie },
    });
    const unauthorizedRoomData = await unauthorizedRoomRes.json();
    assert(
      unauthorizedRoomData.currentAllocation?.studentRegNo === 'STU2024012' ||
        unauthorizedRoomData.studentProfile?.id === 'demo-student-01',
      '4.3 Student requesting other student data is scoped strictly to authenticated session identity'
    );
  } catch (err) {
    assert(false, `Student self-service workflow tests failed: ${err}`);
  }

  // ==========================================
  // 5. PARENT READ-ONLY SCOPED WORKFLOW
  // ==========================================
  console.log('\n--- 5. PARENT READ-ONLY SCOPED WORKFLOW ---');
  try {
    // 5.1 Parent Ward Overview Endpoint
    const parentWardRes = await fetch(`${BASE_URL}/api/parent/ward`, {
      headers: { Cookie: parentCookie },
    });
    const parentWardData = await parentWardRes.json();
    assert(parentWardRes.status === 200, '5.1 Parent can fetch linked ward overview (HTTP 200)');
    assert(parentWardData.student?.name === 'Rahul Kumar', '5.1 Linked ward is Rahul Kumar');
    assert(parentWardData.student?.studentId === 'STU2024012', '5.1 Linked ward reg is STU2024012');
    assert(parentWardData.roomAllocation?.hasActiveAllocation === true, '5.1 Ward room allocation visible');
    assert(parentWardData.curfewAttendance?.status === 'Present', '5.1 Ward curfew attendance is Present');
    assert(Array.isArray(parentWardData.gatePasses), '5.1 Ward gate passes list returned');
    assert(parentWardData.fees?.status === 'Paid', '5.1 Ward fees status is visible');

    // 5.2 Parent voting on complaints
    const complaintsRes = await fetch(`${BASE_URL}/api/complaints`, {
      headers: { Cookie: parentCookie },
    });
    const complaintsData = await complaintsRes.json();
    assert(complaintsRes.status === 200, '5.2 Parent can view active complaint tickets');

    // 5.3 Parent cannot allocate rooms (RBAC 403)
    const parentAllocRes = await fetch(`${BASE_URL}/api/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: parentCookie },
      body: JSON.stringify({
        studentId: 'STU2024012',
        roomId: 'rm-103',
      }),
    });
    assert(parentAllocRes.status === 403, '5.3 Parent strictly blocked from allocating rooms (RBAC 403)');

    // 5.4 Parent cannot modify user accounts (RBAC 403)
    const parentUserModRes = await fetch(`${BASE_URL}/api/admin/users/demo-student-01`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: parentCookie },
      body: JSON.stringify({ isActive: false }),
    });
    assert(parentUserModRes.status === 403, '5.4 Parent strictly blocked from modifying users (RBAC 403)');
  } catch (err) {
    assert(false, `Parent workflow tests failed: ${err}`);
  }

  // ==========================================
  // 6. COMPLETE END-TO-END COMPLAINT LIFECYCLE
  // ==========================================
  console.log('\n--- 6. COMPLETE COMPLAINT LIFECYCLE ---');
  let newTicketId = '';
  try {
    // 6.1 Student creates complaint
    const createCompRes = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        category: 'ELECTRICAL',
        priority: 'HIGH',
        title: 'Study Table Light Socket Short Circuit',
        description: 'Sparking noticed when plugging laptop charger on desk 1',
        room: '101',
        block: 'Block A',
        hostel: 'Boys Hostel A',
      }),
    });
    const createCompData = await createCompRes.json();
    assert(createCompRes.status === 201, '6.1 Step 1: Student creates complaint ticket (HTTP 201)');
    assert(createCompData.complaint?.status === 'Open', '6.1 Initial status is Open');
    newTicketId = createCompData.complaint?.id;

    // 6.2 Parent upvotes complaint
    const parentVoteRes = await fetch(`${BASE_URL}/api/complaints/${newTicketId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: parentCookie },
      body: JSON.stringify({ voteType: 'UPVOTE' }),
    });
    const parentVoteData = await parentVoteRes.json();
    assert(parentVoteRes.status === 200, '6.2 Step 2: Parent can upvote critical safety complaint');
    assert(parentVoteData.hasVoted === true, '6.2 Upvote registered');

    // 6.3 Warden reviews and assigns Maintenance Technician
    const assignRes = await fetch(`${BASE_URL}/api/complaints/${newTicketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        status: 'Assigned',
        assignedTo: 'Suresh Kumar (Electrician)',
      }),
    });
    const assignData = await assignRes.json();
    assert(assignRes.status === 200, '6.3 Step 3: Warden assigns ticket to maintenance technician');
    assert(assignData.complaint?.status === 'Assigned', '6.3 Status transitioned to Assigned');

    // 6.4 Maintenance updates status to In Progress
    const inProgRes = await fetch(`${BASE_URL}/api/complaints/${newTicketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: maintenanceCookie },
      body: JSON.stringify({
        status: 'In Progress',
        estimatedResolutionTime: '2 hours',
      }),
    });
    const inProgData = await inProgRes.json();
    assert(inProgRes.status === 200, '6.4 Step 4: Maintenance technician updates ticket to In Progress');
    assert(inProgData.complaint?.status === 'In Progress', '6.4 Status transitioned to In Progress');

    // 6.5 Maintenance technician marks ticket as Resolved
    const resolveRes = await fetch(`${BASE_URL}/api/complaints/${newTicketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: maintenanceCookie },
      body: JSON.stringify({
        status: 'Resolved',
        resolutionRemarks: 'Replaced burnt socket outlet with 16A modular unit and tested insulation.',
      }),
    });
    const resolveData = await resolveRes.json();
    assert(resolveRes.status === 200, '6.5 Step 5: Maintenance technician marks ticket as Resolved');
    assert(resolveData.complaint?.status === 'Resolved', '6.5 Status transitioned to Resolved');
    assert(resolveData.complaint?.resolvedAt !== undefined, '6.5 resolvedAt timestamp recorded');

    // 6.6 Owner student rates resolution
    const rateRes = await fetch(`${BASE_URL}/api/complaints/${newTicketId}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        rating: 5,
        feedback: 'Prompt and safe repair by electrician Suresh Kumar!',
        resolutionStatus: 'FULLY_RESOLVED',
      }),
    });
    const rateData = await rateRes.json();
    assert(rateRes.status === 200, '6.6 Step 6: Complaint owner student rates resolution 5 stars');
    assert(rateData.success === true, '6.6 Resolution rating recorded');

    // 6.7 Duplicate rating rejected
    const dupRateRes = await fetch(`${BASE_URL}/api/complaints/${newTicketId}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({ rating: 4 }),
    });
    assert(dupRateRes.status === 400, '6.7 Duplicate rating on same ticket rejected (HTTP 400)');
  } catch (err) {
    assert(false, `Complete complaint lifecycle failed: ${err}`);
  }

  // ==========================================
  // 7. END-TO-END MONTHLY FEEDBACK WORKFLOW
  // ==========================================
  console.log('\n--- 7. END-TO-END MONTHLY FEEDBACK WORKFLOW ---');
  try {
    // 7.1 Student submits feedback for current month
    const fbRes = await fetch(`${BASE_URL}/api/monthly-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        month: 11, // November 2026
        year: 2026,
        foodRating: 4,
        staffRating: 5,
        cleanlinessRating: 4,
        securityRating: 5,
        roomRating: 5,
        waterRating: 4,
        otherRating: 5,
        comments: 'Overall outstanding hostel maintenance and cafeteria services.',
        anonymous: false,
      }),
    });
    const fbData = await fbRes.json();
    assert(fbRes.status === 201, '7.1 Student submits monthly feedback for month 11 (HTTP 201)');
    assert(fbData.feedback?.averageRating >= 4.5, '7.1 Feedback average calculated accurately');

    // 7.2 Duplicate monthly feedback rejected
    const dupFbRes = await fetch(`${BASE_URL}/api/monthly-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        month: 11,
        year: 2026,
        foodRating: 3,
        staffRating: 3,
        cleanlinessRating: 3,
        securityRating: 3,
        roomRating: 3,
        waterRating: 3,
        otherRating: 3,
      }),
    });
    assert(dupFbRes.status === 409, '7.2 Duplicate monthly feedback in same month rejected (HTTP 409 Conflict)');

    // 7.3 Warden and Admin access feedback analytics
    const analyticsRes = await fetch(`${BASE_URL}/api/monthly-feedback/analytics?month=11&year=2026`, {
      headers: { Cookie: adminCookie },
    });
    const analyticsData = await analyticsRes.json();
    assert(analyticsRes.status === 200, '7.3 Super Admin can access aggregated monthly analytics');
    assert(analyticsData.analytics?.totalSubmissions >= 1, '7.3 Total feedback submissions tracked');
  } catch (err) {
    assert(false, `Monthly feedback workflow tests failed: ${err}`);
  }

  // ==========================================
  // 8. END-TO-END ROOM ALLOCATION & CAPACITY WORKFLOW
  // ==========================================
  console.log('\n--- 8. END-TO-END ROOM ALLOCATION WORKFLOW ---');
  try {
    // 8.1 Allocate student STU2024077 (Aditya Rao) into Room 202
    const allocRes = await fetch(`${BASE_URL}/api/allocations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'STU2024077',
        roomId: 'rm-202',
        reason: 'Phase 6 Integration Allotment',
      }),
    });
    const allocData = await allocRes.json();
    assert(allocRes.status === 201, '8.1 Student STU2024077 allocated to vacant Room 202');
    assert(allocData.room?.occupied === 1, '8.1 Room 202 occupancy updated to 1');
    assert(allocData.room?.status === 'PARTIALLY_OCCUPIED', '8.1 Room 202 transitioned to PARTIALLY_OCCUPIED');

    // 8.2 Deallocate student
    const deallocRes = await fetch(`${BASE_URL}/api/allocations/deallocate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        studentId: 'STU2024077',
        reason: 'Phase 6 Deallocation test',
      }),
    });
    const deallocData = await deallocRes.json();
    assert(deallocRes.status === 200, '8.2 Student deallocated cleanly');
    assert(deallocData.success === true, '8.2 Deallocation returned success');

    // 8.3 Verify room restored to VACANT
    const roomCheckRes = await fetch(`${BASE_URL}/api/rooms/rm-202`, {
      headers: { Cookie: wardenCookie },
    });
    const roomCheckData = await roomCheckRes.json();
    assert(roomCheckData.room?.occupied === 0, '8.3 Room occupancy decreased back to 0');
    assert(roomCheckData.room?.status === 'VACANT', '8.3 Room status correctly recalculated to VACANT');
  } catch (err) {
    assert(false, `Room allocation workflow tests failed: ${err}`);
  }

  console.log('\n====================================================');
  console.log(`PHASE 6 TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================');

  if (passed === total) {
    console.log('🎉 ALL PHASE 6 WORKFLOW INTEGRATION TESTS COMPLETED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} TESTS FAILED.`);
    process.exit(1);
  }
}

runPhase6Tests();
