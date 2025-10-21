
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/orders/[id]/material-batches/apply-template
 * Применить шаблон партий закупки к заказу
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { templateName, replaceExisting } = await request.json();

    if (!templateName) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    // Получаем все шаблоны с указанным именем (без учета суффикса материала)
    const templates = await prisma.materialPurchaseBatchTemplate.findMany({
      where: {
        name: {
          startsWith: templateName,
        },
      },
      include: {
        material: true,
      },
    });

    if (templates.length === 0) {
      return NextResponse.json(
        { error: 'No templates found with this name' },
        { status: 404 }
      );
    }

    // Если replaceExisting = true, удаляем существующие партии
    if (replaceExisting) {
      await prisma.materialPurchaseBatch.deleteMany({
        where: { orderId: params.id },
      });
    }

    // Создаем новые партии из шаблонов
    const batches = await Promise.all(
      templates.map((template) =>
        prisma.materialPurchaseBatch.create({
          data: {
            orderId: params.id,
            materialId: template.materialId,
            quantity: template.quantity,
            pricePerUnit: template.pricePerUnit,
            totalCost: template.quantity * template.pricePerUnit,
            prepaymentPercentage: template.prepaymentPercentage,
            manufacturingDay: template.manufacturingDays,
            deliveryDay: template.deliveryDays,
            status: 'planned',
          },
          include: {
            material: true,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: `Applied ${batches.length} batches from template`,
      batches,
    });
  } catch (error: any) {
    console.error('[API] Error applying template to material batches:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
