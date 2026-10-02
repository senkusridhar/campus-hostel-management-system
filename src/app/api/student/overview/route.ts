import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getStudentSelfServiceOverview } from '@/lib/services/workflow-service';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('hms_session')?.value;
    const session = sessionToken ? await verifyToken(sessionToken) : null;

    if (!session) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentIdParam = searchParams.get('studentId');

    // Students can only view their own overview; Admin and Warden can specify studentIdParam
    const effectiveStudentId =
      session.role === 'STUDENT' ? session.userId : studentIdParam || session.userId;

    const overview = await getStudentSelfServiceOverview(effectiveStudentId);
    return NextResponse.json({ success: true, ...overview });
  } catch (error) {
    console.error('Error in GET /api/student/overview:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
