
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

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

    return NextResponse.json({
      message: 'Успешный вход',
      user: { id: user.id, email: user.email, name: user.name }
    });

  } catch (error) {
    console.error('Ошибка входа:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
