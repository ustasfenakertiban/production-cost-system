
import { NextRequest, NextResponse } from "next/server";
import { runSimulation } from "@/lib/simulation-v2";
import { SimulationParameters } from "@/lib/simulation-v2/types";

/**
 * API endpoint для запуска симуляции v2
 * POST /api/simulation-v2/run
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const parameters: SimulationParameters = {
      orderId: body.orderId,
      orderQuantity: body.orderQuantity,
      productId: body.productId,
      productName: body.productName,
      processId: body.processId,
      processName: body.processName,
      varianceMode: body.varianceMode || "NORMAL",
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
      settings: {
        payIdleTime: body.settings?.payIdleTime ?? true,
        enablePartialWork: body.settings?.enablePartialWork ?? true,
      },
    };
    
    const result = await runSimulation(parameters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Ошибка при запуске симуляции v2:", error);
    return NextResponse.json(
      { error: "Ошибка при запуске симуляции" },
      { status: 500 }
    );
  }
}
