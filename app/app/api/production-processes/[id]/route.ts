
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - получить конкретный производственный процесс
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const process = await prisma.productionProcess.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        operationChains: {
          include: {
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
        }
      }
    });

    if (!process) {
      return NextResponse.json(
        { error: 'Производственный процесс не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json(process);
  } catch (error) {
    console.error('Ошибка получения производственного процесса:', error);
    return NextResponse.json(
      { error: 'Ошибка получения данных' },
      { status: 500 }
    );
  }
}

// PUT - обновить производственный процесс
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { name, description } = data;

    const process = await prisma.productionProcess.update({
      where: { id: params.id },
      data: {
        name,
        description,
      },
      include: {
        product: true,
        operationChains: true
      }
    });

    return NextResponse.json(process);
  } catch (error) {
    console.error('Ошибка обновления производственного процесса:', error);
    return NextResponse.json(
      { error: 'Ошибка обновления процесса' },
      { status: 500 }
    );
  }
}

// DELETE - удалить производственный процесс
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.productionProcess.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления производственного процесса:', error);
    return NextResponse.json(
      { error: 'Ошибка удаления процесса' },
      { status: 500 }
    );
  }
}
