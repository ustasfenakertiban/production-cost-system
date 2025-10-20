

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT - Обновить периодический расход
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    const expense = await prisma.recurringExpense.update({
      where: { id: params.id },
      data: {
        name: data.name,
        period: data.period,
        amount: data.amount,
        vatRate: data.vatRate,
        active: data.active,
        notes: data.notes || null,
      },
    });
    
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Ошибка обновления периодического расхода:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить периодический расход' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить периодический расход
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.recurringExpense.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: 'Периодический расход удален' });
  } catch (error) {
    console.error('Ошибка удаления периодического расхода:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить периодический расход' },
      { status: 500 }
    );
  }
}
