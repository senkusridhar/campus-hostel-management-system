import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getFineById, payFine, waiveFine } from '@/lib/services/finance-service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { id } = await params;
    const fine = await getFineById(id, { role: session.role, userId: session.userId });

    if (!fine) {
      return NextResponse.json({ error: 'Fine record not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, fine });
  } catch (error) {
    console.error('Error in GET /api/finance/fines/[id]:', error);
    return NextResponse.json({ error: 'Server error retrieving fine.' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Permission denied: Wardens and Non-Finance users cannot settle or waive fines.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { action, paymentMethod, transactionReference, notes, reason } = body || {};

    if (action === 'pay') {
      const result = await payFine(
        {
          fineId: id,
          paymentMethod: paymentMethod || 'UPI',
          transactionReference,
          notes,
        },
        { role: session.role, userId: session.userId, name: session.name }
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        fine: result.fine,
        payment: result.payment,
        receipt: result.receipt,
      });
    } else if (action === 'waive') {
      const result = await waiveFine(
        id,
        reason || 'Administrative waiver',
        { role: session.role, userId: session.userId, name: session.name }
      );

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        fine: result.fine,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported actions are "pay" or "waive".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/finance/fines/[id]:', error);
    return NextResponse.json({ error: 'Server error updating fine.' }, { status: 500 });
  }
}
