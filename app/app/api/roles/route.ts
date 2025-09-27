
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Получить все роли
export async function GET() {
  try {
    const roles = await prisma.employeeRole.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(roles);
  } catch (error) {
    console.error('Ошибка получения ролей:', error);
    return NextResponse.json(
      { error: 'Не удалось получить роли' },
      { status: 500 }
    );
  }
}

// POST - Создать новую роль
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const role = await prisma.employeeRole.create({
      data: {
        name: data.name,
        paymentType: data.paymentType,
        hourlyRate: data.hourlyRate,
      },
    });
    
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания роли:', error);
    return NextResponse.json(
      { error: 'Не удалось создать роль' },
      { status: 500 }
    );
  }
}
