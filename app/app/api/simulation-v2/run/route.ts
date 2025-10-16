
import { NextRequest, NextResponse } from "next/server";
import { runSimulation } from "@/lib/simulation-v2";

/**
 * API endpoint для запуска симуляции v2 (ООП)
 * POST /api/simulation-v2/run
 * 
 * Настройки симуляции (payIdleTime, enablePartialWork) загружаются из БД автоматически
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Параметры без settings - они загрузятся из БД
    const parameters = {
      orderId: body.orderId,
      orderQuantity: body.orderQuantity,
      productId: body.productId,
      productName: body.productName,
      processId: body.processId,
      processName: body.processName,
      varianceMode: body.varianceMode || "NORMAL",
      startDate: body.startDate ? new Date(body.startDate) : new Date(),
    };
    
    console.log("Запуск симуляции v2 с параметрами:", parameters);
    
    const result = await runSimulation(parameters);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Ошибка при запуске симуляции v2:", error);
    return NextResponse.json(
      { 
        error: error.message || "Ошибка при запуске симуляции",
        details: error.stack,
      },
      { status: 500 }
    );
  }
}
