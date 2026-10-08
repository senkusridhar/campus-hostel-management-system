import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { updateGatePassStatus } from '@/lib/services/gate-service';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Role check: Only Warden and Super Admin can approve/reject gate passes
    if (session.role !== 'WARDEN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only authorized Wardens or Super Administrators can approve/reject gate passes.' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Gate pass ID is required.' }, { status: 400 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 });
    }

    const { status, remarks, rejectionReason } = body || {};

    if (!status || typeof status !== 'string') {
      return NextResponse.json(
        { error: 'Approval status (APPROVED or REJECTED) is required.' },
        { status: 400 }
      );
    }

    const normStatus = status.toUpperCase();
    if (normStatus !== 'APPROVED' && normStatus !== 'REJECTED') {
      return NextResponse.json(
        { error: 'Status must be either APPROVED or REJECTED.' },
        { status: 400 }
      );
    }

    const updated = await updateGatePassStatus({
      gatePassId: id,
      status: normStatus as 'APPROVED' | 'REJECTED',
      remarks: remarks || rejectionReason,
      reviewerUserId: session.userId,
      reviewerRole: session.role,
      reviewerName: session.name,
    });

    return NextResponse.json({ success: true, gatePass: updated });
  } catch (error: any) {
    console.error('Error in PATCH /api/gate-passes/[id]:', error);
    const status = error.message && error.message.startsWith('Unauthorized:') ? 403 : 400;
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred while updating gate pass.' },
      { status }
    );
  }
}
