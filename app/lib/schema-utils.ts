
import { prisma } from './db';
import * as crypto from 'crypto';

export interface SchemaInfo {
  hash: string;
  tables: string[];
  version: string;
}

/**
 * Получает информацию о текущей схеме базы данных
 */
export async function getCurrentSchemaInfo(): Promise<SchemaInfo> {
  try {
    // Получаем список всех таблиц
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;

    const tableNames = tables.map(t => t.tablename);

    // Получаем структуру каждой таблицы
    const tableStructures: Record<string, any[]> = {};
    
    for (const tableName of tableNames) {
      try {
        const columns = await prisma.$queryRawUnsafe<Array<{
          column_name: string;
          data_type: string;
          is_nullable: string;
        }>>(
          `SELECT column_name, data_type, is_nullable 
           FROM information_schema.columns 
           WHERE table_schema = 'public' AND table_name = $1
           ORDER BY ordinal_position`,
          tableName
        );
        tableStructures[tableName] = columns;
      } catch (error) {
        console.warn(`Could not fetch columns for table ${tableName}:`, error);
      }
    }

    // Создаем хэш на основе структуры
    const schemaString = JSON.stringify(tableStructures, null, 0);
    const hash = crypto.createHash('sha256').update(schemaString).digest('hex');

    return {
      hash,
      tables: tableNames,
      version: '1.0'
    };
  } catch (error) {
    console.error('Error getting schema info:', error);
    // Возвращаем дефолтную информацию в случае ошибки
    return {
      hash: 'unknown',
      tables: [],
      version: '1.0'
    };
  }
}

/**
 * Сравнивает два хэша схемы и возвращает результат проверки совместимости
 */
export async function checkSchemaCompatibility(
  backupSchemaHash: string | null
): Promise<{
  compatible: boolean;
  currentHash: string;
  backupHash: string;
  warning?: string;
}> {
  const currentSchemaInfo = await getCurrentSchemaInfo();

  // Если у бэкапа нет хэша (старый бэкап), считаем его условно совместимым
  if (!backupSchemaHash || backupSchemaHash === 'unknown') {
    return {
      compatible: true,
      currentHash: currentSchemaInfo.hash,
      backupHash: backupSchemaHash || 'unknown',
      warning: 'Бэкап не содержит информацию о схеме. Восстановление может привести к ошибкам.'
    };
  }

  const compatible = currentSchemaInfo.hash === backupSchemaHash;

  return {
    compatible,
    currentHash: currentSchemaInfo.hash,
    backupHash: backupSchemaHash,
    warning: compatible
      ? undefined
      : 'Схема базы данных изменилась с момента создания бэкапа. Восстановление может привести к потере данных или ошибкам.'
  };
}
