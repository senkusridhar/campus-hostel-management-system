import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getFinanceOverview } from '@/lib/services/finance-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const role = session.role.toUpperCase();
    const allowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT', 'STUDENT', 'PARENT'];
    if (!allowed.includes(role)) {
      return NextResponse.json(
        { error: 'Access denied: You do not have permission to view financial overview statistics.' },
        { status: 403 }
      );
    }

    const stats = await getFinanceOverview({ role: session.role, userId: session.userId });

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error in GET /api/finance/overview:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching finance overview.' },
      { status: 500 }
    );
  }
}
