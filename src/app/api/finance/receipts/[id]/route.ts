import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getReceiptByNumber } from '@/lib/services/finance-service';

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
    const receipt = await getReceiptByNumber(id, { role: session.role, userId: session.userId });

    if (!receipt) {
      return NextResponse.json({ error: 'Receipt not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, receipt });
  } catch (error) {
    console.error('Error in GET /api/finance/receipts/[id]:', error);
    return NextResponse.json({ error: 'Server error retrieving receipt.' }, { status: 500 });
  }
}
