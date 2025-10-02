
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
import { Play, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TreeLogViewer from "@/components/tree-log-viewer";
import TableLogViewer from "@/components/table-log-viewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SimulationPanelProps {
  orderId: string;
}

export type VarianceMode = 
  | "MAX" 
  | "MIN" 
  | "NONE" 
  | "RANDOM_POSITIVE" 
  | "RANDOM_FULL";

export interface SimulationParams {
  hoursPerDay: number;
  physicalWorkers: number;
  breakMinutesPerHour: number;
  varianceMode: VarianceMode;
}

export default function SimulationPanel({ orderId }: SimulationPanelProps) {
  const [params, setParams] = useState<SimulationParams>({
    hoursPerDay: 8,
    physicalWorkers: 5,
    breakMinutesPerHour: 15,
    varianceMode: "NONE",
  });
  const [simulationLog, setSimulationLog] = useState<string>("");
  const [isSimulating, setIsSimulating] = useState(false);
  const { toast } = useToast();

  const handleSimulate = async () => {
    setIsSimulating(true);
    setSimulationLog("");

    try {
      const response = await fetch(`/api/orders/${orderId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.missingParams) {
          toast({
            title: "Не все параметры заполнены",
            description: data.message,
            variant: "destructive",
          });
          setSimulationLog(data.details || data.message);
        } else {
          throw new Error(data.error || "Ошибка симуляции");
        }
        return;
      }

      setSimulationLog(data.log);
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
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
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
          </div>
        </CardContent>
      </Card>

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
            <Tabs defaultValue="tree" className="w-full">
              <TabsList className="grid w-full max-w-2xl grid-cols-3">
                <TabsTrigger value="tree">Древовидный вид</TabsTrigger>
                <TabsTrigger value="table">Таблица</TabsTrigger>
                <TabsTrigger value="text">Текстовый лог</TabsTrigger>
              </TabsList>
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
    </div>
  );
}
