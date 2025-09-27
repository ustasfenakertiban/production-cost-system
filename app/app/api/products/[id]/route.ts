
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { uploadFile, deleteFile } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// PUT - Обновить товар
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const imageFile = formData.get('image') as File | null;

    // Get current product to handle image updates
    const currentProduct = await prisma.product.findUnique({
      where: { id: params.id },
      select: { imagePath: true }
    });

    if (!currentProduct) {
      return NextResponse.json(
        { error: 'Товар не найден' },
        { status: 404 }
      );
    }

    let imagePath = currentProduct.imagePath;

    // Handle image upload/update
    if (imageFile && imageFile.size > 0) {
      // Delete old image if exists
      if (currentProduct.imagePath) {
        try {
          await deleteFile(currentProduct.imagePath);
        } catch (error) {
          console.warn('Не удалось удалить старое изображение:', error);
        }
      }

      // Upload new image
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const fileName = `${Date.now()}-${imageFile.name}`;
      imagePath = await uploadFile(buffer, fileName);
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        imagePath,
      },
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error('Ошибка обновления товара:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить товар' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить товар
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get product to delete its image from S3
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

    // Delete image from S3 if exists
    if (product.imagePath) {
      try {
        await deleteFile(product.imagePath);
      } catch (error) {
        console.warn('Не удалось удалить изображение из S3:', error);
      }
    }

    // Delete product from database
    await prisma.product.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: 'Товар удален' });
  } catch (error) {
    console.error('Ошибка удаления товара:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить товар' },
      { status: 500 }
    );
  }
}
