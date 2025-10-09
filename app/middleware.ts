
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/auth/signin",
    },
  }
);

// Защищаем все страницы кроме /auth/* и API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - auth (authentication pages)
     * - api (all API routes - they handle auth separately if needed)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!auth|api|_next/static|_next/image|favicon.ico).*)",
  ],
};
