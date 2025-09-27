
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - изменить порядок операции (переместить вверх или вниз)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { direction } = data; // 'up' или 'down'

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json(
        { error: 'Направление должно быть "up" или "down"' },
        { status: 400 }
      );
    }

    // Получаем текущую операцию
    const currentOperation = await prisma.productionOperation.findUnique({
      where: { id: params.id },
      select: { chainId: true, orderIndex: true }
    });

    if (!currentOperation) {
      return NextResponse.json(
        { error: 'Операция не найдена' },
        { status: 404 }
      );
    }

    // Определяем операцию для обмена позициями
    const targetOrderIndex = direction === 'up' 
      ? currentOperation.orderIndex - 1 
      : currentOperation.orderIndex + 1;

    const targetOperation = await prisma.productionOperation.findFirst({
      where: {
        chainId: currentOperation.chainId,
        orderIndex: targetOrderIndex
      },
      select: { id: true, orderIndex: true }
    });

    if (!targetOperation) {
      return NextResponse.json(
        { error: 'Нельзя переместить операцию в указанном направлении' },
        { status: 400 }
      );
    }

    // Обмениваем позиции операций в транзакции
    await prisma.$transaction([
      // Временно устанавливаем отрицательный индекс для избежания конфликта уникальности
      prisma.productionOperation.update({
        where: { id: params.id },
        data: { orderIndex: -1 }
      }),
      // Перемещаем целевую операцию на позицию текущей
      prisma.productionOperation.update({
        where: { id: targetOperation.id },
        data: { orderIndex: currentOperation.orderIndex }
      }),
      // Перемещаем текущую операцию на позицию целевой
      prisma.productionOperation.update({
        where: { id: params.id },
        data: { orderIndex: targetOperation.orderIndex }
      })
    ]);

    // Получаем обновленный список операций цепочки
    const operations = await prisma.productionOperation.findMany({
      where: { chainId: currentOperation.chainId },
      include: {
        chain: {
          include: {
            process: {
              include: { product: true }
            }
          }
        },
        operationMaterials: {
          include: { material: { include: { category: true } } }
        },
        operationEquipment: {
          include: { equipment: true }
        },
        operationRoles: {
          include: { role: true }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });

    return NextResponse.json(operations);
  } catch (error) {
    console.error('Ошибка изменения порядка операции:', error);
    return NextResponse.json(
      { error: 'Ошибка изменения порядка' },
      { status: 500 }
    );
  }
}
