import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getWardenRoomStats } from '@/lib/services/hostel-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    if (
      session.role !== 'SUPER_ADMIN' &&
      session.role !== 'WARDEN' &&
      session.role !== 'MAINTENANCE' &&
      session.role !== 'FINANCE'
    ) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get('hostelId') || undefined;

    const stats = await getWardenRoomStats(session.userId, hostelId);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching warden room stats:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
