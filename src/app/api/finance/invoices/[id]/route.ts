import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getInvoiceById } from '@/lib/services/finance-service';

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
    const invoice = await getInvoiceById(id, { role: session.role, userId: session.userId });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error('Error in GET /api/finance/invoices/[id]:', error);
    return NextResponse.json({ error: 'Server error retrieving invoice.' }, { status: 500 });
  }
}
