import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listPayments, recordPayment } from '@/lib/services/finance-service';

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
        { error: 'Access denied: You do not have permission to view payment records.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    let targetStudentId = searchParams.get('studentId') || undefined;

    // RBAC scoping
    if (role === 'STUDENT') {
      if (targetStudentId && targetStudentId !== session.userId && targetStudentId !== 'STU2024012') {
        return NextResponse.json(
          { error: 'Forbidden: You cannot access payment records of another student.' },
          { status: 403 }
        );
      }
      targetStudentId = session.userId;
    } else if (role === 'PARENT') {
      if (targetStudentId && targetStudentId !== 'STU2024012') {
        return NextResponse.json(
          { error: 'Forbidden: You can only view payments of your linked ward.' },
          { status: 403 }
        );
      }
      targetStudentId = 'STU2024012';
    }

    const payments = await listPayments({
      role: session.role,
      userId: session.userId,
      search,
      paymentMethod,
      studentId: targetStudentId,
    });

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    console.error('Error in GET /api/finance/payments:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching payments.' },
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
        { error: 'Permission denied: Only authorized Finance staff and Administrators can record payments.' },
        { status: 403 }
      );
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { feeId, amount, paymentMethod, transactionReference, notes, paidAt } = body || {};

    if (!feeId || typeof feeId !== 'string') {
      return NextResponse.json({ error: 'A valid fee or invoice reference is required.' }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be a positive number greater than zero.' }, { status: 400 });
    }

    const validMethods = ['UPI', 'Net Banking', 'Card', 'Challan', 'Cash'];
    const method = validMethods.includes(paymentMethod) ? paymentMethod : 'UPI';

    const result = await recordPayment(
      {
        feeId,
        amount: parsedAmount,
        paymentMethod: method,
        transactionReference: transactionReference?.trim() || undefined,
        notes: notes?.trim() || undefined,
        paidAt: paidAt || undefined,
      },
      { role: session.role, userId: session.userId, name: session.name }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        success: true,
        payment: result.payment,
        receipt: result.receipt,
        fee: result.fee,
        persisted: result.persisted ?? true,
        storage: result.storage || 'DATABASE',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/finance/payments:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while recording payment.' },
      { status: 500 }
    );
  }
}
