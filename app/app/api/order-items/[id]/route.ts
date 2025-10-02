
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить позицию заказа по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        productionProcess: {
          include: {
            product: true
          }
        },
        order: true
      }
    });

    if (!orderItem) {
      return NextResponse.json({ error: 'Позиция заказа не найдена' }, { status: 404 });
    }

    return NextResponse.json(orderItem);
  } catch (error) {
    console.error('Ошибка получения позиции заказа:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// PUT - обновить позицию заказа
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { productId, quantity, productionProcessId } = data;

    const orderItem = await prisma.orderItem.update({
      where: { id: params.id },
      data: {
        productId,
        quantity: quantity ? parseInt(quantity) : undefined,
        productionProcessId
      },
      include: {
        product: true,
        productionProcess: true,
        order: true
      }
    });

    return NextResponse.json(orderItem);
  } catch (error) {
    console.error('Ошибка обновления позиции заказа:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE - удалить позицию заказа
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.orderItem.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления позиции заказа:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
