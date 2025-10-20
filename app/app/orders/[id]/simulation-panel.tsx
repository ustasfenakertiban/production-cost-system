
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Play, Download, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TreeLogViewer from "@/components/tree-log-viewer";
import TableLogViewer from "@/components/table-log-viewer";
import CostBreakdownChart, { OperationCostBreakdown } from "@/components/cost-breakdown-chart";
import OperationsTotalCostChart from "@/components/operations-total-cost-chart";
import OperationsLaborCostChart from "@/components/operations-labor-cost-chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeSelectionDialog } from "@/components/orders/EmployeeSelectionDialog";

interface SimulationPanelProps {
  orderId: string;
}

export type VarianceMode = 
  | "MAX" 
  | "MIN" 
  | "NONE" 
  | "RANDOM_POSITIVE" 
  | "RANDOM_FULL"
  | "MIN_PRODUCTIVITY_MAX_COSTS"
  | "RANDOM_ASYMMETRIC";

export type ProductivityAlgorithm = "BOTTLENECK" | "NOMINAL";

export type SimulationVersion = "v1" | "v2";

export interface SimulationParams {
  hoursPerDay: number;
  physicalWorkers: number;
  breakMinutesPerHour: number;
  varianceMode: VarianceMode;
  productivityAlgorithm: ProductivityAlgorithm;
}

export default function SimulationPanel({ orderId }: SimulationPanelProps) {
  const [simulationVersion, setSimulationVersion] = useState<SimulationVersion>("v2");
  const [params, setParams] = useState<SimulationParams>({
    hoursPerDay: 8,
    physicalWorkers: 5,
    breakMinutesPerHour: 15,
    varianceMode: "NONE",
    productivityAlgorithm: "BOTTLENECK",
  });
  const [simulationLog, setSimulationLog] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [operationBreakdown, setOperationBreakdown] = useState<OperationCostBreakdown[]>([]);
  const [totalCosts, setTotalCosts] = useState<{
    materials: number;
    equipment: number;
    labor: number;
    total: number;
  }>({ materials: 0, equipment: 0, labor: 0, total: 0 });
  const [isSimulating, setIsSimulating] = useState(false);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimulationLog("");
    setValidationErrors([]);
    setOperationBreakdown([]);
    setTotalCosts({ materials: 0, equipment: 0, labor: 0, total: 0 });

    try {
      const response = await fetch(`/api/orders/${orderId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.missingParams && Array.isArray(data.missingParams)) {
          setValidationErrors(data.missingParams);
          toast({
            title: "Не все параметры заполнены",
            description: `Найдено ${data.missingParams.length} проблем(ы). См. подробности ниже.`,
            variant: "destructive",
          });
        } else {
          throw new Error(data.error || "Ошибка симуляции");
        }
        return;
      }

      setSimulationLog(data.log);
      setOperationBreakdown(data.operationBreakdown || []);
      setTotalCosts(data.totalCosts || { materials: 0, equipment: 0, labor: 0, total: 0 });
      
      toast({
        title: "Симуляция завершена",
        description: "Результаты отображены ниже",
      });
    } catch (error) {
      console.error("Ошибка симуляции:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось выполнить симуляцию",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSimulateV2 = () => {
    // Открываем диалог выбора сотрудников
    setEmployeeDialogOpen(true);
  };

  const runSimulationV2WithEmployees = async (selectedEmployeeIds: string[]) => {
    setIsSimulating(true);
    setSimulationLog("");
    setValidationErrors([]);
    setOperationBreakdown([]);
    setTotalCosts({ materials: 0, equipment: 0, labor: 0, total: 0 });

    try {
      console.log('[FRONTEND] Starting simulation v2 with employees:', selectedEmployeeIds);
      
      // Сначала получим данные заказа
      console.log('[FRONTEND] Fetching order data for:', orderId);
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('[FRONTEND] Failed to load order:', errorText);
        throw new Error("Не удалось загрузить данные заказа");
      }
      const orderData = await orderResponse.json();
      console.log('[FRONTEND] Order data:', orderData);

      // Проверяем, что в заказе есть позиции
      if (!orderData.orderItems || orderData.orderItems.length === 0) {
        throw new Error("В заказе нет позиций. Добавьте хотя бы один товар.");
      }

      // Для MVP берем первую позицию заказа
      const firstItem = orderData.orderItems[0];
      console.log('[FRONTEND] First item:', firstItem);
      
      if (!firstItem.productionProcess?.id) {
        throw new Error(`Для товара "${firstItem.product?.name || 'Unknown'}" не указан технологический процесс`);
      }

      const requestBody = {
        orderId: orderId,
        orderQuantity: firstItem.quantity || 1000,
        productId: firstItem.product?.id || "unknown",
        productName: firstItem.product?.name || "Unknown",
        processId: firstItem.productionProcess.id,
        processName: firstItem.productionProcess.name || "Unknown",
        varianceMode: params.varianceMode === "NONE" ? "NORMAL" : 
                     params.varianceMode === "MAX" ? "MIN_PRODUCTIVITY_MAX_COSTS" :
                     params.varianceMode === "MIN" ? "NORMAL" :
                     params.varianceMode === "RANDOM_FULL" ? "RANDOM_ASYMMETRIC" :
                     "NORMAL",
        startDate: new Date().toISOString(),
        selectedEmployeeIds, // Список выбранных сотрудников
      };

      console.log('[FRONTEND] Sending simulation request:', requestBody);

      // Запустим симуляцию v2
      const response = await fetch(`/api/simulation-v2/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log('[FRONTEND] Response status:', response.status);
      const data = await response.json();
      console.log('[FRONTEND] Response data:', data);

      if (!response.ok) {
        console.error('[FRONTEND] Simulation failed:', data);
        throw new Error(data.error || "Ошибка симуляции v2");
      }

      // Преобразуем результат v2 в формат v1 для отображения
      const logLines: string[] = [];
      logLines.push("=== СИМУЛЯЦИЯ v2 (ООП) ===");
      logLines.push(`Заказ: ${data.orderId || 'N/A'}`);
      logLines.push(`Количество: ${data.orderQuantity || 0}`);
      logLines.push(`Общее время: ${(data.totalDuration ?? 0).toFixed(2)} часов`);
      logLines.push(`Общая стоимость: ${(data.totalCost ?? 0).toFixed(2)}`);
      logLines.push("");
      
      logLines.push("=== ОПЕРАЦИИ ===");
      for (const op of data.operations || []) {
        logLines.push(`\n[${op.chainName || 'N/A'}] ${op.operationName || 'N/A'}`);
        logLines.push(`  Порядок цепочки: ${op.chainOrder ?? 'N/A'}`);
        logLines.push(`  Порядок операции: ${op.operationOrder ?? 'N/A'}`);
        logLines.push(`  Целевое количество: ${op.targetQuantity ?? 0}`);
        logLines.push(`  Выполнено: ${op.completedQuantity ?? 0}`);
        logLines.push(`  Время: ${(op.totalHours ?? 0).toFixed(2)} часов`);
        logLines.push(`  Стоимость: ${(op.totalCost ?? 0).toFixed(2)}`);
      }

      setSimulationLog(logLines.join("\n"));
      
      // Преобразуем в формат для графиков
      const breakdown = (data.operations || []).map((op: any) => {
        const materials = (op.materialCosts || []).reduce((sum: number, m: any) => sum + (m.totalCost || 0), 0);
        const equipment = (op.equipmentCosts || []).reduce((sum: number, e: any) => sum + (e.totalCost || 0), 0);
        const labor = (op.laborCosts || []).reduce((sum: number, l: any) => sum + (l.totalCost || 0), 0);
        const totalCost = materials + equipment + labor;
        
        return {
          operationId: op.operationId || 'unknown',
          operationName: op.operationName || 'N/A',
          chainName: op.chainName || 'N/A',
          productName: firstItem.product?.name || 'N/A',
          materialCost: materials || 0,
          equipmentCost: equipment || 0,
          laborCost: labor || 0,
          totalCost: totalCost || 0,
          materialPercentage: totalCost > 0 ? (materials / totalCost) * 100 : 0,
          equipmentPercentage: totalCost > 0 ? (equipment / totalCost) * 100 : 0,
          laborPercentage: totalCost > 0 ? (labor / totalCost) * 100 : 0,
          percentageOfTotal: data.totalCost > 0 ? (totalCost / data.totalCost) * 100 : 0,
          // Для обратной совместимости с v1
          materials,
          equipment,
          labor,
        };
      });
      
      setOperationBreakdown(breakdown);
      setTotalCosts({
        materials: data.totalMaterialCost ?? 0,
        equipment: data.totalEquipmentCost ?? 0,
        labor: data.totalLaborCost ?? 0,
        total: data.totalCost ?? 0,
      });
      
      toast({
        title: "Симуляция v2 завершена",
        description: "Результаты отображены ниже",
      });
    } catch (error) {
      console.error("Ошибка симуляции v2:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось выполнить симуляцию v2",
        variant: "destructive",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDownloadLog = () => {
    if (!simulationLog) return;
    
    const blob = new Blob([simulationLog], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation_${orderId}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Симуляция выполнения заказа</CardTitle>
          <CardDescription>
            Настройте параметры и запустите симуляцию производства
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Переключатель версий симуляции */}
          <div className="space-y-2">
            <Label>Версия симуляции</Label>
            <Select
              value={simulationVersion}
              onValueChange={(value: SimulationVersion) => setSimulationVersion(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="v1">Версия 1 (классическая)</SelectItem>
                <SelectItem value="v2">Версия 2 (ООП, с выбором сотрудников) 🆕</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {simulationVersion === "v1" 
                ? "Классический алгоритм с настройками производительности и количества работников"
                : "Новый объектно-ориентированный алгоритм с выбором конкретных сотрудников"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hoursPerDay">Количество часов в рабочем дне</Label>
              <Input
                id="hoursPerDay"
                type="number"
                min="1"
                max="24"
                value={params.hoursPerDay}
                onChange={(e) =>
                  setParams({ ...params, hoursPerDay: Number(e.target.value) })
                }
              />
            </div>

            {/* Параметр "Количество физических работников" только для v1 */}
            {simulationVersion === "v1" && (
              <div className="space-y-2">
                <Label htmlFor="physicalWorkers">Количество физических работников</Label>
                <Input
                  id="physicalWorkers"
                  type="number"
                  min="1"
                  value={params.physicalWorkers}
                  onChange={(e) =>
                    setParams({ ...params, physicalWorkers: Number(e.target.value) })
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="breakMinutes">Отдых (минут в час)</Label>
              <Input
                id="breakMinutes"
                type="number"
                min="0"
                max="59"
                value={params.breakMinutesPerHour}
                onChange={(e) =>
                  setParams({
                    ...params,
                    breakMinutesPerHour: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="varianceMode">Выбор значения разброса</Label>
              <Select
                value={params.varianceMode}
                onValueChange={(value: VarianceMode) =>
                  setParams({ ...params, varianceMode: value })
                }
              >
                <SelectTrigger id="varianceMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAX">По максимуму</SelectItem>
                  <SelectItem value="MIN">По минимуму</SelectItem>
                  <SelectItem value="NONE">Без разброса</SelectItem>
                  <SelectItem value="RANDOM_POSITIVE">
                    Случайное значение 0+
                  </SelectItem>
                  <SelectItem value="RANDOM_FULL">
                    Случайное значение во всем диапазоне
                  </SelectItem>
                  <SelectItem value="MIN_PRODUCTIVITY_MAX_COSTS">
                    Производительность по минимуму, расходы по максимуму
                  </SelectItem>
                  <SelectItem value="RANDOM_ASYMMETRIC">
                    Случайные значения (расходы 0+, производительность 0-)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Алгоритм расчета производительности только для v1 */}
            {simulationVersion === "v1" && (
              <div className="space-y-2">
                <Label htmlFor="productivityAlgorithm">Алгоритм расчета производительности</Label>
                <Select
                  value={params.productivityAlgorithm}
                  onValueChange={(value: ProductivityAlgorithm) =>
                    setParams({ ...params, productivityAlgorithm: value })
                  }
                >
                  <SelectTrigger id="productivityAlgorithm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOTTLENECK">
                      Бутылочное горлышко
                    </SelectItem>
                    <SelectItem value="NOMINAL">
                      По номиналу
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {params.productivityAlgorithm === "BOTTLENECK" 
                    ? "Производительность ограничивается самым медленным ресурсом (оборудование, работники, номинал)"
                    : "Используется только номинальная производительность операции. Производительность оборудования учитывается только для амортизации, работников - только для зарплаты"}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {simulationVersion === "v1" ? (
              <Button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="flex-1"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Выполняется симуляция...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Запустить симуляцию
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSimulateV2}
                disabled={isSimulating}
                className="flex-1"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Выполняется симуляция...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Запустить симуляцию
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Не все параметры заполнены</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              <p className="font-medium mb-2">
                Для запуска симуляции необходимо заполнить следующие параметры:
              </p>
              <div className="bg-destructive/10 rounded-md p-3 max-h-[400px] overflow-y-auto">
                <ol className="list-decimal list-inside space-y-2">
                  {validationErrors.map((error, idx) => (
                    <li key={idx} className="text-sm leading-relaxed">
                      {error}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {simulationLog && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Результаты симуляции</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadLog}
              >
                <Download className="w-4 h-4 mr-2" />
                Сохранить лог
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="costs" className="w-full">
              <TabsList className="grid w-full max-w-5xl grid-cols-6">
                <TabsTrigger value="costs">Структура затрат</TabsTrigger>
                <TabsTrigger value="operations-total">Затраты по операциям</TabsTrigger>
                <TabsTrigger value="operations-labor">Зарплаты по операциям</TabsTrigger>
                <TabsTrigger value="tree">Древовидный вид</TabsTrigger>
                <TabsTrigger value="table">Таблица</TabsTrigger>
                <TabsTrigger value="text">Текстовый лог</TabsTrigger>
              </TabsList>
              <TabsContent value="costs" className="mt-4">
                {operationBreakdown.length > 0 ? (
                  <CostBreakdownChart 
                    operations={operationBreakdown}
                    totalCosts={totalCosts}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    Запустите симуляцию, чтобы увидеть структуру затрат
                  </div>
                )}
              </TabsContent>
              <TabsContent value="operations-total" className="mt-4">
                {operationBreakdown.length > 0 ? (
                  <OperationsTotalCostChart 
                    operations={operationBreakdown}
                    totalCosts={totalCosts}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    Запустите симуляцию, чтобы увидеть затраты по операциям
                  </div>
                )}
              </TabsContent>
              <TabsContent value="operations-labor" className="mt-4">
                {operationBreakdown.length > 0 ? (
                  <OperationsLaborCostChart 
                    operations={operationBreakdown}
                    totalCosts={totalCosts}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    Запустите симуляцию, чтобы увидеть зарплаты по операциям
                  </div>
                )}
              </TabsContent>
              <TabsContent value="tree" className="mt-4 border rounded-lg p-4 max-h-[600px] overflow-auto">
                <TreeLogViewer log={simulationLog} />
              </TabsContent>
              <TabsContent value="table" className="mt-4">
                <TableLogViewer log={simulationLog} />
              </TabsContent>
              <TabsContent value="text" className="mt-4">
                <Textarea
                  value={simulationLog}
                  readOnly
                  className="font-mono text-sm min-h-[400px] max-h-[600px]"
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <EmployeeSelectionDialog
        open={employeeDialogOpen}
        onOpenChange={setEmployeeDialogOpen}
        onConfirm={runSimulationV2WithEmployees}
      />
    </div>
  );
}
