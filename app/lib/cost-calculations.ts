
// Утилиты для расчета стоимости операций и цепочек

interface OperationMaterial {
  id: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  variance?: number;
  enabled: boolean;
  material: {
    vatPercentage: number;
  };
}

interface OperationEquipment {
  id: string;
  machineTime: number;
  hourlyRate: number;
  totalCost: number;
  variance?: number;
  enabled: boolean;
}

interface OperationRole {
  id: string;
  timeSpent: number;
  rate: number;
  totalCost: number;
  variance?: number;
  enabled: boolean;
}

interface Operation {
  id: string;
  name: string;
  enabled: boolean;
  operationMaterials?: OperationMaterial[];
  operationEquipment?: OperationEquipment[];
  operationRoles?: OperationRole[];
}

interface OperationCosts {
  materials: number;
  equipment: number;
  roles: number;
  vat: number;
  total: number;
  materialsPercent: number;
  equipmentPercent: number;
  rolesPercent: number;
}

interface ChainCosts extends OperationCosts {
  operations: Array<{
    id: string;
    name: string;
    costs: OperationCosts;
    enabled: boolean;
  }>;
}

export function calculateOperationCosts(operation: Operation): OperationCosts {
  let materialsCost = 0;
  let equipmentCost = 0;
  let rolesCost = 0;
  let vatAmount = 0;

  // Расчет стоимости материалов
  (operation.operationMaterials || [])
    .filter(m => m.enabled)
    .forEach(material => {
      const cost = material.totalCost;
      materialsCost += cost;
      
      // Расчет НДС для материалов
      const vatRate = material.material.vatPercentage / 100;
      const vatForMaterial = cost * vatRate;
      vatAmount += vatForMaterial;
    });

  // Расчет стоимости оборудования
  equipmentCost = (operation.operationEquipment || [])
    .filter(e => e.enabled)
    .reduce((sum, equipment) => sum + equipment.totalCost, 0);

  // Расчет стоимости ролей
  rolesCost = (operation.operationRoles || [])
    .filter(r => r.enabled)
    .reduce((sum, role) => sum + role.totalCost, 0);

  const total = materialsCost + equipmentCost + rolesCost + vatAmount;

  return {
    materials: materialsCost,
    equipment: equipmentCost,
    roles: rolesCost,
    vat: vatAmount,
    total,
    materialsPercent: total > 0 ? (materialsCost / (total - vatAmount)) * 100 : 0,
    equipmentPercent: total > 0 ? (equipmentCost / (total - vatAmount)) * 100 : 0,
    rolesPercent: total > 0 ? (rolesCost / (total - vatAmount)) * 100 : 0,
  };
}

export function calculateChainCosts(operations: Operation[]): ChainCosts {
  let totalMaterials = 0;
  let totalEquipment = 0;
  let totalRoles = 0;
  let totalVat = 0;

  const operationsWithCosts = operations.map(operation => {
    const costs = calculateOperationCosts(operation);
    
    if (operation.enabled) {
      totalMaterials += costs.materials;
      totalEquipment += costs.equipment;
      totalRoles += costs.roles;
      totalVat += costs.vat;
    }

    return {
      id: operation.id,
      name: operation.name,
      costs,
      enabled: operation.enabled,
    };
  });

  const total = totalMaterials + totalEquipment + totalRoles + totalVat;
  const subtotal = total - totalVat;

  return {
    materials: totalMaterials,
    equipment: totalEquipment,
    roles: totalRoles,
    vat: totalVat,
    total,
    materialsPercent: subtotal > 0 ? (totalMaterials / subtotal) * 100 : 0,
    equipmentPercent: subtotal > 0 ? (totalEquipment / subtotal) * 100 : 0,
    rolesPercent: subtotal > 0 ? (totalRoles / subtotal) * 100 : 0,
    operations: operationsWithCosts,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(percent: number): string {
  return `${percent.toFixed(1)}%`;
}
