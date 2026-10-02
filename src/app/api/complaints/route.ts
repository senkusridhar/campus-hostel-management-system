import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { listComplaints, createComplaint } from '@/lib/services/complaint-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const sortBy = (searchParams.get('sortBy') as 'votes' | 'date' | 'priority') || undefined;
    const scope = searchParams.get('scope'); // 'my' vs 'all'

    const studentIdFilter =
      session.role === 'STUDENT' && scope === 'my' ? session.userId : undefined;

    const complaints = await listComplaints({
      studentId: studentIdFilter,
      role: session.role,
      category,
      priority,
      status,
      search,
      sortBy,
      currentUserId: session.userId,
    });

    return NextResponse.json({ success: true, complaints });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching complaints.' },
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

    // Role check: Only students and authorized staff can create complaints
    if (session.role !== 'STUDENT' && session.role !== 'SUPER_ADMIN' && session.role !== 'WARDEN') {
      return NextResponse.json(
        { error: 'Your role is not authorized to create complaints.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, category, priority, roomId, hostelId, blockId, imageUrl } = body;

    // Server-side validation
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Complaint title is required.' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Detailed description is required.' }, { status: 400 });
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json({ error: 'Complaint category is required.' }, { status: 400 });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'];
    const normPriority = (priority || 'MEDIUM').toUpperCase();
    if (!validPriorities.includes(normPriority)) {
      return NextResponse.json({ error: 'Invalid priority level.' }, { status: 400 });
    }

    const created = await createComplaint(
      {
        studentId: session.userId,
        hostelId,
        blockId,
        roomId,
        category,
        priority: normPriority,
        title,
        description,
        imageUrl,
      },
      {
        name: session.name,
        studentId: session.userId === 'demo-student-01' ? 'STU2024012' : 'STU-RESIDENT',
        roomNumber: '101',
        hostelName: 'Boys Hostel A',
      }
    );

    return NextResponse.json({ success: true, complaint: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating complaint:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while creating complaint.' },
      { status: 500 }
    );
  }
}
