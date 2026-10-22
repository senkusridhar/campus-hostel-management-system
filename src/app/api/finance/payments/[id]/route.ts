import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getPaymentById } from '@/lib/services/finance-service';

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
    const payment = await getPaymentById(id, { role: session.role, userId: session.userId });

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Error in GET /api/finance/payments/[id]:', error);
    return NextResponse.json({ error: 'Server error retrieving payment.' }, { status: 500 });
  }
}
