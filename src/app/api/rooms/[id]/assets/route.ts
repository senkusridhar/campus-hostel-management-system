import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listRoomAssets, addRoomAsset, updateRoomAsset } from '@/lib/services/hostel-service';

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
    const { searchParams } = new URL(req.url);
    const condition = searchParams.get('condition') || undefined;

    const assets = await listRoomAssets(id, condition);
    return NextResponse.json({ success: true, assets });
  } catch (error) {
    console.error('Error fetching room assets:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    if (
      session.role !== 'SUPER_ADMIN' &&
      session.role !== 'WARDEN' &&
      session.role !== 'MAINTENANCE'
    ) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { assetType, quantity, condition, serialNumber, notes } = body;

    if (!assetType) {
      return NextResponse.json({ error: 'Asset type is required.' }, { status: 400 });
    }

    const created = await addRoomAsset({
      roomId: id,
      assetType,
      quantity: Number(quantity) || 1,
      condition: condition || 'GOOD',
      serialNumber,
      notes,
    });

    return NextResponse.json(
      { success: true, message: 'Room asset registered.', asset: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating room asset:', error);
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

    if (
      session.role !== 'SUPER_ADMIN' &&
      session.role !== 'WARDEN' &&
      session.role !== 'MAINTENANCE'
    ) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const body = await req.json();
    const { assetId, ...updates } = body;

    if (!assetId) {
      return NextResponse.json({ error: 'Asset ID is required.' }, { status: 400 });
    }

    const updated = await updateRoomAsset(assetId, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Asset updated successfully.',
      asset: updated,
    });
  } catch (error) {
    console.error('Error updating room asset:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
