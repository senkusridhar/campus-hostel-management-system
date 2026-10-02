import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getAllocationHistory } from '@/lib/services/hostel-service';

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
    const hostelId = searchParams.get('hostelId') || undefined;

    const history = await getAllocationHistory({ studentId, roomId, hostelId });
    return NextResponse.json({ success: true, history });
  } catch (error) {
    console.error('Error fetching allocation history:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
