// Simulation engine for order execution

export type VarianceMode = 
  | "MAX" 
  | "MIN" 
  | "NONE" 
  | "RANDOM_POSITIVE" 
  | "RANDOM_FULL";

export interface SimulationParams {
  hoursPerDay: number;
  physicalWorkers: number;
  breakMinutesPerHour: number;
  varianceMode: VarianceMode;
}

interface Material {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  variance: number;
  enabled: boolean;
  material: {
    name: string;
    vatPercentage: number;
  };
}

interface Equipment {
  id: string;
  name: string;
  machineTime: number;
  piecesPerHour: number;
  hourlyRate: number;
  totalCost: number;
  variance: number;
  enabled: boolean;
  equipment: {
    name: string;
  };
}

interface Role {
  id: string;
  name: string;
  timeSpent: number;
  piecesPerHour: number;
  rate: number;
  totalCost: number;
  variance: number;
  enabled: boolean;
  role: {
    name: string;
  };
}

interface Operation {
  id: string;
  name: string;
  orderIndex: number;
  enabled: boolean;
  estimatedProductivityPerHour: number;
  estimatedProductivityPerHourVariance: number;
  cycleHours: number;
  operationMaterials: Material[];
  operationEquipment: Equipment[];
  operationRoles: Role[];
}

interface Chain {
  id: string;
  name: string;
  chainType: "ONE_TIME" | "PER_UNIT";
  orderIndex: number;
  enabled: boolean;
  operations: Operation[];
}

interface Process {
  id: string;
  name: string;
  operationChains: Chain[];
}

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    name: string;
  };
  productionProcess: Process;
}

interface Order {
  id: string;
  name: string;
  orderItems: OrderItem[];
}

interface ResourceState {
  physicalWorkers: number; // Максимальное количество физических работников
  busyWorkers: Map<number, { operationName: string; productName: string; untilHour: number }>;
  busyEquipment: Map<string, { equipmentName: string; operationName: string; productName: string; untilHour: number }>;
}

interface ActiveOperation {
  itemId: string;
  productName: string;
  chainId: string;
  chainName: string;
  chainType: "ONE_TIME" | "PER_UNIT";
  operation: Operation;
  totalQuantity: number;
  completedQuantity: number;
  cycleStartHour: number;
  operationDuration: number; // Длительность операции в часах
  assignedWorkerIds: number[];
  assignedEquipmentIds: string[];
}

export function applyVariance(
  baseValue: number,
  variance: number | null | undefined,
  mode: VarianceMode
): number {
  // Если разброс не указан (null, undefined или 0), считаем его равным 0
  if (variance == null || variance === 0 || mode === "NONE") return baseValue;

  const varianceDecimal = variance / 100;

  switch (mode) {
    case "MAX":
      return baseValue * (1 + varianceDecimal);
    case "MIN":
      return baseValue * (1 - varianceDecimal);
    case "RANDOM_POSITIVE":
      return baseValue * (1 + Math.random() * varianceDecimal);
    case "RANDOM_FULL":
      return baseValue * (1 + (Math.random() * 2 - 1) * varianceDecimal);
    default:
      return baseValue;
  }
}

export function validateOrder(order: Order): {
  valid: boolean;
  missingParams: string[];
} {
  const missingParams: string[] = [];

  for (const item of order.orderItems) {
    const process = item.productionProcess;
    
    for (const chain of process.operationChains) {
      if (!chain.enabled) continue;

      for (const operation of chain.operations) {
        if (!operation.enabled) continue;

        const opPath = `${item.product.name} → ${process.name} → ${chain.name} → ${operation.name}`;

        // Для разовых цепочек (ONE_TIME) проверяем наличие оборудования/ролей с временем
        if (chain.chainType === "ONE_TIME") {
          const enabledEquipment = operation.operationEquipment.filter(e => e.enabled);
          const enabledRoles = operation.operationRoles.filter(r => r.enabled);
          
          const hasEquipmentTime = enabledEquipment.some(eq => eq.machineTime && eq.machineTime > 0);
          const hasRoleTime = enabledRoles.some(r => r.timeSpent && r.timeSpent > 0);
          
          if (!hasEquipmentTime && !hasRoleTime) {
            missingParams.push(`${opPath}: для разовой операции укажите время работы оборудования или ролей`);
          }
        } else {
          // Для поточных цепочек (PER_UNIT) проверяем производительность и цикл
          // Проверяем длину рабочего цикла
          if (!operation.cycleHours || operation.cycleHours <= 0) {
            missingParams.push(`${opPath}: отсутствует длина рабочего цикла`);
          }

          // Проверяем, что есть хотя бы один способ рассчитать производительность
          const hasNominalProductivity = operation.estimatedProductivityPerHour && operation.estimatedProductivityPerHour > 0;
          
          const enabledEquipment = operation.operationEquipment.filter(e => e.enabled);
          const enabledRoles = operation.operationRoles.filter(r => r.enabled);
          
          const hasEquipmentProductivity = enabledEquipment.some(eq => eq.piecesPerHour && eq.piecesPerHour > 0);
          const hasRoleProductivity = enabledRoles.some(r => r.piecesPerHour && r.piecesPerHour > 0);

          // Если ни одна производительность не указана, это может быть нормально -
          // будет считаться только по времени использования оборудования/ролей
          if (!hasNominalProductivity && !hasEquipmentProductivity && !hasRoleProductivity) {
            // Проверяем, что хотя бы есть оборудование или роли для расчета по времени
            if (enabledEquipment.length === 0 && enabledRoles.length === 0) {
              missingParams.push(`${opPath}: отсутствует способ расчета (укажите производительность или добавьте оборудование/роли)`);
            }
          }
        }
      }
    }
  }

  return {
    valid: missingParams.length === 0,
    missingParams,
  };
}

export function simulateOrder(
  order: Order,
  params: SimulationParams
): string {
  const log: string[] = [];
  const { hoursPerDay, physicalWorkers, breakMinutesPerHour, varianceMode } = params;

  // Validate order first
  const validation = validateOrder(order);
  if (!validation.valid) {
    log.push("═══════════════════════════════════════════════════════════════");
    log.push("  ⚠️  ОШИБКА: Не все параметры заполнены");
    log.push("═══════════════════════════════════════════════════════════════\n");
    log.push("Для выполнения симуляции необходимо заполнить следующие параметры:\n");
    validation.missingParams.forEach((param, idx) => {
      log.push(`  ${idx + 1}. ${param}`);
    });
    return log.join("\n");
  }

  log.push("╔═══════════════════════════════════════════════════════════════╗");
  log.push("║         СИМУЛЯЦИЯ ВЫПОЛНЕНИЯ ПРОИЗВОДСТВЕННОГО ЗАКАЗА         ║");
  log.push("╚═══════════════════════════════════════════════════════════════╝\n");
  log.push(`📋 Заказ: ${order.name}\n`);
  log.push(`⚙️  Параметры симуляции:`);
  log.push(`   • Часов в рабочем дне: ${hoursPerDay}`);
  log.push(`   • Физических работников: ${physicalWorkers}`);
  log.push(`   • Отдых (мин/час): ${breakMinutesPerHour}`);
  log.push(`   • Режим разброса: ${getVarianceModeLabel(varianceMode)}\n`);

  const breakCoefficient = 1 - breakMinutesPerHour / 60;

  // Initialize resources
  const resources: ResourceState = {
    physicalWorkers: physicalWorkers,
    busyWorkers: new Map(),
    busyEquipment: new Map(),
  };

  // Track active operations
  const activeOperations: ActiveOperation[] = [];
  const completedOperations: Set<string> = new Set();

  // Totals
  let totalMaterialCost = 0;
  let totalMaterialVAT = 0;
  let totalEquipmentCost = 0;
  let totalLaborCost = 0;

  let currentDay = 1;
  let currentHour = 1;
  let absoluteHour = 0;

  // Main simulation loop
  while (true) {
    absoluteHour++;
    
    if (currentHour === 1) {
      log.push(`\n${"━".repeat(65)}`);
      log.push(`  📅 ДЕНЬ ${currentDay}`);
      log.push(`${"━".repeat(65)}\n`);
    }

    log.push(`\n⏰ Час ${currentHour} (абсолютный час: ${absoluteHour})`);
    log.push(`${"─".repeat(50)}`);

    // Release resources
    releaseResources(resources, absoluteHour, log);

    // Process active operations
    processActiveOperations(
      activeOperations,
      completedOperations,
      resources,
      absoluteHour,
      breakCoefficient,
      varianceMode,
      log,
      {
        totalMaterialCost: (v: number) => totalMaterialCost += v,
        totalMaterialVAT: (v: number) => totalMaterialVAT += v,
        totalEquipmentCost: (v: number) => totalEquipmentCost += v,
        totalLaborCost: (v: number) => totalLaborCost += v,
      }
    );

    // Try to start new operations
    tryStartNewOperations(
      order,
      activeOperations,
      completedOperations,
      resources,
      absoluteHour,
      varianceMode,
      log
    );

    // Show current status
    const availableWorkerCount = resources.physicalWorkers - resources.busyWorkers.size;
    const busyWorkerCount = resources.busyWorkers.size;
    
    // Show active operations in progress
    if (activeOperations.length > 0) {
      log.push(`\n  📊 Выполняется операций: ${activeOperations.length}`);
      activeOperations.forEach((opState) => {
        const remainingHours = (opState.cycleStartHour + opState.operationDuration) - absoluteHour;
        const progress = opState.completedQuantity;
        const total = opState.totalQuantity;
        log.push(`     • "${opState.operation.name}" (${opState.productName})`);
        log.push(`       Выполнено: ${progress}/${total} шт., до завершения цикла: ${remainingHours} час(ов)`);
        log.push(`       Занято работников: ${opState.assignedWorkerIds.map(id => `#${id}`).join(", ") || "нет"}`);
        if (opState.assignedEquipmentIds.length > 0) {
          const equipmentNames = opState.operation.operationEquipment
            .filter(eq => opState.assignedEquipmentIds.includes(eq.id))
            .map(eq => eq.equipment.name);
          log.push(`       Занято оборудования: ${equipmentNames.join(", ")}`);
        }
      });
    }
    
    // Show resource status
    log.push(`\n  👥 Работники: ${busyWorkerCount} занято, ${availableWorkerCount} свободно (всего: ${resources.physicalWorkers})`);
    
    // Check for idle workers
    if (availableWorkerCount > 0 && !allWorkCompleted(order, completedOperations)) {
      // Check if there's pending work that can't start
      const hasPendingWork = order.orderItems.some(item => {
        return item.productionProcess.operationChains.some(chain => {
          if (!chain.enabled) return false;
          return chain.operations.some(op => {
            if (!op.enabled) return false;
            const opKey = `${item.id}-${op.id}`;
            return !completedOperations.has(opKey) && 
                   !activeOperations.some(active => active.operation.id === op.id && active.itemId === item.id);
          });
        });
      });
      
      if (hasPendingWork) {
        log.push(`  ⏸️  Ожидание: ${availableWorkerCount} работник(ов) свободны, но не могут начать работу`);
        log.push(`     (возможно, заняты предыдущие операции или оборудование)`);
      }
    }

    // Check if all work is done
    if (activeOperations.length === 0 && allWorkCompleted(order, completedOperations)) {
      break;
    }

    // Move to next hour/day
    currentHour++;
    if (currentHour > hoursPerDay) {
      currentHour = 1;
      currentDay++;
    }

    // Safety check
    if (absoluteHour > 10000) {
      log.push("\n\n⚠️  ВНИМАНИЕ: Симуляция прервана (превышено 10000 часов работы)");
      break;
    }
  }

  // Summary
  const totalDays = Math.ceil(absoluteHour / hoursPerDay);
  const totalCost = totalMaterialCost + totalEquipmentCost + totalLaborCost;

  log.push(`\n\n╔═══════════════════════════════════════════════════════════════╗`);
  log.push(`║                     ИТОГОВАЯ СВОДКА                           ║`);
  log.push(`╚═══════════════════════════════════════════════════════════════╝\n`);
  log.push(`⏱️  Общее время выполнения: ${absoluteHour} часов (${totalDays} ${getDaysLabel(totalDays)})\n`);
  log.push(`💰 Затраты:`);
  log.push(`   • Материалы: ${totalMaterialCost.toFixed(2)} руб.`);
  log.push(`     (в т.ч. НДС: ${totalMaterialVAT.toFixed(2)} руб.)`);
  log.push(`   • Оборудование (амортизация): ${totalEquipmentCost.toFixed(2)} руб.`);
  log.push(`   • Оплата труда: ${totalLaborCost.toFixed(2)} руб.`);
  log.push(`   ${"─".repeat(50)}`);
  log.push(`   • ИТОГО: ${totalCost.toFixed(2)} руб.\n`);

  // Product breakdown
  log.push(`📦 Выполнено изделий:`);
  for (const item of order.orderItems) {
    log.push(`   • ${item.product.name}: ${item.quantity} шт.`);
  }

  return log.join("\n");
}

function getVarianceModeLabel(mode: VarianceMode): string {
  switch (mode) {
    case "MAX": return "По максимуму (+)";
    case "MIN": return "По минимуму (−)";
    case "NONE": return "Без разброса (=)";
    case "RANDOM_POSITIVE": return "Случайное 0+ (↑)";
    case "RANDOM_FULL": return "Случайное полное (↕)";
  }
}

function getDaysLabel(days: number): string {
  if (days === 1) return "день";
  if (days >= 2 && days <= 4) return "дня";
  return "дней";
}

function releaseResources(
  resources: ResourceState,
  currentHour: number,
  log: string[]
): void {
  // Release workers
  const workersToRelease: Array<{ id: number; info: { operationName: string; productName: string; untilHour: number } }> = [];
  resources.busyWorkers.forEach((info, workerId) => {
    if (info.untilHour <= currentHour) {
      workersToRelease.push({ id: workerId, info });
    }
  });

  if (workersToRelease.length > 0) {
    workersToRelease.forEach(({ id, info }) => {
      log.push(`  ✅ Освободился работник #${id}: "${info.operationName}" (${info.productName})`);
      resources.busyWorkers.delete(id);
    });
  }

  // Release equipment
  const equipmentToRelease: Array<{ id: string; info: { equipmentName: string; operationName: string; productName: string; untilHour: number } }> = [];
  resources.busyEquipment.forEach((info, equipmentId) => {
    if (info.untilHour <= currentHour) {
      equipmentToRelease.push({ id: equipmentId, info });
    }
  });

  if (equipmentToRelease.length > 0) {
    equipmentToRelease.forEach(({ id, info }) => {
      log.push(`  ✅ Освободилось оборудование "${info.equipmentName}": "${info.operationName}" (${info.productName})`);
      resources.busyEquipment.delete(id);
    });
  }
}

function processActiveOperations(
  activeOperations: ActiveOperation[],
  completedOperations: Set<string>,
  resources: ResourceState,
  currentHour: number,
  breakCoefficient: number,
  varianceMode: VarianceMode,
  log: string[],
  totals: {
    totalMaterialCost: (v: number) => void;
    totalMaterialVAT: (v: number) => void;
    totalEquipmentCost: (v: number) => void;
    totalLaborCost: (v: number) => void;
  }
): void {
  const toRemove: number[] = [];

  activeOperations.forEach((opState, index) => {
    const cycleEnd = opState.cycleStartHour + opState.operationDuration;

    // Check if cycle is completing this hour
    if (cycleEnd === currentHour) {
      // Calculate productivity
      const operation = opState.operation;
      
      log.push(`\n  🔧 Операция: "${operation.name}"`);
      log.push(`     Товар: ${opState.productName}`);
      log.push(`     Цепочка: ${opState.chainName} (${opState.chainType === "ONE_TIME" ? "разовая" : "поточная"})`);

      let producedThisCycle: number;
      const enabledEquipment = operation.operationEquipment.filter(e => e.enabled);
      const enabledRoles = operation.operationRoles.filter(r => r.enabled);

      if (opState.chainType === "ONE_TIME") {
        // Для разовых операций выполняется весь тираж за один раз
        log.push(`     Режим: разовая операция (выполняется полностью за ${opState.operationDuration} час(ов))`);
        producedThisCycle = opState.totalQuantity - opState.completedQuantity;
      } else {
        // Для поточных операций считаем производительность
        // Base productivity with variance (если указана)
        const hasBaseProductivity = operation.estimatedProductivityPerHour && operation.estimatedProductivityPerHour > 0;
        let baseProductivity = Infinity;
        
        if (hasBaseProductivity) {
          baseProductivity = applyVariance(
            operation.estimatedProductivityPerHour,
            operation.estimatedProductivityPerHourVariance,
            varianceMode
          );
          log.push(`     Номинальная производительность: ${baseProductivity.toFixed(2)} шт/час`);
        } else {
          log.push(`     Номинальная производительность: не указана (расчет по оборудованию и людям)`);
        }

        let equipmentProductivity = Infinity;
        if (enabledEquipment.length > 0) {
          // Берем только оборудование с указанной производительностью
          const equipmentWithProductivity = enabledEquipment.filter(eq => eq.piecesPerHour && eq.piecesPerHour > 0);
          if (equipmentWithProductivity.length > 0) {
            const equipmentRates = equipmentWithProductivity.map(eq => 
              applyVariance(eq.piecesPerHour, eq.variance, varianceMode)
            );
            equipmentProductivity = Math.min(...equipmentRates);
            log.push(`     Производительность по оборудованию: ${equipmentProductivity.toFixed(2)} шт/час`);
          } else {
            log.push(`     Производительность по оборудованию: не указана (расчет по времени)`);
          }
        }

        // Role productivity
        let roleProductivity = Infinity;
        
        if (enabledRoles.length > 0) {
          // Берем только роли с указанной производительностью
          const rolesWithProductivity = enabledRoles.filter(r => r.piecesPerHour && r.piecesPerHour > 0);
          
          if (rolesWithProductivity.length > 0) {
            const availablePhysicalWorkers = opState.assignedWorkerIds.length;
            
            if (availablePhysicalWorkers >= rolesWithProductivity.length) {
              // Enough workers - each role has one person
              const roleRates = rolesWithProductivity.map(role =>
                applyVariance(role.piecesPerHour, role.variance, varianceMode)
              );
              roleProductivity = Math.min(...roleRates);
            } else {
              // Not enough workers - need to combine roles
              const totalTimePerPiece = rolesWithProductivity.reduce((sum, role) => {
                const piecesPerHour = applyVariance(role.piecesPerHour, role.variance, varianceMode);
                return sum + (1 / piecesPerHour);
              }, 0);
              roleProductivity = 1 / totalTimePerPiece;
            }
            log.push(`     Производительность по работникам: ${roleProductivity.toFixed(2)} шт/час`);
          } else {
            log.push(`     Производительность по работникам: не указана (расчет по времени)`);
          }
        }

        // Real productivity (минимальное значение из всех доступных)
        let realProductivity = Math.min(baseProductivity!, equipmentProductivity, roleProductivity);
        
        // Если ничего не указано (все Infinity), считаем по времени работы
        // За 1 час цикла производится 1 единица
        if (realProductivity === Infinity) {
          realProductivity = 1; // 1 шт/час по умолчанию
          log.push(`     Производительность по умолчанию: ${realProductivity.toFixed(2)} шт/час (расчет по времени)`);
        }
        
        realProductivity *= breakCoefficient;
        log.push(`     Реальная производительность (с учетом отдыха): ${realProductivity.toFixed(2)} шт/час`);

        // Calculate produced quantity
        const cycleHours = opState.operationDuration;
        producedThisCycle = Math.floor(realProductivity * cycleHours);
        const remaining = opState.totalQuantity - opState.completedQuantity;
        producedThisCycle = Math.min(producedThisCycle, remaining);
      }

      opState.completedQuantity += producedThisCycle;
      log.push(`     ✔️  Выполнено: ${producedThisCycle} шт. (всего: ${opState.completedQuantity}/${opState.totalQuantity})`);

      // Calculate costs
      // Materials
      const enabledMaterials = operation.operationMaterials.filter(m => m.enabled);
      if (enabledMaterials.length > 0) {
        let materialCost = 0;
        let materialVAT = 0;
        enabledMaterials.forEach(mat => {
          const quantityUsed = mat.quantity * producedThisCycle;
          const cost = mat.unitPrice * quantityUsed;
          const vatAmount = cost * (mat.material.vatPercentage / 100);
          materialCost += cost;
          materialVAT += vatAmount;
          log.push(`     💎 Материал "${mat.material?.name || 'неизвестно'}": ${quantityUsed.toFixed(2)} ед. × ${mat.unitPrice.toFixed(2)} = ${cost.toFixed(2)} руб.`);
        });
        totals.totalMaterialCost(materialCost);
        totals.totalMaterialVAT(materialVAT);
        log.push(`     💰 Стоимость материалов: ${materialCost.toFixed(2)} руб. (НДС: ${materialVAT.toFixed(2)} руб.)`);
      }

      // Equipment
      if (enabledEquipment.length > 0) {
        let equipmentCost = 0;
        enabledEquipment.forEach(eq => {
          const cost = eq.hourlyRate * opState.operationDuration;
          equipmentCost += cost;
          log.push(`     ⚙️  Оборудование "${eq.equipment.name}": ${opState.operationDuration} час(ов) × ${eq.hourlyRate.toFixed(2)} = ${cost.toFixed(2)} руб.`);
        });
        totals.totalEquipmentCost(equipmentCost);
        log.push(`     💰 Амортизация оборудования: ${equipmentCost.toFixed(2)} руб.`);
      }

      // Labor
      if (enabledRoles.length > 0) {
        let laborCost = 0;
        enabledRoles.forEach(role => {
          const cost = role.rate * opState.operationDuration;
          laborCost += cost;
          log.push(`     👤 Роль "${role.role.name}": ${opState.operationDuration} час(ов) × ${role.rate.toFixed(2)} = ${cost.toFixed(2)} руб.`);
        });
        totals.totalLaborCost(laborCost);
        log.push(`     💰 Оплата труда: ${laborCost.toFixed(2)} руб.`);
      }

      // Check if operation is complete
      if (opState.completedQuantity >= opState.totalQuantity) {
        log.push(`     ✅ Операция "${operation.name}" завершена полностью!`);
        completedOperations.add(`${opState.itemId}-${operation.id}`);
        toRemove.push(index);

        // Release resources
        opState.assignedWorkerIds.forEach(workerId => {
          resources.busyWorkers.delete(workerId);
        });
        opState.assignedEquipmentIds.forEach(equipmentId => {
          resources.busyEquipment.delete(equipmentId);
        });
      } else {
        // Continue for another cycle
        opState.cycleStartHour = currentHour;
        log.push(`     🔄 Продолжение операции в следующем цикле...`);
      }
    }
  });

  // Remove completed operations
  toRemove.reverse().forEach(index => {
    activeOperations.splice(index, 1);
  });
}

function tryStartNewOperations(
  order: Order,
  activeOperations: ActiveOperation[],
  completedOperations: Set<string>,
  resources: ResourceState,
  currentHour: number,
  varianceMode: VarianceMode,
  log: string[]
): void {
  for (const item of order.orderItems) {
    const process = item.productionProcess;
    
    // Separate chains by type
    const oneTimeChains = process.operationChains
      .filter(c => c.enabled && c.chainType === "ONE_TIME")
      .sort((a, b) => a.orderIndex - b.orderIndex);
    
    const perUnitChains = process.operationChains
      .filter(c => c.enabled && c.chainType === "PER_UNIT")
      .sort((a, b) => a.orderIndex - b.orderIndex);

    // Check if all ONE_TIME chains are completed
    const oneTimeCompleted = oneTimeChains.every(chain =>
      chain.operations.filter(op => op.enabled).every(op =>
        completedOperations.has(`${item.id}-${op.id}`)
      )
    );

    if (!oneTimeCompleted) {
      // Process ONE_TIME chains
      for (const chain of oneTimeChains) {
        tryStartChainOperation(item, chain, activeOperations, completedOperations, resources, currentHour, varianceMode, log, 1);
      }
    } else {
      // Process PER_UNIT chains
      for (const chain of perUnitChains) {
        tryStartChainOperation(item, chain, activeOperations, completedOperations, resources, currentHour, varianceMode, log, item.quantity);
      }
    }
  }
}

function tryStartChainOperation(
  item: OrderItem,
  chain: Chain,
  activeOperations: ActiveOperation[],
  completedOperations: Set<string>,
  resources: ResourceState,
  currentHour: number,
  varianceMode: VarianceMode,
  log: string[],
  totalQuantity: number
): void {
  const enabledOps = chain.operations
    .filter(op => op.enabled)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  for (const operation of enabledOps) {
    const opKey = `${item.id}-${operation.id}`;

    // Skip if completed
    if (completedOperations.has(opKey)) continue;

    // Skip if already active
    if (activeOperations.some(op => op.operation.id === operation.id && op.itemId === item.id)) {
      return;
    }

    // Check previous operations
    const prevOpsCompleted = enabledOps
      .filter(op => op.orderIndex < operation.orderIndex)
      .every(op => completedOperations.has(`${item.id}-${op.id}`));

    if (!prevOpsCompleted) return;

    // Check resource availability
    const enabledRoles = operation.operationRoles.filter(r => r.enabled);
    const enabledEquipment = operation.operationEquipment.filter(e => e.enabled);

    // Check equipment
    for (const eq of enabledEquipment) {
      if (resources.busyEquipment.has(eq.id)) {
        return; // Equipment busy
      }
    }

    // Check workers
    const availableWorkerCount = resources.physicalWorkers - resources.busyWorkers.size;
    const requiredWorkers = Math.min(enabledRoles.length, availableWorkerCount);
    if (requiredWorkers === 0 && enabledRoles.length > 0) {
      return; // No workers available
    }

    // Вычисляем длительность операции
    let operationDuration: number;
    
    if (chain.chainType === "ONE_TIME") {
      // Для разовых операций берем максимальное время из оборудования и ролей
      const equipmentTimes = enabledEquipment.map(eq => eq.machineTime || 0);
      const roleTimes = enabledRoles.map(r => r.timeSpent || 0);
      const allTimes = [...equipmentTimes, ...roleTimes].filter(t => t > 0);
      operationDuration = allTimes.length > 0 ? Math.max(...allTimes) : 1;
    } else {
      // Для поточных операций используем cycleHours
      operationDuration = operation.cycleHours || 1;
    }

    // Allocate resources
    const assignedWorkerIds: number[] = [];
    let nextWorkerId = 0;
    for (let i = 0; i < requiredWorkers; i++) {
      while (resources.busyWorkers.has(nextWorkerId)) {
        nextWorkerId++;
      }
      assignedWorkerIds.push(nextWorkerId);
      resources.busyWorkers.set(nextWorkerId, {
        operationName: operation.name,
        productName: item.product.name,
        untilHour: currentHour + operationDuration,
      });
      nextWorkerId++;
    }

    const assignedEquipmentIds: string[] = [];
    for (const eq of enabledEquipment) {
      assignedEquipmentIds.push(eq.id);
      resources.busyEquipment.set(eq.id, {
        equipmentName: eq.equipment.name,
        operationName: operation.name,
        productName: item.product.name,
        untilHour: currentHour + operationDuration,
      });
    }

    // Create active operation
    const activeOp: ActiveOperation = {
      itemId: item.id,
      productName: item.product.name,
      chainId: chain.id,
      chainName: chain.name,
      chainType: chain.chainType,
      operation: operation,
      totalQuantity,
      completedQuantity: 0,
      cycleStartHour: currentHour,
      operationDuration,
      assignedWorkerIds,
      assignedEquipmentIds,
    };

    activeOperations.push(activeOp);

    log.push(`\n  🚀 НАЧАЛО ОПЕРАЦИИ: "${operation.name}"`);
    log.push(`     Товар: ${item.product.name}`);
    log.push(`     Цепочка: ${chain.name} (${chain.chainType === "ONE_TIME" ? "разовая" : "поточная"})`);
    log.push(`     Тираж: ${totalQuantity} шт.`);
    log.push(`     Задействовано работников: ${requiredWorkers}${enabledRoles.length > requiredWorkers ? ` (требуется ${enabledRoles.length})` : ""}`);
    if (enabledEquipment.length > 0) {
      log.push(`     Задействовано оборудования: ${enabledEquipment.map(e => e.equipment.name).join(", ")}`);
    }
    log.push(`     Длительность: ${operationDuration} час(ов)`);

    return;
  }
}

function allWorkCompleted(order: Order, completedOperations: Set<string>): boolean {
  for (const item of order.orderItems) {
    const process = item.productionProcess;
    
    for (const chain of process.operationChains) {
      if (!chain.enabled) continue;

      for (const operation of chain.operations) {
        if (!operation.enabled) continue;

        const opKey = `${item.id}-${operation.id}`;
        if (!completedOperations.has(opKey)) {
          return false;
        }
      }
    }
  }

  return true;
}
