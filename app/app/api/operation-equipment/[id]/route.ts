
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/operation-equipment/[id] - обновить оборудование операции
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { machineTime, hourlyRate, variance } = data;

    if (!machineTime || !hourlyRate) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const totalCost = parseFloat(machineTime) * parseFloat(hourlyRate);

    const operationEquipment = await prisma.operationEquipment.update({
      where: { id: params.id },
      data: {
        machineTime: parseFloat(machineTime),
        hourlyRate: parseFloat(hourlyRate),
        totalCost,
        variance: variance ? parseFloat(variance) : null,
      },
      include: {
        equipment: true,
      },
    });

    return NextResponse.json(operationEquipment);
  } catch (error) {
    console.error('Ошибка обновления оборудования:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/operation-equipment/[id] - удалить оборудование из операции
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.operationEquipment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления оборудования:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
