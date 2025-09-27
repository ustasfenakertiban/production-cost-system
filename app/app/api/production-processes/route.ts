
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все производственные процессы
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const where = productId ? { productId } : {};

    const processes = await prisma.productionProcess.findMany({
      where,
      include: {
        product: true,
        operationChains: {
          include: {
            operations: {
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(processes);
  } catch (error) {
    console.error('Ошибка получения производственных процессов:', error);
    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

// POST - создать новый производственный процесс
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { productId, name, description } = data;

    if (!productId || !name) {
      return NextResponse.json(
        { error: 'Обязательные поля: productId, name' },
        { status: 400 }
      );
    }

    const process = await prisma.productionProcess.create({
      data: {
        productId,
        name,
        description,
      },
      include: {
        product: true,
        operationChains: true
      }
    });

    return NextResponse.json(process);
  } catch (error) {
    console.error('Ошибка создания производственного процесса:', error);
    return NextResponse.json(
      { error: 'Ошибка создания процесса' },
      { status: 500 }
    );
  }
}
