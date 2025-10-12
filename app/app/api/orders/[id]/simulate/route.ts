
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
      productivityAlgorithm: body.productivityAlgorithm || "BOTTLENECK",
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

    // Validate order before simulation
    const { validateOrder } = require("@/lib/simulation-engine");
    const validation = validateOrder(order);
    
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Missing parameters",
          missingParams: validation.missingParams,
          message: "Не все параметры заполнены для запуска симуляции",
        },
        { status: 400 }
      );
    }

    // Run simulation
    const result = simulateOrder(order as any, simulationParams);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
