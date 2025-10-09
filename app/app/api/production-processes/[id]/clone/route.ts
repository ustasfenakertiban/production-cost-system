

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/production-processes/[id]/clone - клонировать весь процесс со всеми цепочками и операциями
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { newName } = body;

    // Получаем исходный процесс со всеми связанными данными
    const sourceProcess = await prisma.productionProcess.findUnique({
      where: { id: params.id },
      include: {
        operationChains: {
          include: {
            operations: {
              include: {
                operationMaterials: true,
                operationEquipment: true,
                operationRoles: true,
              },
            },
          },
        },
      },
    });

    if (!sourceProcess) {
      return NextResponse.json({ error: 'Процесс не найден' }, { status: 404 });
    }

    // Создаем новый процесс
    const newProcess = await prisma.productionProcess.create({
      data: {
        name: newName || `${sourceProcess.name} (копия)`,
        description: sourceProcess.description,
        productId: sourceProcess.productId,
        operationChains: {
          create: sourceProcess.operationChains.map((chain) => ({
            name: chain.name,
            chainType: chain.chainType,
            comment: chain.comment,
            orderIndex: chain.orderIndex,
            enabled: chain.enabled,
            estimatedQuantity: chain.estimatedQuantity,
            operations: {
              create: chain.operations.map((operation) => ({
                name: operation.name,
                description: operation.description,
                comment: operation.comment,
                orderIndex: operation.orderIndex,
                enabled: operation.enabled,
                estimatedProductivityPerHour: operation.estimatedProductivityPerHour,
                estimatedProductivityPerHourVariance: operation.estimatedProductivityPerHourVariance,
                cycleHours: operation.cycleHours,
                operationDuration: operation.operationDuration,
                minimumBatchSize: operation.minimumBatchSize,
                cycleName: operation.cycleName,
                cyclesPerHour: operation.cyclesPerHour,
                itemsPerCycle: operation.itemsPerCycle,
                operationMaterials: {
                  create: operation.operationMaterials.map((material) => ({
                    materialId: material.materialId,
                    quantity: material.quantity,
                    quantityPerHour: material.quantityPerHour,
                    unitPrice: material.unitPrice,
                    totalCost: material.totalCost,
                    variance: material.variance,
                    comment: material.comment,
                    enabled: material.enabled,
                  })),
                },
                operationEquipment: {
                  create: operation.operationEquipment.map((equipment) => ({
                    equipmentId: equipment.equipmentId,
                    machineTime: equipment.machineTime,
                    machineTimeSeconds: equipment.machineTimeSeconds,
                    piecesPerHour: equipment.piecesPerHour,
                    hourlyRate: equipment.hourlyRate,
                    totalCost: equipment.totalCost,
                    variance: equipment.variance,
                    comment: equipment.comment,
                    enabled: equipment.enabled,
                    requiresContinuousOperation: equipment.requiresContinuousOperation,
                  })),
                },
                operationRoles: {
                  create: operation.operationRoles.map((role) => ({
                    roleId: role.roleId,
                    timeSpent: role.timeSpent,
                    timeSpentSeconds: role.timeSpentSeconds,
                    piecesPerHour: role.piecesPerHour,
                    paymentType: role.paymentType,
                    rate: role.rate,
                    totalCost: role.totalCost,
                    variance: role.variance,
                    comment: role.comment,
                    enabled: role.enabled,
                    requiresContinuousPresence: role.requiresContinuousPresence,
                  })),
                },
              })),
            },
          })),
        },
      },
      include: {
        product: true,
        operationChains: {
          include: {
            operations: true,
          },
        },
      },
    });

    return NextResponse.json(newProcess);
  } catch (error) {
    console.error('Ошибка клонирования процесса:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
