
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET - Получить одного сотрудника
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
    
    if (!employee) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(employee);
  } catch (error) {
    console.error('Ошибка получения сотрудника:', error);
    return NextResponse.json(
      { error: 'Не удалось получить сотрудника' },
      { status: 500 }
    );
  }
}

// PUT - Обновить сотрудника
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json();
    
    // Сначала удаляем все текущие роли
    await prisma.employeeRoleAssignment.deleteMany({
      where: { employeeId: params.id },
    });
    
    // Обновляем сотрудника и добавляем новые роли
    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: {
        name: data.name,
        isActive: data.isActive,
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
    
    return NextResponse.json(employee);
  } catch (error) {
    console.error('Ошибка обновления сотрудника:', error);
    return NextResponse.json(
      { error: 'Не удалось обновить сотрудника' },
      { status: 500 }
    );
  }
}

// DELETE - Удалить сотрудника
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.employee.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ message: 'Сотрудник удален' });
  } catch (error) {
    console.error('Ошибка удаления сотрудника:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить сотрудника' },
      { status: 500 }
    );
  }
}
