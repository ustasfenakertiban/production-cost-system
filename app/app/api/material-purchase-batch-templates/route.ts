
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/material-purchase-batch-templates
 * Получить все шаблоны партий закупки
 */
export async function GET(request: NextRequest) {
  try {
    const templates = await prisma.materialPurchaseBatchTemplate.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('[API] Error fetching material purchase batch templates:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/material-purchase-batch-templates
 * Создать шаблон партии закупки
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      materialId,
      quantity,
      pricePerUnit,
      vatPercent,
      prepaymentPercentage,
      manufacturingDays,
      deliveryDays,
      minStock,
    } = body;

    if (!name || !materialId || quantity === undefined || pricePerUnit === undefined) {
      return NextResponse.json(
        { error: 'name, materialId, quantity, and pricePerUnit are required' },
        { status: 400 }
      );
    }

    const template = await prisma.materialPurchaseBatchTemplate.create({
      data: {
        name,
        description,
        materialId,
        quantity,
        pricePerUnit,
        vatPercent: vatPercent ?? 0,
        prepaymentPercentage: prepaymentPercentage ?? 0,
        manufacturingDays: manufacturingDays ?? 0,
        deliveryDays: deliveryDays ?? 0,
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
    console.error('[API] Error creating material purchase batch template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
