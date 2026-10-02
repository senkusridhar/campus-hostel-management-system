import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import {
  listRoomChangeRequests,
  submitRoomChangeRequest,
} from '@/lib/services/hostel-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const studentIdFilter =
      session.role === 'STUDENT'
        ? session.userId
        : searchParams.get('studentId') || undefined;

    const requests = await listRoomChangeRequests({
      studentId: studentIdFilter,
      status,
    });

    return NextResponse.json({ success: true, requests });
  } catch (error) {
    console.error('Error fetching room change requests:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Role check: Students and Wardens/Admin can submit room change requests
    if (
      session.role !== 'STUDENT' &&
      session.role !== 'SUPER_ADMIN' &&
      session.role !== 'WARDEN'
    ) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const { preferredRoomId, reason, comment, studentId } = body;

    const effectiveStudentId =
      session.role === 'STUDENT' ? session.userId : studentId || session.userId;

    if (!preferredRoomId || !reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json(
        { error: 'Preferred room ID and a valid reason are required.' },
        { status: 400 }
      );
    }

    const result = await submitRoomChangeRequest({
      studentId: effectiveStudentId,
      preferredRoomId,
      reason: reason.trim(),
      comment: comment ? String(comment).trim() : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        request: result.request,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting room change request:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
