
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Не указаны учетные данные' 
      }, { status: 400 });
    }
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user || !user.password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Неверный email или пароль' 
      }, { status: 401 });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ 
        success: false, 
        message: 'Неверный email или пароль' 
      }, { status: 401 });
    }
    
    // Создаем JWT токен
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development',
      { expiresIn: '30d' }
    );
    
    // Создаем response с cookie
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
    
    // Устанавливаем cookie с токеном
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('[Login] Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Произошла ошибка при входе',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
