
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/production-operations/[id] - получить операцию с полными данными
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const operation = await prisma.productionOperation.findUnique({
      where: { id: params.id },
      include: {
        chain: {
          include: {
            process: {
              include: {
                product: true,
              },
            },
          },
        },
        operationMaterials: {
          include: {
            material: {
              include: {
                category: true,
              },
            },
          },
        },
        operationEquipment: {
          include: {
            equipment: true,
          },
        },
        operationRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!operation) {
      return NextResponse.json({ error: 'Операция не найдена' }, { status: 404 });
    }

    return NextResponse.json(operation);
  } catch (error) {
    console.error('Ошибка получения операции:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// PUT /api/production-operations/[id] - обновить операцию
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const { name, description, comment, enabled } = data;

    const operation = await prisma.productionOperation.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        comment: comment || null,
        enabled,
      },
      include: {
        chain: {
          include: {
            process: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(operation);
  } catch (error) {
    console.error('Ошибка обновления операции:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// DELETE /api/production-operations/[id] - удалить операцию
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.productionOperation.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления операции:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
