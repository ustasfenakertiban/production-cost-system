
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    console.log('[TestAuth] Testing login for:', email);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Пользователь не найден' 
      });
    }
    
    console.log('[TestAuth] User found:', user.email);
    console.log('[TestAuth] Stored hash:', user.password);
    
    const isValid = await bcrypt.compare(password, user.password!);
    
    console.log('[TestAuth] Password valid:', isValid);
    
    return NextResponse.json({
      success: isValid,
      message: isValid ? 'Пароль верный' : 'Пароль неверный',
      user: isValid ? { id: user.id, email: user.email, name: user.name } : null
    });
    
  } catch (error: any) {
    console.error('[TestAuth] Error:', error);
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}
