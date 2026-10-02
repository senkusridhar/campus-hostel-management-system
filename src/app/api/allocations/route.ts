import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { allocateStudent, getAllocationHistory } from '@/lib/services/hostel-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId =
      session.role === 'STUDENT' ? session.userId : searchParams.get('studentId') || undefined;
    const roomId = searchParams.get('roomId') || undefined;

    const allocations = await getAllocationHistory({ studentId, roomId });
    return NextResponse.json({ success: true, allocations });
  } catch (error) {
    console.error('Error fetching allocations:', error);
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

    if (session.role !== 'SUPER_ADMIN' && session.role !== 'WARDEN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Super Admin and Wardens can perform student room allocations.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentId, roomId, bedId, reason } = body;

    if (!studentId || !roomId) {
      return NextResponse.json(
        { error: 'Student ID and target Room ID are required for allocation.' },
        { status: 400 }
      );
    }

    const result = await allocateStudent({
      studentId: String(studentId).trim(),
      roomId: String(roomId).trim(),
      bedId,
      allocatedById: session.userId,
      allocatedByName: session.name,
      reason,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        allocation: result.allocation,
        room: result.room,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in student allocation:', error);
    return NextResponse.json({ error: 'Internal server error during allocation.' }, { status: 500 });
  }
}
