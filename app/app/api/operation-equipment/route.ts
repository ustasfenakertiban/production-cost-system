
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/operation-equipment?operationId=xxx - получить оборудование операции
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      return NextResponse.json({ error: 'operationId is required' }, { status: 400 });
    }

    const operationEquipment = await prisma.operationEquipment.findMany({
      where: { operationId },
      include: {
        equipment: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(operationEquipment);
  } catch (error) {
    console.error('Ошибка получения оборудования операции:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST /api/operation-equipment - добавить оборудование к операции
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { operationId, equipmentId, machineTime, machineTimeSeconds, hourlyRate, variance, comment, enabled } = data;

    if (!operationId || !equipmentId || !machineTime || !hourlyRate) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }

    const totalCost = parseFloat(machineTime) * parseFloat(hourlyRate);

    const operationEquipment = await prisma.operationEquipment.create({
      data: {
        operationId,
        equipmentId,
        machineTime: parseFloat(machineTime),
        machineTimeSeconds: machineTimeSeconds ? parseFloat(machineTimeSeconds) : null,
        hourlyRate: parseFloat(hourlyRate),
        totalCost,
        variance: variance ? parseFloat(variance) : null,
        comment: comment,
        enabled: enabled !== undefined ? enabled : true,
      },
      include: {
        equipment: true,
      },
    });

    return NextResponse.json(operationEquipment);
  } catch (error) {
    console.error('Ошибка добавления оборудования:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
