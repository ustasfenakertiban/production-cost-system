
import { PrismaClient } from '@prisma/client';
import {
  MaterialSpec, EquipmentSpec, EmployeeSpec, RoleSpec,
  ProcessSpec, ChainSpec, OperationSpec, SimulationSettings,
  PeriodicExpenseSpec, PaymentScheduleItem, ChainType
} from './types';

const prisma = new PrismaClient();

export async function loadMaterials(): Promise<MaterialSpec[]> {
  const rows = await prisma.material.findMany();
  return rows.map(r => ({
    id: String(r.id),
    name: r.name,
    unitCost: Number(r.cost ?? 0),
    vatRate: Number(r.vatPercentage ?? 0),
    minStock: Number(r.batchSize ?? 0), // адаптация: используем batchSize как minStock
    minOrderQty: Number(r.batchSize ?? 0), // адаптация: используем batchSize как minOrderQty
    leadTimeProductionDays: Number(r.manufacturingDays ?? 0),
    leadTimeShippingDays: Number(r.deliveryDays ?? 0),
  }));
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
  const s = await prisma.simulationSettingsV2.findFirst();
  return {
    workingHoursPerDay: Number(s?.workingHoursPerDay ?? 8),
    restMinutesPerHour: Number(s?.restMinutesPerHour ?? 0),
    waitForMaterialDelivery: Boolean(s?.waitForMaterialDelivery ?? true),
    considerPeriodicExpenses: Boolean(s?.includeRecurringExpenses ?? true),
    varianceMode: (s?.varianceMode as any) ?? 'no_variance',
    variancePercent: Number(s?.variancePercent ?? 0),
    thresholdRatio: Number(s?.thresholdRatio ?? 0.5),
    initialCashBalance: Number(s?.initialCashBalance ?? 0),
    materialPrepayPercent: Number(s?.materialPrepayPercent ?? 0.3),
    depreciationCashPolicy: (s?.depreciationCashPolicy as any) ?? 'end_of_simulation',
    periodicExpensePaymentPolicy: (s?.periodicExpensePaymentPolicy as any) ?? 'daily',
    monthDivisor: Number(s?.monthDivisor ?? 30),
    payrollPaymentPolicy: (s?.payrollPaymentPolicy as any) ?? 'daily',
    materialTwoPhasePayment: Boolean(s?.materialTwoPhasePayment ?? true),
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
