

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Получить все материалы
export async function GET() {
  try {
    const materials = await prisma.material.findMany({
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(materials);
  } catch (error) {
    console.error('Ошибка получения материалов:', error);
    return NextResponse.json(
      { error: 'Не удалось получить материалы' },
      { status: 500 }
    );
  }
}

// POST - Создать новый материал
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const material = await prisma.material.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        unit: data.unit,
        cost: data.cost,
        vatPercentage: data.vatPercentage ?? 0,
        comment: data.comment,
      },
      include: {
        category: true,
      },
    });
    
    return NextResponse.json(material, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания материала:', error);
    return NextResponse.json(
      { error: 'Не удалось создать материал' },
      { status: 500 }
    );
  }
}
