
/**
 * Загрузчик данных из базы данных для симуляции
 */

import { PrismaClient } from "@prisma/client";
import {
  MaterialInfo,
  EquipmentInfo,
  EmployeeInfo,
  EmployeeRoleInfo,
  OperationChainConfig,
} from "./types";

const prisma = new PrismaClient();

/**
 * Загрузить все данные для симуляции
 */
export async function loadSimulationData(processId: string, selectedEmployeeIds?: string[]) {
  const [materials, equipment, roles, employees, chains] = await Promise.all([
    loadMaterials(),
    loadEquipment(),
    loadRoles(),
    loadEmployees(selectedEmployeeIds),
    loadOperationChains(processId),
  ]);
  
  return {
    materials,
    equipment,
    roles,
    employees,
    chains,
  };
}

/**
 * Загрузить материалы
 */
export async function loadMaterials(): Promise<MaterialInfo[]> {
  const materials = await prisma.material.findMany({
    include: {
      category: true,
    },
  });
  
  return materials.map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    cost: m.cost,
    minStockPercentage: m.minStockPercentage || 0,
    batchSize: m.batchSize || 0,
    prepaymentPercentage: m.prepaymentPercentage || 0,
    manufacturingDays: m.manufacturingDays || 0,
    deliveryDays: m.deliveryDays || 0,
  }));
}

/**
 * Загрузить оборудование
 */
export async function loadEquipment(): Promise<EquipmentInfo[]> {
  const equipment = await prisma.equipment.findMany();
  
  return equipment.map((e) => ({
    id: e.id,
    name: e.name,
    hourlyDepreciation: e.hourlyDepreciation,
    maxProductivity: e.maxProductivity || undefined,
    productivityUnits: e.productivityUnits || undefined,
  }));
}

/**
 * Загрузить роли
 */
export async function loadRoles(): Promise<EmployeeRoleInfo[]> {
  const roles = await prisma.employeeRole.findMany();
  
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    paymentType: r.paymentType as "HOURLY" | "PIECE_RATE",
    hourlyRate: r.hourlyRate,
  }));
}

/**
 * Загрузить сотрудников
 * @param selectedEmployeeIds - Список ID выбранных сотрудников (если не указано - загружаются все активные)
 */
export async function loadEmployees(selectedEmployeeIds?: string[]): Promise<EmployeeInfo[]> {
  // Если список сотрудников не указан, загружаем всех активных
  const where = selectedEmployeeIds && selectedEmployeeIds.length > 0
    ? { id: { in: selectedEmployeeIds }, isActive: true }
    : { isActive: true };
  
  const employees = await prisma.employee.findMany({
    where,
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });
  
  return employees.map((e) => ({
    id: e.id,
    name: e.name,
    roles: e.roles.map((r) => r.roleId),
  }));
}

/**
 * Загрузить цепочки операций для процесса
 */
export async function loadOperationChains(processId: string): Promise<OperationChainConfig[]> {
  const chains = await prisma.operationChain.findMany({
    where: { processId },
    include: {
      operations: {
        where: { enabled: true },
        include: {
          operationMaterials: {
            where: { enabled: true },
            include: {
              material: true,
            },
          },
          operationEquipment: {
            where: { enabled: true },
            include: {
              equipment: true,
            },
          },
          operationRoles: {
            where: { enabled: true },
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          orderIndex: "asc",
        },
      },
    },
    orderBy: {
      orderIndex: "asc",
    },
  });
  
  return chains.map((chain) => ({
    id: chain.id,
    name: chain.name,
    chainType: chain.chainType as "ONE_TIME" | "PER_UNIT",
    orderIndex: chain.orderIndex,
    enabled: chain.enabled,
    operations: chain.operations.map((op) => ({
      id: op.id,
      name: op.name,
      chainId: chain.id,
      orderIndex: op.orderIndex,
      enabled: op.enabled,
      estimatedProductivityPerHour: op.estimatedProductivityPerHour || undefined,
      cycleHours: op.cycleHours || undefined,
      operationDuration: op.operationDuration || undefined,
      minimumBatchSize: op.minimumBatchSize || 1,
      requiresContinuousOperation: false, // Можно добавить в схему позже
      materials: op.operationMaterials.map((m) => ({
        materialId: m.materialId,
        quantityPerUnit: m.quantity,
        variance: m.variance || 0,
        enabled: m.enabled,
      })),
      equipment: op.operationEquipment.map((e) => ({
        equipmentId: e.equipmentId,
        timePerUnit: e.machineTime,
        productivityPerHour: e.piecesPerHour || undefined,
        variance: e.variance || 0,
        enabled: e.enabled,
        requiresContinuousOperation: e.requiresContinuousOperation || false,
      })),
      roles: op.operationRoles.map((r) => ({
        roleId: r.roleId,
        timePerUnit: r.timeSpent,
        productivityPerHour: r.piecesPerHour || undefined,
        variance: r.variance || 0,
        enabled: r.enabled,
        requiresContinuousPresence: r.requiresContinuousPresence || false,
      })),
    })),
  }));
}

/**
 * Загрузить настройки симуляции v2 для заказа
 */
export async function loadSimulationSettingsV2(orderId: string) {
  // Получить настройки для конкретного заказа
  let settings = await prisma.simulationSettingsV2.findUnique({
    where: { orderId },
  });
  
  // Если настроек нет, создать с дефолтными значениями
  if (!settings) {
    settings = await prisma.simulationSettingsV2.create({
      data: {
        orderId,
        workingHoursPerDay: 8,
        restMinutesPerHour: 0,
        vatRate: 20,
        profitTaxRate: 20,
        includeRecurringExpenses: false,
        waitForMaterialDelivery: true,
        payEmployeesForIdleTime: false,
      },
    });
  }
  
  return {
    workingHoursPerDay: settings.workingHoursPerDay,
    restMinutesPerHour: settings.restMinutesPerHour,
    sellingPriceWithVAT: settings.sellingPriceWithVAT || undefined,
    vatRate: settings.vatRate,
    profitTaxRate: settings.profitTaxRate,
    includeRecurringExpenses: settings.includeRecurringExpenses,
    waitForMaterialDelivery: settings.waitForMaterialDelivery,
    payEmployeesForIdleTime: settings.payEmployeesForIdleTime,
    minIdleMinutesForPayment: 10,  // Константа по требованию
    simulationTimeoutDays: 30,      // Константа по требованию
  };
}
