import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import {
  listGatePasses,
  createGatePass,
  getGateOverviewStats,
} from '@/lib/services/gate-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const scope = searchParams.get('scope') || undefined;
    const studentId = searchParams.get('studentId') || undefined;
    const hostelId = searchParams.get('hostelId') || undefined;

    const gatePasses = await listGatePasses({
      role: session.role,
      userId: session.userId,
      status,
      type,
      search,
      scope,
      studentId: session.role === 'STUDENT' ? session.userId : studentId,
      hostelId,
    });

    const stats = await getGateOverviewStats();

    return NextResponse.json({ success: true, gatePasses, stats });
  } catch (error) {
    console.error('Error in GET /api/gate-passes:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching gate passes.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Role check: Only Students (and Super Admin) can submit gate pass requests
    if (session.role !== 'STUDENT' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only registered students can apply for gate passes.' },
        { status: 403 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const {
      passType,
      type,
      reason,
      destination,
      fromDateTime,
      outTime,
      departureTime,
      toDateTime,
      expectedInTime,
      expectedReturnTime,
    } = body || {};

    const targetType = passType || type || 'Day Pass';
    const targetReason = reason;
    const targetDestination = destination;
    const targetFrom = fromDateTime || outTime || departureTime;
    const targetTo = toDateTime || expectedInTime || expectedReturnTime;

    if (!targetReason || typeof targetReason !== 'string' || !targetReason.trim()) {
      return NextResponse.json(
        { error: 'Gate pass reason or purpose is required.' },
        { status: 400 }
      );
    }

    if (!targetDestination || typeof targetDestination !== 'string' || !targetDestination.trim()) {
      return NextResponse.json(
        { error: 'Destination address is required.' },
        { status: 400 }
      );
    }

    if (!targetFrom) {
      return NextResponse.json(
        { error: 'Departure date and time is required.' },
        { status: 400 }
      );
    }

    if (!targetTo) {
      return NextResponse.json(
        { error: 'Expected return date and time is required.' },
        { status: 400 }
      );
    }

    const fromDate = new Date(targetFrom);
    const toDate = new Date(targetTo);

    if (isNaN(fromDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid departure date/time format.' },
        { status: 400 }
      );
    }

    if (isNaN(toDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid expected return date/time format.' },
        { status: 400 }
      );
    }

    if (toDate.getTime() <= fromDate.getTime()) {
      return NextResponse.json(
        { error: 'Expected return date/time must be strictly after the departure time.' },
        { status: 400 }
      );
    }

    const createdPass = await createGatePass({
      studentUserId: session.userId,
      passType: targetType,
      reason: targetReason,
      destination: targetDestination,
      fromDateTime: fromDate,
      toDateTime: toDate,
    });

    return NextResponse.json({ success: true, gatePass: createdPass }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/gate-passes:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while creating gate pass.' },
      { status: 400 }
    );
  }
}
