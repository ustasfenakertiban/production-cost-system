
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT - обновить оборудование в операции
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { machineTime, hourlyRate, variance } = data;

    if (!machineTime || !hourlyRate) {
      return NextResponse.json(
        { error: 'Обязательные поля: machineTime, hourlyRate' },
        { status: 400 }
      );
    }

    const totalCost = machineTime * hourlyRate;

    const operationEquipment = await prisma.operationEquipment.update({
      where: { id: params.id },
      data: {
        machineTime: parseFloat(machineTime.toString()),
        hourlyRate: parseFloat(hourlyRate.toString()),
        totalCost: parseFloat(totalCost.toString()),
        variance: variance ? parseFloat(variance.toString()) : null,
      },
      include: {
        operation: true,
        equipment: true
      }
    });

    return NextResponse.json(operationEquipment);
  } catch (error) {
    console.error('Ошибка обновления оборудования операции:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления оборудования' },
      { status: 500 }
    );
  }
}

// DELETE - удалить оборудование из операции
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.operationEquipment.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления оборудования операции:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления оборудования' },
      { status: 500 }
    );
  }
}
