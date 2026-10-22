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

async function loginAndGetCookie(email: string, role: string, password = 'CampusHMS@2026'): Promise<{ cookie: string; status: number }> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      portalRole: role,
    }),
  });

  const cookie = res.headers.get('set-cookie') || '';
  return { cookie, status: res.status };
}

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING CHANGE PASSWORD FEATURE TEST SUITE');
  console.log('====================================================\n');

  // --- 1. UNAUTHENTICATED REQUESTS ---
  console.log('--- 1. UNAUTHENTICATED ACCESS CONTROL ---');
  const unauthRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentPassword: 'AnyPassword',
      newPassword: 'NewSecurePassword@2026',
      confirmPassword: 'NewSecurePassword@2026',
    }),
  });
  assert(unauthRes.status === 401, '1.1 Unauthenticated request rejected (HTTP 401)');
  const unauthData = await unauthRes.json();
  assert(unauthData.error?.includes('Authentication required'), '1.1 Safe error message for unauthenticated request');

  // Login as Student for tests
  const initialLogin = await loginAndGetCookie('student@campushms.local', 'STUDENT');
  assert(initialLogin.status === 200, 'Student initial login succeeded (HTTP 200)');
  let studentCookie = initialLogin.cookie;

  // --- 2. INPUT VALIDATION & CONSTRAINTS ---
  console.log('\n--- 2. SERVER-SIDE INPUT VALIDATION ---');

  // 2.1 Missing current password
  const missingCurrRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      newPassword: 'NewSecurePassword@2026',
      confirmPassword: 'NewSecurePassword@2026',
    }),
  });
  assert(missingCurrRes.status === 400, '2.1 Missing current password rejected (HTTP 400)');

  // 2.2 Missing new password
  const missingNewRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      currentPassword: 'CampusHMS@2026',
      confirmPassword: 'NewSecurePassword@2026',
    }),
  });
  assert(missingNewRes.status === 400, '2.2 Missing new password rejected (HTTP 400)');

  // 2.3 Mismatched confirmation password
  const mismatchRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      currentPassword: 'CampusHMS@2026',
      newPassword: 'NewSecurePassword@2026',
      confirmPassword: 'DifferentPassword@2026',
    }),
  });
  assert(mismatchRes.status === 400, '2.3 Mismatched password confirmation rejected (HTTP 400)');
  const mismatchData = await mismatchRes.json();
  assert(mismatchData.error?.includes('do not match'), '2.3 Mismatch error explanation received');

  // 2.4 Same new password as current password
  const samePwRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      currentPassword: 'CampusHMS@2026',
      newPassword: 'CampusHMS@2026',
      confirmPassword: 'CampusHMS@2026',
    }),
  });
  assert(samePwRes.status === 400, '2.4 Identical new password rejected (HTTP 400)');
  const samePwData = await samePwRes.json();
  assert(samePwData.error?.includes('must be different'), '2.4 Difference requirement message verified');

  // 2.5 Weak password checks
  // Short password (<8 chars)
  const shortPwRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      currentPassword: 'CampusHMS@2026',
      newPassword: 'Short1!',
      confirmPassword: 'Short1!',
    }),
  });
  assert(shortPwRes.status === 400, '2.5 Short password (<8 characters) rejected (HTTP 400)');

  // Missing special symbol
  const noSymbolRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      currentPassword: 'CampusHMS@2026',
      newPassword: 'NoSymbolPassword123',
      confirmPassword: 'NoSymbolPassword123',
    }),
  });
  assert(noSymbolRes.status === 400, '2.5 Password without symbol rejected (HTTP 400)');

  // Missing number
  const noNumberRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      currentPassword: 'CampusHMS@2026',
      newPassword: 'NoNumberPassword!@#',
      confirmPassword: 'NoNumberPassword!@#',
    }),
  });
  assert(noNumberRes.status === 400, '2.5 Password without number rejected (HTTP 400)');

  // --- 3. CURRENT PASSWORD VERIFICATION ---
  console.log('\n--- 3. CURRENT PASSWORD VERIFICATION ---');
  const wrongCurrentRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      currentPassword: 'WrongPassword@999',
      newPassword: 'ValidNewPassword@2026',
      confirmPassword: 'ValidNewPassword@2026',
    }),
  });
  assert(wrongCurrentRes.status === 400, '3.1 Incorrect current password rejected (HTTP 400)');
  const wrongCurrentData = await wrongCurrentRes.json();
  assert(wrongCurrentData.error?.includes('Incorrect current password'), '3.1 Safe error message without credential leakage');

  // --- 4. IDOR / USER IMPERSONATION ATTEMPTS ---
  console.log('\n--- 4. IDOR / USER IMPERSONATION PROTECTION ---');
  // Attempting to send spoofed userId and email in request body
  const spoofRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      userId: 'demo-super-admin-01',
      email: 'admin@campushms.local',
      currentPassword: 'WrongPasswordForAdmin',
      newPassword: 'HackedAdminPassword@2026',
      confirmPassword: 'HackedAdminPassword@2026',
    }),
  });
  // Should reject because it checks the student's current password, not admin's, and does NOT allow changing other users
  assert(spoofRes.status === 400, '4.1 Spoofed userId/email in payload ignored, strictly uses session identity');

  // --- 5. SUCCESSFUL PASSWORD CHANGE & SESSION REFRESH ---
  console.log('\n--- 5. SUCCESSFUL PASSWORD CHANGE WORKFLOW ---');
  const NEW_TEMP_PASSWORD = 'StudentNewSecure@2026!';
  const changeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      currentPassword: 'CampusHMS@2026',
      newPassword: NEW_TEMP_PASSWORD,
      confirmPassword: NEW_TEMP_PASSWORD,
    }),
  });
  assert(changeRes.status === 200, '5.1 Valid password change succeeds (HTTP 200)');
  const changeData = await changeRes.json();
  assert(changeData.success === true, '5.1 Success flag returned');
  const refreshedCookie = changeRes.headers.get('set-cookie');
  assert(!!refreshedCookie && refreshedCookie.includes('hms_session='), '5.2 Refreshed session cookie issued in response');

  // --- 6. AUTHENTICATION VALIDATION WITH NEW PASSWORD ---
  console.log('\n--- 6. AUTHENTICATION WITH NEW & OLD PASSWORDS ---');
  // 6.1 Try logging in with the old password (MUST FAIL)
  const oldLoginRes = await loginAndGetCookie('student@campushms.local', 'STUDENT', 'CampusHMS@2026');
  assert(oldLoginRes.status === 401, '6.1 Login with OLD password rejected (HTTP 401)');

  // 6.2 Try logging in with the NEW password (MUST SUCCEED)
  const newLoginRes = await loginAndGetCookie('student@campushms.local', 'STUDENT', NEW_TEMP_PASSWORD);
  assert(newLoginRes.status === 200, '6.2 Login with NEW password accepted (HTTP 200)');
  studentCookie = newLoginRes.cookie;

  // --- 7. CLEANUP / REVERT TO BASELINE PASSWORD ---
  console.log('\n--- 7. REVERT TO STANDARD BASELINE PASSWORD ---');
  const revertRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: studentCookie },
    body: JSON.stringify({
      currentPassword: NEW_TEMP_PASSWORD,
      newPassword: 'CampusHMS@2026',
      confirmPassword: 'CampusHMS@2026',
    }),
  });
  assert(revertRes.status === 200, '7.1 Successfully reverted student password to standard baseline');
  const baselineLogin = await loginAndGetCookie('student@campushms.local', 'STUDENT', 'CampusHMS@2026');
  assert(baselineLogin.status === 200, '7.2 Login with standard baseline password restored');

  // --- 8. MULTI-ROLE ACCESSIBILITY ---
  console.log('\n--- 8. MULTI-ROLE ACCESSIBILITY & ROUTE CHECKS ---');
  // Test Warden
  const wardenLogin = await loginAndGetCookie('warden@campushms.local', 'WARDEN');
  const wardenCheckRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: wardenLogin.cookie },
    body: JSON.stringify({
      currentPassword: 'WrongPassword',
      newPassword: 'AnyValidPassword@2026',
      confirmPassword: 'AnyValidPassword@2026',
    }),
  });
  // Confirms route is reachable by Warden (rejected by password check, not RBAC 403)
  assert(wardenCheckRes.status === 400, '8.1 Warden role permitted on change-password API (HTTP 400 on bad password, not 403)');

  // Test Finance
  const financeLogin = await loginAndGetCookie('finance@campushms.local', 'FINANCE');
  const financeCheckRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: financeLogin.cookie },
    body: JSON.stringify({
      currentPassword: 'WrongPassword',
      newPassword: 'AnyValidPassword@2026',
      confirmPassword: 'AnyValidPassword@2026',
    }),
  });
  assert(financeCheckRes.status === 400, '8.2 Finance role permitted on change-password API (HTTP 400 on bad password, not 403)');

  // Test UI route
  const pageRes = await fetch(`${BASE_URL}/change-password`, {
    headers: { Cookie: wardenLogin.cookie },
  });
  assert(pageRes.status === 200, '8.3 Route /change-password page returns HTTP 200 for authenticated user');

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} / ${total} TESTS PASSED (${failed} FAILED)`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
