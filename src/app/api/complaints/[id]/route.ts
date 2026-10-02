import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getComplaintById, updateComplaint } from '@/lib/services/complaint-service';

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
    const complaint = await getComplaintById(id, session.userId);

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    console.error('Error fetching complaint details:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching complaint details.' },
      { status: 500 }
    );
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

    const { id } = await params;
    const body = await req.json();

    const result = await updateComplaint(
      id,
      body,
      { role: session.role, userId: session.userId, name: session.name }
    );

    if (result.error) {
      const statusCode = result.error.includes('not authorized') ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({ success: true, complaint: result.complaint });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while updating complaint.' },
      { status: 500 }
    );
  }
}
