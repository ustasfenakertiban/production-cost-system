
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить заказ по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        orderItems: {
          include: {
            product: true,
            productionProcess: {
              include: {
                product: true,
                operationChains: {
                  include: {
                    operations: {
                      include: {
                        operationMaterials: {
                          include: {
                            material: {
                              include: {
                                category: true
                              }
                            }
                          }
                        },
                        operationEquipment: {
                          include: {
                            equipment: true
                          }
                        },
                        operationRoles: {
                          include: {
                            role: true
                          }
                        }
                      },
                      orderBy: { orderIndex: 'asc' }
                    }
                  },
                  orderBy: { orderIndex: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Ошибка получения заказа:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// PUT - обновить заказ
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { name, orderDate } = data;

    const order = await prisma.order.update({
      where: { id: params.id },
      data: {
        name,
        orderDate: orderDate ? new Date(orderDate) : undefined
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
    console.error('Ошибка обновления заказа:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE - удалить заказ
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.order.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления заказа:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
