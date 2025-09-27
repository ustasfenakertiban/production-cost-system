
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить роли операции
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    const where = operationId ? { operationId } : {};

    const roles = await prisma.operationRole.findMany({
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
        role: true
      }
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error('Ошибка получения ролей операции:', error);
    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

// POST - добавить роль в операцию
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { operationId, roleId, timeSpent, paymentType, rate } = data;

    if (!operationId || !roleId || !timeSpent || !paymentType || !rate) {
      return NextResponse.json(
        { error: 'Обязательные поля: operationId, roleId, timeSpent, paymentType, rate' },
        { status: 400 }
      );
    }

    const totalCost = timeSpent * rate;

    const operationRole = await prisma.operationRole.create({
      data: {
        operationId,
        roleId,
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
    console.error('Ошибка добавления роли в операцию:', error);
    return NextResponse.json(
      { error: 'Ошибка добавления роли' },
      { status: 500 }
    );
  }
}
