
import { PrismaClient } from '@prisma/client';
import {
  MaterialSpec, EquipmentSpec, EmployeeSpec, RoleSpec,
  ProcessSpec, ChainSpec, OperationSpec, SimulationSettings,
  PeriodicExpenseSpec, PaymentScheduleItem, ChainType
} from './types';

const prisma = new PrismaClient();

export async function loadMaterials(orderId?: string): Promise<MaterialSpec[]> {
  const rows = await prisma.material.findMany();
  console.log('[DataLoader] Loading materials from database...');
  
  // Загружаем партии закупки для заказа
  if (!orderId) {
    throw new Error(
      'Для запуска симуляции необходимо указать ID заказа. ' +
      'Партии закупок материалов загружаются из настроек конкретного заказа.'
    );
  }
  
  const batches = await prisma.materialPurchaseBatch.findMany({
    where: { orderId }
  });
  console.log(`[DataLoader] Loaded ${batches.length} material purchase batches for order ${orderId}`);
  
  // Если для заказа нет партий - это ошибка
  if (batches.length === 0) {
    throw new Error(
      'Не настроены партии закупок материалов для этого заказа. ' +
      'Откройте карточку заказа и настройте партии закупок материалов, ' +
      'либо импортируйте их из шаблона (если есть сохраненный шаблон из другого заказа).'
    );
  }
  
  // Создаем Map для быстрого доступа к партиям по materialId
  const batchByMaterial = new Map(batches.map(b => [b.materialId, b]));
  
  // Проверяем, что для всех используемых в производстве материалов есть партии
  const materialsWithoutBatches: string[] = [];
  
  return rows.map(r => {
    const batch = batchByMaterial.get(r.id);
    
    // Если есть партия для этого материала - используем ее данные
    if (batch) {
      const quantity = Number(batch.quantity ?? 0);
      console.log(`[DataLoader] Material "${r.name}": using batch data - quantity=${quantity}, minStock=${batch.minStock ?? 0}`);
      
      return {
        id: String(r.id),
        name: r.name,
        unitCost: Number(batch.pricePerUnit ?? r.cost ?? 0),
        vatRate: Number(batch.vatPercent ?? r.vatPercentage ?? 0),
        minStock: Number(batch.minStock ?? quantity * 0.2), // минимальный остаток на складе
        minOrderQty: quantity, // минимальный размер заказа
        leadTimeProductionDays: Number(batch.manufacturingDays ?? 0),
        leadTimeShippingDays: Number(batch.deliveryDays ?? 0),
      };
    }
    
    // Если партии нет - запоминаем материал для предупреждения
    console.warn(`[DataLoader] Material "${r.name}": no batch found, material will not be purchased during simulation`);
    materialsWithoutBatches.push(r.name);
    
    // Возвращаем с нулевыми значениями - материал не будет закупаться
    // Это допустимо, если материал не используется в производственных операциях
    return {
      id: String(r.id),
      name: r.name,
      unitCost: Number(r.cost ?? 0),
      vatRate: Number(r.vatPercentage ?? 0),
      minStock: 0,
      minOrderQty: 0, // Нулевой размер заказа = материал не будет закупаться
      leadTimeProductionDays: 0,
      leadTimeShippingDays: 0,
    };
  });
}

export async function loadEquipment(): Promise<EquipmentSpec[]> {
  const rows = await prisma.equipment.findMany();
  return rows.map(r => ({
    id: String(r.id),
    name: r.name,
    hourlyDepreciation: Number(r.hourlyDepreciation ?? 0),
    considerInUtilization: Boolean(r.trackInOccupancy ?? true),
  }));
}

export async function loadRoles(): Promise<RoleSpec[]> {
  const rows = await prisma.employeeRole.findMany();
  return rows.map(r => ({ id: String(r.id), name: r.name }));
}

export async function loadEmployees(): Promise<EmployeeSpec[]> {
  const rows = await prisma.employee.findMany({ 
    include: { 
      roles: {
        include: {
          role: true
        }
      }
    } 
  });
  return rows.map(r => {
    // Берем среднюю ставку из всех ролей сотрудника
    const avgWage = r.roles.length > 0 
      ? r.roles.reduce((sum, rr) => sum + Number(rr.role.hourlyRate ?? 0), 0) / r.roles.length
      : 0;
    return {
      id: String(r.id),
      name: r.name,
      roleIds: r.roles.map(rr => String(rr.roleId)),
      hourlyWage: avgWage,
    };
  });
}

export async function loadOperationChains(): Promise<ProcessSpec> {
  const chains = await prisma.operationChain.findMany({
    where: { enabled: true },
    include: {
      operations: {
        where: { enabled: true },
        include: {
          operationMaterials: { where: { enabled: true } },
          operationRoles: { where: { enabled: true } },
          operationEquipment: { where: { enabled: true } }
        }
      }
    }
  });
  const chainSpecs: ChainSpec[] = chains.map(ch => ({
    id: String(ch.id),
    name: ch.name,
    type: (ch.chainType === 'ONE_TIME' ? 'one-time' : 'per-unit') as ChainType,
    orderIndex: Number(ch.orderIndex ?? 0),
    operations: ch.operations.map(op => ({
      id: String(op.id),
      name: op.name,
      orderIndex: Number(op.orderIndex ?? 0),
      baseProductivityPerHour: Number(op.estimatedProductivityPerHour ?? 0),
      minStartInput: op.minimumBatchSize ? Number(op.minimumBatchSize) : undefined,
      requiresContinuousEquipmentWork: op.operationEquipment.some(e => e.requiresContinuousOperation),
      staffPresenceMode: (op.operationRoles.some(r => r.requiresContinuousPresence) ? 'full' : 'partial') as 'full' | 'partial',
      materialUsages: op.operationMaterials.map(m => ({ 
        materialId: String(m.materialId), 
        quantityPerUnit: Number(m.quantity ?? 0) 
      })),
      requiredRoleIds: op.operationRoles.map(r => String(r.roleId)),
      requiredEquipmentIds: op.operationEquipment.map(e => String(e.equipmentId)),
    })).sort((a,b)=>a.orderIndex-b.orderIndex)
  })).sort((a,b)=>a.orderIndex-b.orderIndex);
  return { id: 'process_main', name: 'Main Production', chains: chainSpecs };
}

export async function loadSimulationSettingsV2(): Promise<SimulationSettings> {
  // Пытаемся получить глобальные настройки, если их нет - создаем с дефолтными значениями
  let s = await prisma.globalSimulationSettingsV2.findFirst();
  
  if (!s) {
    console.log('[DataLoader] GlobalSimulationSettingsV2 not found, creating default...');
    s = await prisma.globalSimulationSettingsV2.create({
      data: {
        workingHoursPerDay: 8,
        restMinutesPerHour: 0,
        waitForMaterialDelivery: true,
        includeRecurringExpenses: true,
        varianceMode: 'NO_VARIANCE',
        variancePercent: 0,
        thresholdRatio: 0.5,
        initialCashBalance: 0,
        materialPrepayPercent: 30,
        depreciationCashPolicy: 'END_OF_SIMULATION',
        periodicExpensePaymentPolicy: 'DAILY',
        monthDivisor: 30,
        payrollPaymentPolicy: 'DAILY',
        materialTwoPhasePayment: true,
      }
    });
  }
  
  return {
    workingHoursPerDay: Number(s.workingHoursPerDay),
    restMinutesPerHour: Number(s.restMinutesPerHour),
    waitForMaterialDelivery: Boolean(s.waitForMaterialDelivery),
    considerPeriodicExpenses: Boolean(s.includeRecurringExpenses),
    varianceMode: s.varianceMode.toLowerCase() as any,
    variancePercent: Number(s.variancePercent),
    thresholdRatio: Number(s.thresholdRatio),
    initialCashBalance: Number(s.initialCashBalance),
    materialPrepayPercent: Number(s.materialPrepayPercent) / 100, // Конвертируем проценты в десятичную дробь
    depreciationCashPolicy: s.depreciationCashPolicy.toLowerCase() as any,
    periodicExpensePaymentPolicy: s.periodicExpensePaymentPolicy.toLowerCase() as any,
    monthDivisor: Number(s.monthDivisor),
    payrollPaymentPolicy: s.payrollPaymentPolicy.toLowerCase() as any,
    materialTwoPhasePayment: Boolean(s.materialTwoPhasePayment),
  };
}

export async function loadPeriodicExpenses(): Promise<PeriodicExpenseSpec[]> {
  const rows = await prisma.recurringExpense.findMany({ where: { active: true } });
  return rows.map(r => ({
    id: String(r.id),
    name: r.name,
    period: r.period as any,
    amount: Number(r.amount ?? 0),
    isActive: Boolean(r.active ?? true),
    vatRate: Number(r.vatRate ?? 0),
  }));
}

export async function loadPaymentSchedule(orderId: string): Promise<PaymentScheduleItem[]> {
  const rows = await prisma.paymentSchedule.findMany({ where: { orderId } });
  return rows.map(r => ({
    id: String(r.id),
    orderId: String(r.orderId),
    dayNumber: Number(r.dayNumber),
    percentageOfTotal: Number(r.percentageOfTotal),
    amount: r.amount != null ? Number(r.amount) : undefined,
    description: r.description ?? undefined,
  }));
}
