
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT - Обновить оборудование
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const equipment = await prisma.equipment.update({
      where: { id: params.id },
      data: {
        name: data.name,
        estimatedCost: data.estimatedCost,
        hourlyDepreciation: data.hourlyDepreciation,
        maxProductivity: data.maxProductivity,
        productivityUnits: data.productivityUnits,
        comment: data.comment,
      },
    });
    
    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Ошибка обновления оборудования:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить оборудование' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить оборудование
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.equipment.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: 'Оборудование удалено' });
  } catch (error) {
    console.error('Ошибка удаления оборудования:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить оборудование' },
      { status: 500 }
    );
  }
}
