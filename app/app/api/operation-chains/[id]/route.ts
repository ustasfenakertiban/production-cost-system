
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить конкретную цепочку операций
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const chain = await prisma.operationChain.findUnique({
      where: { id: params.id },
      include: {
        process: {
          include: { product: true }
        },
        operations: {
          include: {
            operationMaterials: {
              include: { material: { include: { category: true } } }
            },
            operationEquipment: {
              include: { equipment: true }
            },
            operationRoles: {
              include: { role: true }
            }
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!chain) {
      return NextResponse.json(
        { error: 'Цепочка операций не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json(chain);
  } catch (error) {
    console.error('Ошибка получения цепочки операций:', error);
    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

// PUT - обновить цепочку операций
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { name, chainType } = data;

    const chain = await prisma.operationChain.update({
      where: { id: params.id },
      data: {
        name,
        chainType,
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
    console.error('Ошибка обновления цепочки операций:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления цепочки' },
      { status: 500 }
    );
  }
}

// DELETE - удалить цепочку операций
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.operationChain.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления цепочки операций:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления цепочки' },
      { status: 500 }
    );
  }
}
