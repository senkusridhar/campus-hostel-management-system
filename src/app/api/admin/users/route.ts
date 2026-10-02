import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listUsers } from '@/lib/services/workflow-service';

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

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role') || undefined;
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const users = await listUsers({ role, search, status });
    return NextResponse.json({ success: true, users, count: users.length });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
