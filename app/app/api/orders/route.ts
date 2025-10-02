
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все заказы
export async function GET(request: NextRequest) {
  try {
    const orders = await prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            product: true,
            productionProcess: {
              include: {
                product: true
              }
            }
          }
        }
      },
      orderBy: { orderDate: 'desc' }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

// POST - создать новый заказ
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, orderDate, orderItems } = data;

    if (!name || !orderDate) {
      return NextResponse.json(
        { error: 'Обязательные поля: name, orderDate' },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        name,
        orderDate: new Date(orderDate),
        orderItems: orderItems ? {
          create: orderItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            productionProcessId: item.productionProcessId
          }))
        } : undefined
      },
      include: {
        orderItems: {
          include: {
            product: true,
            productionProcess: true
          }
        }
      }
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    return NextResponse.json(
      { error: 'Ошибка создания заказа' },
      { status: 500 }
    );
  }
}
