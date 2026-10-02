import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listBlocks, createBlock } from '@/lib/services/hostel-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const hostelId = searchParams.get('hostelId') || undefined;

    const blocks = await listBlocks(hostelId);
    return NextResponse.json({ success: true, blocks });
  } catch (error) {
    console.error('Error fetching blocks:', error);
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
    const { hostelId, name, code, numberOfFloors, genderCategory, isActive } = body;

    if (!hostelId || !name || !code) {
      return NextResponse.json(
        { error: 'Hostel ID, block name, and block code are required.' },
        { status: 400 }
      );
    }

    const created = await createBlock({
      hostelId,
      name,
      code,
      numberOfFloors: Number(numberOfFloors) || 1,
      genderCategory,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json(
      { success: true, message: 'Block created successfully.', block: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating block:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
