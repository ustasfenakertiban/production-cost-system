
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - обновить роль в операции
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { timeSpent, paymentType, rate } = data;

    if (!timeSpent || !paymentType || !rate) {
      return NextResponse.json(
        { error: 'Обязательные поля: timeSpent, paymentType, rate' },
        { status: 400 }
      );
    }

    const totalCost = timeSpent * rate;

    const operationRole = await prisma.operationRole.update({
      where: { id: params.id },
      data: {
        timeSpent: parseFloat(timeSpent.toString()),
        paymentType,
        rate: parseFloat(rate.toString()),
        totalCost: parseFloat(totalCost.toString()),
      },
      include: {
        operation: true,
        role: true
      }
    });

    return NextResponse.json(operationRole);
  } catch (error) {
    console.error('Ошибка обновления роли операции:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления роли' },
      { status: 500 }
    );
  }
}

// DELETE - удалить роль из операции
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.operationRole.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления роли операции:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления роли' },
      { status: 500 }
    );
  }
}
