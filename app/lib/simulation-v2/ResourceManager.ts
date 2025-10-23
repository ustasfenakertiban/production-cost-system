
import { 
  EmployeeSpec, EquipmentSpec, MaterialSpec, PeriodicExpenseSpec, SimulationSettings,
  DayLog, HourLog, ChainHourLog, OperationHourLog, MaterialBatchDebug, DayCashOut, DayNonCash
} from './types';

type MaterialBatch = {
  materialId: string;
  qty: number;
  unitCost: number;
  vatRate: number;
  orderDay: number;
  etaProductionDay: number;
  etaArrivalDay: number;
  prepayNet: number;
  prepayVat: number;
  postpayNet: number;
  postpayVat: number;
};

export class ResourceManager {
  readonly materials: Map<string, MaterialSpec>;
  readonly equipment: Map<string, EquipmentSpec>;
  readonly employees: Map<string, EmployeeSpec>;
  private materialStock: Map<string, number>;
  private plannedBatches: MaterialBatch[];
  private employeeMinuteAllocated: Map<string, number>;
  private equipmentMinuteAllocated: Map<string, number>;

  public materialCostAccrued = 0;
  public materialVatAccrued = 0;
  public laborCostAccrued = 0;
  public equipmentDepreciationAccrued = 0;
  public periodicNetAccrued = 0;
  public periodicVatAccrued = 0;

  public cashBalance = 0;

  public daily = new Map<number, {
    cashIn: number;
    cashOut: { materials: number; materialsVat: number; labor: number; periodic: number; periodicVat: number };
    nonCash: { depreciation: number };
  }>();

  // New fields for v2
  public materialBatchesDebug: MaterialBatchDebug[] = [];
  private hourLogs: Map<number, HourLog[]> = new Map();
  private employeeWorkedThisHour: Set<string> = new Set();
  private laborAccrualDaily: Map<number, number> = new Map();

  constructor(materials: MaterialSpec[], equipment: EquipmentSpec[], employees: EmployeeSpec[], initialCash: number) {
    this.materials = new Map(materials.map(m => [m.id, m]));
    this.equipment = new Map(equipment.map(e => [e.id, e]));
    this.employees = new Map(employees.map(emp => [emp.id, emp]));
    this.materialStock = new Map(materials.map(m => [m.id, 0]));
    this.plannedBatches = [];
    this.employeeMinuteAllocated = new Map();
    this.equipmentMinuteAllocated = new Map();
    this.cashBalance = initialCash;
  }

  private ensureDay(day: number) {
    if (!this.daily.has(day)) {
      this.daily.set(day, {
        cashIn: 0,
        cashOut: { materials: 0, materialsVat: 0, labor: 0, periodic: 0, periodicVat: 0 },
        nonCash: { depreciation: 0 },
      });
    }
    return this.daily.get(day)!;
  }

  getStock(materialId: string): number { return this.materialStock.get(materialId) ?? 0; }
  setStock(materialId: string, qty: number) { this.materialStock.set(materialId, qty); }

  // Автозаказ материалов утром
  dailyMaterialReplenishment(currentDay: number, s: SimulationSettings) {
    if (currentDay <= 3) {
      console.log(`[ResourceMgr] Day ${currentDay}: Checking material replenishment`);
      console.log(`[ResourceMgr]   waitForMaterialDelivery: ${s.waitForMaterialDelivery}`);
      console.log(`[ResourceMgr]   thresholdRatio: ${s.thresholdRatio}`);
    }
    for (const m of this.materials.values()) {
      const stock = this.getStock(m.id);
      const threshold = s.thresholdRatio * m.minStock;
      const hasIncoming = this.plannedBatches.some(b => b.materialId === m.id && b.etaArrivalDay >= currentDay);
      if (currentDay <= 3) {
        console.log(`[ResourceMgr]   Material "${m.name}": stock=${stock}, threshold=${threshold}, minStock=${m.minStock}, hasIncoming=${hasIncoming}`);
      }
      if (stock <= threshold && !hasIncoming) {
        const leadProd = s.waitForMaterialDelivery ? m.leadTimeProductionDays : 0;
        const leadShip = s.waitForMaterialDelivery ? m.leadTimeShippingDays : 0;
        const etaProdDay = currentDay + leadProd;
        const etaArrivalDay = currentDay + leadProd + leadShip;
        const qty = m.minOrderQty;
        
        console.log(`[ResourceMgr] Day ${currentDay}: Ordering material "${m.name}"`);
        console.log(`[ResourceMgr]   minOrderQty from spec: ${m.minOrderQty}`);
        console.log(`[ResourceMgr]   qty to order: ${qty}`);
        console.log(`[ResourceMgr]   leadProd: ${leadProd}, leadShip: ${leadShip}, etaArrivalDay: ${etaArrivalDay}`);
        
        if (qty === 0) {
          console.error(`[ResourceMgr] ⚠️ ERROR: Attempting to order 0 units of "${m.name}"! minOrderQty=${m.minOrderQty}, minStock=${m.minStock}`);
        }
        const net = m.unitCost * qty;
        const vat = net * (m.vatRate / 100);

        let prepayNet = 0, prepayVat = 0, postpayNet = 0, postpayVat = 0;

        if (s.materialTwoPhasePayment) {
          // Двухфазная оплата: предоплата сейчас, постоплата при готовности
          prepayNet = net * s.materialPrepayPercent;
          prepayVat = vat * s.materialPrepayPercent;
          postpayNet = net - prepayNet;
          postpayVat = vat - prepayVat;

          const day = this.ensureDay(currentDay);
          day.cashOut.materials += prepayNet;
          day.cashOut.materialsVat += prepayVat;
          this.cashBalance -= (prepayNet + prepayVat);
        } else {
          // Вся оплата сразу в день заказа
          const day = this.ensureDay(currentDay);
          day.cashOut.materials += net;
          day.cashOut.materialsVat += vat;
          this.cashBalance -= (net + vat);
        }

        this.plannedBatches.push({
          materialId: m.id,
          qty,
          unitCost: m.unitCost,
          vatRate: m.vatRate,
          orderDay: currentDay,
          etaProductionDay: etaProdDay,
          etaArrivalDay,
          prepayNet, prepayVat, postpayNet, postpayVat
        });

        // Запись в materialBatchesDebug
        this.materialBatchesDebug.push({
          materialId: m.id,
          qty,
          unitCost: m.unitCost,
          vatRate: m.vatRate,
          orderDay: currentDay,
          etaProductionDay: etaProdDay,
          etaArrivalDay,
          prepayNet, prepayVat, postpayNet, postpayVat
        });
      }
    }
  }

  processMaterialPostpay(currentDay: number) {
    for (const b of this.plannedBatches) {
      if (b.etaProductionDay === currentDay && b.postpayNet > 0) {
        const day = this.ensureDay(currentDay);
        day.cashOut.materials += b.postpayNet;
        day.cashOut.materialsVat += b.postpayVat;
        this.cashBalance -= (b.postpayNet + b.postpayVat);
      }
    }
  }

  processIncomingMaterials(currentDay: number) {
    const arrived: MaterialBatch[] = [];
    this.plannedBatches = this.plannedBatches.filter(b => {
      if (b.etaArrivalDay === currentDay) { arrived.push(b); return false; }
      return true;
    });
    if (currentDay <= 5) {
      console.log(`[ResourceMgr] Day ${currentDay}: Processing incoming materials, arrived=${arrived.length}, pending=${this.plannedBatches.length}`);
    }
    for (const b of arrived) {
      const prev = this.getStock(b.materialId);
      this.setStock(b.materialId, prev + b.qty);
      const m = this.materials.get(b.materialId);
      if (currentDay <= 5) {
        console.log(`[ResourceMgr]   Material "${m?.name}" arrived: qty=${b.qty}, stock: ${prev} → ${prev + b.qty}`);
      }
    }
  }

  reserveAndConsumeMaterials(consumption: Array<{ materialId: string; qty: number }>): { ok: boolean; details: Array<{ materialId: string; qty: number; net: number; vat: number }> } {
    // Check availability
    for (const c of consumption) {
      const stock = this.getStock(c.materialId);
      if (stock < c.qty) {
        const m = this.materials.get(c.materialId);
        console.log(`[ResourceMgr] ⚠️ Material shortage: "${m?.name}" needs ${c.qty}, available ${stock}`);
        return { ok: false, details: [] };
      }
    }
    
    // Consume and record details
    const details: Array<{ materialId: string; qty: number; net: number; vat: number }> = [];
    for (const c of consumption) {
      const stock = this.getStock(c.materialId);
      this.setStock(c.materialId, stock - c.qty);
      const m = this.materials.get(c.materialId)!;
      const net = m.unitCost * c.qty;
      const vat = net * (m.vatRate / 100);
      this.materialCostAccrued += net;
      this.materialVatAccrued += vat;
      details.push({ materialId: c.materialId, qty: c.qty, net, vat });
    }
    return { ok: true, details };
  }

  resetHourAllocations() { 
    this.employeeMinuteAllocated.clear(); 
    this.equipmentMinuteAllocated.clear(); 
  }

  allocateForOperation(
    requiredRoleIds: string[],
    requiredEquipmentIds: string[],
    minutesLeftInHour: number,
    opts?: { requireFullForStaff?: boolean; requireFullForEquipment?: boolean }
  ): { capacityFactor: number; employeesUsed: { id: string; minutes: number }[]; equipmentUsed: { id: string; minutes: number }[] } {
    const requireFullForStaff = !!opts?.requireFullForStaff;
    const requireFullForEquipment = !!opts?.requireFullForEquipment;

    const employeesUsed: { id: string; minutes: number }[] = [];
    let minEmployeeFraction = 1;
    for (const roleId of requiredRoleIds) {
      const emp = [...this.employees.values()].find(e => e.roleIds.includes(roleId));
      if (!emp) return { capacityFactor: 0, employeesUsed: [], equipmentUsed: [] };
      const allocated = this.employeeMinuteAllocated.get(emp.id) ?? 0;
      const available = Math.max(0, minutesLeftInHour - allocated);
      if (requireFullForStaff) {
        if (available < minutesLeftInHour) return { capacityFactor: 0, employeesUsed: [], equipmentUsed: [] };
        employeesUsed.push({ id: emp.id, minutes: minutesLeftInHour });
      } else {
        if (available <= 0) {
          minEmployeeFraction = Math.min(minEmployeeFraction, 0);
        } else {
          const frac = Math.min(1, available / minutesLeftInHour);
          minEmployeeFraction = Math.min(minEmployeeFraction, frac);
          employeesUsed.push({ id: emp.id, minutes: Math.min(available, minutesLeftInHour) });
        }
      }
    }

    const equipmentUsed: { id: string; minutes: number }[] = [];
    let minEquipmentFraction = 1;
    for (const eqId of requiredEquipmentIds) {
      const eq = this.equipment.get(eqId);
      if (!eq) return { capacityFactor: 0, employeesUsed: [], equipmentUsed: [] };
      if (eq.considerInUtilization === false) continue;
      const allocated = this.equipmentMinuteAllocated.get(eq.id) ?? 0;
      const available = Math.max(0, minutesLeftInHour - allocated);
      if (requireFullForEquipment) {
        if (available < minutesLeftInHour) return { capacityFactor: 0, employeesUsed: [], equipmentUsed: [] };
        equipmentUsed.push({ id: eq.id, minutes: minutesLeftInHour });
      } else {
        if (available <= 0) {
          minEquipmentFraction = Math.min(minEquipmentFraction, 0);
        } else {
          const frac = Math.min(1, available / minutesLeftInHour);
          minEquipmentFraction = Math.min(minEquipmentFraction, frac);
          equipmentUsed.push({ id: eq.id, minutes: Math.min(available, minutesLeftInHour) });
        }
      }
    }

    const capacityFactor = Math.min(minEmployeeFraction, minEquipmentFraction);
    return { capacityFactor, employeesUsed, equipmentUsed };
  }

  commitHourWork(
    employeesUsed: { id: string; minutes: number }[],
    equipmentUsed: { id: string; minutes: number }[],
    laborVarianceMultiplier: number,
    equipmentVarianceMultiplier: number,
    employeeHourlyWageById: (id: string) => number,
    equipmentHourlyDepById: (id: string) => number,
    currentDay?: number
  ) {
    for (const e of employeesUsed) {
      const prev = this.employeeMinuteAllocated.get(e.id) ?? 0;
      this.employeeMinuteAllocated.set(e.id, prev + e.minutes);
      const wage = employeeHourlyWageById(e.id) * (e.minutes / 60);
      const cost = wage * laborVarianceMultiplier;
      
      // Accumulate labor for payroll policy
      if (currentDay != null) {
        const dailyAccrued = this.laborAccrualDaily.get(currentDay) ?? 0;
        this.laborAccrualDaily.set(currentDay, dailyAccrued + cost);
      }
      this.laborCostAccrued += cost;
      
      // Mark employee as worked in this hour
      this.employeeWorkedThisHour.add(e.id);
    }
    for (const eq of equipmentUsed) {
      this.equipmentMinuteAllocated.set(eq.id, (this.equipmentMinuteAllocated.get(eq.id) ?? 0) + eq.minutes);
      const dep = equipmentHourlyDepById(eq.id) * (eq.minutes / 60);
      this.equipmentDepreciationAccrued += dep * equipmentVarianceMultiplier;
      if (currentDay != null) {
        this.ensureDay(currentDay).nonCash.depreciation += dep * equipmentVarianceMultiplier;
      }
    }
  }

  // Hour logging methods
  beginHour(day: number, hour: number) {
    this.employeeWorkedThisHour.clear();
    if (!this.hourLogs.has(day)) this.hourLogs.set(day, []);
    this.hourLogs.get(day)!.push({ hour, chains: [] });
  }

  endHour(day: number, hour: number) {
    // nothing special for now
  }

  logOperationHour(day: number, hour: number, chainId: string, chainName: string, entry: OperationHourLog) {
    const hours = this.hourLogs.get(day);
    if (!hours) return;
    const h = hours.find(x => x.hour === hour);
    if (!h) return;
    let ch = h.chains.find(c => c.chainId === chainId);
    if (!ch) {
      ch = { chainId, chainName, ops: [] };
      h.chains.push(ch);
    }
    ch.ops.push(entry);
  }

  flushDayLogsToDaily(day: number) {
    const dayRec = this.ensureDay(day);
    const hours = this.hourLogs.get(day) ?? [];
    const dayLog: DayLog = {
      day,
      cashIn: dayRec.cashIn,
      cashOut: dayRec.cashOut,
      nonCash: dayRec.nonCash,
      hours
    };
    // Store as DayLog in the daily map
    (this.daily as any).set(day, dayLog);
    this.hourLogs.delete(day);
  }

  // Try to swap an employee to unlock an operation
  trySwapToUnlockOperation(requiredRoleIds: string[], minutesLeftInHour: number): boolean {
    for (const roleId of requiredRoleIds) {
      const candidate = [...this.employees.values()].find(
        e => e.roleIds.includes(roleId) && !this.employeeWorkedThisHour.has(e.id)
      );
      if (!candidate) continue;
      
      const allocated = this.employeeMinuteAllocated.get(candidate.id) ?? 0;
      if (allocated < minutesLeftInHour) {
        this.employeeMinuteAllocated.set(candidate.id, minutesLeftInHour);
        return true;
      }
    }
    return false;
  }

  // PERIODIC EXPENSES

  private periodToDivisor(period: PeriodicExpenseSpec['period'], s: SimulationSettings): number {
    switch (period) {
      case 'DAY': return 1;
      case 'WEEK': return 7;
      case 'MONTH': return s.monthDivisor;
      case 'QUARTER': return 3 * s.monthDivisor;
      case 'YEAR': return 12 * s.monthDivisor;
    }
  }

  getDailyPeriodicExpenseShare(exp: PeriodicExpenseSpec, s: SimulationSettings) {
    const divisor = this.periodToDivisor(exp.period, s);
    const dailyGross = exp.amount / divisor;
    const net = dailyGross / (1 + (exp.vatRate / 100));
    const vat = dailyGross - net;
    return { dailyGross, net, vat };
  }

  applyPeriodicExpensesForDay(currentDay: number, expenses: PeriodicExpenseSpec[], s: SimulationSettings) {
    if (!expenses?.length) return;
    const d = this.ensureDay(currentDay);
    for (const exp of expenses) {
      if (!exp.isActive) continue;
      const { net, vat } = this.getDailyPeriodicExpenseShare(exp, s);
      d.cashOut.periodic += net;
      d.cashOut.periodicVat += vat;
      this.cashBalance -= (net + vat);
      this.periodicNetAccrued += net;
      this.periodicVatAccrued += vat;
    }
  }

  accruePeriodicExpensesForDayOnly(expenses: PeriodicExpenseSpec[], s: SimulationSettings) {
    for (const exp of expenses) {
      if (!exp.isActive) continue;
      const { net, vat } = this.getDailyPeriodicExpenseShare(exp, s);
      this.periodicNetAccrued += net;
      this.periodicVatAccrued += vat;
    }
  }

  bookEndOfSimulationPeriodicCashOut(currentDay: number) {
    const d = this.ensureDay(currentDay);
    d.cashOut.periodic += this.periodicNetAccrued;
    d.cashOut.periodicVat += this.periodicVatAccrued;
    this.cashBalance -= (this.periodicNetAccrued + this.periodicVatAccrued);
  }

  // Payroll policy support
  private getLaborAccruedForRange(startDay: number, endDay: number): number {
    let sum = 0;
    for (let d = startDay; d <= endDay; d++) {
      sum += this.laborAccrualDaily.get(d) ?? 0;
    }
    return sum;
  }

  bookPayrollPolicyCashOut(dayIndex: number, s: SimulationSettings) {
    let range: [number, number] | null = null;
    
    switch (s.payrollPaymentPolicy) {
      case 'daily':
        range = [dayIndex, dayIndex];
        break;
      case 'weekly':
        if (dayIndex % 7 === 0) {
          range = [Math.max(1, dayIndex - 6), dayIndex];
        }
        break;
      case 'biweekly':
        if (dayIndex % 14 === 0) {
          range = [Math.max(1, dayIndex - 13), dayIndex];
        }
        break;
      case 'monthly':
        if (dayIndex % s.monthDivisor === 0) {
          range = [Math.max(1, dayIndex - (s.monthDivisor - 1)), dayIndex];
        }
        break;
    }

    if (range) {
      const amount = this.getLaborAccruedForRange(range[0], range[1]);
      if (amount > 0) {
        const d = this.ensureDay(dayIndex);
        d.cashOut.labor += amount;
        this.cashBalance -= amount;
      }
    }
  }

  bookEndOfDayPayments(dayIndex: number, s: SimulationSettings) {
    // Depreciation as cash (if policy=daily)
    if (s.depreciationCashPolicy === 'daily') {
      const dep = this.ensureDay(dayIndex).nonCash.depreciation;
      this.cashBalance -= dep;
    }
    // Note: Labor is now handled by bookPayrollPolicyCashOut
  }

  creditClientInflow(currentDay: number, amount: number) {
    const d = this.ensureDay(currentDay);
    d.cashIn += amount;
    this.cashBalance += amount;
  }
}
