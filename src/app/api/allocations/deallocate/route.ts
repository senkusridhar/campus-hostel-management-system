import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { deallocateStudent } from '@/lib/services/hostel-service';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.role !== 'WARDEN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Super Admin and Wardens can deallocate students.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { studentId, allocationId, reason } = body;

    if (!studentId && !allocationId) {
      return NextResponse.json(
        { error: 'Student ID or Allocation ID is required.' },
        { status: 400 }
      );
    }

    const result = await deallocateStudent({
      studentId,
      allocationId,
      deallocatedById: session.userId,
      reason,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error) {
    console.error('Error in deallocation:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
