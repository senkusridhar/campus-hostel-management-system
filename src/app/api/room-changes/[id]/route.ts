import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import {
  listRoomChangeRequests,
  reviewRoomChangeRequest,
} from '@/lib/services/hostel-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    const requests = await listRoomChangeRequests();
    const found = requests.find((r) => r.id === id);

    if (!found) {
      return NextResponse.json({ error: 'Room change request not found.' }, { status: 404 });
    }

    // Protection: Students can only view their own request
    if (
      session.role === 'STUDENT' &&
      found.studentId !== session.userId &&
      found.studentRegNo !== session.userId
    ) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, request: found });
  } catch (error) {
    console.error('Error fetching room change request:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { decision, wardenRemarks } = body;

    const normDecision = String(decision || '').toUpperCase();

    // Cancellation by student or review by warden
    if (normDecision === 'CANCELLED') {
      const result = await reviewRoomChangeRequest(id, {
        decision: 'CANCELLED',
        wardenId: session.userId,
        wardenName: session.name,
        wardenRemarks: wardenRemarks || 'Cancelled by student request',
      });
      return NextResponse.json(result);
    }

    // Approve / Reject can only be done by Super Admin or Warden
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'WARDEN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Warden or Admin can approve or reject room change requests.' },
        { status: 403 }
      );
    }

    if (normDecision !== 'APPROVED' && normDecision !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Invalid decision. Must be APPROVED or REJECTED.' },
        { status: 400 }
      );
    }

    const result = await reviewRoomChangeRequest(id, {
      decision: normDecision as any,
      wardenId: session.userId,
      wardenName: session.name,
      wardenRemarks,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      request: result.request,
    });
  } catch (error) {
    console.error('Error reviewing room change request:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
