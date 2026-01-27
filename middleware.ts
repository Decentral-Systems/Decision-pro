import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Route Protection
 * Protects dashboard routes and redirects unauthenticated users to login
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get auth token from localStorage (client-side check will be more thorough)
  // For server-side, we check if there's any indication of auth
  const authCookie = request.cookies.get('auth_access_token');
  const isAuthenticated = !!authCookie;
  
  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  // Define auth routes (login page)
  const isAuthRoute = pathname.startsWith('/login');
  
  // Define protected routes (dashboard and its subroutes)
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/credit-scoring') ||
                          pathname.startsWith('/default-prediction') ||
                          pathname.startsWith('/customers') ||
                          pathname.startsWith('/analytics') ||
                          pathname.startsWith('/compliance') ||
                          pathname.startsWith('/settings') ||
                          pathname.startsWith('/admin') ||
                          pathname.startsWith('/ml-center') ||
                          pathname.startsWith('/rules-engine') ||
                          pathname.startsWith('/system-status') ||
                          pathname.startsWith('/realtime-scoring') ||
                          pathname.startsWith('/dynamic-pricing');
  
  // Redirect authenticated users away from login page
  if (isAuthenticated && isAuthRoute) {
    console.log('[Middleware] Authenticated user accessing login, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Redirect unauthenticated users to login when accessing protected routes
  if (!isAuthenticated && isProtectedRoute) {
    console.log('[Middleware] Unauthenticated user accessing protected route, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    // Store the attempted URL to redirect back after login
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow the request to proceed
  return NextResponse.next();
}

/**
 * Middleware configuration
 * Specifies which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
