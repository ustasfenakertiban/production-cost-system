

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
    
    console.log(`[Materials API] UPDATE ${params.id}:`);
    console.log(`  Name: ${data.name}`);
    console.log(`  batchSize from request: ${data.batchSize} (type: ${typeof data.batchSize})`);
    console.log(`  Will be saved as: ${data.batchSize || null}`);
    
    const material = await prisma.material.update({
      where: { id: params.id },
      data: {
        name: data.name,
        categoryId: data.categoryId,
        unit: data.unit,
        cost: data.cost,
        vatPercentage: data.vatPercentage ?? 0,
        minStockPercentage: data.minStockPercentage ?? 0,
        batchSize: data.batchSize || null,
        prepaymentPercentage: data.prepaymentPercentage ?? 0,
        manufacturingDays: data.manufacturingDays ?? 0, // Может быть 0 (не требуется срок)
        deliveryDays: data.deliveryDays ?? 0, // Может быть 0 (доступно мгновенно)
        comment: data.comment,
      },
      include: {
        category: true,
      },
    });
    
    console.log(`[Materials API] Material updated. batchSize in DB: ${material.batchSize}`);
    
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
