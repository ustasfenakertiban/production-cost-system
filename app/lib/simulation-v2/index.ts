/**
 * Точка входа для симуляции v2
 * Экспортирует главную функцию запуска симуляции с ООП архитектурой
 */

import { SimulationParameters, SimulationResult } from "./types";
import { loadSimulationData, loadSimulationSettingsV2 } from "./dataLoader";
import { SimulationEngine } from "./SimulationEngine";

/**
 * Запустить симуляцию производства (v2)
 * 
 * @param parameters - Параметры симуляции (без настроек)
 * @returns Результат симуляции
 */
export async function runSimulation(
  params: Omit<SimulationParameters, "settings">
): Promise<SimulationResult> {
  try {
    console.log("🚀 Запуск симуляции v2 (ООП)");
    
    // Загрузить настройки v2 из БД для конкретного заказа
    const settings = await loadSimulationSettingsV2(params.orderId);
    
    // Создать полные параметры
    const parameters: SimulationParameters = {
      ...params,
      settings,
    };
    
    // Загрузить все данные из БД
    console.log("📊 Загрузка данных из базы...");
    const data = await loadSimulationData(parameters.processId);
    
    console.log(`✅ Загружено:`);
    console.log(`  - Материалов: ${data.materials.length}`);
    console.log(`  - Оборудования: ${data.equipment.length}`);
    console.log(`  - Ролей: ${data.roles.length}`);
    console.log(`  - Сотрудников: ${data.employees.length}`);
    console.log(`  - Цепочек операций: ${data.chains.length}`);
    
    // Создать движок симуляции
    const engine = new SimulationEngine();
    
    // Инициализировать
    console.log("⚙️ Инициализация движка симуляции...");
    await engine.initialize(parameters, data);
    
    // Запустить симуляцию
    console.log("▶️ Запуск симуляции...");
    const result = await engine.run();
    
    console.log("✅ Симуляция v2 завершена успешно");
    console.log(`  - Общее время: ${(result.totalDuration ?? 0).toFixed(2)} часов`);
    console.log(`  - Общая стоимость: ${(result.totalCost ?? 0).toFixed(2)}`);
    console.log(`  - Материалы: ${(result.totalMaterialCost ?? 0).toFixed(2)}`);
    console.log(`  - Оборудование: ${(result.totalEquipmentCost ?? 0).toFixed(2)}`);
    console.log(`  - Персонал: ${(result.totalLaborCost ?? 0).toFixed(2)}`);
    
    return result;
  } catch (error) {
    console.error("❌ Ошибка в симуляции v2:", error);
    throw error;
  }
}

export * from "./types";
