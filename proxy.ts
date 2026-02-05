import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authCookie = request.cookies.get("auth_access_token");
  const isAuthenticated = !!authCookie;

  const publicRoutes = ["/login", "/"];
  const isPublicRoute = publicRoutes.includes(pathname);

  const isAuthRoute = pathname.startsWith("/login");

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/credit-scoring") ||
    pathname.startsWith("/default-prediction") ||
    pathname.startsWith("/customers") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/compliance") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/ml-center") ||
    pathname.startsWith("/rules-engine") ||
    pathname.startsWith("/system-status") ||
    pathname.startsWith("/realtime-scoring") ||
    pathname.startsWith("/dynamic-pricing");

  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
