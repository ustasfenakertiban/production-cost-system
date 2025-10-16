
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/material-purchase-batches?orderId=xxx
 * Получить партии закупки материалов для заказа
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const batches = await prisma.materialPurchaseBatch.findMany({
      where: { orderId },
      include: {
        material: true,
      },
      orderBy: { deliveryDay: 'asc' },
    });

    return NextResponse.json(batches);
  } catch (error: any) {
    console.error('[API] Error fetching material purchase batches:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/material-purchase-batches
 * Создать партию закупки материалов
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, materialId, quantity, pricePerUnit, deliveryDay, status } = body;

    if (!orderId || !materialId || quantity === undefined || pricePerUnit === undefined || deliveryDay === undefined) {
      return NextResponse.json(
        { error: 'orderId, materialId, quantity, pricePerUnit, and deliveryDay are required' },
        { status: 400 }
      );
    }

    const totalCost = quantity * pricePerUnit;

    const batch = await prisma.materialPurchaseBatch.create({
      data: {
        orderId,
        materialId,
        quantity,
        pricePerUnit,
        totalCost,
        deliveryDay,
        status: status || 'planned',
      },
      include: {
        material: true,
      },
    });

    return NextResponse.json(batch);
  } catch (error: any) {
    console.error('[API] Error creating material purchase batch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
