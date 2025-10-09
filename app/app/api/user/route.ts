
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: 'Не авторизован' 
      }, { status: 401 });
    }
    
    // Проверяем и декодируем JWT токен
    const decoded = jwt.verify(
      token, 
      process.env.NEXTAUTH_SECRET || 'fallback-secret-key-for-development'
    ) as { id: string; email: string; name: string };
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name
      }
    });
  } catch (error) {
    console.error('[User API] Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Ошибка получения данных пользователя',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
