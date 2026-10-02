import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { comparePassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/auth/rate-limit';
import { getRoleDashboardRoute } from '@/lib/permissions/rbac';
import { DEMO_USERS, DEMO_PASSWORD } from '@/lib/auth/demo-users';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { email, password, portalRole } = body || {};

    // 1. Server-side Input Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Institutional email address is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid institutional email format.' },
        { status: 400 }
      );
    }

    // 2. Rate Limiting Protection
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'localhost';
    const rateLimitKey = `${clientIp}:${cleanEmail}`;

    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed login attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    // 3. User Lookup (Prisma Database with Demo Store Resilience)
    let user: {
      id: string;
      name: string;
      email: string;
      passwordHash?: string;
      role: string;
      phone: string | null;
      isActive: boolean;
    } | null = null;

    let dbAvailable = true;
    try {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
          role: true,
          phone: true,
          isActive: true,
        },
      });
    } catch (dbErr) {
      console.warn('Database query failed or remote server unreachable. Checking demo accounts...', dbErr);
      dbAvailable = false;
    }

    // If database was offline or user not found in DB, check fallback demo user store
    if (!user && DEMO_USERS[cleanEmail]) {
      const demoAccount = DEMO_USERS[cleanEmail];
      const isDemoPasswordValid = password === DEMO_PASSWORD;
      if (!isDemoPasswordValid) {
        const remaining = recordFailedAttempt(rateLimitKey);
        return NextResponse.json(
          {
            error: remaining > 0
              ? `Invalid credentials. (${remaining} attempts remaining)`
              : 'Invalid credentials. Account locked temporarily.',
          },
          { status: 401 }
        );
      }
      user = {
        id: demoAccount.id,
        name: demoAccount.name,
        email: demoAccount.email,
        role: demoAccount.role,
        phone: demoAccount.phone,
        isActive: demoAccount.isActive,
      };
    } else if (!user || !user.isActive) {
      const remaining = recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        {
          error: remaining > 0
            ? `Invalid credentials. (${remaining} attempts remaining)`
            : 'Invalid credentials. Account locked temporarily.',
        },
        { status: 401 }
      );
    } else if (dbAvailable && user.passwordHash) {
      // 4. Verify Password Hash with bcrypt
      const isValidPassword = await comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        const remaining = recordFailedAttempt(rateLimitKey);
        return NextResponse.json(
          {
            error: remaining > 0
              ? `Invalid credentials. (${remaining} attempts remaining)`
              : 'Invalid credentials. Account locked temporarily.',
          },
          { status: 401 }
        );
      }
    }

    if (!user) {
      const remaining = recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: `Invalid credentials. (${remaining} attempts remaining)` },
        { status: 401 }
      );
    }

    // 5. Portal Role Authorization Check
    if (portalRole) {
      const targetRole = String(portalRole).toUpperCase();
      const userRole = user.role.toUpperCase();

      const isFinanceMatch =
        (targetRole === 'FINANCE' || targetRole === 'ACCOUNTANT') &&
        (userRole === 'FINANCE' || userRole === 'ACCOUNTANT');

      if (userRole !== 'SUPER_ADMIN' && userRole !== targetRole && !isFinanceMatch) {
        return NextResponse.json(
          {
            error: `Your account role (${user.role}) is not authorized for the ${portalRole.replace('_', ' ')} portal. Please use your assigned role login.`,
          },
          { status: 403 }
        );
      }
    }

    // Reset rate limit on successful authentication
    resetRateLimit(rateLimitKey);

    // 6. Generate Signed JWT Session Token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // 7. Determine Role-Based Destination
    const redirectUrl = getRoleDashboardRoute(user.role);

    // 8. Construct Safe Response without Password Exposure
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
      redirectUrl,
    });

    // 9. Attach Secure HTTP-Only Cookie
    response.cookies.set({
      name: 'hms_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'An unexpected authentication error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
