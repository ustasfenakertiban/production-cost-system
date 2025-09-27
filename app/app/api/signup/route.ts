
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ message: 'Все поля обязательны' }, { status: 400 });
    }

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Пользователь уже существует' }, { status: 400 });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаем пользователя
    const user = await prisma.user.create({
      data: {
        email,
        name: fullName,
        password: hashedPassword,
      }
    });

    return NextResponse.json({ 
      message: 'Пользователь успешно зарегистрирован',
      user: { id: user.id, email: user.email, name: user.name }
    }, { status: 201 });

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}
