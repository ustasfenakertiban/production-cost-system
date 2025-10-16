/**
 * Точка входа для симуляции v2
 * Экспортирует главную функцию запуска симуляции
 */

import { SimulationParameters } from "./types";
import { loadSimulationSettings } from "./dataLoader";

/**
 * Запустить симуляцию производства (v2)
 * 
 * @param parameters - Параметры симуляции
 * @returns Результат симуляции
 */
export async function runSimulation(parameters: SimulationParameters): Promise<any> {
  try {
    // Загрузить настройки v2
    const settings = await loadSimulationSettings();
    
    // TODO: Реализовать полную логику SimulationEngine v2 с:
    // - Оптимизацией простоя ресурсов (enablePartialWork)
    // - Гибкой оплатой простоя (payIdleTime)
    // - Минимальным остатком материалов (minStockPercentage, batchSize)
    // - Улучшенным расчетом производительности
    
    console.log("⚠️ Симуляция v2 в разработке");
    
    // Временная заглушка - возвращаем уведомление о том, что v2 в разработке
    throw new Error(
      "Симуляция v2 находится в разработке. " +
      "Инфраструктура готова: dataLoader, типы, API endpoints. " +
      "Требуется завершить реализацию SimulationEngine. " +
      "Пожалуйста, используйте v1 пока идет доработка v2."
    );
  } catch (error) {
    console.error("Ошибка в симуляции v2:", error);
    throw error;
  }
}

export * from "./types";
