
/**
 * Менеджер ресурсов - управляет материалами, оборудованием и сотрудниками
 * Версия 2 с поддержкой закупки материалов, управления сотрудниками и параллельного выполнения
 */

import {
  MaterialInfo,
  EquipmentInfo,
  EmployeeInfo,
  EmployeeRoleInfo,
  MaterialStock,
  EmployeeState,
  EquipmentState,
  MaterialPurchaseBatch,
  SimulationSettingsV2,
} from "./types";

export class ResourceManager {
  // Справочники ресурсов
  private materials: Map<string, MaterialInfo> = new Map();
  private equipment: Map<string, EquipmentInfo> = new Map();
  private roles: Map<string, EmployeeRoleInfo> = new Map();
  private employees: Map<string, EmployeeInfo> = new Map();
  
  // Состояние ресурсов
  private materialStocks: Map<string, MaterialStock> = new Map();
  private employeeStates: Map<string, EmployeeState> = new Map();
  private equipmentStates: Map<string, EquipmentState> = new Map();
  
  // Настройки симуляции
  private settings?: SimulationSettingsV2;
  
  constructor() {}
  
  // ==================== Инициализация ====================
  
  /**
   * Установить настройки симуляции
   */
  setSettings(settings: SimulationSettingsV2): void {
    this.settings = settings;
  }
  
  /**
   * Загрузить информацию о материалах
   */
  loadMaterials(materials: MaterialInfo[]): void {
    materials.forEach(m => {
      this.materials.set(m.id, m);
      // Инициализировать запас материала
      this.materialStocks.set(m.id, {
        materialId: m.id,
        quantity: 0,
        minStock: (m.batchSize || 0) * (m.minStockPercentage || 0) / 100,
        totalPurchased: 0,
        totalCost: 0,
        pendingBatches: [],
      });
    });
  }
  
  /**
   * Загрузить информацию об оборудовании
   */
  loadEquipment(equipment: EquipmentInfo[]): void {
    equipment.forEach(e => {
      this.equipment.set(e.id, e);
      // Инициализировать состояние оборудования
      this.equipmentStates.set(e.id, {
        equipmentId: e.id,
        busyUntil: new Date(0),
        idleHours: 0,
        workHours: 0,
      });
    });
  }
  
  /**
   * Загрузить информацию о ролях
   */
  loadRoles(roles: EmployeeRoleInfo[]): void {
    roles.forEach(r => this.roles.set(r.id, r));
  }
  
  /**
   * Загрузить информацию о сотрудниках
   */
  loadEmployees(employees: EmployeeInfo[]): void {
    employees.forEach(e => {
      this.employees.set(e.id, e);
      // Инициализировать состояние сотрудника
      this.employeeStates.set(e.id, {
        employeeId: e.id,
        name: e.name,
        roles: e.roles,
        busyUntil: new Date(0),
        idleMinutes: 0,
        workHours: 0,
        paidIdleHours: 0,
      });
    });
  }
  
  // ==================== Материалы ====================
  
  /**
   * Проверить доступность материала
   */
  checkMaterialAvailability(materialId: string, required: number): boolean {
    const stock = this.materialStocks.get(materialId);
    if (!stock) return false;
    
    const available = stock.quantity - stock.minStock;
    return available >= required;
  }
  
  /**
   * Заказать материал (создать партию закупки)
   * Возвращает дату поступления материала
   */
  orderMaterial(materialId: string, quantity: number, currentTime: Date): Date {
    const material = this.materials.get(materialId);
    const stock = this.materialStocks.get(materialId);
    
    if (!material || !stock) {
      throw new Error(`Material ${materialId} not found`);
    }
    
    // Округлить количество до целых партий
    const batchSize = material.batchSize || 1;
    const batches = Math.ceil(quantity / batchSize);
    const actualQuantity = batches * batchSize;
    
    // Рассчитать стоимость
    const pricePerUnit = material.cost;
    const totalCost = actualQuantity * pricePerUnit;
    const prepaymentPercentage = material.prepaymentPercentage || 0;
    const prepaymentPaid = totalCost * prepaymentPercentage / 100;
    const remainingAmount = totalCost - prepaymentPaid;
    
    // Рассчитать даты
    const manufacturingDays = material.manufacturingDays || 0;
    const deliveryDays = material.deliveryDays || 0;
    const totalDays = manufacturingDays + deliveryDays;
    
    const deliveryDate = new Date(currentTime);
    deliveryDate.setDate(deliveryDate.getDate() + totalDays);
    
    // Создать партию закупки
    const batch: MaterialPurchaseBatch = {
      materialId,
      quantity: actualQuantity,
      pricePerUnit,
      totalCost,
      prepaymentPercentage,
      prepaymentPaid,
      remainingAmount,
      manufacturingDay: manufacturingDays,
      deliveryDay: Math.ceil((deliveryDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24)),
      status: manufacturingDays > 0 ? "manufacturing" : "in_transit",
      orderedAt: currentTime,
      deliveryDate,
    };
    
    stock.pendingBatches.push(batch);
    
    return deliveryDate;
  }
  
  /**
   * Проверить и обработать поступившие партии материалов
   */
  processIncomingMaterials(currentTime: Date): void {
    for (const stock of this.materialStocks.values()) {
      // Найти партии, которые уже должны поступить
      const deliveredBatches = stock.pendingBatches.filter(
        batch => batch.deliveryDate <= currentTime && batch.status !== "delivered"
      );
      
      for (const batch of deliveredBatches) {
        // Добавить материал на склад
        stock.quantity += batch.quantity;
        stock.totalPurchased += batch.quantity;
        stock.totalCost += batch.totalCost;
        
        // Обновить статус
        batch.status = "delivered";
      }
      
      // Удалить доставленные партии из списка ожидающих
      stock.pendingBatches = stock.pendingBatches.filter(
        batch => batch.status !== "delivered"
      );
    }
  }
  
  /**
   * Использовать материал
   */
  consumeMaterial(materialId: string, quantity: number): void {
    const stock = this.materialStocks.get(materialId);
    
    if (!stock) {
      throw new Error(`Material ${materialId} not found`);
    }
    
    if (stock.quantity - quantity < stock.minStock) {
      throw new Error(
        `Insufficient material ${materialId}: available ${stock.quantity - stock.minStock}, required ${quantity}`
      );
    }
    
    stock.quantity -= quantity;
  }
  
  /**
   * Получить текущий запас материала
   */
  getMaterialStock(materialId: string): MaterialStock | undefined {
    return this.materialStocks.get(materialId);
  }
  
  /**
   * Получить все запасы материалов
   */
  getAllMaterialStocks(): MaterialStock[] {
    return Array.from(this.materialStocks.values());
  }
  
  /**
   * Проверить, есть ли ожидающие партии материалов
   */
  hasPendingMaterialBatches(): boolean {
    for (const stock of this.materialStocks.values()) {
      if (stock.pendingBatches.length > 0) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Получить ближайшую дату поступления материалов
   */
  getNextMaterialDeliveryDate(): Date | null {
    let nextDate: Date | null = null;
    
    for (const stock of this.materialStocks.values()) {
      for (const batch of stock.pendingBatches) {
        if (!nextDate || batch.deliveryDate < nextDate) {
          nextDate = batch.deliveryDate;
        }
      }
    }
    
    return nextDate;
  }
  
  // ==================== Оборудование ====================
  
  /**
   * Найти свободное оборудование
   */
  findAvailableEquipment(equipmentId: string, fromTime: Date): EquipmentState | null {
    const state = this.equipmentStates.get(equipmentId);
    
    if (!state) return null;
    if (state.busyUntil <= fromTime) return state;
    
    return null;
  }
  
  /**
   * Занять оборудование
   */
  occupyEquipment(
    equipmentId: string,
    operationId: string,
    fromTime: Date,
    duration: number
  ): Date {
    const state = this.equipmentStates.get(equipmentId);
    
    if (!state) {
      throw new Error(`Equipment ${equipmentId} not found`);
    }
    
    const startTime = state.busyUntil > fromTime ? state.busyUntil : fromTime;
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    
    state.currentOperationId = operationId;
    state.busyUntil = endTime;
    state.workHours += duration;
    
    return endTime;
  }
  
  /**
   * Освободить оборудование
   */
  releaseEquipment(equipmentId: string): void {
    const state = this.equipmentStates.get(equipmentId);
    if (state) {
      state.currentOperationId = undefined;
    }
  }
  
  /**
   * Получить состояние оборудования
   */
  getEquipmentState(equipmentId: string): EquipmentState | undefined {
    return this.equipmentStates.get(equipmentId);
  }
  
  /**
   * Получить все состояния оборудования
   */
  getAllEquipmentStates(): EquipmentState[] {
    return Array.from(this.equipmentStates.values());
  }
  
  // ==================== Сотрудники ====================
  
  /**
   * Найти свободного сотрудника с нужной ролью
   * Берем первого попавшегося, если он занят то второго и т.д.
   */
  findAvailableEmployee(roleId: string, fromTime: Date): EmployeeState | null {
    // Найти всех сотрудников с нужной ролью
    const availableEmployees: EmployeeState[] = [];
    
    for (const [empId, empInfo] of this.employees.entries()) {
      if (empInfo.roles.includes(roleId)) {
        const state = this.employeeStates.get(empId);
        if (state && state.busyUntil <= fromTime) {
          availableEmployees.push(state);
        }
      }
    }
    
    // Вернуть первого свободного
    return availableEmployees.length > 0 ? availableEmployees[0] : null;
  }
  
  /**
   * Проверить, есть ли хотя бы один сотрудник с нужной ролью
   */
  hasEmployeeWithRole(roleId: string): boolean {
    for (const empInfo of this.employees.values()) {
      if (empInfo.roles.includes(roleId)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Занять сотрудника
   * Если оплата простоя включена, накапливаем минуты простоя
   */
  occupyEmployee(
    employeeId: string,
    roleId: string,
    operationId: string,
    fromTime: Date,
    durationHours: number
  ): Date {
    const state = this.employeeStates.get(employeeId);
    
    if (!state) {
      throw new Error(`Employee ${employeeId} not found`);
    }
    
    const startTime = state.busyUntil > fromTime ? state.busyUntil : fromTime;
    
    // Если сотрудник был занят и есть пробел во времени, это простой
    if (state.busyUntil < fromTime && this.settings?.payEmployeesForIdleTime) {
      const idleMinutes = (fromTime.getTime() - state.busyUntil.getTime()) / (1000 * 60);
      state.idleMinutes += idleMinutes;
      
      // Проверить, нужно ли оплатить простой (> 10 минут)
      if (state.idleMinutes >= (this.settings.minIdleMinutesForPayment || 10)) {
        // Округлить до часа и добавить к оплаченным часам простоя
        const idleHours = Math.ceil(state.idleMinutes / 60);
        state.paidIdleHours += idleHours;
        state.idleMinutes = 0; // Сбросить накопленные минуты
      }
    }
    
    const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);
    
    state.currentOperationId = operationId;
    state.currentRoleId = roleId;
    state.busyUntil = endTime;
    state.workHours += durationHours;
    state.lastOperationEndTime = endTime;
    
    return endTime;
  }
  
  /**
   * Освободить сотрудника
   * При смене операции - доплачиваем оставшиеся минуты до часа (если уже оплатили 40 минут)
   */
  releaseEmployee(employeeId: string, newOperationStart?: Date): void {
    const state = this.employeeStates.get(employeeId);
    if (!state) return;
    
    // Если сотрудник меняет операцию и включена оплата простоя
    if (newOperationStart && state.lastOperationEndTime && this.settings?.payEmployeesForIdleTime) {
      const lastOpEndMinutes = state.lastOperationEndTime.getMinutes();
      
      // Если последняя операция закончилась не на ровном часе
      if (lastOpEndMinutes > 0) {
        // Доплатить оставшиеся минуты до часа
        const remainingMinutes = 60 - lastOpEndMinutes;
        const additionalHours = remainingMinutes / 60;
        state.paidIdleHours += additionalHours;
      }
    }
    
    state.currentOperationId = undefined;
    state.currentRoleId = undefined;
  }
  
  /**
   * Добавить время простоя сотруднику (минуты)
   */
  addEmployeeIdleTime(employeeId: string, minutes: number): void {
    const state = this.employeeStates.get(employeeId);
    if (state) {
      state.idleMinutes += minutes;
      
      // Проверить, нужно ли оплатить простой (> 10 минут)
      if (this.settings?.payEmployeesForIdleTime && 
          state.idleMinutes >= (this.settings.minIdleMinutesForPayment || 10)) {
        // Округлить до часа и добавить к оплаченным часам простоя
        const idleHours = Math.ceil(state.idleMinutes / 60);
        state.paidIdleHours += idleHours;
        state.idleMinutes = 0; // Сбросить накопленные минуты
      }
    }
  }
  
  /**
   * Получить состояние сотрудника
   */
  getEmployeeState(employeeId: string): EmployeeState | undefined {
    return this.employeeStates.get(employeeId);
  }
  
  /**
   * Получить все состояния сотрудников
   */
  getAllEmployeeStates(): EmployeeState[] {
    return Array.from(this.employeeStates.values());
  }
  
  // ==================== Справочная информация ====================
  
  getMaterialInfo(materialId: string): MaterialInfo | undefined {
    return this.materials.get(materialId);
  }
  
  getEquipmentInfo(equipmentId: string): EquipmentInfo | undefined {
    return this.equipment.get(equipmentId);
  }
  
  getRoleInfo(roleId: string): EmployeeRoleInfo | undefined {
    return this.roles.get(roleId);
  }
  
  getEmployeeInfo(employeeId: string): EmployeeInfo | undefined {
    return this.employees.get(employeeId);
  }
}
