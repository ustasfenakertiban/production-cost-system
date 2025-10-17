
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/material-purchase-batches/[id]
 * Обновить партию закупки материалов
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      materialId, 
      quantity, 
      pricePerUnit, 
      prepaymentPercentage,
      manufacturingDay,
      deliveryDay, 
      status 
    } = body;

    const totalCost = quantity !== undefined && pricePerUnit !== undefined 
      ? quantity * pricePerUnit 
      : undefined;

    const batch = await prisma.materialPurchaseBatch.update({
      where: { id },
      data: {
        materialId,
        quantity,
        pricePerUnit,
        totalCost,
        prepaymentPercentage,
        manufacturingDay,
        deliveryDay,
        status,
      },
      include: {
        material: true,
      },
    });

    return NextResponse.json(batch);
  } catch (error: any) {
    console.error('[API] Error updating material purchase batch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/material-purchase-batches/[id]
 * Удалить партию закупки материалов
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.materialPurchaseBatch.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Material purchase batch deleted' });
  } catch (error: any) {
    console.error('[API] Error deleting material purchase batch:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
