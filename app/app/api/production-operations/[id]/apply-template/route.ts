
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { templateId } = await request.json();

    // Получаем шаблон со всеми связанными данными
    const template = await prisma.operationTemplate.findUnique({
      where: { id: templateId },
      include: {
        materials: true,
        equipment: true,
        roles: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Шаблон не найден" },
        { status: 404 }
      );
    }

    // Обновляем операцию данными из шаблона
    const operation = await prisma.productionOperation.update({
      where: { id: params.id },
      data: {
        description: template.description,
        comment: template.comment,
        enabled: template.enabled,
        estimatedProductivityPerHour: template.estimatedProductivityPerHour,
        estimatedProductivityPerHourVariance: template.estimatedProductivityPerHourVariance,
        cycleHours: template.cycleHours,
        minimumBatchSize: template.minimumBatchSize,
        // Удаляем старые материалы, оборудование и роли
        operationMaterials: {
          deleteMany: {},
        },
        operationEquipment: {
          deleteMany: {},
        },
        operationRoles: {
          deleteMany: {},
        },
      },
    });

    // Создаем новые материалы из шаблона
    if (template.materials.length > 0) {
      await prisma.operationMaterial.createMany({
        data: template.materials.map((m) => ({
          operationId: params.id,
          materialId: m.materialId,
          quantity: m.quantity,
          unitPrice: m.unitPrice,
          totalCost: m.totalCost,
          variance: m.variance,
          comment: m.comment,
          enabled: m.enabled,
        })),
      });
    }

    // Создаем новое оборудование из шаблона
    if (template.equipment.length > 0) {
      await prisma.operationEquipment.createMany({
        data: template.equipment.map((e) => ({
          operationId: params.id,
          equipmentId: e.equipmentId,
          machineTime: e.machineTime,
          machineTimeSeconds: e.machineTimeSeconds,
          piecesPerHour: e.piecesPerHour,
          hourlyRate: e.hourlyRate,
          totalCost: e.totalCost,
          variance: e.variance,
          comment: e.comment,
          enabled: e.enabled,
          requiresContinuousOperation: e.requiresContinuousOperation,
        })),
      });
    }

    // Создаем новые роли из шаблона
    if (template.roles.length > 0) {
      await prisma.operationRole.createMany({
        data: template.roles.map((r) => ({
          operationId: params.id,
          roleId: r.roleId,
          timeSpent: r.timeSpent,
          timeSpentSeconds: r.timeSpentSeconds,
          piecesPerHour: r.piecesPerHour,
          paymentType: r.paymentType,
          rate: r.rate,
          totalCost: r.totalCost,
          variance: r.variance,
          comment: r.comment,
          enabled: r.enabled,
          requiresContinuousPresence: r.requiresContinuousPresence,
        })),
      });
    }

    // Получаем обновленную операцию
    const updatedOperation = await prisma.productionOperation.findUnique({
      where: { id: params.id },
      include: {
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

    return NextResponse.json(updatedOperation);
  } catch (error) {
    console.error("Error applying template to operation:", error);
    return NextResponse.json(
      { error: "Ошибка при применении шаблона к операции" },
      { status: 500 }
    );
  }
}
