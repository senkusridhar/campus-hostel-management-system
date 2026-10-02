import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getStudentRoomInfo } from '@/lib/services/hostel-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get('studentId');

    const effectiveStudentId =
      session.role === 'STUDENT' ? session.userId : studentIdParam || session.userId;

    const info = await getStudentRoomInfo(effectiveStudentId);
    return NextResponse.json({ success: true, ...info });
  } catch (error) {
    console.error('Error fetching student room info:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
