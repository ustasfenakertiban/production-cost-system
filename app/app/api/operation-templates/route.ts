
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const templates = await prisma.operationTemplate.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching operation templates:", error);
    return NextResponse.json(
      { error: "Ошибка при получении шаблонов операций" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      materials,
      equipment,
      roles,
    } = data;

    const template = await prisma.operationTemplate.create({
      data: {
        name,
        description,
        comment,
        enabled,
        estimatedProductivityPerHour,
        estimatedProductivityPerHourVariance,
        cycleHours,
        minimumBatchSize,
        materials: {
          create: materials?.map((m: any) => ({
            materialId: m.materialId,
            quantity: m.quantity,
            unitPrice: m.unitPrice,
            totalCost: m.totalCost,
            variance: m.variance,
            comment: m.comment,
            enabled: m.enabled,
          })) || [],
        },
        equipment: {
          create: equipment?.map((e: any) => ({
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
          })) || [],
        },
        roles: {
          create: roles?.map((r: any) => ({
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
          })) || [],
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
    console.error("Error creating operation template:", error);
    return NextResponse.json(
      { error: "Ошибка при создании шаблона операции" },
      { status: 500 }
    );
  }
}
