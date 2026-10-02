async function runPhase4Tests() {
  const BASE_URL = 'http://localhost:3000';
  console.log('====================================================');
  console.log('RUNNING PHASE 4: COMPLAINTS, VOTING & FEEDBACK SUITE');
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

  // Obtain cookies for different roles
  const studentCookie = await loginAs('student@campushms.local', 'STUDENT');
  const parentCookie = await loginAs('parent@campushms.local', 'PARENT');
  const wardenCookie = await loginAs('warden@campushms.local', 'WARDEN');
  const maintenanceCookie = await loginAs('maintenance@campushms.local', 'MAINTENANCE');
  const adminCookie = await loginAs('admin@campushms.local', 'SUPER_ADMIN');
  const financeCookie = await loginAs('finance@campushms.local', 'FINANCE');

  assert(Boolean(studentCookie), '1. Student authenticated with HTTP-only session');
  assert(Boolean(parentCookie), '1. Parent authenticated with HTTP-only session');
  assert(Boolean(wardenCookie), '1. Warden authenticated with HTTP-only session');
  assert(Boolean(maintenanceCookie), '1. Maintenance staff authenticated with HTTP-only session');
  assert(Boolean(adminCookie), '1. Super Admin authenticated with HTTP-only session');

  let createdComplaintId = '';
  let createdTicketNumber = '';

  // 2. Test Student Complaint Creation & Retrieval
  try {
    const res = await fetch(`${BASE_URL}/api/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        category: 'ELECTRICAL',
        priority: 'HIGH',
        roomId: '101',
        hostelId: 'Boys Hostel A',
        title: 'Study table reading lamp socket sparking',
        description: 'The power socket adjacent to bed 101-A trips the circuit breaker when turned on.',
      }),
    });
    const data = await res.json();
    assert(res.status === 201, '2. Student can create complaint (HTTP 201 Created)');
    assert(data.success === true, '2. Complaint creation returns success flag');
    assert(Boolean(data.complaint?.id), '2. Complaint ID is returned');
    assert(Boolean(data.complaint?.ticketId), `2. Ticket number generated: ${data.complaint?.ticketId}`);
    assert(data.complaint?.status === 'Open', '2. Initial complaint status is Open');
    assert(data.complaint?.upvotesCount >= 1, '2. Creator automatically registered with initial support upvote');

    createdComplaintId = data.complaint.id;
    createdTicketNumber = data.complaint.ticketId;

    // Student retrieves complaints list
    const listRes = await fetch(`${BASE_URL}/api/complaints`, {
      headers: { Cookie: studentCookie },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, '2. Student can retrieve complaints list');
    assert(Array.isArray(listData.complaints), '2. Complaints array is returned');
    const found = listData.complaints.find((c: any) => c.id === createdComplaintId);
    assert(Boolean(found), '2. Newly created complaint is present in retrieved list');
  } catch (err) {
    assert(false, `Complaint creation/retrieval failed: ${err}`);
  }

  // 3. Test Student Cannot Edit Another Student's Complaint
  try {
    const res = await fetch(`${BASE_URL}/api/complaints/comp-1041`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        title: 'Malicious title overwrite attempt',
      }),
    });
    const data = await res.json();
    assert(res.status === 403, '3. Student cannot edit another student\'s complaint (HTTP 403 Forbidden)');
    assert(
      data.error?.includes('not authorized to modify another student'),
      `3. Protection error message received: "${data.error}"`
    );
  } catch (err) {
    assert(false, `Unauthorized complaint edit test failed: ${err}`);
  }

  // 4. Test Complaint Voting: UPVOTE, Vote Switching (DOWNVOTE), Removal & Duplicate Rejection
  try {
    // 4a. Student Upvotes comp-1041
    const upRes = await fetch(`${BASE_URL}/api/complaints/comp-1041/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({ type: 'UPVOTE' }),
    });
    const upData = await upRes.json();
    assert(upRes.status === 200, '4. Student can upvote complaint (HTTP 200)');
    assert(upData.userVote === 'UPVOTE', '4. userVote is set to UPVOTE');
    assert(upData.hasVoted === true, '4. hasVoted is true');
    const prevUpvotes = upData.upvotesCount;

    // 4b. Duplicate UPVOTE is rejected with HTTP 409 Conflict
    const dupRes = await fetch(`${BASE_URL}/api/complaints/comp-1041/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({ type: 'UPVOTE' }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 409, '4. Duplicate vote rejected with HTTP 409 Conflict');
    assert(dupData.error?.includes('already upvoted'), '4. Duplicate vote prevention message verified');

    // 4c. Student switches vote to DOWNVOTE
    const downRes = await fetch(`${BASE_URL}/api/complaints/comp-1041/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({ type: 'DOWNVOTE' }),
    });
    const downData = await downRes.json();
    assert(downRes.status === 200, '4. Student can change vote to DOWNVOTE (HTTP 200)');
    assert(downData.userVote === 'DOWNVOTE', '4. userVote updated to DOWNVOTE');
    assert(downData.upvotesCount === prevUpvotes - 1, '4. Upvotes count decremented on vote change');

    // 4d. Student removes vote
    const delRes = await fetch(`${BASE_URL}/api/complaints/comp-1041/vote`, {
      method: 'DELETE',
      headers: { Cookie: studentCookie },
    });
    const delData = await delRes.json();
    assert(delRes.status === 200, '4. Student can remove vote (HTTP 200)');
    assert(delData.userVote === null, '4. userVote is now null');
    assert(delData.hasVoted === false, '4. hasVoted is false');
  } catch (err) {
    assert(false, `Voting workflow test failed: ${err}`);
  }

  // 5. Test Parent Can Vote on Complaints (Parent RBAC)
  try {
    const parentVoteRes = await fetch(`${BASE_URL}/api/complaints/comp-1041/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: parentCookie,
      },
      body: JSON.stringify({ type: 'UPVOTE' }),
    });
    const parentVoteData = await parentVoteRes.json();
    assert(parentVoteRes.status === 200, '5. Parent can vote on complaints (HTTP 200)');
    assert(parentVoteData.userVote === 'UPVOTE', '5. Parent userVote is UPVOTE');

    // Cleanup parent vote
    await fetch(`${BASE_URL}/api/complaints/comp-1041/vote`, {
      method: 'DELETE',
      headers: { Cookie: parentCookie },
    });
  } catch (err) {
    assert(false, `Parent voting test failed: ${err}`);
  }

  // 6. Test Warden Staff Assignment & Workflow
  try {
    const res = await fetch(`${BASE_URL}/api/complaints/${createdComplaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: wardenCookie,
      },
      body: JSON.stringify({
        status: 'Assigned',
        assignedToId: 'demo-maintenance-01',
        resolutionNotes: 'Assigned to Suresh Kumar (Chief Electrician) with 12h SLA.',
      }),
    });
    const data = await res.json();
    assert(res.status === 200, '6. Warden can assign maintenance staff (HTTP 200)');
    assert(data.complaint?.status === 'Assigned', '6. Complaint status updated to Assigned');
    assert(Boolean(data.complaint?.assignedStaff), '6. Assigned technician name is reflected');
  } catch (err) {
    assert(false, `Warden assignment test failed: ${err}`);
  }

  // 7. Test Maintenance Staff Status Changes (In Progress -> Resolved)
  try {
    const startRes = await fetch(`${BASE_URL}/api/complaints/${createdComplaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: maintenanceCookie,
      },
      body: JSON.stringify({
        status: 'In Progress',
        resolutionNotes: 'Electrician on site inspecting socket wiring.',
      }),
    });
    assert(startRes.status === 200, '7. Maintenance staff can update status to In Progress');

    const resolveRes = await fetch(`${BASE_URL}/api/complaints/${createdComplaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: maintenanceCookie,
      },
      body: JSON.stringify({
        status: 'Resolved',
        resolutionNotes: 'Replaced charred socket unit and modular fuse. Power restored safely.',
      }),
    });
    const resolveData = await resolveRes.json();
    assert(resolveRes.status === 200, '7. Maintenance staff can mark ticket as Resolved');
    assert(resolveData.complaint?.status === 'Resolved', '7. Ticket status is now Resolved');
    assert(Boolean(resolveData.complaint?.resolvedAt), '7. resolvedAt timestamp is recorded');
  } catch (err) {
    assert(false, `Maintenance workflow test failed: ${err}`);
  }

  // 8. Test Complaint Resolution Rating (Post-Resolution 1–5 Stars)
  try {
    const rateRes = await fetch(`${BASE_URL}/api/complaints/${createdComplaintId}/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        score: 5,
        comment: 'Fixed quickly and cleaned up after repair. Excellent service!',
        resolutionStatus: 'FULLY_RESOLVED',
      }),
    });
    const rateData = await rateRes.json();
    assert(rateRes.status === 200, '8. Complaint owner can submit resolution rating (HTTP 200)');
    assert(rateData.rating?.score === 5, '8. Rating score is 5 stars');
    assert(rateData.rating?.comment?.includes('Fixed quickly'), '8. Rating comment is stored');

    // Duplicate rating rejection
    const dupRateRes = await fetch(`${BASE_URL}/api/complaints/${createdComplaintId}/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({ score: 4 }),
    });
    const dupRateData = await dupRateRes.json();
    assert(dupRateRes.status === 400, '8. Duplicate rating on same ticket rejected (HTTP 400)');
    assert(dupRateData.error?.includes('already submitted a rating'), '8. Duplicate rating rejection message verified');

    // Invalid score rejection (>5)
    const invalidRateRes = await fetch(`${BASE_URL}/api/complaints/comp-1044/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({ score: 7 }),
    });
    assert(invalidRateRes.status === 400, '8. Invalid rating score (>5) rejected with HTTP 400');
  } catch (err) {
    assert(false, `Resolution rating test failed: ${err}`);
  }

  // 9. Test Rating Rejected on Unresolved Complaint
  try {
    const openTicketRateRes = await fetch(`${BASE_URL}/api/complaints/comp-1043/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({ score: 4 }),
    });
    const openData = await openTicketRateRes.json();
    assert(openTicketRateRes.status === 400, '9. Rating rejected before complaint is resolved (HTTP 400)');
    assert(openData.error?.includes('after the complaint has been marked as Resolved'), '9. Rejection rationale verified');
  } catch (err) {
    assert(false, `Rating on open ticket test failed: ${err}`);
  }

  // 10. Test Non-Owner Student Cannot Rate Another Student's Resolved Complaint
  try {
    const nonOwnerRateRes = await fetch(`${BASE_URL}/api/complaints/comp-1045/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({ score: 5, comment: 'Trying to rate someone else ticket' }),
    });
    const nonOwnerData = await nonOwnerRateRes.json();
    assert(nonOwnerRateRes.status === 403, '10. Non-owner student cannot rate another student\'s complaint (HTTP 403)');
    assert(nonOwnerData.error?.includes('Only the student who submitted the complaint'), '10. Ownership rating check verified');
  } catch (err) {
    assert(false, `Non-owner rating test failed: ${err}`);
  }

  // 11. Test Monthly Feedback Submission across 7 Categories
  try {
    const testMonth = ((Date.now() % 12) + 1);
    const testYear = 2032;

    const feedbackRes = await fetch(`${BASE_URL}/api/monthly-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        month: testMonth,
        year: testYear,
        hostelId: 'hostel-bha',
        hostelName: 'Boys Hostel A',
        generalComment: 'Mess breakfast quality has improved. Cleanliness is well maintained.',
        isAnonymous: true,
        ratings: [
          { category: 'FOOD', criterion: 'Food Quality', rating: 5 },
          { category: 'FOOD', criterion: 'Food Taste', rating: 4 },
          { category: 'STAFF', criterion: 'Staff Behaviour', rating: 5 },
          { category: 'CLEANLINESS', criterion: 'Cleanliness', rating: 4 },
          { category: 'MAINTENANCE', criterion: 'Hostel Maintenance', rating: 4 },
          { category: 'SECURITY', criterion: 'Security', rating: 5 },
          { category: 'EXPERIENCE', criterion: 'Overall Hostel Experience', rating: 5 },
        ],
      }),
    });
    const feedbackData = await feedbackRes.json();
    assert(feedbackRes.status === 201, '11. Student can submit monthly feedback (HTTP 201 Created)');
    assert(feedbackData.success === true, '11. Monthly feedback returns success');
    assert(feedbackData.feedback?.month === testMonth, `11. Feedback month is ${testMonth}`);

    // Test Duplicate Monthly Feedback Prevention
    const dupFbRes = await fetch(`${BASE_URL}/api/monthly-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        month: testMonth,
        year: testYear,
        hostelId: 'hostel-bha',
        ratings: [{ category: 'FOOD', criterion: 'Food Quality', rating: 4 }],
      }),
    });
    const dupFbData = await dupFbRes.json();
    assert(dupFbRes.status === 409, '11. Duplicate monthly feedback for same month rejected (HTTP 409 Conflict)');
    assert(dupFbData.error?.includes('already submitted monthly feedback'), '11. Duplicate monthly submission message verified');
  } catch (err) {
    assert(false, `Monthly feedback test failed: ${err}`);
  }

  // 12. Test Warden Can View Monthly Analytics
  try {
    const wardenAnalyticsRes = await fetch(`${BASE_URL}/api/monthly-feedback/analytics?month=10&year=2026`, {
      headers: { Cookie: wardenCookie },
    });
    const wardenData = await wardenAnalyticsRes.json();
    assert(wardenAnalyticsRes.status === 200, '12. Warden permitted access to monthly feedback analytics');
    assert(wardenData.success === true, '12. Analytics returned successfully');
    assert(typeof wardenData.analytics?.overallAverage === 'number', `12. Overall satisfaction score: ${wardenData.analytics?.overallAverage} / 5`);
    assert(Boolean(wardenData.analytics?.categoryAverages['Food Quality']), '12. Food Quality category average computed');
    assert(Boolean(wardenData.analytics?.staffAverages['Behaviour']), '12. Staff Behaviour score computed');
    assert(Boolean(wardenData.analytics?.complaintMetrics), '12. Complaint metrics included in analytics');
    assert(Array.isArray(wardenData.analytics?.recentComments), '12. Recent comments list returned');
  } catch (err) {
    assert(false, `Warden feedback analytics test failed: ${err}`);
  }

  // 13. Test Super Admin Can View Monthly Analytics
  try {
    const adminAnalyticsRes = await fetch(`${BASE_URL}/api/monthly-feedback/analytics?month=10&year=2026`, {
      headers: { Cookie: adminCookie },
    });
    const adminData = await adminAnalyticsRes.json();
    assert(adminAnalyticsRes.status === 200, '13. Super Admin permitted access to monthly feedback analytics');
    assert(adminData.success === true, '13. Admin analytics returned successfully');
  } catch (err) {
    assert(false, `Admin feedback analytics test failed: ${err}`);
  }

  // 14. Test Student Cannot Access Admin Analytics (HTTP 403)
  try {
    const studentAnalyticsRes = await fetch(`${BASE_URL}/api/monthly-feedback/analytics`, {
      headers: { Cookie: studentCookie },
    });
    assert(studentAnalyticsRes.status === 403, '14. Student denied access to /api/monthly-feedback/analytics (HTTP 403)');
  } catch (err) {
    assert(false, `Student access control test failed: ${err}`);
  }

  // 15. Test Server-Side Identity Binding (Client cannot spoof studentId)
  try {
    const spoofMonth = ((Date.now() % 12) + 1);
    const spoofYear = 2038;
    const spoofRes = await fetch(`${BASE_URL}/api/monthly-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        studentId: 'spoofed-victim-id',
        month: spoofMonth,
        year: spoofYear,
        hostelId: 'hostel-bha',
        ratings: [{ category: 'FOOD', criterion: 'Food Quality', rating: 5 }],
      }),
    });
    const spoofData = await spoofRes.json();
    assert(spoofRes.status === 201, '15. Monthly feedback accepted for authenticated session');
    assert(spoofData.feedback?.studentId === 'demo-student-01', '15. Identity derived from server session, client spoofed studentId ignored');
  } catch (err) {
    assert(false, `Server-side identity binding test failed: ${err}`);
  }

  // 16. Test RBAC: Unauthorized Role (Finance) Cannot Modify Maintenance Complaints
  try {
    const unauthUpdateRes = await fetch(`${BASE_URL}/api/complaints/${createdComplaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: financeCookie,
      },
      body: JSON.stringify({ status: 'Resolved' }),
    });
    assert(unauthUpdateRes.status === 403, '16. Finance role cannot modify complaint tickets (HTTP 403 Forbidden)');
  } catch (err) {
    assert(false, `RBAC unauthorized role test failed: ${err}`);
  }

  console.log('\n====================================================');
  console.log(`PHASE 4 TEST RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================');
}

runPhase4Tests();
