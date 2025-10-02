
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/operation-roles/[id] - обновить роль операции
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { timeSpent, timeSpentSeconds, piecesPerHour, paymentType, rate, variance, comment, enabled, requiresContinuousPresence } = data;

    if (!timeSpent || !paymentType || !rate) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const totalCost = parseFloat(timeSpent) * parseFloat(rate);

    const operationRole = await prisma.operationRole.update({
      where: { id: params.id },
      data: {
        timeSpent: parseFloat(timeSpent),
        timeSpentSeconds: timeSpentSeconds ? parseFloat(timeSpentSeconds) : null,
        piecesPerHour: piecesPerHour ? parseFloat(piecesPerHour) : null,
        paymentType,
        rate: parseFloat(rate),
        totalCost,
        variance: variance ? parseFloat(variance) : null,
        comment: comment,
        enabled: enabled !== undefined ? enabled : true,
        requiresContinuousPresence: requiresContinuousPresence !== undefined ? requiresContinuousPresence : true,
      },
      include: {
        role: true,
      },
    });

    return NextResponse.json(operationRole);
  } catch (error) {
    console.error('Ошибка обновления роли:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/operation-roles/[id] - удалить роль из операции
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.operationRole.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления роли:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
