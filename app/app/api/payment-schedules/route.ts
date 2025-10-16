
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payment-schedules?orderId=xxx
 * Получить график платежей для заказа
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const schedules = await prisma.paymentSchedule.findMany({
      where: { orderId },
      orderBy: { dayNumber: 'asc' },
    });

    return NextResponse.json(schedules);
  } catch (error: any) {
    console.error('[API] Error fetching payment schedules:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/payment-schedules
 * Создать запись в графике платежей
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, dayNumber, percentageOfTotal, amount, description } = body;

    if (!orderId || dayNumber === undefined || percentageOfTotal === undefined) {
      return NextResponse.json(
        { error: 'orderId, dayNumber, and percentageOfTotal are required' },
        { status: 400 }
      );
    }

    const schedule = await prisma.paymentSchedule.create({
      data: {
        orderId,
        dayNumber,
        percentageOfTotal,
        amount,
        description,
      },
    });

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error('[API] Error creating payment schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
