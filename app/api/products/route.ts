
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// GET - Получить все товары
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Ошибка получения товаров:', error);
    return NextResponse.json(
      { error: 'Не удалось получить товары' },
      { status: 500 }
    );
  }
}

// POST - Создать новый товар
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File | null;

    let imagePath: string | null = null;

    // Upload image if provided
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `${Date.now()}-${imageFile.name}`;
      imagePath = await uploadFile(buffer, fileName);
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description || null,
        imagePath,
      },
    });
    
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания товара:', error);
    return NextResponse.json(
      { error: 'Не удалось создать товар' },
      { status: 500 }
    );
  }
}
