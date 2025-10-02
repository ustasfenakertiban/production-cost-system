
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - клонировать цепочку операций
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { newName } = await request.json();

    if (!newName || typeof newName !== 'string' || newName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Необходимо указать новое имя для цепочки' },
        { status: 400 }
      );
    }

    // Получаем оригинальную цепочку со всеми связанными данными
    const originalChain = await prisma.operationChain.findUnique({
      where: { id: params.id },
      include: {
        operations: {
          include: {
            operationMaterials: true,
            operationEquipment: true,
            operationRoles: true,
          },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!originalChain) {
      return NextResponse.json(
        { error: 'Цепочка операций не найдена' },
        { status: 404 }
      );
    }

    // Клонируем цепочку со всеми операциями
    const clonedChain = await prisma.operationChain.create({
      data: {
        processId: originalChain.processId,
        name: newName.trim(),
        chainType: originalChain.chainType,
        orderIndex: originalChain.orderIndex,
        comment: originalChain.comment,
        enabled: originalChain.enabled,
        estimatedQuantity: originalChain.estimatedQuantity,
        operations: {
          create: originalChain.operations.map((operation) => ({
            name: operation.name,
            description: operation.description,
            comment: operation.comment,
            orderIndex: operation.orderIndex,
            enabled: operation.enabled,
            estimatedProductivityPerHour: operation.estimatedProductivityPerHour,
            estimatedProductivityPerHourVariance: operation.estimatedProductivityPerHourVariance,
            cycleHours: operation.cycleHours,
            minimumBatchSize: operation.minimumBatchSize,
            operationMaterials: {
              create: operation.operationMaterials.map((material) => ({
                materialId: material.materialId,
                quantity: material.quantity,
                unitPrice: material.unitPrice,
                totalCost: material.totalCost,
                variance: material.variance,
                comment: material.comment,
                enabled: material.enabled,
              }))
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
              }))
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
              }))
            }
          }))
        }
      },
      include: {
        operations: {
          include: {
            operationMaterials: true,
            operationEquipment: true,
            operationRoles: true,
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      clonedChain
    });
  } catch (error) {
    console.error('Ошибка клонирования цепочки операций:', error);
    return NextResponse.json(
      { error: 'Ошибка клонирования цепочки' },
      { status: 500 }
    );
  }
}
