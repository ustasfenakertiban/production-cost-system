
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { simulateOrder, SimulationParams } from "@/lib/simulation-engine";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const simulationParams: SimulationParams = {
      hoursPerDay: body.hoursPerDay || 8,
      physicalWorkers: body.physicalWorkers || 5,
      breakMinutesPerHour: body.breakMinutesPerHour || 15,
      varianceMode: body.varianceMode || "NONE",
    };

    // Fetch order with all related data
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        orderItems: {
          include: {
            product: true,
            productionProcess: {
              include: {
                operationChains: {
                  include: {
                    operations: {
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
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Run simulation
    const log = simulateOrder(order as any, simulationParams);

    // Check if log contains error about missing params
    if (log.includes("ОШИБКА: Не все параметры заполнены")) {
      return NextResponse.json(
        {
          error: "Missing parameters",
          missingParams: true,
          message: "Не все параметры заполнены",
          details: log,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ log });
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
