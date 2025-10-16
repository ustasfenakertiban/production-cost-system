
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/payment-schedules/[id]
 * Обновить запись в графике платежей
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { dayNumber, percentageOfTotal, amount, description } = body;

    const schedule = await prisma.paymentSchedule.update({
      where: { id },
      data: {
        dayNumber,
        percentageOfTotal,
        amount,
        description,
      },
    });

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error('[API] Error updating payment schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/payment-schedules/[id]
 * Удалить запись из графика платежей
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.paymentSchedule.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Payment schedule deleted' });
  } catch (error: any) {
    console.error('[API] Error deleting payment schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
