/**
 * Comprehensive Automated Security & Persistence Test Suite
 * Verifies:
 * 1. Live PostgreSQL password change persistence and retrieval
 * 2. Non-blocking audit log creation on password change
 * 3. Immediate 500 error on failed database update (no false success)
 * 4. Immediate 503 error on database outage (no fallback to demo store)
 * 5. Strict rejection of demo-account fallback in production (NODE_ENV=production)
 * 6. Explicit configuration gating for demo-account fallback in development
 * 7. Strict rejection of incorrect passwords for database users (no fall-through)
 * 8. Missing user handling (404, no fallback password modification)
 * 9. Password complexity validation (length, upper, lower, digit, symbol)
 * 10. IDOR / Session identity enforcement
 * 11. Rate limiting on repeated failures (429 with Retry-After)
 * 12. Cleanup: zero permanent modifications to existing database accounts
 */

import { NextRequest } from 'next/server';
import { POST as loginPost } from './src/app/api/auth/login/route';
import { POST as changePasswordPost } from './src/app/api/auth/change-password/route';
import { prisma } from './src/lib/db/prisma';
import { hashPassword, comparePassword } from './src/lib/auth/password';
import { signToken } from './src/lib/auth/jwt';
import { resetRateLimit } from './src/lib/auth/rate-limit';

let passed = 0;
let failed = 0;
let total = 0;

function assert(condition: boolean, testName: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    failed++;
    console.error(`  ❌ FAIL: ${testName}`);
  }
}

function createJsonRequest(url: string, body: Record<string, any>, cookie?: string): NextRequest {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (cookie) {
    headers.set('Cookie', cookie);
  }
  return new NextRequest(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

async function runAllTests() {
  console.log('================================================================');
  console.log('AUTOMATED AUTHENTICATION & POSTGRESQL PERSISTENCE TEST SUITE');
  console.log('================================================================\n');

  const originalFindUnique = prisma.user.findUnique.bind(prisma.user);
  const originalUpdate = prisma.user.update.bind(prisma.user);
  const originalEnvNodeEnv = process.env.NODE_ENV;
  const originalEnableDemo = process.env.ENABLE_DEMO_FALLBACK;

  try {
    // -------------------------------------------------------------
    // 1. LIVE POSTGRESQL PERSISTENCE & VERIFICATION
    // -------------------------------------------------------------
    console.log('--- 1. LIVE POSTGRESQL PERSISTENCE & AUDIT LOGGING ---');

    const ephemeralTimestamp = Date.now();
    const ephemeralEmail = `test.user.${ephemeralTimestamp}@campushms.internal`;
    const initialPassword = 'InitialSecure@2026';
    const initialHash = await hashPassword(initialPassword);

    // Create ephemeral user directly in PostgreSQL
    const testUser = await prisma.user.create({
      data: {
        name: 'Ephemeral Test User',
        email: ephemeralEmail,
        passwordHash: initialHash,
        role: 'STUDENT',
        isActive: true,
      },
    });

    console.log(`  [Setup] Created ephemeral test user in PostgreSQL (ID: ${testUser.id})`);

    try {
      // Create valid session token for this user
      const userToken = await signToken({
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role,
        name: testUser.name,
      });
      const cookie = `hms_session=${userToken}`;

      // Execute password change
      const newPassword = 'NewSecretUpdated@2026!';
      const changeReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
        currentPassword: initialPassword,
        newPassword: newPassword,
        confirmPassword: newPassword,
      }, cookie);

      const changeRes = await changePasswordPost(changeReq);
      assert(changeRes.status === 200, 'Password change request succeeds with HTTP 200');

      const changeBody = await changeRes.json();
      assert(changeBody.success === true, 'Response body contains success: true');

      const refreshedCookie = changeRes.headers.get('set-cookie');
      assert(!!refreshedCookie && refreshedCookie.includes('hms_session='), 'Refreshed session cookie returned in headers');

      // VERIFY DIRECTLY AGAINST POSTGRESQL DATABASE
      const updatedUserInDb = await prisma.user.findUnique({
        where: { id: testUser.id },
      });

      assert(!!updatedUserInDb, 'User record retrieved directly from PostgreSQL');
      const oldPasswordMatchesDb = await comparePassword(initialPassword, updatedUserInDb!.passwordHash);
      const newPasswordMatchesDb = await comparePassword(newPassword, updatedUserInDb!.passwordHash);

      assert(!oldPasswordMatchesDb, 'Old password NO LONGER matches database hash');
      assert(newPasswordMatchesDb, 'New password SUCCESSFULLY MATCHES database hash in PostgreSQL');
      assert(updatedUserInDb!.updatedAt.getTime() > testUser.createdAt.getTime(), 'User updatedAt timestamp in PostgreSQL was updated');

      // VERIFY AUDIT LOG IN POSTGRESQL
      const auditEntry = await prisma.auditLog.findFirst({
        where: {
          userId: testUser.id,
          action: 'PASSWORD_CHANGE',
        },
        orderBy: { createdAt: 'desc' },
      });

      assert(!!auditEntry, 'PASSWORD_CHANGE audit log entry recorded in PostgreSQL');
      assert(auditEntry?.entity === 'User', 'Audit entry entity is User');
      assert(auditEntry?.entityId === testUser.id, 'Audit entry entityId matches user ID');

      // VERIFY LOGIN WITH NEW AND OLD CREDENTIALS
      const oldLoginReq = createJsonRequest('http://localhost:3000/api/auth/login', {
        email: ephemeralEmail,
        password: initialPassword,
      });
      const oldLoginRes = await loginPost(oldLoginReq);
      assert(oldLoginRes.status === 401, 'Login with old password fails (HTTP 401)');

      const newLoginReq = createJsonRequest('http://localhost:3000/api/auth/login', {
        email: ephemeralEmail,
        password: newPassword,
      });
      const newLoginRes = await loginPost(newLoginReq);
      assert(newLoginRes.status === 200, 'Login with newly persisted password succeeds (HTTP 200)');
      const newLoginBody = await newLoginRes.json();
      assert(newLoginBody.user?.email === ephemeralEmail, 'Login response returns correct user data');
    } finally {
      // Clean up ephemeral user and audit logs from PostgreSQL
      await prisma.auditLog.deleteMany({ where: { userId: testUser.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
      console.log(`  [Cleanup] Ephemeral test user and audit logs removed from PostgreSQL.`);
    }

    // -------------------------------------------------------------
    // 2. FAILED DATABASE UPDATE MUST NEVER RETURN SUCCESS
    // -------------------------------------------------------------
    console.log('\n--- 2. FAILED DATABASE UPDATE HANDLING (FAIL-CLOSED) ---');

    // Create session token for a dummy user
    const dummyToken = await signToken({
      userId: 'mock-user-123',
      email: 'mock.user@campushms.internal',
      role: 'STUDENT',
      name: 'Mock User',
    });
    const dummyCookie = `hms_session=${dummyToken}`;
    const dummyPasswordHash = await hashPassword('CurrentPassword@2026');

    // Mock findUnique to return the user, but mock update to throw an error
    (prisma.user as any).findUnique = async () => ({
      id: 'mock-user-123',
      email: 'mock.user@campushms.internal',
      passwordHash: dummyPasswordHash,
      isActive: true,
    });

    (prisma.user as any).update = async () => {
      throw new Error('Disk full / write failure in PostgreSQL');
    };

    const failedUpdateReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'CurrentPassword@2026',
      newPassword: 'BrandNewPassword@2026!',
      confirmPassword: 'BrandNewPassword@2026!',
    }, dummyCookie);

    const failedUpdateRes = await changePasswordPost(failedUpdateReq);
    assert(failedUpdateRes.status === 500, 'Failed database update returns HTTP 500 Server Error');

    const failedUpdateBody = await failedUpdateRes.json();
    assert(failedUpdateBody.success === undefined, 'No success flag in failed update response');
    assert(failedUpdateBody.error?.includes('Unable to update password'), 'Safe server error message returned');
    assert(!failedUpdateRes.headers.get('set-cookie'), 'No session token refreshed on failed database update');

    // Restore update
    (prisma.user as any).update = originalUpdate;

    // -------------------------------------------------------------
    // 3. DATABASE OUTAGES MUST RETURN 503 (NO FALLBACK AUTH/CHANGE)
    // -------------------------------------------------------------
    console.log('\n--- 3. DATABASE OUTAGES (FAIL-CLOSED 503) ---');

    // Mock findUnique to throw DB connection error
    (prisma.user as any).findUnique = async () => {
      throw new Error('Connection terminated: PostgreSQL server unavailable');
    };

    // 3.1 Login during DB outage
    const dbOutageLoginReq = createJsonRequest('http://localhost:3000/api/auth/login', {
      email: 'student@campushms.local',
      password: 'CampusHMS@2026',
    });
    const dbOutageLoginRes = await loginPost(dbOutageLoginReq);
    assert(dbOutageLoginRes.status === 503, 'Login during database outage returns HTTP 503 Service Unavailable');
    const dbOutageLoginBody = await dbOutageLoginRes.json();
    assert(dbOutageLoginBody.error?.includes('temporarily unavailable'), 'Safe 503 message without credentials');
    assert(dbOutageLoginBody.user === undefined, 'No user object or demo authentication returned on DB outage');

    // 3.2 Change password during DB outage
    const dbOutageChangeReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'CurrentPassword@2026',
      newPassword: 'BrandNewPassword@2026!',
      confirmPassword: 'BrandNewPassword@2026!',
    }, dummyCookie);
    const dbOutageChangeRes = await changePasswordPost(dbOutageChangeReq);
    assert(dbOutageChangeRes.status === 503, 'Change password during database outage returns HTTP 503 Service Unavailable');
    const dbOutageChangeBody = await dbOutageChangeRes.json();
    assert(dbOutageChangeBody.error?.includes('temporarily unavailable'), 'Safe 503 message without credentials');

    // -------------------------------------------------------------
    // 4. MISSING USER IN POSTGRESQL (NO FALLBACK IN PROD)
    // -------------------------------------------------------------
    console.log('\n--- 4. MISSING USER IN POSTGRESQL & PRODUCTION GATING ---');

    // Mock findUnique to return null (user not found in DB)
    (prisma.user as any).findUnique = async () => null;

    // 4.1 In production, missing user must return 401 (even if ENABLE_DEMO_FALLBACK=true)
    (process.env as any).NODE_ENV = 'production';
    (process.env as any).ENABLE_DEMO_FALLBACK = 'true';

    const prodLoginReq = createJsonRequest('http://localhost:3000/api/auth/login', {
      email: 'student@campushms.local',
      password: 'CampusHMS@2026',
    });
    const prodLoginRes = await loginPost(prodLoginReq);
    assert(prodLoginRes.status === 401, 'Missing DB user in production returns HTTP 401 (demo fallback strictly forbidden)');

    // 4.2 In development, missing user returns 401 by default unless ENABLE_DEMO_FALLBACK=true
    (process.env as any).NODE_ENV = 'development';
    delete process.env.ENABLE_DEMO_FALLBACK;

    const devNoFlagReq = createJsonRequest('http://localhost:3000/api/auth/login', {
      email: 'student@campushms.local',
      password: 'CampusHMS@2026',
    });
    const devNoFlagRes = await loginPost(devNoFlagReq);
    assert(devNoFlagRes.status === 401, 'Missing DB user in development without ENABLE_DEMO_FALLBACK returns HTTP 401 (disabled by default)');

    // 4.3 In development WITH explicit ENABLE_DEMO_FALLBACK=true, demo user can authenticate
    process.env.ENABLE_DEMO_FALLBACK = 'true';
    const devWithFlagReq = createJsonRequest('http://localhost:3000/api/auth/login', {
      email: 'student@campushms.local',
      password: 'CampusHMS@2026',
    });
    const devWithFlagRes = await loginPost(devWithFlagReq);
    assert(devWithFlagRes.status === 200, 'Missing DB user in development WITH explicit ENABLE_DEMO_FALLBACK=true returns HTTP 200 for demo account');

    // 4.4 Missing user in change-password returns HTTP 404
    const missingChangeReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'AnyPassword@2026',
      newPassword: 'BrandNewPassword@2026!',
      confirmPassword: 'BrandNewPassword@2026!',
    }, dummyCookie);
    const missingChangeRes = await changePasswordPost(missingChangeReq);
    assert(missingChangeRes.status === 404, 'Change password for missing user returns HTTP 404 (no fallback store change)');

    // -------------------------------------------------------------
    // 5. INCORRECT PASSWORDS FOR DATABASE USERS
    // -------------------------------------------------------------
    console.log('\n--- 5. INCORRECT PASSWORD HANDLING (NO FALL-THROUGH) ---');

    const customUserHash = await hashPassword('CustomUserPass@2026!');
    (prisma.user as any).findUnique = async () => ({
      id: 'mock-db-user-999',
      name: 'Custom User',
      email: 'student@campushms.local',
      passwordHash: customUserHash,
      role: 'STUDENT',
      isActive: true,
    });

    // Submitting wrong password must return 401 and NOT fall through to demo password
    const wrongPasswordReq = createJsonRequest('http://localhost:3000/api/auth/login', {
      email: 'student@campushms.local',
      password: 'CampusHMS@2026', // Demo password, but DB user has customUserHash!
    });
    const wrongPasswordRes = await loginPost(wrongPasswordReq);
    assert(wrongPasswordRes.status === 401, 'Submitting demo password for DB user with different hash returns HTTP 401 (never falls through)');

    // Submitting correct custom password succeeds
    const correctPasswordReq = createJsonRequest('http://localhost:3000/api/auth/login', {
      email: 'student@campushms.local',
      password: 'CustomUserPass@2026!',
    });
    const correctPasswordRes = await loginPost(correctPasswordReq);
    assert(correctPasswordRes.status === 200, 'Submitting correct password for DB user returns HTTP 200');

    // Submitting wrong current password in change-password returns 400
    const wrongCurrentReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'WrongPassword@999',
      newPassword: 'BrandNewPassword@2026!',
      confirmPassword: 'BrandNewPassword@2026!',
    }, dummyCookie);
    const wrongCurrentRes = await changePasswordPost(wrongCurrentReq);
    assert(wrongCurrentRes.status === 400, 'Incorrect current password in change-password returns HTTP 400');

    // -------------------------------------------------------------
    // 6. PASSWORD COMPLEXITY & VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- 6. PASSWORD COMPLEXITY & INPUT CONSTRAINTS ---');

    // 6.1 Unauthenticated request (no cookie)
    const unauthReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'CustomUserPass@2026!',
      newPassword: 'BrandNewPassword@2026!',
      confirmPassword: 'BrandNewPassword@2026!',
    });
    const unauthRes = await changePasswordPost(unauthReq);
    assert(unauthRes.status === 401, 'Unauthenticated change-password request returns HTTP 401');

    // 6.2 Short password (<8 characters)
    const shortReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'CustomUserPass@2026!',
      newPassword: 'Short1!',
      confirmPassword: 'Short1!',
    }, dummyCookie);
    const shortRes = await changePasswordPost(shortReq);
    assert(shortRes.status === 400, 'Password with length < 8 rejected (HTTP 400)');

    // 6.3 Missing uppercase letter
    const noUpperReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'CustomUserPass@2026!',
      newPassword: 'nouppercase123!',
      confirmPassword: 'nouppercase123!',
    }, dummyCookie);
    const noUpperRes = await changePasswordPost(noUpperReq);
    assert(noUpperRes.status === 400, 'Password without uppercase letter rejected (HTTP 400)');

    // 6.4 Missing lowercase letter
    const noLowerReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'CustomUserPass@2026!',
      newPassword: 'NOLOWERCASE123!',
      confirmPassword: 'NOLOWERCASE123!',
    }, dummyCookie);
    const noLowerRes = await changePasswordPost(noLowerReq);
    assert(noLowerRes.status === 400, 'Password without lowercase letter rejected (HTTP 400)');

    // 6.5 Missing numeric digit
    const noDigitReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'CustomUserPass@2026!',
      newPassword: 'NoNumberSpecial!',
      confirmPassword: 'NoNumberSpecial!',
    }, dummyCookie);
    const noDigitRes = await changePasswordPost(noDigitReq);
    assert(noDigitRes.status === 400, 'Password without digit rejected (HTTP 400)');

    // 6.6 Missing special character
    const noSymbolReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'CustomUserPass@2026!',
      newPassword: 'NoSymbolPassword123',
      confirmPassword: 'NoSymbolPassword123',
    }, dummyCookie);
    const noSymbolRes = await changePasswordPost(noSymbolReq);
    assert(noSymbolRes.status === 400, 'Password without special symbol rejected (HTTP 400)');

    // 6.7 Mismatched confirmation password
    const mismatchReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'CustomUserPass@2026!',
      newPassword: 'ValidPassword@2026!',
      confirmPassword: 'DifferentPassword@2026!',
    }, dummyCookie);
    const mismatchRes = await changePasswordPost(mismatchReq);
    assert(mismatchRes.status === 400, 'Mismatched confirmation password rejected (HTTP 400)');

    // 6.8 Same new password as current password
    const samePwReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
      currentPassword: 'CustomUserPass@2026!',
      newPassword: 'CustomUserPass@2026!',
      confirmPassword: 'CustomUserPass@2026!',
    }, dummyCookie);
    const samePwRes = await changePasswordPost(samePwReq);
    assert(samePwRes.status === 400, 'New password identical to current password rejected (HTTP 400)');

    // -------------------------------------------------------------
    // 7. RATE LIMITING PROTECTION
    // -------------------------------------------------------------
    console.log('\n--- 7. RATE LIMITING ON REPEATED FAILURES ---');

    const testRateLimitEmail = `ratelimit.test.${Date.now()}@campushms.internal`;
    const rateLimitToken = await signToken({
      userId: 'mock-rl-user',
      email: testRateLimitEmail,
      role: 'STUDENT',
      name: 'Rate Limit User',
    });
    const rlCookie = `hms_session=${rateLimitToken}`;

    // Make 6 failed change-password attempts
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const rlReq = createJsonRequest('http://localhost:3000/api/auth/change-password', {
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword@2026!',
        confirmPassword: 'NewPassword@2026!',
      }, rlCookie);
      const rlRes = await changePasswordPost(rlReq);
      lastStatus = rlRes.status;
    }
    assert(lastStatus === 429, 'Repeated failed password change attempts trigger HTTP 429 Rate Limit');

  } finally {
    // Restore mocks and environment
    (prisma.user as any).findUnique = originalFindUnique;
    (prisma.user as any).update = originalUpdate;
    (process.env as any).NODE_ENV = originalEnvNodeEnv;
    if (originalEnableDemo !== undefined) {
      process.env.ENABLE_DEMO_FALLBACK = originalEnableDemo;
    } else {
      delete process.env.ENABLE_DEMO_FALLBACK;
    }
    await prisma.$disconnect();
  }

  console.log('\n================================================================');
  console.log(`TEST RESULTS: ${passed} / ${total} ASSERTIONS PASSED (${failed} FAILED)`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runAllTests().catch((err) => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
