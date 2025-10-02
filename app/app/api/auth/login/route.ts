
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { encode } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: 'Email и пароль обязательны' }, { status: 400 });
    }

    // Validate credentials through NextAuth provider
    const provider = authOptions.providers.find(p => p.id === 'credentials') as any;
    if (!provider || !provider.authorize) {
      return NextResponse.json({ message: 'Провайдер не найден' }, { status: 500 });
    }

    const user = await provider.authorize({ email, password }, req as any);

    if (!user) {
      return NextResponse.json({ message: 'Неверные учетные данные' }, { status: 401 });
    }

    // Create JWT token compatible with NextAuth format
    const secret = authOptions.secret || process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development';
    const maxAge = authOptions.session?.maxAge || 30 * 24 * 60 * 60;
    
    // Build token payload with all required NextAuth fields
    let tokenPayload: any = {
      name: user.name,
      email: user.email,
      sub: user.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + maxAge,
      jti: crypto.randomUUID(),
    };

    // Apply JWT callback if defined
    if (authOptions.callbacks?.jwt) {
      tokenPayload = await authOptions.callbacks.jwt({
        token: tokenPayload,
        user: user,
        account: null,
        profile: undefined,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      });
    }

    const token = await encode({
      token: tokenPayload,
      secret,
      maxAge,
    });

    // Set cookie with NextAuth naming convention
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    const response = NextResponse.json({
      message: 'Успешный вход',
      user: { id: user.id, email: user.email, name: user.name },
      ok: true,
      url: '/'
    });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Ошибка входа:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
