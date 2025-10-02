
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все позиции заказов
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    const where = orderId ? { orderId } : {};

    const orderItems = await prisma.orderItem.findMany({
      where,
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

    return NextResponse.json(orderItems);
  } catch (error) {
    console.error('Ошибка получения позиций заказа:', error);
    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

// POST - создать новую позицию заказа
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { orderId, productId, quantity, productionProcessId } = data;

    if (!orderId || !productId || !quantity || !productionProcessId) {
      return NextResponse.json(
        { error: 'Обязательные поля: orderId, productId, quantity, productionProcessId' },
        { status: 400 }
      );
    }

    const orderItem = await prisma.orderItem.create({
      data: {
        orderId,
        productId,
        quantity: parseInt(quantity),
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
    console.error('Ошибка создания позиции заказа:', error);
    return NextResponse.json(
      { error: 'Ошибка создания позиции' },
      { status: 500 }
    );
  }
}
