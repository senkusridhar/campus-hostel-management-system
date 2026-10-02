import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getMonthlyFeedbackAnalytics } from '@/lib/services/feedback-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    // Role check: Only SUPER_ADMIN and WARDEN can access analytics
    if (session.role !== 'SUPER_ADMIN' && session.role !== 'WARDEN') {
      return NextResponse.json(
        { error: 'Access restricted: Only Wardens and Administrators can view aggregate feedback analytics.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined;
    const year = searchParams.get('year') ? Number(searchParams.get('year')) : undefined;
    const hostelId = searchParams.get('hostelId') || undefined;

    const analytics = await getMonthlyFeedbackAnalytics({
      month,
      year,
      hostelId,
    });

    return NextResponse.json({ success: true, analytics });
  } catch (error) {
    console.error('Error computing feedback analytics:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while generating feedback analytics.' },
      { status: 500 }
    );
  }
}
