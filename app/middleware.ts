
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  
  // Проверяем наличие и валидность токена
  if (!token) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  try {
    // Проверяем валидность JWT токена
    jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development');
    return NextResponse.next();
  } catch (error) {
    // Токен невалиден - удаляем cookie и перенаправляем на вход
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
