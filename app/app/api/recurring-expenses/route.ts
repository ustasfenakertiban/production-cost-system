

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Получить все периодические расходы
export async function GET() {
  try {
    const expenses = await prisma.recurringExpense.findMany({
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Ошибка получения периодических расходов:', error);
    return NextResponse.json(
      { error: 'Не удалось получить периодические расходы' },
      { status: 500 }
    );
  }
}

// POST - Создать новый периодический расход
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const expense = await prisma.recurringExpense.create({
      data: {
        name: data.name,
        period: data.period,
        amount: data.amount,
      },
    });
    
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания периодического расхода:', error);
    return NextResponse.json(
      { error: 'Не удалось создать периодический расход' },
      { status: 500 }
    );
  }
}
