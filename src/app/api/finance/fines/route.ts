import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listFines, issueFine } from '@/lib/services/finance-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const role = session.role.toUpperCase();
    const allowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT', 'WARDEN', 'STUDENT', 'PARENT'];
    if (!allowed.includes(role)) {
      return NextResponse.json(
        { error: 'Access denied: You do not have permission to view fines.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const status = searchParams.get('status') || undefined;
    let targetStudentId = searchParams.get('studentId') || undefined;

    // RBAC scoping
    if (role === 'STUDENT') {
      if (targetStudentId && targetStudentId !== session.userId && targetStudentId !== 'STU2024012') {
        return NextResponse.json(
          { error: 'Forbidden: You cannot access fines of another student.' },
          { status: 403 }
        );
      }
      targetStudentId = session.userId;
    } else if (role === 'PARENT') {
      if (targetStudentId && targetStudentId !== 'STU2024012') {
        return NextResponse.json(
          { error: 'Forbidden: You can only view fines of your linked ward.' },
          { status: 403 }
        );
      }
      targetStudentId = 'STU2024012';
    }

    const fines = await listFines({
      role: session.role,
      userId: session.userId,
      search,
      category,
      status,
      studentId: targetStudentId,
    });

    return NextResponse.json({ success: true, fines });
  } catch (error) {
    console.error('Error in GET /api/finance/fines:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching fines.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const role = session.role.toUpperCase();
    const allowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT', 'WARDEN'];
    if (!allowed.includes(role)) {
      return NextResponse.json(
        { error: 'Permission denied: Only Wardens and Authorized Administrative Staff can issue disciplinary fines.' },
        { status: 403 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { studentId, category, reason, amount } = body || {};

    if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json({ error: 'Student registration number or ID is required.' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return NextResponse.json({ error: 'Reason for disciplinary fine is required.' }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Fine penalty amount must be a positive number greater than zero.' }, { status: 400 });
    }

    const validCategories = [
      'Discipline',
      'Property Damage',
      'Curfew Violation',
      'Mess Violation',
      'Noise Complaint',
      'Other',
    ];
    const cat = validCategories.includes(category) ? category : 'Discipline';

    const result = await issueFine(
      {
        studentId: studentId.trim(),
        category: cat,
        reason: reason.trim(),
        amount: parsedAmount,
      },
      { role: session.role, userId: session.userId, name: session.name }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        fine: result.fine,
        persisted: result.persisted ?? true,
        storage: result.storage || 'DATABASE',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/finance/fines:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while issuing fine.' },
      { status: 500 }
    );
  }
}
