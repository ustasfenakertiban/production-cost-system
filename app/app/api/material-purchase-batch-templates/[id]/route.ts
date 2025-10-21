
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/material-purchase-batch-templates/[id]
 * Получить шаблон по ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.materialPurchaseBatchTemplate.findUnique({
      where: { id: params.id },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            cost: true,
            vatPercentage: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[API] Error fetching material purchase batch template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/material-purchase-batch-templates/[id]
 * Обновить шаблон
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      quantity,
      pricePerUnit,
      vatPercent,
      prepaymentPercentage,
      manufacturingDays,
      deliveryDays,
      minStock,
    } = body;

    const template = await prisma.materialPurchaseBatchTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description,
        quantity,
        pricePerUnit,
        vatPercent,
        prepaymentPercentage,
        manufacturingDays,
        deliveryDays,
        minStock,
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            cost: true,
            vatPercentage: true,
          },
        },
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('[API] Error updating material purchase batch template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/material-purchase-batch-templates/[id]
 * Удалить шаблон
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.materialPurchaseBatchTemplate.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Error deleting material purchase batch template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
