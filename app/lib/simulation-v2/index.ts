
/**
 * Точка входа для симуляции производства v2
 * Экспорт всех классов и функций
 */

export { SimulationEngine } from "./SimulationEngine";
export { ResourceManager } from "./ResourceManager";
export { Operation } from "./Operation";
export { OperationChain } from "./OperationChain";

export * from "./types";
export * from "./dataLoader";

/**
 * Главная функция для запуска симуляции
 */
export async function runSimulation(parameters: import("./types").SimulationParameters) {
  const { SimulationEngine } = await import("./SimulationEngine");
  const { loadSimulationData } = await import("./dataLoader");
  
  const engine = new SimulationEngine();
  
  // Инициализировать
  await engine.initialize(parameters);
  
  // Загрузить данные
  const data = await loadSimulationData(parameters.processId);
  
  // TODO: Передать данные в движок
  
  // Запустить симуляцию
  const result = await engine.run();
  
  return result;
}
