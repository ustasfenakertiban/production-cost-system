

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT - Обновить категорию материалов
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const category = await prisma.materialCategory.update({
      where: { id: params.id },
      data: {
        name: data.name,
      },
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Ошибка обновления категории материалов:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить категорию материалов' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить категорию материалов
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.materialCategory.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: 'Категория материалов удалена' });
  } catch (error) {
    console.error('Ошибка удаления категории материалов:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить категорию материалов' },
      { status: 500 }
    );
  }
}
