import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { getRoleDashboardRoute, isRoleAllowedOnRoute } from '@/lib/permissions/rbac';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip Next.js internal files, static assets, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // 2. Extract and verify session cookie
  const sessionToken = req.cookies.get('hms_session')?.value;
  const session = sessionToken ? await verifyToken(sessionToken) : null;

  // 3. Handle Unauthorized Page (Public access, but informative)
  if (pathname === '/unauthorized') {
    return NextResponse.next();
  }

  // 4. Handle Root URL ("/")
  if (pathname === '/') {
    if (session) {
      const targetDashboard = getRoleDashboardRoute(session.role);
      return NextResponse.redirect(new URL(targetDashboard, req.url));
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 5. Handle Login Routes ("/login" and "/login/*")
  if (pathname.startsWith('/login')) {
    // If already authenticated, redirect straight to their role dashboard
    if (session) {
      const targetDashboard = getRoleDashboardRoute(session.role);
      return NextResponse.redirect(new URL(targetDashboard, req.url));
    }
    return NextResponse.next();
  }

  // 6. All other routes are PROTECTED
  if (!session) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 7. If accessing generic /dashboard, redirect to role-specific dashboard
  if (pathname === '/dashboard' || pathname === '/dashboard/') {
    const targetDashboard = getRoleDashboardRoute(session.role);
    return NextResponse.redirect(new URL(targetDashboard, req.url));
  }

  // 8. Server-Side Role-Based Route Authorization Check
  const isAllowed = isRoleAllowedOnRoute(session.role, pathname);
  if (!isAllowed) {
    const unauthorizedUrl = new URL('/unauthorized', req.url);
    unauthorizedUrl.searchParams.set('role', session.role);
    unauthorizedUrl.searchParams.set('attempted', pathname);
    return NextResponse.redirect(unauthorizedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
