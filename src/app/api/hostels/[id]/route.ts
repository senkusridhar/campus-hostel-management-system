import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { updateHostel, listHostels } from '@/lib/services/hostel-service';

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
    const hostels = await listHostels();
    const found = hostels.find((h) => h.id === id || h.code === id);

    if (!found) {
      return NextResponse.json({ error: 'Hostel not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, hostel: found });
  } catch (error) {
    console.error('Error fetching hostel by id:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
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

    if (session.role !== 'SUPER_ADMIN' && session.role !== 'WARDEN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Super Admin and Wardens can update hostel details.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await updateHostel(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Hostel not found or update failed.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Hostel updated successfully.',
      hostel: updated,
    });
  } catch (error) {
    console.error('Error updating hostel:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
