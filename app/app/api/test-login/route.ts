
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Test Login] Request received:', { email: body.email });

    const user = await prisma.user.findUnique({
      where: { email: body.email }
    });

    if (!user || !user.password) {
      console.log('[Test Login] User not found or no password');
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(body.password, user.password);
    console.log('[Test Login] Password valid:', isValid);

    if (!isValid) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 });
    }

    console.log('[Test Login] Login successful');
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('[Test Login] Error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
