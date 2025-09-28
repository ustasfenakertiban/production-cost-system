
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/operation-roles?operationId=xxx - получить роли операции
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      return NextResponse.json({ error: 'operationId is required' }, { status: 400 });
    }

    const operationRoles = await prisma.operationRole.findMany({
      where: { operationId },
      include: {
        role: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(operationRoles);
  } catch (error) {
    console.error('Ошибка получения ролей операции:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/operation-roles - добавить роль к операции
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { operationId, roleId, timeSpent, paymentType, rate, variance, comment, enabled } = data;

    if (!operationId || !roleId || !timeSpent || !paymentType || !rate) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const totalCost = parseFloat(timeSpent) * parseFloat(rate);

    const operationRole = await prisma.operationRole.create({
      data: {
        operationId,
        roleId,
        timeSpent: parseFloat(timeSpent),
        paymentType,
        rate: parseFloat(rate),
        totalCost,
        variance: variance ? parseFloat(variance) : null,
        comment: comment,
        enabled: enabled !== undefined ? enabled : true,
      },
      include: {
        role: true,
      },
    });

    return NextResponse.json(operationRole);
  } catch (error) {
    console.error('Ошибка добавления роли:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
