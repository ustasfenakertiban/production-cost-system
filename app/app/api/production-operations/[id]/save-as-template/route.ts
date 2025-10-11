
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description } = await request.json();

    // Получаем операцию со всеми связанными данными
    const operation = await prisma.productionOperation.findUnique({
      where: { id: params.id },
      include: {
        operationMaterials: {
          include: {
            material: true,
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
      return NextResponse.json(
        { error: "Операция не найдена" },
        { status: 404 }
      );
    }

    // Создаем шаблон из операции
    const template = await prisma.operationTemplate.create({
      data: {
        name: name || operation.name,
        description: description || operation.description,
        comment: operation.comment,
        enabled: operation.enabled,
        estimatedProductivityPerHour: operation.estimatedProductivityPerHour,
        estimatedProductivityPerHourVariance: operation.estimatedProductivityPerHourVariance,
        cycleHours: operation.cycleHours,
        operationDuration: operation.operationDuration,
        minimumBatchSize: operation.minimumBatchSize,
        cycleName: operation.cycleName,
        cyclesPerHour: operation.cyclesPerHour,
        itemsPerCycle: operation.itemsPerCycle,
        materials: {
          create: operation.operationMaterials.map((m) => ({
            materialId: m.materialId,
            quantity: m.quantity,
            unitPrice: m.unitPrice,
            totalCost: m.totalCost,
            variance: m.variance,
            comment: m.comment,
            enabled: m.enabled,
          })),
        },
        equipment: {
          create: operation.operationEquipment.map((e) => ({
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
        },
        roles: {
          create: operation.operationRoles.map((r) => ({
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
        },
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
    console.error("Error saving operation as template:", error);
    return NextResponse.json(
      { error: "Ошибка при сохранении операции как шаблона" },
      { status: 500 }
    );
  }
}
