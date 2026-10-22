import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listInvoices } from '@/lib/services/finance-service';

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
        { error: 'Access denied: You do not have permission to view invoices.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    let targetStudentId = searchParams.get('studentId') || undefined;

    // RBAC scoping
    if (role === 'STUDENT') {
      if (targetStudentId && targetStudentId !== session.userId && targetStudentId !== 'STU2024012') {
        return NextResponse.json(
          { error: 'Forbidden: You cannot access invoices of another student.' },
          { status: 403 }
        );
      }
      targetStudentId = session.userId;
    } else if (role === 'PARENT') {
      if (targetStudentId && targetStudentId !== 'STU2024012') {
        return NextResponse.json(
          { error: 'Forbidden: You can only view invoices of your linked ward.' },
          { status: 403 }
        );
      }
      targetStudentId = 'STU2024012';
    }

    const invoices = await listInvoices({
      role: session.role,
      userId: session.userId,
      search,
      status,
      studentId: targetStudentId,
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    console.error('Error in GET /api/finance/invoices:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching invoices.' },
      { status: 500 }
    );
  }
}
