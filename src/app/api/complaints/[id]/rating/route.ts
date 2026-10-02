import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { rateComplaint } from '@/lib/services/complaint-service';

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

    if (session.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Only the student who submitted the complaint can rate the resolution.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const rawScore = body.score !== undefined ? body.score : body.rating;
    const comment = body.comment !== undefined ? body.comment : body.feedback;
    const resolutionStatus = body.resolutionStatus;

    if (rawScore === undefined || rawScore === null) {
      return NextResponse.json({ error: 'Rating score (1 to 5) is required.' }, { status: 400 });
    }

    const numScore = Number(rawScore);
    if (isNaN(numScore) || numScore < 1 || numScore > 5) {
      return NextResponse.json(
        { error: 'Rating score must be an integer between 1 and 5.' },
        { status: 400 }
      );
    }

    const result = await rateComplaint(id, session.userId, {
      score: numScore,
      comment,
      resolutionStatus,
    });

    if (result.error) {
      const statusCode = result.error.includes('Only the student') ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }

    return NextResponse.json({ success: true, rating: result.rating });
  } catch (error) {
    console.error('Error rating complaint resolution:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while saving complaint rating.' },
      { status: 500 }
    );
  }
}
