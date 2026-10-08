import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import {
  listGateActivities,
  recordGateActivity,
} from '@/lib/services/gate-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const search = searchParams.get('search') || undefined;
    const gatePassId = searchParams.get('gatePassId') || undefined;

    const activities = await listGateActivities({
      role: session.role,
      userId: session.userId,
      type,
      search,
      gatePassId,
    });

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('Error in GET /api/gate-activity:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching gate activity logs.' },
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

    // Role check: Only Security Desk and Super Admin can record gate check-in/out
    if (session.role !== 'SECURITY' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only authorized security personnel can record gate movements.' },
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
      gatePassId,
      studentId,
      qrToken,
      passNo,
      activityType,
      type,
      movementType,
      gate,
      remarks,
    } = body || {};

    const targetType = activityType || type || movementType;

    if (!targetType) {
      return NextResponse.json(
        { error: 'Movement type (CHECK_IN or CHECK_OUT) is required.' },
        { status: 400 }
      );
    }

    const activity = await recordGateActivity({
      gatePassId,
      studentId,
      qrToken,
      passNo,
      activityType: targetType,
      gate: gate || 'Main Gate',
      remarks,
      securityUserId: session.userId,
      securityRole: session.role,
      securityName: session.name,
    });

    return NextResponse.json({ success: true, activity }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/gate-activity:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while recording gate activity.' },
      { status: 400 }
    );
  }
}
