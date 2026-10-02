import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listHostels, createHostel } from '@/lib/services/hostel-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const hostels = await listHostels();
    return NextResponse.json({ success: true, hostels });
  } catch (error) {
    console.error('Error fetching hostels:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching hostels.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Only SUPER_ADMIN can create new hostels
    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Super Admin can register new hostels.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, code, genderCategory, address, capacity, isActive } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Hostel name is required.' }, { status: 400 });
    }

    if (!code || typeof code !== 'string' || !code.trim()) {
      return NextResponse.json({ error: 'Hostel code is required.' }, { status: 400 });
    }

    if (!genderCategory || typeof genderCategory !== 'string') {
      return NextResponse.json({ error: 'Gender category is required.' }, { status: 400 });
    }

    if (!capacity || typeof capacity !== 'number' || capacity <= 0) {
      return NextResponse.json({ error: 'Valid total bed capacity is required.' }, { status: 400 });
    }

    const created = await createHostel({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      genderCategory,
      address,
      capacity,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json(
      { success: true, message: 'Hostel created successfully.', hostel: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating hostel:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating hostel.' },
      { status: 500 }
    );
  }
}
