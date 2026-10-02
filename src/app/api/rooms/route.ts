import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listRooms, createRoom } from '@/lib/services/hostel-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get('hostelId') || undefined;
    const blockId = searchParams.get('blockId') || undefined;
    const floorId = searchParams.get('floorId') || undefined;
    const status = searchParams.get('status') || undefined;
    const genderCategory = searchParams.get('genderCategory') || undefined;
    const search = searchParams.get('search') || undefined;

    const rooms = await listRooms({
      hostelId,
      blockId,
      floorId,
      status,
      genderCategory,
      search,
    });

    return NextResponse.json({ success: true, rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    if (session.role !== 'SUPER_ADMIN' && session.role !== 'WARDEN') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const { floorId, roomNumber, roomType, capacity, genderCategory, status } = body;

    if (!floorId || !roomNumber || !roomType || !capacity) {
      return NextResponse.json(
        { error: 'Floor ID, room number, room type, and capacity are required.' },
        { status: 400 }
      );
    }

    const created = await createRoom({
      floorId,
      roomNumber: String(roomNumber).trim(),
      roomType: String(roomType).trim(),
      capacity: Number(capacity),
      genderCategory,
      status,
    });

    return NextResponse.json(
      { success: true, message: 'Room created successfully.', room: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
