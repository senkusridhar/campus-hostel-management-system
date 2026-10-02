import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { submitMonthlyFeedback, getMonthlyFeedbacks } from '@/lib/services/feedback-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
    const hostelId = searchParams.get('hostelId') || undefined;

    const feedbacks = await getMonthlyFeedbacks({
      studentId: session.userId,
      role: session.role,
      month,
      year,
      hostelId,
    });

    return NextResponse.json({ success: true, feedbacks });
  } catch (error) {
    console.error('Error fetching monthly feedbacks:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while fetching monthly feedback.' },
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

    if (session.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only resident students can submit monthly hostel feedback.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    let ratings = body.ratings;
    if (!ratings || !Array.isArray(ratings)) {
      ratings = [];
      if (body.foodRating !== undefined) ratings.push({ category: 'FOOD', criterion: 'Food Quality', rating: Number(body.foodRating) });
      if (body.staffRating !== undefined) ratings.push({ category: 'STAFF', criterion: 'Staff Behaviour', rating: Number(body.staffRating) });
      if (body.cleanlinessRating !== undefined) ratings.push({ category: 'CLEANLINESS', criterion: 'Hostel Cleanliness', rating: Number(body.cleanlinessRating) });
      if (body.securityRating !== undefined) ratings.push({ category: 'SECURITY', criterion: 'Security', rating: Number(body.securityRating) });
      if (body.roomRating !== undefined) ratings.push({ category: 'ROOM', criterion: 'Room Maintenance', rating: Number(body.roomRating) });
      if (body.waterRating !== undefined) ratings.push({ category: 'WATER', criterion: 'Water Supply', rating: Number(body.waterRating) });
      if (body.otherRating !== undefined) ratings.push({ category: 'GENERAL', criterion: 'General Services', rating: Number(body.otherRating) });
      if (body.maintenanceRating !== undefined) ratings.push({ category: 'MAINTENANCE', criterion: 'Maintenance', rating: Number(body.maintenanceRating) });
      if (body.experienceRating !== undefined) ratings.push({ category: 'EXPERIENCE', criterion: 'Overall Hostel Experience', rating: Number(body.experienceRating) });
    }

    const generalComment = body.generalComment !== undefined ? body.generalComment : body.comments;
    const isAnonymous = body.isAnonymous !== undefined ? body.isAnonymous : (body.anonymous !== undefined ? body.anonymous : false);

    const result = await submitMonthlyFeedback({
      studentId: session.userId,
      studentName: session.name,
      hostelId: body.hostelId,
      hostelName: body.hostelName,
      month: Number(body.month),
      year: Number(body.year),
      generalComment,
      isAnonymous,
      ratings,
    });

    if (result.error) {
      const statusCode = result.error.includes('already submitted') ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({ success: true, feedback: result.feedback }, { status: 201 });
  } catch (error) {
    console.error('Error submitting monthly feedback:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while submitting monthly feedback.' },
      { status: 500 }
    );
  }
}
