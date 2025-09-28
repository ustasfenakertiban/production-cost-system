
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить все цепочки операций
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const processId = searchParams.get('processId');

    const where = processId ? { processId } : {};

    const chains = await prisma.operationChain.findMany({
      where,
      include: {
        process: {
          include: { product: true }
        },
        operations: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json(chains);
  } catch (error) {
    console.error('Ошибка получения цепочек операций:', error);
    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

// POST - создать новую цепочку операций
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { processId, name, chainType, orderIndex, comment, enabled } = data;

    if (!processId || !name || !chainType) {
      return NextResponse.json(
        { error: 'Обязательные поля: processId, name, chainType' },
        { status: 400 }
      );
    }

    const chain = await prisma.operationChain.create({
      data: {
        processId,
        name,
        chainType,
        orderIndex: orderIndex || 1,
        comment,
        enabled: enabled !== undefined ? enabled : true,
      },
      include: {
        process: {
          include: { product: true }
        },
        operations: true
      }
    });

    return NextResponse.json(chain);
  } catch (error) {
    console.error('Ошибка создания цепочки операций:', error);
    return NextResponse.json(
      { error: 'Ошибка создания цепочки' },
      { status: 500 }
    );
  }
}
