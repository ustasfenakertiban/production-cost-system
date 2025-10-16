
/**
 * Менеджер ресурсов - управляет материалами, оборудованием и сотрудниками
 */

import {
  MaterialInfo,
  EquipmentInfo,
  EmployeeInfo,
  EmployeeRoleInfo,
  MaterialStock,
  EmployeeState,
  EquipmentState,
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
  
  constructor() {}
  
  // ==================== Инициализация ====================
  
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
        busyUntil: new Date(0),
        idleHours: 0,
        workHours: 0,
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
   * Закупить материал
   */
  purchaseMaterial(materialId: string, quantity: number): void {
    const material = this.materials.get(materialId);
    const stock = this.materialStocks.get(materialId);
    
    if (!material || !stock) {
      throw new Error(`Material ${materialId} not found`);
    }
    
    // Округлить количество до целых партий
    const batchSize = material.batchSize || 1;
    const batches = Math.ceil(quantity / batchSize);
    const actualQuantity = batches * batchSize;
    
    stock.quantity += actualQuantity;
    stock.totalPurchased += actualQuantity;
    stock.totalCost += actualQuantity * material.cost;
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
   * Занять сотрудника
   */
  occupyEmployee(
    employeeId: string,
    operationId: string,
    fromTime: Date,
    duration: number
  ): Date {
    const state = this.employeeStates.get(employeeId);
    
    if (!state) {
      throw new Error(`Employee ${employeeId} not found`);
    }
    
    const startTime = state.busyUntil > fromTime ? state.busyUntil : fromTime;
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
    
    state.currentOperationId = operationId;
    state.busyUntil = endTime;
    state.workHours += duration;
    
    return endTime;
  }
  
  /**
   * Освободить сотрудника
   */
  releaseEmployee(employeeId: string): void {
    const state = this.employeeStates.get(employeeId);
    if (state) {
      state.currentOperationId = undefined;
    }
  }
  
  /**
   * Добавить время простоя сотруднику
   */
  addEmployeeIdleTime(employeeId: string, hours: number): void {
    const state = this.employeeStates.get(employeeId);
    if (state) {
      state.idleHours += hours;
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
