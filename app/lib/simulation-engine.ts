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
  availableWorkers: number;
  busyWorkers: Map<number, { operationName: string; untilHour: number }>;
  busyEquipment: Map<string, { equipmentName: string; operationName: string; untilHour: number }>;
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
  assignedWorkerIds: number[];
  assignedEquipmentIds: string[];
}

export function applyVariance(
  baseValue: number,
  variance: number | null,
  mode: VarianceMode
): number {
  if (!variance || variance === 0 || mode === "NONE") return baseValue;

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

        if (!operation.estimatedProductivityPerHour || operation.estimatedProductivityPerHour <= 0) {
          missingParams.push(`${opPath}: отсутствует номинальная производительность`);
        }

        if (operation.estimatedProductivityPerHourVariance === null || operation.estimatedProductivityPerHourVariance === undefined) {
          missingParams.push(`${opPath}: отсутствует разброс производительности`);
        }

        if (!operation.cycleHours || operation.cycleHours <= 0) {
          missingParams.push(`${opPath}: отсутствует длина рабочего цикла`);
        }

        const enabledEquipment = operation.operationEquipment.filter(e => e.enabled);
        for (const eq of enabledEquipment) {
          if (!eq.piecesPerHour || eq.piecesPerHour <= 0) {
            missingParams.push(`${opPath} → Оборудование "${eq.equipment.name}": отсутствует производительность (шт/час)`);
          }
          if (eq.variance === null || eq.variance === undefined) {
            missingParams.push(`${opPath} → Оборудование "${eq.equipment.name}": отсутствует разброс`);
          }
        }

        const enabledRoles = operation.operationRoles.filter(r => r.enabled);
        for (const role of enabledRoles) {
          if (!role.piecesPerHour || role.piecesPerHour <= 0) {
            missingParams.push(`${opPath} → Роль "${role.role.name}": отсутствует производительность (шт/час)`);
          }
          if (role.variance === null || role.variance === undefined) {
            missingParams.push(`${opPath} → Роль "${role.role.name}": отсутствует разброс`);
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
    availableWorkers: physicalWorkers,
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

    // Check for idle workers
    const idleWorkers = resources.availableWorkers;
    if (idleWorkers > 0 && (activeOperations.length > 0 || !allWorkCompleted(order, completedOperations))) {
      log.push(`\n  ⏸️  Простой: ${idleWorkers} работник(ов) не задействованы`);
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
  const workersToRelease: number[] = [];
  resources.busyWorkers.forEach((info, workerId) => {
    if (info.untilHour <= currentHour) {
      workersToRelease.push(workerId);
    }
  });

  workersToRelease.forEach(workerId => {
    resources.busyWorkers.delete(workerId);
    resources.availableWorkers++;
  });

  if (workersToRelease.length > 0) {
    log.push(`  ✅ Освободились работники: ${workersToRelease.length} чел.`);
  }

  // Release equipment
  const equipmentToRelease: string[] = [];
  resources.busyEquipment.forEach((info, equipmentId) => {
    if (info.untilHour <= currentHour) {
      equipmentToRelease.push(equipmentId);
    }
  });

  equipmentToRelease.forEach(equipmentId => {
    const info = resources.busyEquipment.get(equipmentId);
    if (info) {
      log.push(`  ✅ Освободилось оборудование: ${info.equipmentName}`);
      resources.busyEquipment.delete(equipmentId);
    }
  });
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
    const cycleEnd = opState.cycleStartHour + opState.operation.cycleHours;

    // Check if cycle is completing this hour
    if (cycleEnd === currentHour) {
      // Calculate productivity
      const operation = opState.operation;
      
      log.push(`\n  🔧 Операция: "${operation.name}"`);
      log.push(`     Товар: ${opState.productName}`);
      log.push(`     Цепочка: ${opState.chainName} (${opState.chainType})`);

      // Base productivity with variance
      let baseProductivity = applyVariance(
        operation.estimatedProductivityPerHour || 0,
        operation.estimatedProductivityPerHourVariance,
        varianceMode
      );
      log.push(`     Расчетная производительность: ${baseProductivity.toFixed(2)} шт/час`);

      // Equipment productivity
      const enabledEquipment = operation.operationEquipment.filter(e => e.enabled);
      let equipmentProductivity = Infinity;
      if (enabledEquipment.length > 0) {
        const equipmentRates = enabledEquipment.map(eq => 
          applyVariance(eq.piecesPerHour || 0, eq.variance, varianceMode)
        );
        equipmentProductivity = Math.min(...equipmentRates);
        log.push(`     Производительность по оборудованию: ${equipmentProductivity.toFixed(2)} шт/час`);
      }

      // Role productivity
      const enabledRoles = operation.operationRoles.filter(r => r.enabled);
      let roleProductivity = Infinity;
      
      if (enabledRoles.length > 0) {
        const availablePhysicalWorkers = opState.assignedWorkerIds.length;
        
        if (availablePhysicalWorkers >= enabledRoles.length) {
          // Enough workers - each role has one person
          const roleRates = enabledRoles.map(role =>
            applyVariance(role.piecesPerHour || 0, role.variance, varianceMode)
          );
          roleProductivity = Math.min(...roleRates);
        } else {
          // Not enough workers - need to combine roles
          const totalTimePerPiece = enabledRoles.reduce((sum, role) => {
            const piecesPerHour = applyVariance(role.piecesPerHour || 0, role.variance, varianceMode);
            return sum + (1 / piecesPerHour);
          }, 0);
          roleProductivity = 1 / totalTimePerPiece;
        }
        log.push(`     Производительность по работникам: ${roleProductivity.toFixed(2)} шт/час`);
      }

      // Real productivity
      let realProductivity = Math.min(baseProductivity, equipmentProductivity, roleProductivity);
      realProductivity *= breakCoefficient;
      log.push(`     Реальная производительность (с учетом отдыха): ${realProductivity.toFixed(2)} шт/час`);

      // Calculate produced quantity
      const cycleHours = operation.cycleHours;
      let producedThisCycle = Math.floor(realProductivity * cycleHours);
      const remaining = opState.totalQuantity - opState.completedQuantity;
      producedThisCycle = Math.min(producedThisCycle, remaining);

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
          const cost = eq.hourlyRate * cycleHours;
          equipmentCost += cost;
          log.push(`     ⚙️  Оборудование "${eq.equipment.name}": ${cycleHours} час(ов) × ${eq.hourlyRate.toFixed(2)} = ${cost.toFixed(2)} руб.`);
        });
        totals.totalEquipmentCost(equipmentCost);
        log.push(`     💰 Амортизация оборудования: ${equipmentCost.toFixed(2)} руб.`);
      }

      // Labor
      if (enabledRoles.length > 0) {
        let laborCost = 0;
        enabledRoles.forEach(role => {
          const cost = role.rate * cycleHours;
          laborCost += cost;
          log.push(`     👤 Роль "${role.role.name}": ${cycleHours} час(ов) × ${role.rate.toFixed(2)} = ${cost.toFixed(2)} руб.`);
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
          resources.availableWorkers++;
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
    const requiredWorkers = Math.min(enabledRoles.length, resources.availableWorkers);
    if (requiredWorkers === 0 && enabledRoles.length > 0) {
      return; // No workers available
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
        untilHour: currentHour + operation.cycleHours,
      });
      nextWorkerId++;
    }
    resources.availableWorkers -= requiredWorkers;

    const assignedEquipmentIds: string[] = [];
    for (const eq of enabledEquipment) {
      assignedEquipmentIds.push(eq.id);
      resources.busyEquipment.set(eq.id, {
        equipmentName: eq.equipment.name,
        operationName: operation.name,
        untilHour: currentHour + operation.cycleHours,
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
      assignedWorkerIds,
      assignedEquipmentIds,
    };

    activeOperations.push(activeOp);

    log.push(`\n  🚀 НАЧАЛО ОПЕРАЦИИ: "${operation.name}"`);
    log.push(`     Товар: ${item.product.name}`);
    log.push(`     Цепочка: ${chain.name} (${chain.chainType})`);
    log.push(`     Тираж: ${totalQuantity} шт.`);
    log.push(`     Задействовано работников: ${requiredWorkers}${enabledRoles.length > requiredWorkers ? ` (требуется ${enabledRoles.length})` : ""}`);
    if (enabledEquipment.length > 0) {
      log.push(`     Задействовано оборудования: ${enabledEquipment.map(e => e.equipment.name).join(", ")}`);
    }
    log.push(`     Длительность цикла: ${operation.cycleHours} час(ов)`);

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
