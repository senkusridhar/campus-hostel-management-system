import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { updateUserStatus } from '@/lib/services/workflow-service';

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

    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Super Administrator can update user activation status.' },
        { status: 403 }
      );
    }

    const { id: targetUserId } = await params;
    const body = await req.json();

    if (typeof body.isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing or invalid parameter: isActive must be a boolean.' },
        { status: 400 }
      );
    }

    const result = await updateUserStatus(targetUserId, body.isActive, session.userId);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      user: result.user,
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
