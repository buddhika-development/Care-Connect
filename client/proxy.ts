import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route groups each role is allowed to access
const ROLE_ROUTES: Record<string, string[]> = {
  patient: ['/patient', '/telemedicine'],
  doctor: ['/doctor', '/telemedicine'],
  admin: ['/admin'],
};

const PUBLIC_ROUTES = ['/', '/login', '/signup'];
const AUTH_ONLY_ROUTES = ['/patient', '/doctor', '/admin', '/telemedicine'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and Next.js internals through
  if (
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const role = request.cookies.get('role')?.value as string | undefined;

  // No role cookie → not logged in → redirect to login
  if (!role && AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Role exists → check if they're accessing the right dashboard
  if (role && AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
    const allowedPrefixes = ROLE_ROUTES[role] ?? [];
    const isAllowed = allowedPrefixes.some((prefix) => pathname.startsWith(prefix));

    if (!isAllowed) {
      // Wrong dashboard for this role → redirect to their dashboard
      const url = request.nextUrl.clone();
      url.pathname = `/${role}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
