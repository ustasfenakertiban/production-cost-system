

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT - Обновить материал
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const material = await prisma.material.update({
      where: { id: params.id },
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
    
    return NextResponse.json(material);
  } catch (error) {
    console.error('Ошибка обновления материала:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить материал' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить материал
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.material.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: 'Материал удален' });
  } catch (error) {
    console.error('Ошибка удаления материала:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить материал' },
      { status: 500 }
    );
  }
}
