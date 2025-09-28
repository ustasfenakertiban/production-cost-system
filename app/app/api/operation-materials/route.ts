
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/operation-materials?operationId=xxx - получить материалы операции
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      return NextResponse.json({ error: 'operationId is required' }, { status: 400 });
    }

    const operationMaterials = await prisma.operationMaterial.findMany({
      where: { operationId },
      include: {
        material: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(operationMaterials);
  } catch (error) {
    console.error('Ошибка получения материалов операции:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/operation-materials - добавить материал к операции
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { operationId, materialId, quantity, unitPrice, variance, comments, enabled } = data;

    if (!operationId || !materialId || !quantity || !unitPrice) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const totalCost = quantity * unitPrice;

    const operationMaterial = await prisma.operationMaterial.create({
      data: {
        operationId,
        materialId,
        quantity: parseFloat(quantity),
        unitPrice: parseFloat(unitPrice),
        totalCost,
        variance: variance ? parseFloat(variance) : null,
        comment: comments,
        enabled: enabled !== undefined ? enabled : true,
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
    console.error('Ошибка добавления материала:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
