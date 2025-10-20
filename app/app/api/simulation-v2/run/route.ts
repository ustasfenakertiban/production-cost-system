
import { NextRequest, NextResponse } from 'next/server';
import {
  loadMaterials, loadEquipment, loadEmployees, loadOperationChains, loadSimulationSettingsV2,
  loadPaymentSchedule, loadPeriodicExpenses
} from '@/lib/simulation-v2/dataLoader';
import { ResourceManager } from '@/lib/simulation-v2/ResourceManager';
import { SimulationEngine } from '@/lib/simulation-v2/SimulationEngine';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[SIM-V2] Received request body:', JSON.stringify(body, null, 2));
    
    const { 
      orderId, 
      orderQuantity, 
      productId, 
      productName,
      processId, 
      processName,
      varianceMode, 
      startDate,
      selectedEmployeeIds,
      // Legacy parameters
      initialTargetPerChain = {}, 
      salePricePerUnit, 
      orderQty 
    } = body ?? {};
    
    console.log('[SIM-V2] Processing simulation for order:', orderId);
    console.log('[SIM-V2] Order quantity:', orderQuantity);
    console.log('[SIM-V2] Selected employees:', selectedEmployeeIds);
    
    // Загрузка данных
    const [materials, equipment, allEmployees, processSpec, settings, periodicExpenses] = await Promise.all([
      loadMaterials(), 
      loadEquipment(), 
      loadEmployees(), 
      loadOperationChains(), 
      loadSimulationSettingsV2(), 
      loadPeriodicExpenses()
    ]);

    console.log('[SIM-V2] Loaded data - materials:', materials.length, 'equipment:', equipment.length, 'employees:', allEmployees.length);

    // Фильтруем сотрудников, если указан список выбранных
    let employees = allEmployees;
    if (selectedEmployeeIds && Array.isArray(selectedEmployeeIds) && selectedEmployeeIds.length > 0) {
      employees = allEmployees.filter(emp => selectedEmployeeIds.includes(emp.id));
      console.log('[SIM-V2] Filtered to selected employees:', employees.length);
    }

    if (employees.length === 0) {
      throw new Error('Нет доступных сотрудников для выполнения симуляции');
    }

    // Получаем данные заказа для определения целей производства
    let targets = new Map<string, number>(Object.entries(initialTargetPerChain));
    let totalOrderAmount = (salePricePerUnit && orderQty) ? (Number(salePricePerUnit) * Number(orderQty)) : undefined;

    if (orderId && orderQuantity) {
      // Для нового API: получаем данные заказа и устанавливаем цели
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              product: true,
              productionProcess: {
                include: {
                  operationChains: {
                    orderBy: { orderIndex: 'asc' }
                  }
                }
              }
            }
          }
        }
      });

      if (order && order.orderItems.length > 0) {
        const firstItem = order.orderItems[0];
        
        // Устанавливаем цели для каждой цепочки
        if (firstItem.productionProcess?.operationChains) {
          for (const chain of firstItem.productionProcess.operationChains) {
            // Для цепочек типа "per-unit" цель = количество заказа
            // Для цепочек типа "one-time" цель = 1
            const target = chain.chainType === 'ONE_TIME' ? 1 : (orderQuantity || 1000);
            targets.set(chain.id, target);
            console.log(`[SIM-V2] Set target for chain ${chain.id} (${chain.name}): ${target}`);
          }
        }
      }
    }

    console.log('[SIM-V2] Targets:', Array.from(targets.entries()));

    const resources = new ResourceManager(materials, equipment, employees, settings.initialCashBalance);
    const engine = new SimulationEngine(processSpec, resources, settings, targets);

    const payments = orderId ? await loadPaymentSchedule(orderId) : [];
    const inflows = payments.map(p => ({
      dayNumber: p.dayNumber,
      amount: p.amount ?? ((p.percentageOfTotal / 100) * (totalOrderAmount ?? 0))
    }));

    engine.setPaymentInflows(inflows);
    engine.setPeriodicExpenses(periodicExpenses);
    engine.setTotalOrderAmount(totalOrderAmount);

    console.log('[SIM-V2] Starting simulation engine...');
    const result = await engine.run();
    console.log('[SIM-V2] Simulation completed successfully');
    
    return NextResponse.json(result);
  } catch (e: any) {
    console.error('[SIM-V2] Simulation error:', e);
    console.error('[SIM-V2] Stack trace:', e?.stack);
    return NextResponse.json({ error: e?.message ?? 'Simulation error', stack: e?.stack }, { status: 500 });
  }
}
