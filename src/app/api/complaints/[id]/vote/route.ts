import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { voteComplaint, removeVoteComplaint, VoteType } from '@/lib/services/complaint-service';

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
      session.role !== 'STUDENT' &&
      session.role !== 'PARENT' &&
      session.role !== 'WARDEN' &&
      session.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Your role is not authorized to vote on complaints.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    let voteType: VoteType = 'UPVOTE';
    try {
      const body = await req.json();
      if (body.type === 'DOWNVOTE' || body.voteType === 'DOWNVOTE') {
        voteType = 'DOWNVOTE';
      }
    } catch {
      // Body is optional, defaults to UPVOTE
    }

    const result = await voteComplaint(id, session.userId, voteType);

    if (result.error) {
      const statusCode = result.alreadyVoted ? 409 : 400;
      return NextResponse.json(
        {
          error: result.error,
          alreadyVoted: result.alreadyVoted,
          userVote: result.userVote,
          hasVoted: result.hasVoted,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      votesCount: result.votesCount,
      upvotesCount: result.upvotesCount,
      downvotesCount: result.downvotesCount,
      userVote: result.userVote,
      hasVoted: result.hasVoted,
    });
  } catch (error) {
    console.error('Error recording complaint vote:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing vote.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      session.role !== 'STUDENT' &&
      session.role !== 'PARENT' &&
      session.role !== 'WARDEN' &&
      session.role !== 'SUPER_ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Your role is not authorized to remove votes.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const result = await removeVoteComplaint(id, session.userId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      votesCount: result.votesCount,
      upvotesCount: result.upvotesCount,
      downvotesCount: result.downvotesCount,
      userVote: null,
      hasVoted: false,
    });
  } catch (error) {
    console.error('Error removing complaint vote:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while removing vote.' },
      { status: 500 }
    );
  }
}
