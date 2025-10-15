import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to auth pages
  if (pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }

  // Allow access to public API routes
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next()
  }

  // Allow access to static assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // For now, allow all routes (we'll handle auth in components)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)",
  ],
}
