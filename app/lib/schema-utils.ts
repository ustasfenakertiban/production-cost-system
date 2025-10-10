
import { prisma } from './db';
import * as crypto from 'crypto';
import * as fs from 'fs';

export interface SchemaInfo {
  hash: string;
  tables: string[];
  version: string;
}

export interface BackupTypeInfo {
  type: 'data-only' | 'full';
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
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
 * Определяет тип бэкапа по содержимому файла
 */
export function detectBackupTypeFromContent(filePath: string): BackupTypeInfo {
  try {
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return {
        type: 'data-only',
        confidence: 'low',
        indicators: ['Файл не найден']
      };
    }

    // Читаем файл
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    
    // Обработка JSON файлов
    if (fileExtension === 'json') {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        // Проверяем наличие поля backupType
        if (data.backupType) {
          return {
            type: data.backupType,
            confidence: 'high',
            indicators: [`Указан тип в JSON: ${data.backupType}`]
          };
        }
        
        // JSON бэкапы обычно содержат только данные
        return {
          type: 'data-only',
          confidence: 'high',
          indicators: ['JSON формат (только данные)']
        };
      } catch (error) {
        return {
          type: 'data-only',
          confidence: 'low',
          indicators: ['Ошибка парсинга JSON']
        };
      }
    }

    // Обработка SQL файлов
    if (fileExtension === 'sql') {
      // Читаем первые 50KB файла для анализа
      const buffer = Buffer.alloc(50 * 1024);
      const fd = fs.openSync(filePath, 'r');
      const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
      fs.closeSync(fd);
      
      const content = buffer.toString('utf-8', 0, bytesRead).toUpperCase();
      
      const indicators: string[] = [];
      let hasSchemaCommands = false;
      let hasDataCommands = false;
      
      // Проверяем наличие команд создания структуры
      if (content.includes('CREATE TABLE')) {
        indicators.push('CREATE TABLE');
        hasSchemaCommands = true;
      }
      if (content.includes('CREATE SEQUENCE')) {
        indicators.push('CREATE SEQUENCE');
        hasSchemaCommands = true;
      }
      if (content.includes('CREATE INDEX')) {
        indicators.push('CREATE INDEX');
        hasSchemaCommands = true;
      }
      if (content.includes('CREATE SCHEMA')) {
        indicators.push('CREATE SCHEMA');
        hasSchemaCommands = true;
      }
      if (content.includes('ALTER TABLE')) {
        indicators.push('ALTER TABLE');
        hasSchemaCommands = true;
      }
      
      // Проверяем наличие команд данных
      if (content.includes('COPY ') && content.includes(' FROM STDIN')) {
        indicators.push('COPY ... FROM STDIN');
        hasDataCommands = true;
      }
      if (content.includes('INSERT INTO')) {
        indicators.push('INSERT INTO');
        hasDataCommands = true;
      }
      
      // Проверяем комментарии pg_dump
      if (content.includes('-- POSTGRESQL DATABASE DUMP')) {
        indicators.push('pg_dump заголовок');
      }
      if (content.includes('--DATA-ONLY')) {
        indicators.push('--data-only флаг');
        return {
          type: 'data-only',
          confidence: 'high',
          indicators
        };
      }
      if (content.includes('--SCHEMA-ONLY')) {
        indicators.push('--schema-only флаг');
        return {
          type: 'full',
          confidence: 'high',
          indicators
        };
      }
      
      // Определяем тип на основе найденных команд
      if (hasSchemaCommands && hasDataCommands) {
        return {
          type: 'full',
          confidence: 'high',
          indicators: ['Структура + Данные', ...indicators]
        };
      } else if (hasSchemaCommands && !hasDataCommands) {
        return {
          type: 'full',
          confidence: 'medium',
          indicators: ['Только структура (схема)', ...indicators]
        };
      } else if (!hasSchemaCommands && hasDataCommands) {
        return {
          type: 'data-only',
          confidence: 'high',
          indicators: ['Только данные', ...indicators]
        };
      }
      
      // Если ничего не нашли, проверяем размер файла
      const stats = fs.statSync(filePath);
      if (stats.size < 1000) {
        return {
          type: 'data-only',
          confidence: 'low',
          indicators: ['Малый размер файла', ...indicators]
        };
      }
      
      // По умолчанию считаем data-only
      return {
        type: 'data-only',
        confidence: 'medium',
        indicators: ['Не найдено явных индикаторов', ...indicators]
      };
    }

    // Неизвестный формат
    return {
      type: 'data-only',
      confidence: 'low',
      indicators: [`Неизвестный формат: ${fileExtension}`]
    };
  } catch (error: any) {
    console.error('[detectBackupType] Error:', error);
    return {
      type: 'data-only',
      confidence: 'low',
      indicators: [`Ошибка чтения: ${error.message}`]
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
