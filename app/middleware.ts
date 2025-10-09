
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  console.log('[Middleware] Path:', request.nextUrl.pathname);
  console.log('[Middleware] Has token:', !!token);
  
  // Проверяем наличие и валидность токена
  if (!token) {
    console.log('[Middleware] No token, redirecting to signin');
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  try {
    // Проверяем валидность JWT токена
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development'
    );
    console.log('[Middleware] Verifying token...');
    const { payload } = await jwtVerify(token, secret);
    console.log('[Middleware] Token valid, user:', JSON.stringify(payload));
    return NextResponse.next();
  } catch (error) {
    // Токен невалиден - удаляем cookie и перенаправляем на вход
    console.error('[Middleware] Token invalid:', error);
    const response = NextResponse.redirect(new URL('/auth/signin', request.url));
    response.cookies.delete('auth-token');
    return response;
  }
}

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
