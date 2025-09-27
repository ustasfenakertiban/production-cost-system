
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - обновить материал в операции
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { quantity, unitPrice, variance } = data;

    if (!quantity || !unitPrice) {
      return NextResponse.json(
        { error: 'Обязательные поля: quantity, unitPrice' },
        { status: 400 }
      );
    }

    const totalCost = quantity * unitPrice;

    const operationMaterial = await prisma.operationMaterial.update({
      where: { id: params.id },
      data: {
        quantity: parseFloat(quantity.toString()),
        unitPrice: parseFloat(unitPrice.toString()),
        totalCost: parseFloat(totalCost.toString()),
        variance: variance ? parseFloat(variance.toString()) : null,
      },
      include: {
        operation: true,
        material: {
          include: { category: true }
        }
      }
    });

    return NextResponse.json(operationMaterial);
  } catch (error) {
    console.error('Ошибка обновления материала операции:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления материала' },
      { status: 500 }
    );
  }
}

// DELETE - удалить материал из операции
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.operationMaterial.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления материала операции:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления материала' },
      { status: 500 }
    );
  }
}
