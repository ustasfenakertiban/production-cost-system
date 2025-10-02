
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.operationTemplate.findUnique({
      where: { id: params.id },
      include: {
        materials: {
          include: {
            material: {
              include: {
                category: true,
              },
            },
          },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Шаблон не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching operation template:", error);
    return NextResponse.json(
      { error: "Ошибка при получении шаблона операции" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.operationTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Шаблон успешно удален" });
  } catch (error) {
    console.error("Error deleting operation template:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении шаблона операции" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    const {
      name,
      description,
      comment,
      enabled,
      estimatedProductivityPerHour,
      estimatedProductivityPerHourVariance,
      cycleHours,
      minimumBatchSize,
    } = data;

    const template = await prisma.operationTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description,
        comment,
        enabled,
        estimatedProductivityPerHour,
        estimatedProductivityPerHourVariance,
        cycleHours,
        minimumBatchSize,
      },
      include: {
        materials: {
          include: {
            material: {
              include: {
                category: true,
              },
            },
          },
        },
        equipment: {
          include: {
            equipment: true,
          },
        },
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating operation template:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении шаблона операции" },
      { status: 500 }
    );
  }
}
