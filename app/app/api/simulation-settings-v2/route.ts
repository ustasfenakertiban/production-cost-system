
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/simulation-settings-v2?orderId=xxx
 * Получить настройки симуляции v2 для заказа
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const settings = await prisma.simulationSettingsV2.findUnique({
      where: { orderId },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[API] Error fetching simulation settings v2:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/simulation-settings-v2
 * Создать настройки симуляции v2 для заказа
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      workingHoursPerDay,
      restMinutesPerHour,
      sellingPriceWithVAT,
      vatRate,
      profitTaxRate,
      includeRecurringExpenses,
      waitForMaterialDelivery,
      payEmployeesForIdleTime,
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Проверяем существование заказа
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Создаем или обновляем настройки
    const settings = await prisma.simulationSettingsV2.upsert({
      where: { orderId },
      create: {
        orderId,
        workingHoursPerDay: workingHoursPerDay ?? 8,
        restMinutesPerHour: restMinutesPerHour ?? 0,
        sellingPriceWithVAT,
        vatRate: vatRate ?? 20,
        profitTaxRate: profitTaxRate ?? 20,
        includeRecurringExpenses: includeRecurringExpenses ?? false,
        waitForMaterialDelivery: waitForMaterialDelivery ?? true,
        payEmployeesForIdleTime: payEmployeesForIdleTime ?? false,
      },
      update: {
        workingHoursPerDay: workingHoursPerDay ?? 8,
        restMinutesPerHour: restMinutesPerHour ?? 0,
        sellingPriceWithVAT,
        vatRate: vatRate ?? 20,
        profitTaxRate: profitTaxRate ?? 20,
        includeRecurringExpenses: includeRecurringExpenses ?? false,
        waitForMaterialDelivery: waitForMaterialDelivery ?? true,
        payEmployeesForIdleTime: payEmployeesForIdleTime ?? false,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('[API] Error creating/updating simulation settings v2:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
