import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { comparePassword, hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/auth/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Session Authentication Check
    const sessionCookie = req.cookies.get('hms_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to change your password.' },
        { status: 401 }
      );
    }

    const session = await verifyToken(sessionCookie);
    if (!session || !session.userId || !session.email) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      );
    }

    // 2. Rate Limiting Protection (per IP and User Email)
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      'localhost';
    const rateLimitKey = `pwd-change:${clientIp}:${session.email.toLowerCase()}`;

    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many failed password change attempts. Please wait ${rateLimit.retryAfterSeconds} seconds before trying again.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    // 3. Request Payload Validation
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = body || {};

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json(
        { error: 'Current password is required.' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return NextResponse.json(
        { error: 'New password is required.' },
        { status: 400 }
      );
    }

    if (!confirmPassword || typeof confirmPassword !== 'string') {
      return NextResponse.json(
        { error: 'Please confirm your new password.' },
        { status: 400 }
      );
    }

    // 4. Input Constraints & Policy Checks
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation password do not match.' },
        { status: 400 }
      );
    }

    if (newPassword === currentPassword) {
      return NextResponse.json(
        { error: 'New password must be different from your current password.' },
        { status: 400 }
      );
    }

    const strengthResult = validatePasswordStrength(newPassword);
    if (!strengthResult.valid) {
      return NextResponse.json(
        {
          error: strengthResult.errors[0],
          errors: strengthResult.errors,
        },
        { status: 400 }
      );
    }

    // 5. User Retrieval from PostgreSQL (Fail-Closed, No In-Memory Fallback)
    let userFromDb: {
      id: string;
      email: string;
      passwordHash: string;
      isActive: boolean;
    } | null = null;

    try {
      userFromDb = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          isActive: true,
        },
      });

      if (!userFromDb && session.email) {
        userFromDb = await prisma.user.findUnique({
          where: { email: session.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            isActive: true,
          },
        });
      }
    } catch {
      console.error('PostgreSQL lookup failed during password change [Database Unavailable]');
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Unable to verify user account in database.' },
        { status: 503 }
      );
    }

    if (!userFromDb) {
      return NextResponse.json(
        { error: 'User account not found in database.' },
        { status: 404 }
      );
    }

    if (!userFromDb.isActive) {
      return NextResponse.json(
        { error: 'This user account is currently deactivated.' },
        { status: 403 }
      );
    }

    if (!userFromDb.passwordHash) {
      return NextResponse.json(
        { error: 'Password authentication is not configured for this account.' },
        { status: 400 }
      );
    }

    // 6. Verify Current Password against Database Hash
    const isCurrentPasswordCorrect = await comparePassword(currentPassword, userFromDb.passwordHash);
    if (!isCurrentPasswordCorrect) {
      const remaining = recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        {
          error: remaining > 0
            ? `Incorrect current password. (${remaining} attempts remaining)`
            : 'Incorrect current password. Account locked temporarily.',
        },
        { status: 400 }
      );
    }

    // 7. Hash New Password with bcrypt
    const newHash = await hashPassword(newPassword);

    // 8. Persist to PostgreSQL (Must succeed before reporting success)
    try {
      await prisma.user.update({
        where: { id: userFromDb.id },
        data: { passwordHash: newHash },
      });
    } catch {
      console.error('PostgreSQL update failed during password change [Database Update Error]');
      return NextResponse.json(
        { error: 'Database error: Unable to update password. Please try again.' },
        { status: 500 }
      );
    }

    // 9. Record Security Audit Trail (Non-blocking: failure here does not roll back saved password)
    try {
      await prisma.auditLog.create({
        data: {
          userId: userFromDb.id,
          action: 'PASSWORD_CHANGE',
          entity: 'User',
          entityId: userFromDb.id,
          description: 'User successfully changed account password in database.',
          ipAddress: clientIp,
        },
      });
    } catch {
      console.warn('Failed to record password change audit log [Non-fatal audit error]');
    }

    // Reset rate limiter on successful change
    resetRateLimit(rateLimitKey);

    // 10. Refresh Session Token
    const refreshedToken = await signToken({
      userId: userFromDb.id,
      email: userFromDb.email,
      role: session.role,
      name: session.name,
    });

    // 11. Respond with Success and Set Refreshed Cookie
    const response = NextResponse.json({
      success: true,
      message: 'Password changed successfully. Your session has been securely refreshed.',
    });

    response.cookies.set({
      name: 'hms_session',
      value: refreshedToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch {
    console.error('Unexpected change password error [Internal Error]');
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating your password. Please try again.' },
      { status: 500 }
    );
  }
}
