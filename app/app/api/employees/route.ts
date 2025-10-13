
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Получить всех сотрудников
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Ошибка получения сотрудников:', error);
    return NextResponse.json(
      { error: 'Не удалось получить список сотрудников' },
      { status: 500 }
    );
  }
}

// POST - Создать нового сотрудника
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        isActive: data.isActive ?? true,
        comment: data.comment,
        roles: {
          create: data.roleIds?.map((roleId: string) => ({
            roleId: roleId,
          })) || [],
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Ошибка создания сотрудника:', error);
    return NextResponse.json(
      { error: 'Не удалось создать сотрудника' },
      { status: 500 }
    );
  }
}
