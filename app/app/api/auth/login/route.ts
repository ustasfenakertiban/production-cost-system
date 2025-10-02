
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email и пароль обязательны' }, { status: 400 });
    }

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return NextResponse.json({ message: 'Неверные учетные данные' }, { status: 401 });
    }

    // Проверить пароль
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ message: 'Неверные учетные данные' }, { status: 401 });
    }

    // Создать JWT токен используя next-auth
    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development';
    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
      },
      secret,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Имя cookie для NextAuth
    const cookieName = process.env.NODE_ENV === 'production' 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token';

    const response = NextResponse.json({
      message: 'Успешный вход',
      user: { id: user.id, email: user.email, name: user.name }
    });

    // Установить cookie
    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Ошибка входа:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
