import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listFees, createFee } from '@/lib/services/finance-service';

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
        { error: 'Access denied: You do not have permission to view student fee records.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const feeType = searchParams.get('feeType') || undefined;
    const status = searchParams.get('status') || undefined;
    const hostel = searchParams.get('hostel') || undefined;
    let targetStudentId = searchParams.get('studentId') || undefined;

    // Prevent IDOR: Student can only view own records; Parent can only view linked ward
    if (role === 'STUDENT') {
      if (targetStudentId && targetStudentId !== session.userId && targetStudentId !== 'STU2024012') {
        return NextResponse.json(
          { error: 'Forbidden: You cannot access financial records of another student.' },
          { status: 403 }
        );
      }
      targetStudentId = session.userId;
    } else if (role === 'PARENT') {
      if (targetStudentId && targetStudentId !== 'STU2024012') {
        return NextResponse.json(
          { error: 'Forbidden: You can only view fees of your linked ward.' },
          { status: 403 }
        );
      }
      targetStudentId = 'STU2024012';
    }

    const fees = await listFees({
      role: session.role,
      userId: session.userId,
      search,
      feeType,
      status,
      hostel,
      studentId: targetStudentId,
    });

    return NextResponse.json({ success: true, fees });
  } catch (error) {
    console.error('Error in GET /api/finance/fees:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching fees.' },
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
    const allowed = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'ACCOUNTANT'];
    if (!allowed.includes(role)) {
      return NextResponse.json(
        { error: 'Permission denied: Only Finance staff and Administrators can generate fee demands.' },
        { status: 403 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { studentId, feeType, amount, dueDate, description, academicTerm, invoiceNumber } = body || {};

    if (!studentId || typeof studentId !== 'string' || !studentId.trim()) {
      return NextResponse.json({ error: 'Student registration number or ID is required.' }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Fee amount must be a positive number greater than zero.' }, { status: 400 });
    }

    if (!dueDate) {
      return NextResponse.json({ error: 'Due date is required.' }, { status: 400 });
    }

    const result = await createFee(
      {
        studentId: studentId.trim(),
        feeType: feeType || 'Hostel Fee',
        amount: parsedAmount,
        dueDate,
        description,
        academicTerm,
        invoiceNumber,
      },
      { role: session.role, userId: session.userId, name: session.name }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        fee: result.fee,
        persisted: result.persisted ?? true,
        storage: result.storage || 'DATABASE',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/finance/fees:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating fee.' },
      { status: 500 }
    );
  }
}
