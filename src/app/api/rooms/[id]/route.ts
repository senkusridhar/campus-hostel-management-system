import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getRoomById, updateRoom, setRoomMaintenance } from '@/lib/services/hostel-service';

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
    const room = await getRoomById(id);

    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error('Error fetching room by id:', error);
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

    // Role check: Admin, Warden, and Maintenance can update room maintenance/status
    if (
      session.role !== 'SUPER_ADMIN' &&
      session.role !== 'WARDEN' &&
      session.role !== 'MAINTENANCE'
    ) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Check if toggling maintenance
    if (body.action === 'SET_MAINTENANCE') {
      const isMaint = Boolean(body.isMaintenance);
      const updated = await setRoomMaintenance(id, isMaint, body.reason);
      if (!updated) {
        return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: isMaint ? 'Room marked under maintenance.' : 'Room restored from maintenance.',
        room: updated,
      });
    }

    const updated = await updateRoom(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Room details updated successfully.',
      room: updated,
    });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
