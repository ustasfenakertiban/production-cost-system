
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFileUrl } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// GET - Получить URL изображения товара
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { imagePath: true }
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    if (!product.imagePath) {
      return NextResponse.json(
        { error: 'Изображение отсутствует' },
        { status: 404 }
      );
    }

    // Get signed URL from S3
    const url = await getFileUrl(product.imagePath);
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Ошибка получения URL изображения:', error);
    return NextResponse.json(
      { error: 'Не удалось получить изображение' },
      { status: 500 }
    );
  }
}
