import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getAdminGovernanceOverview } from '@/lib/services/workflow-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Super Administrator privileges required.' },
        { status: 403 }
      );
    }

    const overview = await getAdminGovernanceOverview();
    return NextResponse.json({ success: true, overview });
  } catch (error) {
    console.error('Error in GET /api/admin/overview:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
