
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/operation-materials/[id] - обновить материал операции
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { quantity, unitPrice, variance, comment } = data;

    if (!quantity || !unitPrice) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const totalCost = parseFloat(quantity) * parseFloat(unitPrice);

    const operationMaterial = await prisma.operationMaterial.update({
      where: { id: params.id },
      data: {
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        totalCost,
        variance: variance ? parseFloat(variance) : null,
        comment,
      },
      include: {
        material: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(operationMaterial);
  } catch (error) {
    console.error('Ошибка обновления материала:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/operation-materials/[id] - удалить материал из операции
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.operationMaterial.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления материала:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
