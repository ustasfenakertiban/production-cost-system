
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Получить все оборудование
export async function GET() {
  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Ошибка получения оборудования:', error);
    return NextResponse.json(
      { error: 'Не удалось получить оборудование' },
      { status: 500 }
    );
  }
}

// POST - Создать новое оборудование
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const equipment = await prisma.equipment.create({
      data: {
        name: data.name,
        estimatedCost: data.estimatedCost,
        hourlyDepreciation: data.hourlyDepreciation,
        maxProductivity: data.maxProductivity,
        productivityUnits: data.productivityUnits,
        comment: data.comment,
      },
    });
    
    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания оборудования:', error);
    return NextResponse.json(
      { error: 'Не удалось создать оборудование' },
      { status: 500 }
    );
  }
}
