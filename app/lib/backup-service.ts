
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

export interface BackupMetadata {
  timestamp: string;
  reason: 'manual' | 'auto' | 'before_restore';
  version: string;
}

export interface BackupData {
  metadata: BackupMetadata;
  users?: any[];
  accounts?: any[];
  sessions?: any[];
  materialCategories?: any[];
  materials?: any[];
  equipment?: any[];
  employeeRoles?: any[];
  products?: any[];
  recurringExpenses?: any[];
  productionProcesses?: any[];
  operationChains?: any[];
  productionOperations?: any[];
  orders?: any[];
  orderItems?: any[];
  operationTemplates?: any[];
}

export interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  created: Date;
  metadata?: BackupMetadata;
}

const BACKUP_DIR = path.join(process.cwd(), '..', 'backups');

// Убедимся, что папка для бэкапов существует
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

export async function createBackup(reason: 'manual' | 'auto' | 'before_restore' = 'manual'): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  const filename = `backup_${reason}_${timestamp}.json`;
  const filepath = path.join(BACKUP_DIR, filename);

  const backupData: BackupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      reason,
      version: '1.0'
    }
  };

  // Экспортируем все данные
  const users = await prisma.user.findMany();
  if (users.length > 0) backupData.users = users;

  const accounts = await prisma.account.findMany();
  if (accounts.length > 0) backupData.accounts = accounts;

  const sessions = await prisma.session.findMany();
  if (sessions.length > 0) backupData.sessions = sessions;

  const materialCategories = await prisma.materialCategory.findMany();
  if (materialCategories.length > 0) backupData.materialCategories = materialCategories;

  const materials = await prisma.material.findMany();
  if (materials.length > 0) backupData.materials = materials;

  const equipment = await prisma.equipment.findMany();
  if (equipment.length > 0) backupData.equipment = equipment;

  const employeeRoles = await prisma.employeeRole.findMany();
  if (employeeRoles.length > 0) backupData.employeeRoles = employeeRoles;

  const products = await prisma.product.findMany();
  if (products.length > 0) backupData.products = products;

  const recurringExpenses = await prisma.recurringExpense.findMany();
  if (recurringExpenses.length > 0) backupData.recurringExpenses = recurringExpenses;

  const productionProcesses = await prisma.productionProcess.findMany();
  if (productionProcesses.length > 0) backupData.productionProcesses = productionProcesses;

  const operationChains = await prisma.operationChain.findMany();
  if (operationChains.length > 0) backupData.operationChains = operationChains;

  const productionOperations = await prisma.productionOperation.findMany({
    include: {
      operationMaterials: true,
      operationEquipment: true,
      operationRoles: true
    }
  });
  if (productionOperations.length > 0) backupData.productionOperations = productionOperations;

  const orders = await prisma.order.findMany();
  if (orders.length > 0) backupData.orders = orders;

  const orderItems = await prisma.orderItem.findMany();
  if (orderItems.length > 0) backupData.orderItems = orderItems;

  const operationTemplates = await prisma.operationTemplate.findMany({
    include: {
      materials: true,
      equipment: true,
      roles: true
    }
  });
  if (operationTemplates.length > 0) backupData.operationTemplates = operationTemplates;

  // Сохраняем бэкап
  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

  // Удаляем старые бэкапы, оставляем последние 20
  cleanupOldBackups(20);

  return filename;
}

export function listBackups(): BackupInfo[] {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
    .map(filename => {
      const filepath = path.join(BACKUP_DIR, filename);
      const stats = fs.statSync(filepath);
      
      let metadata: BackupMetadata | undefined;
      try {
        const content = fs.readFileSync(filepath, 'utf8');
        const data = JSON.parse(content);
        metadata = data.metadata;
      } catch (e) {
        // Ignore parsing errors
      }

      return {
        filename,
        path: filepath,
        size: stats.size,
        created: stats.mtime,
        metadata
      };
    })
    .sort((a, b) => b.created.getTime() - a.created.getTime());

  return files;
}

export function getBackupPath(filename: string): string {
  return path.join(BACKUP_DIR, filename);
}

export function deleteBackup(filename: string): boolean {
  const filepath = path.join(BACKUP_DIR, filename);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
    return true;
  }
  return false;
}

function cleanupOldBackups(keepCount: number) {
  const backups = listBackups();
  if (backups.length > keepCount) {
    const toDelete = backups.slice(keepCount);
    toDelete.forEach(backup => {
      fs.unlinkSync(backup.path);
    });
  }
}

export async function restoreFromBackup(filename: string): Promise<void> {
  const filepath = path.join(BACKUP_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    throw new Error(`Бэкап не найден: ${filename}`);
  }

  const backupData: BackupData = JSON.parse(fs.readFileSync(filepath, 'utf8'));

  // Создаем бэкап перед восстановлением
  await createBackup('before_restore');

  // Удаляем текущие данные
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.operationRole.deleteMany({});
  await prisma.operationMaterial.deleteMany({});
  await prisma.operationEquipment.deleteMany({});
  await prisma.productionOperation.deleteMany({});
  await prisma.operationChain.deleteMany({});
  await prisma.productionProcess.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.recurringExpense.deleteMany({});
  await prisma.employeeRole.deleteMany({});
  await prisma.material.deleteMany({});
  await prisma.materialCategory.deleteMany({});
  await prisma.equipment.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  // Восстанавливаем данные
  if (backupData.users) {
    for (const user of backupData.users) {
      await prisma.user.create({ data: user });
    }
  }

  if (backupData.accounts) {
    for (const account of backupData.accounts) {
      await prisma.account.create({ data: account });
    }
  }

  if (backupData.sessions) {
    for (const session of backupData.sessions) {
      await prisma.session.create({ data: session });
    }
  }

  if (backupData.materialCategories) {
    for (const category of backupData.materialCategories) {
      await prisma.materialCategory.create({ data: category });
    }
  }

  if (backupData.materials) {
    for (const material of backupData.materials) {
      await prisma.material.create({ data: material });
    }
  }

  if (backupData.equipment) {
    for (const equip of backupData.equipment) {
      await prisma.equipment.create({ data: equip });
    }
  }

  if (backupData.employeeRoles) {
    for (const role of backupData.employeeRoles) {
      await prisma.employeeRole.create({ data: role });
    }
  }

  if (backupData.recurringExpenses) {
    for (const expense of backupData.recurringExpenses) {
      await prisma.recurringExpense.create({ data: expense });
    }
  }

  if (backupData.products) {
    for (const product of backupData.products) {
      await prisma.product.create({ data: product });
    }
  }

  if (backupData.productionProcesses) {
    for (const process of backupData.productionProcesses) {
      await prisma.productionProcess.create({ data: process });
    }
  }

  if (backupData.operationChains) {
    for (const chain of backupData.operationChains) {
      await prisma.operationChain.create({ data: chain });
    }
  }

  if (backupData.productionOperations) {
    for (const operation of backupData.productionOperations) {
      const { operationMaterials, operationEquipment, operationRoles, ...operationData } = operation;
      await prisma.productionOperation.create({ data: operationData });
    }

    for (const operation of backupData.productionOperations) {
      if (operation.operationMaterials) {
        for (const om of operation.operationMaterials) {
          await prisma.operationMaterial.create({ data: om });
        }
      }

      if (operation.operationEquipment) {
        for (const oe of operation.operationEquipment) {
          await prisma.operationEquipment.create({ data: oe });
        }
      }

      if (operation.operationRoles) {
        for (const or of operation.operationRoles) {
          await prisma.operationRole.create({ data: or });
        }
      }
    }
  }

  if (backupData.orders) {
    for (const order of backupData.orders) {
      await prisma.order.create({ data: order });
    }
  }

  if (backupData.orderItems) {
    for (const orderItem of backupData.orderItems) {
      await prisma.orderItem.create({ data: orderItem });
    }
  }
}
