
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT - Обновить роль
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const role = await prisma.employeeRole.update({
      where: { id: params.id },
      data: {
        name: data.name,
        paymentType: data.paymentType,
        hourlyRate: data.hourlyRate,
      },
    });
    
    return NextResponse.json(role);
  } catch (error) {
    console.error('Ошибка обновления роли:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить роль' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить роль
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.employeeRole.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: 'Роль удалена' });
  } catch (error) {
    console.error('Ошибка удаления роли:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить роль' },
      { status: 500 }
    );
  }
}
