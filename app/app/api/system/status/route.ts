
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const counts = {
      products: await prisma.product.count().catch(() => 0),
      materials: await prisma.material.count().catch(() => 0),
      equipment: await prisma.equipment.count().catch(() => 0),
      employeeRoles: await prisma.employeeRole.count().catch(() => 0),
      productionProcesses: await prisma.productionProcess.count().catch(() => 0),
      operationChains: await prisma.operationChain.count().catch(() => 0),
      operations: await prisma.productionOperation.count().catch(() => 0),
      backups: await prisma.backup.count().catch(() => 0),
    };
    
    const totalRecords = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
    // Проверяем последний бэкап
    let lastBackup = null;
    try {
      lastBackup = await prisma.backup.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { 
          id: true, 
          createdAt: true, 
          type: true, 
          size: true,
          filename: true
        }
      });
    } catch (e) {
      console.log('Таблица backups не существует');
    }
    
    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        counts,
        totalRecords,
        isEmpty: totalRecords === 0
      },
      backup: {
        tableExists: counts.backups >= 0,
        count: counts.backups,
        lastBackup
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('System status error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка при проверке статуса системы', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}
