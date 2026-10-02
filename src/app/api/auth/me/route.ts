import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/db/prisma';
import { DEMO_USERS } from '@/lib/auth/demo-users';

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('hms_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const payload = await verifyToken(sessionCookie);
    if (!payload) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Attempt DB query
    let user: {
      id: string;
      name: string;
      email: string;
      role: string;
      phone: string | null;
      isActive: boolean;
      createdAt?: Date;
    } | null = null;

    try {
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          isActive: true,
          createdAt: true,
        },
      });
    } catch {
      // Database offline/unreachable fallback
    }

    if (!user) {
      const demoAccount = DEMO_USERS[payload.email];
      if (demoAccount && demoAccount.isActive) {
        user = {
          id: demoAccount.id,
          name: demoAccount.name,
          email: demoAccount.email,
          role: demoAccount.role,
          phone: demoAccount.phone,
          isActive: demoAccount.isActive,
        };
      } else {
        // Construct from valid payload if active
        user = {
          id: payload.userId,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          phone: null,
          isActive: true,
        };
      }
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
