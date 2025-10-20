
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
    console.log('[SIM-V2] Result:', JSON.stringify(result, null, 2));
    
    // Преобразуем результат в формат для фронтенда
    const operations = [];
    
    // Проходим по всем дням и часам, собирая данные по операциям
    const operationStats = new Map<string, {
      chainId: string;
      chainName: string;
      chainOrder: number;
      operationId: string;
      operationName: string;
      operationOrder: number;
      targetQuantity: number;
      completedQuantity: number;
      totalHours: number;
      materialCosts: any[];
      equipmentCosts: any[];
      laborCosts: any[];
      totalCost: number;
    }>();
    
    for (const day of result.days) {
      for (const hour of day.hours) {
        for (const chain of hour.chains) {
          for (const op of chain.ops) {
            const key = `${chain.chainId}-${op.opId}`;
            
            if (!operationStats.has(key)) {
              // Находим цепочку и операцию для получения имен
              const chainSpec = processSpec.chains.find(c => c.id === chain.chainId);
              const opSpec = chainSpec?.operations.find(o => o.id === op.opId);
              
              operationStats.set(key, {
                chainId: chain.chainId,
                chainName: chainSpec?.name || 'Unknown',
                chainOrder: chainSpec?.orderIndex || 0,
                operationId: op.opId,
                operationName: opSpec?.name || 'Unknown',
                operationOrder: opSpec?.orderIndex || 0,
                targetQuantity: 0,
                completedQuantity: 0,
                totalHours: 0,
                materialCosts: [],
                equipmentCosts: [],
                laborCosts: [],
                totalCost: 0,
              });
            }
            
            const stats = operationStats.get(key)!;
            stats.completedQuantity += op.produced || 0;
            stats.totalHours += 1; // Каждый час работы
            stats.totalCost += (op.materialsConsumed?.reduce((sum, m) => sum + (m.net || 0) + (m.vat || 0), 0) || 0);
            stats.totalCost += (op.laborCost || 0);
            stats.totalCost += (op.depreciation || 0);
            
            // Материалы
            for (const mat of op.materialsConsumed || []) {
              const existing = stats.materialCosts.find(m => m.materialId === mat.materialId);
              if (existing) {
                existing.quantity += mat.qty || 0;
                existing.totalCost += (mat.net || 0) + (mat.vat || 0);
              } else {
                const matSpec = materials.find(m => m.id === mat.materialId);
                stats.materialCosts.push({
                  materialId: mat.materialId,
                  materialName: matSpec?.name || 'Unknown',
                  quantity: mat.qty || 0,
                  totalCost: (mat.net || 0) + (mat.vat || 0),
                });
              }
            }
            
            // Оборудование (depreciation)
            if (op.depreciation > 0) {
              stats.equipmentCosts.push({
                equipmentName: 'Equipment',
                totalCost: op.depreciation,
              });
            }
            
            // Труд
            if (op.laborCost > 0) {
              stats.laborCosts.push({
                totalCost: op.laborCost,
              });
            }
          }
        }
      }
    }
    
    // Устанавливаем целевое количество из targets
    for (const [key, stats] of operationStats.entries()) {
      const target = targets.get(stats.chainId) || 0;
      stats.targetQuantity = target;
    }
    
    // Преобразуем в массив
    for (const stats of operationStats.values()) {
      operations.push(stats);
    }
    
    // Сортируем операции по порядку цепочки и операции
    operations.sort((a, b) => {
      if (a.chainOrder !== b.chainOrder) return a.chainOrder - b.chainOrder;
      return a.operationOrder - b.operationOrder;
    });
    
    const response = {
      orderId: orderId || null,
      orderQuantity: orderQuantity || 0,
      productId: productId || null,
      productName: productName || null,
      processId: processId || null,
      processName: processName || null,
      totalDuration: result.daysTaken * settings.workingHoursPerDay,
      totalDays: result.daysTaken,
      totalMaterialCost: result.totals.materialNet + result.totals.materialVAT,
      totalEquipmentCost: result.totals.depreciation,
      totalLaborCost: result.totals.labor,
      totalPeriodicCost: result.totals.periodicNet + result.totals.periodicVAT,
      totalCost: (result.totals.materialNet + result.totals.materialVAT) + 
                 result.totals.depreciation + 
                 result.totals.labor + 
                 (result.totals.periodicNet + result.totals.periodicVAT),
      revenue: result.totals.revenue,
      grossMargin: result.totals.grossMargin,
      cashEnding: result.totals.cashEnding,
      operations,
      warnings: result.warnings,
      // Добавляем исходный результат для отладки
      _raw: result,
    };
    
    console.log('[SIM-V2] Formatted response:', JSON.stringify(response, null, 2));
    
    return NextResponse.json(response);
  } catch (e: any) {
    console.error('[SIM-V2] Simulation error:', e);
    console.error('[SIM-V2] Stack trace:', e?.stack);
    return NextResponse.json({ error: e?.message ?? 'Simulation error', stack: e?.stack }, { status: 500 });
  }
}
