

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Получить все категории материалов
export async function GET() {
  try {
    const categories = await prisma.materialCategory.findMany({
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Ошибка получения категорий материалов:', error);
    return NextResponse.json(
      { error: 'Не удалось получить категории материалов' },
      { status: 500 }
    );
  }
}

// POST - Создать новую категорию материалов
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const category = await prisma.materialCategory.create({
      data: {
        name: data.name,
      },
    });
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания категории материалов:', error);
    return NextResponse.json(
      { error: 'Не удалось создать категорию материалов' },
      { status: 500 }
    );
  }
}
