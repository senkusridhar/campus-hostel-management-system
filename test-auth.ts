async function runAuthTests() {
  const BASE_URL = 'http://localhost:3000';
  console.log('====================================================');
  console.log('RUNNING PHASE 3 AUTHENTICATION & RBAC TEST SUITE');
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

  // 1. Test unauthenticated request to /dashboard
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' });
    const location = res.headers.get('location');
    assert(
      res.status === 307 || res.status === 308 || res.status === 302,
      `Unauthenticated /dashboard redirects (status ${res.status})`
    );
    assert(
      location?.includes('/login') === true,
      `Unauthenticated /dashboard redirects to /login (location: ${location})`
    );
  } catch (err) {
    assert(false, `Unauthenticated /dashboard request failed: ${err}`);
  }

  // 2. Test Invalid Email format validation
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notanemail', password: 'Password@123' }),
    });
    const data = await res.json();
    assert(res.status === 400, 'Invalid email format returns HTTP 400');
    assert(
      data.error.includes('valid institutional email format'),
      `Server-side email format validation message received: "${data.error}"`
    );
  } catch (err) {
    assert(false, `Email validation test failed: ${err}`);
  }

  // 3. Test Invalid Password
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campushms.local', password: 'WrongPassword999' }),
    });
    const data = await res.json();
    assert(res.status === 401, 'Invalid password returns HTTP 401 Unauthorized');
    assert(
      data.error.includes('Invalid credentials'),
      `Safe error message received: "${data.error}"`
    );
  } catch (err) {
    assert(false, `Invalid password test failed: ${err}`);
  }

  // 4. Test Role Mismatch (e.g. Student attempting to login via /login/admin)
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@campushms.local',
        password: 'CampusHMS@2026',
        portalRole: 'SUPER_ADMIN',
      }),
    });
    const data = await res.json();
    assert(res.status === 403, 'Role portal mismatch returns HTTP 403 Forbidden');
    assert(
      data.error.includes('not authorized for the SUPER ADMIN portal'),
      `Portal mismatch authorization error received: "${data.error}"`
    );
  } catch (err) {
    assert(false, `Role mismatch test failed: ${err}`);
  }

  // 5. Test Successful Student Login & HTTP-Only Cookie
  let studentCookie = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@campushms.local',
        password: 'CampusHMS@2026',
        portalRole: 'STUDENT',
      }),
    });
    const data = await res.json();
    const setCookieHeader = res.headers.get('set-cookie');
    studentCookie = setCookieHeader?.split(';')[0] || '';

    assert(res.status === 200, 'Student login returns HTTP 200 OK');
    assert(data.success === true, 'Student login returns success flag');
    assert(data.redirectUrl === '/dashboard/student', 'Student redirectUrl is /dashboard/student');
    assert(data.user.role === 'STUDENT', 'User role in response is STUDENT');
    assert(data.user.passwordHash === undefined, 'passwordHash is NOT exposed in response');
    assert(
      setCookieHeader?.includes('hms_session=') === true,
      'hms_session HTTP-Only cookie was attached'
    );
  } catch (err) {
    assert(false, `Student login test failed: ${err}`);
  }

  // 6. Test /api/auth/me session verification
  try {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: studentCookie },
    });
    const data = await res.json();
    assert(res.status === 200, '/api/auth/me with session returns HTTP 200 OK');
    assert(data.authenticated === true, 'Session is authenticated: true');
    assert(data.user.email === 'student@campushms.local', 'Session user email matches student');
    assert(data.user.passwordHash === undefined, 'passwordHash is NOT exposed in /api/auth/me');
  } catch (err) {
    assert(false, `/api/auth/me test failed: ${err}`);
  }

  // 7. Test Student Accessing Student Dashboard
  try {
    const res = await fetch(`${BASE_URL}/dashboard/student`, {
      headers: { Cookie: studentCookie },
      redirect: 'manual',
    });
    assert(
      res.status === 200,
      `Student accessing /dashboard/student is permitted (status ${res.status})`
    );
  } catch (err) {
    assert(false, `Student dashboard access test failed: ${err}`);
  }

  // 8. Test Student Accessing Admin Dashboard (RBAC Boundary Protection)
  try {
    const res = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { Cookie: studentCookie },
      redirect: 'manual',
    });
    const location = res.headers.get('location');
    assert(
      res.status === 307 || res.status === 308 || res.status === 302,
      `Student accessing /dashboard/admin is intercepted (status ${res.status})`
    );
    assert(
      location?.includes('/unauthorized') === true,
      `Student redirected to /unauthorized (location: ${location})`
    );
    assert(
      location?.includes('role=STUDENT') === true,
      `Unauthorized redirect includes role param (role=STUDENT)`
    );
  } catch (err) {
    assert(false, `Student accessing admin dashboard RBAC test failed: ${err}`);
  }

  // 9. Test Student Accessing Settings (SUPER_ADMIN only)
  try {
    const res = await fetch(`${BASE_URL}/settings`, {
      headers: { Cookie: studentCookie },
      redirect: 'manual',
    });
    const location = res.headers.get('location');
    assert(
      location?.includes('/unauthorized') === true,
      `Student accessing /settings redirected to /unauthorized (location: ${location})`
    );
  } catch (err) {
    assert(false, `Student accessing settings RBAC test failed: ${err}`);
  }

  // 10. Test All 7 Roles Authentication & Correct Dashboard Redirection
  const roles = [
    { role: 'SUPER_ADMIN', email: 'admin@campushms.local', target: '/dashboard/admin' },
    { role: 'WARDEN', email: 'warden@campushms.local', target: '/dashboard/warden' },
    { role: 'STUDENT', email: 'student@campushms.local', target: '/dashboard/student' },
    { role: 'PARENT', email: 'parent@campushms.local', target: '/dashboard/parent' },
    { role: 'SECURITY', email: 'security@campushms.local', target: '/dashboard/security' },
    { role: 'FINANCE', email: 'finance@campushms.local', target: '/dashboard/finance' },
    { role: 'MAINTENANCE', email: 'maintenance@campushms.local', target: '/dashboard/maintenance' },
  ];

  for (const r of roles) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: r.email,
          password: 'CampusHMS@2026',
          portalRole: r.role,
        }),
      });
      const data = await res.json();
      assert(
        res.status === 200 && data.redirectUrl === r.target,
        `Role ${r.role} login -> ${r.target}`
      );
    } catch (err) {
      assert(false, `Role ${r.role} test failed: ${err}`);
    }
  }

  // 11. Test Super Admin Access to All Role Dashboards
  let adminCookie = '';
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@campushms.local',
        password: 'CampusHMS@2026',
        portalRole: 'SUPER_ADMIN',
      }),
    });
    const setCookieHeader = res.headers.get('set-cookie');
    adminCookie = setCookieHeader?.split(';')[0] || '';

    // Admin accessing settings
    const settingsRes = await fetch(`${BASE_URL}/settings`, {
      headers: { Cookie: adminCookie },
      redirect: 'manual',
    });
    assert(settingsRes.status === 200, 'SUPER_ADMIN permitted on /settings');

    // Admin accessing warden dashboard
    const wardenRes = await fetch(`${BASE_URL}/dashboard/warden`, {
      headers: { Cookie: adminCookie },
      redirect: 'manual',
    });
    assert(wardenRes.status === 200, 'SUPER_ADMIN permitted on /dashboard/warden');
  } catch (err) {
    assert(false, `Super Admin access test failed: ${err}`);
  }

  // 12. Test Logout
  try {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
    });
    const setCookieHeader = res.headers.get('set-cookie');
    assert(res.status === 200, 'Logout returns HTTP 200 OK');
    assert(
      setCookieHeader?.includes('Max-Age=0') === true || setCookieHeader?.includes('expires=') === true,
      'Logout expires hms_session cookie'
    );
  } catch (err) {
    assert(false, `Logout test failed: ${err}`);
  }

  console.log('\n====================================================');
  console.log(`TEST SUITE RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log('====================================================');
}

runAuthTests();
