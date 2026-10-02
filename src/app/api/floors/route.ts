import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listFloors, createFloor } from '@/lib/services/hostel-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const blockId = searchParams.get('blockId') || undefined;
    const hostelId = searchParams.get('hostelId') || undefined;

    const floors = await listFloors(blockId, hostelId);
    return NextResponse.json({ success: true, floors });
  } catch (error) {
    console.error('Error fetching floors:', error);
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
    const { blockId, floorNumber, name, isActive } = body;

    if (!blockId || floorNumber === undefined || !name) {
      return NextResponse.json(
        { error: 'Block ID, floor number, and name are required.' },
        { status: 400 }
      );
    }

    const created = await createFloor({
      blockId,
      floorNumber: Number(floorNumber),
      name,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json(
      { success: true, message: 'Floor registered successfully.', floor: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating floor:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
