import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getParentWardOverview } from '@/lib/services/workflow-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    if (session.role !== 'PARENT' && session.role !== 'SUPER_ADMIN' && session.role !== 'WARDEN') {
      return NextResponse.json(
        { error: 'Forbidden. Access restricted to authorized parents.' },
        { status: 403 }
      );
    }

    const overview = await getParentWardOverview(session.userId);
    return NextResponse.json({ success: true, ...overview });
  } catch (error) {
    console.error('Error in GET /api/parent/ward:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
