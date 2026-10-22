export {};

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

  const match = cookie.match(/hms_session=([^;]+)/);
  return match ? `hms_session=${match[1]}` : cookie;
}

async function runPhase8Tests() {
  console.log('====================================================');
  console.log('RUNNING PHASE 8.1: GATE PASS & SECURITY MANAGEMENT TESTS');
  console.log('====================================================\n');

  let studentCookie = '';
  let wardenCookie = '';
  let securityCookie = '';
  let adminCookie = '';
  let parentCookie = '';

  try {
    studentCookie = await loginAndGetCookie('student@campushms.local', 'STUDENT');
    wardenCookie = await loginAndGetCookie('warden@campushms.local', 'WARDEN');
    securityCookie = await loginAndGetCookie('security@campushms.local', 'SECURITY');
    adminCookie = await loginAndGetCookie('admin@campushms.local', 'SUPER_ADMIN');
    parentCookie = await loginAndGetCookie('parent@campushms.local', 'PARENT');
    assert(true, 'Authentication established for Student, Warden, Security, Super Admin, and Parent');
  } catch (err) {
    console.error('Login setup failed:', err);
    process.exit(1);
  }

  let createdPassId = '';
  let rejectPassId = '';

  // ==========================================
  // 1. STUDENT GATE PASS CREATION & VALIDATION
  // ==========================================
  console.log('\n--- 1. STUDENT GATE PASS CREATION & VALIDATION ---');
  try {
    // 1.1 Invalid / empty destination rejected
    const invalidRes1 = await fetch(`${BASE_URL}/api/gate-passes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        passType: 'Day Pass',
        reason: 'Local bank visit',
        destination: '',
        fromDateTime: new Date(Date.now() + 3600000).toISOString(),
        toDateTime: new Date(Date.now() + 7200000).toISOString(),
      }),
    });
    assert(invalidRes1.status === 400, '1.1 Empty destination rejected (HTTP 400)');

    // 1.2 Invalid return time before departure rejected
    const invalidRes2 = await fetch(`${BASE_URL}/api/gate-passes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        passType: 'Day Pass',
        reason: 'Local library',
        destination: 'Central Library',
        fromDateTime: new Date(Date.now() + 7200000).toISOString(),
        toDateTime: new Date(Date.now() + 3600000).toISOString(), // earlier than from
      }),
    });
    assert(invalidRes2.status === 400, '1.2 Invalid return time earlier than departure rejected (HTTP 400)');

    // 1.3 Valid Gate Pass creation by Student
    const validCreateRes = await fetch(`${BASE_URL}/api/gate-passes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        passType: 'Day Pass',
        reason: 'City Center Bank and Bookstore Visit',
        destination: 'Brigade Road, City Center',
        fromDateTime: new Date(Date.now() + 3600000).toISOString(),
        toDateTime: new Date(Date.now() + 28800000).toISOString(),
      }),
    });
    const validCreateData = await validCreateRes.json();
    assert(validCreateRes.status === 201, '1.3 Student can create gate pass (HTTP 201)');
    assert(validCreateData.gatePass?.status === 'Pending', '1.3 Created pass has initial status Pending');
    assert(!!validCreateData.gatePass?.id, '1.3 Created pass returns unique ID');
    createdPassId = validCreateData.gatePass?.id;

    // 1.4 Second pass creation for rejection test
    const secondPassRes = await fetch(`${BASE_URL}/api/gate-passes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        passType: 'Night Out',
        reason: 'Late night family gathering',
        destination: 'West Campus Residency',
        fromDateTime: new Date(Date.now() + 86400000).toISOString(),
        toDateTime: new Date(Date.now() + 172800000).toISOString(),
      }),
    });
    const secondPassData = await secondPassRes.json();
    rejectPassId = secondPassData.gatePass?.id;
    assert(secondPassRes.status === 201, '1.4 Additional pass created for rejection workflow');

    // 1.5 Non-student (e.g. Parent) blocked from creating gate passes
    const parentCreateRes = await fetch(`${BASE_URL}/api/gate-passes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: parentCookie },
      body: JSON.stringify({
        passType: 'Day Pass',
        reason: 'Parent attempted application',
        destination: 'City',
        fromDateTime: new Date().toISOString(),
        toDateTime: new Date(Date.now() + 3600000).toISOString(),
      }),
    });
    assert(parentCreateRes.status === 403, '1.5 Parent blocked from creating gate pass (RBAC 403)');
  } catch (err) {
    assert(false, `Student gate pass creation tests failed: ${err}`);
  }

  // ==========================================
  // 2. SCOPED RETRIEVAL & PRIVACY ACCESS
  // ==========================================
  console.log('\n--- 2. SCOPED RETRIEVAL & PRIVACY ACCESS ---');
  try {
    // 2.1 Student can retrieve own gate passes
    const studentListRes = await fetch(`${BASE_URL}/api/gate-passes`, {
      headers: { Cookie: studentCookie },
    });
    const studentListData = await studentListRes.json();
    assert(studentListRes.status === 200, '2.1 Student can retrieve gate passes (HTTP 200)');
    assert(Array.isArray(studentListData.gatePasses), '2.1 Gate passes returned as array');
    assert(
      studentListData.gatePasses.some((p: any) => p.id === createdPassId),
      '2.1 Student list includes recently created pass'
    );

    // 2.2 Unauthenticated user blocked
    const unauthRes = await fetch(`${BASE_URL}/api/gate-passes`);
    assert(unauthRes.status === 401, '2.2 Unauthenticated request blocked from /api/gate-passes (HTTP 401)');

    // 2.3 Warden can retrieve hostel gate passes
    const wardenListRes = await fetch(`${BASE_URL}/api/gate-passes`, {
      headers: { Cookie: wardenCookie },
    });
    const wardenListData = await wardenListRes.json();
    assert(wardenListRes.status === 200, '2.3 Warden can list authorized hostel requests (HTTP 200)');
    assert(
      wardenListData.gatePasses.some((p: any) => p.id === createdPassId),
      '2.3 Warden sees pending student pass in scope'
    );

    // 2.4 Filter by status
    const pendingFilterRes = await fetch(`${BASE_URL}/api/gate-passes?status=PENDING`, {
      headers: { Cookie: wardenCookie },
    });
    const pendingFilterData = await pendingFilterRes.json();
    assert(
      pendingFilterData.gatePasses.every(
        (p: any) => p.status === 'Pending' || p.statusCode === 'PENDING'
      ),
      '2.4 Status filter strictly returns pending gate passes'
    );
  } catch (err) {
    assert(false, `Scoped retrieval tests failed: ${err}`);
  }

  // ==========================================
  // 3. WARDEN APPROVAL & REJECTION WORKFLOW
  // ==========================================
  console.log('\n--- 3. WARDEN APPROVAL & REJECTION WORKFLOW ---');
  try {
    // 3.1 Unauthorized role (Student) cannot approve gate pass
    const studentApproveRes = await fetch(`${BASE_URL}/api/gate-passes/${createdPassId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert(studentApproveRes.status === 403, '3.1 Student strictly forbidden from approving gate pass (RBAC 403)');

    // 3.2 Unauthorized role (Security) cannot approve gate pass
    const securityApproveRes = await fetch(`${BASE_URL}/api/gate-passes/${createdPassId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: securityCookie },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert(securityApproveRes.status === 403, '3.2 Security personnel blocked from approving gate pass (RBAC 403)');

    // 3.3 Warden approves pending gate pass
    const wardenApproveRes = await fetch(`${BASE_URL}/api/gate-passes/${createdPassId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        status: 'APPROVED',
        remarks: 'Approved by Chief Warden Dr. Ramesh. Follow curfew guidelines.',
      }),
    });
    const wardenApproveData = await wardenApproveRes.json();
    assert(wardenApproveRes.status === 200, '3.3 Warden approves pending request (HTTP 200)');
    assert(
      wardenApproveData.gatePass?.status === 'Approved' ||
        wardenApproveData.gatePass?.statusCode === 'APPROVED',
      '3.3 Gate pass status persisted as Approved'
    );

    // 3.4 Warden rejects second gate pass with remarks
    const wardenRejectRes = await fetch(`${BASE_URL}/api/gate-passes/${rejectPassId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: wardenCookie },
      body: JSON.stringify({
        status: 'REJECTED',
        remarks: 'Night out denied due to hostel maintenance scheduled tonight.',
      }),
    });
    const wardenRejectData = await wardenRejectRes.json();
    assert(wardenRejectRes.status === 200, '3.4 Warden rejects gate pass with remarks (HTTP 200)');
    assert(
      wardenRejectData.gatePass?.status === 'Rejected' ||
        wardenRejectData.gatePass?.statusCode === 'REJECTED',
      '3.4 Gate pass status updated to Rejected'
    );
  } catch (err) {
    assert(false, `Warden approval workflow tests failed: ${err}`);
  }

  // ==========================================
  // 4. SECURITY DESK CHECK-OUT & CHECK-IN WORKFLOW
  // ==========================================
  console.log('\n--- 4. SECURITY CHECK-OUT & CHECK-IN WORKFLOW ---');
  try {
    // 4.1 Security retrieves approved gate passes
    const secPassListRes = await fetch(`${BASE_URL}/api/gate-passes`, {
      headers: { Cookie: securityCookie },
    });
    const secPassListData = await secPassListRes.json();
    assert(secPassListRes.status === 200, '4.1 Security desk can retrieve gate passes (HTTP 200)');
    assert(
      secPassListData.gatePasses.some((p: any) => p.id === createdPassId),
      '4.1 Approved pass is visible in Security terminal'
    );

    // 4.2 Security cannot check out rejected pass
    const rejectCheckOutRes = await fetch(`${BASE_URL}/api/gate-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: securityCookie },
      body: JSON.stringify({
        gatePassId: rejectPassId,
        activityType: 'CHECK_OUT',
        gate: 'Main Gate',
      }),
    });
    assert(
      rejectCheckOutRes.status === 400,
      '4.2 Security strictly blocked from checking out a REJECTED pass (HTTP 400)'
    );

    // 4.3 Unauthorized role (Student) cannot record gate activity
    const studentSecRes = await fetch(`${BASE_URL}/api/gate-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
      body: JSON.stringify({
        gatePassId: createdPassId,
        activityType: 'CHECK_OUT',
      }),
    });
    assert(
      studentSecRes.status === 403,
      '4.3 Student forbidden from self-recording gate movement (RBAC 403)'
    );

    // 4.4 Security checks out approved student
    const checkOutRes = await fetch(`${BASE_URL}/api/gate-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: securityCookie },
      body: JSON.stringify({
        gatePassId: createdPassId,
        activityType: 'CHECK_OUT',
        gate: 'Main Gate',
        remarks: 'Physical ID & pass verified at Main Gate barrier',
      }),
    });
    const checkOutData = await checkOutRes.json();
    assert(checkOutRes.status === 201, '4.4 Security records student CHECK-OUT against approved pass (HTTP 201)');
    assert(
      checkOutData.activity?.type === 'Check-out' || checkOutData.activity?.activityType === 'CHECK_OUT',
      '4.4 Check-out activity type recorded'
    );
    assert(checkOutData.activity?.gate === 'Main Gate', '4.4 Gate location persisted');

    // 4.5 Duplicate check-out prevented
    const dupCheckOutRes = await fetch(`${BASE_URL}/api/gate-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: securityCookie },
      body: JSON.stringify({
        gatePassId: createdPassId,
        activityType: 'CHECK_OUT',
        gate: 'Main Gate',
      }),
    });
    assert(dupCheckOutRes.status === 400, '4.5 Duplicate check-out strictly prevented (HTTP 400)');

    // 4.6 Duplicate check-in before check-out is rejected on fresh/unout pass
    const prematureInRes = await fetch(`${BASE_URL}/api/gate-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: securityCookie },
      body: JSON.stringify({
        gatePassId: rejectPassId,
        activityType: 'CHECK_IN',
        gate: 'North Gate',
      }),
    });
    assert(prematureInRes.status === 400, '4.6 Invalid check-in without check-out rejected (HTTP 400)');

    // 4.7 Security checks in returning student
    const checkInRes = await fetch(`${BASE_URL}/api/gate-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: securityCookie },
      body: JSON.stringify({
        gatePassId: createdPassId,
        activityType: 'CHECK_IN',
        gate: 'Main Gate',
        remarks: 'Resident returned safely before curfew',
      }),
    });
    const checkInData = await checkInRes.json();
    assert(checkInRes.status === 201, '4.7 Security records student CHECK-IN on return (HTTP 201)');
    assert(
      checkInData.activity?.type === 'Check-in' || checkInData.activity?.activityType === 'CHECK_IN',
      '4.7 Check-in activity registered'
    );

    // 4.8 Duplicate check-in prevented
    const dupCheckInRes = await fetch(`${BASE_URL}/api/gate-activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: securityCookie },
      body: JSON.stringify({
        gatePassId: createdPassId,
        activityType: 'CHECK_IN',
        gate: 'Main Gate',
      }),
    });
    assert(dupCheckInRes.status === 400, '4.8 Duplicate check-in strictly prevented (HTTP 400)');

    // 4.9 Gate activity persisted and retrievable
    const activityLogRes = await fetch(`${BASE_URL}/api/gate-activity`, {
      headers: { Cookie: securityCookie },
    });
    const activityLogData = await activityLogRes.json();
    assert(activityLogRes.status === 200, '4.9 Operational gate activity ledger accessible (HTTP 200)');
    assert(
      activityLogData.activities.some((a: any) => a.gatePassId === createdPassId),
      '4.9 Recorded movement entries are persisted in activity register'
    );
  } catch (err) {
    assert(false, `Security operational workflow tests failed: ${err}`);
  }

  console.log('\n====================================================');
  console.log(`PHASE 8.1 TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================');

  if (passed === total) {
    console.log('🎉 ALL PHASE 8.1 GATE PASS & SECURITY TESTS COMPLETED SUCCESSFULLY!\n');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} TESTS FAILED.`);
    process.exit(1);
  }
}

runPhase8Tests();
