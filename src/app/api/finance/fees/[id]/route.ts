import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getFeeById } from '@/lib/services/finance-service';

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
    const fee = await getFeeById(id, { role: session.role, userId: session.userId });

    if (!fee) {
      return NextResponse.json({ error: 'Fee record not found or access denied.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, fee });
  } catch (error) {
    console.error('Error in GET /api/finance/fees/[id]:', error);
    return NextResponse.json({ error: 'Server error retrieving fee.' }, { status: 500 });
  }
}
