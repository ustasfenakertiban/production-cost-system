
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить оборудование операции
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    const where = operationId ? { operationId } : {};

    const equipment = await prisma.operationEquipment.findMany({
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
        equipment: true
      }
    });

    return NextResponse.json(equipment);
  } catch (error) {
    console.error('Ошибка получения оборудования операции:', error);
    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

// POST - добавить оборудование в операцию
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { operationId, equipmentId, machineTime, hourlyRate, variance } = data;

    if (!operationId || !equipmentId || !machineTime || !hourlyRate) {
      return NextResponse.json(
        { error: 'Обязательные поля: operationId, equipmentId, machineTime, hourlyRate' },
        { status: 400 }
      );
    }

    const totalCost = machineTime * hourlyRate;

    const operationEquipment = await prisma.operationEquipment.create({
      data: {
        operationId,
        equipmentId,
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
    console.error('Ошибка добавления оборудования в операцию:', error);
    return NextResponse.json(
      { error: 'Ошибка добавления оборудования' },
      { status: 500 }
    );
  }
}
