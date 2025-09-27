
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить материалы операции
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    const where = operationId ? { operationId } : {};

    const materials = await prisma.operationMaterial.findMany({
      where,
      include: {
        operation: {
          include: {
            chain: {
              include: {
                process: {
                  include: { product: true }
                }
              }
            }
          }
        },
        material: {
          include: { category: true }
        }
      }
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error('Ошибка получения материалов операции:', error);
    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

// POST - добавить материал в операцию
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { operationId, materialId, quantity, unitPrice, variance } = data;

    if (!operationId || !materialId || !quantity || !unitPrice) {
      return NextResponse.json(
        { error: 'Обязательные поля: operationId, materialId, quantity, unitPrice' },
        { status: 400 }
      );
    }

    const totalCost = quantity * unitPrice;

    const operationMaterial = await prisma.operationMaterial.create({
      data: {
        operationId,
        materialId,
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
    console.error('Ошибка добавления материала в операцию:', error);
    return NextResponse.json(
      { error: 'Ошибка добавления материала' },
      { status: 500 }
    );
  }
}
