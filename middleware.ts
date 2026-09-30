import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = await verifySessionToken(sessionCookie);

  // 1. API Route Protection (/api/admin/*)
  if (pathname.startsWith("/api/admin")) {
    // /api/admin/login is public
    if (pathname === "/api/admin/login") {
      return NextResponse.next();
    }

    // All other /api/admin/* routes reject unauthenticated requests with 401 JSON
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized. Admin session required." },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // 2. Dashboard UI Route Protection (/admin/*)
  const isLoginPage = pathname === "/admin/login";

  // If user is already authenticated and visits the login page, redirect to overview
  if (isLoginPage) {
    if (session) {
      const overviewUrl = new URL("/admin/overview", request.url);
      return NextResponse.redirect(overviewUrl);
    }
    return NextResponse.next();
  }

  // Protect all other /admin/* routes: redirect unauthenticated users to login
  if (pathname.startsWith("/admin")) {
    if (!session) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
