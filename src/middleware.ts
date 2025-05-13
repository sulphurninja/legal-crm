import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenEdge, getAuthTokenEdge } from '@/lib/edge-auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Quick skip for all API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const protectedRoutes = ['/dashboard', '/admin', '/leads'];
  const adminOnlyRoutes = ['/admin'];
  const authRoutes = ['/login', '/register'];

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isAdminRoute = adminOnlyRoutes.some(route => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));

  const token = getAuthTokenEdge(request);

  if (isAuthRoute && token) {
    try {
      const decoded = await verifyTokenEdge(token);
      if (decoded) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } catch {
      return NextResponse.next();
    }
  }

  if (isProtectedRoute) {
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }

    try {
      const decoded = await verifyTokenEdge(token);
      if (!decoded) {
        const url = new URL('/login', request.url);
        url.searchParams.set('from', pathname);
        return NextResponse.redirect(url);
      }

      if (isAdminRoute && !['admin', 'super_admin'].includes(decoded.role as string)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      return NextResponse.next();
    } catch {
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
