
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все производственные операции
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chainId = searchParams.get('chainId');

    const where = chainId ? { chainId } : {};

    const operations = await prisma.productionOperation.findMany({
      where,
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
    console.error('Ошибка получения производственных операций:', error);
    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

// POST - создать новую производственную операцию
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { chainId, name, description, comment, enabled, estimatedProductivityPerHour, estimatedProductivityPerHourVariance } = data;

    if (!chainId || !name) {
      return NextResponse.json(
        { error: 'Обязательные поля: chainId, name' },
        { status: 400 }
      );
    }

    // Получаем следующий порядковый номер
    const maxOrder = await prisma.productionOperation.findFirst({
      where: { chainId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true }
    });

    const nextOrderIndex = (maxOrder?.orderIndex || 0) + 1;

    const operation = await prisma.productionOperation.create({
      data: {
        chainId,
        name,
        description,
        comment,
        orderIndex: nextOrderIndex,
        enabled: enabled !== undefined ? enabled : true,
        estimatedProductivityPerHour: estimatedProductivityPerHour || null,
        estimatedProductivityPerHourVariance: estimatedProductivityPerHourVariance || null,
      },
      include: {
        chain: {
          include: {
            process: {
              include: { product: true }
            }
          }
        },
        operationMaterials: true,
        operationEquipment: true,
        operationRoles: true
      }
    });

    return NextResponse.json(operation);
  } catch (error) {
    console.error('Ошибка создания производственной операции:', error);
    return NextResponse.json(
      { error: 'Ошибка создания операции' },
      { status: 500 }
    );
  }
}
