// =============================================================================
// Next.js middleware — auth check for /admin/* paths
// =============================================================================
// Per PM Plan Section 14.4: middleware redirects unauthenticated requests to
// /admin/* to /login?redirect=<original>. Authenticated requests without the
// Admin group return 403.

import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt } from "@gps/shared";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Only protect /admin paths.
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("gps-jwt");
  if (!cookie?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const claims = await verifyJwt(cookie.value);
    // Admin-only.
    if (!claims.groups?.includes("Admin")) {
      return new NextResponse("Forbidden: admin access required.", {
        status: 403,
      });
    }
    return NextResponse.next();
  } catch {
    // Invalid or expired token.
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
