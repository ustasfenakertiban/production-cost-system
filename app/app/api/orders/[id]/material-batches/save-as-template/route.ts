
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/orders/[id]/material-batches/save-as-template
 * Сохранить текущие партии закупки заказа как шаблон
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    // Получаем все партии закупки для заказа
    const batches = await prisma.materialPurchaseBatch.findMany({
      where: { orderId: params.id },
      include: {
        material: true,
      },
    });

    if (batches.length === 0) {
      return NextResponse.json(
        { error: 'No material batches found for this order' },
        { status: 404 }
      );
    }

    // Создаем шаблоны для каждой партии
    const templates = await Promise.all(
      batches.map((batch) =>
        prisma.materialPurchaseBatchTemplate.create({
          data: {
            name: `${name} - ${batch.material.name}`,
            description,
            materialId: batch.materialId,
            quantity: batch.quantity,
            pricePerUnit: batch.pricePerUnit,
            prepaymentPercentage: batch.prepaymentPercentage,
            manufacturingDays: batch.manufacturingDay,
            deliveryDays: batch.deliveryDay,
            minStock: batch.quantity * 0.2, // 20% от партии как минимальный запас
          },
          include: {
            material: {
              select: {
                id: true,
                name: true,
                unit: true,
                cost: true,
              },
            },
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Created ${templates.length} templates`,
      templates,
    });
  } catch (error: any) {
    console.error('[API] Error saving material batches as template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
