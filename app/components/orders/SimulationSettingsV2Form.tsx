
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SimulationSettingsV2 {
  id?: string;
  orderId: string;
  workingHoursPerDay: number;
  restMinutesPerHour: number;
  sellingPriceWithVAT?: number;
  vatRate: number;
  profitTaxRate: number;
  includeRecurringExpenses: boolean;
  waitForMaterialDelivery: boolean;
  payEmployeesForIdleTime: boolean;
}

interface Props {
  orderId: string;
}

export function SimulationSettingsV2Form({ orderId }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SimulationSettingsV2>({
    orderId,
    workingHoursPerDay: 8,
    restMinutesPerHour: 0,
    vatRate: 20,
    profitTaxRate: 20,
    includeRecurringExpenses: false,
    waitForMaterialDelivery: true,
    payEmployeesForIdleTime: false,
  });

  useEffect(() => {
    loadSettings();
  }, [orderId]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/simulation-settings-v2?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setSettings(data);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки настроек:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/simulation-settings-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Настройки симуляции v2 сохранены",
        });
        loadSettings();
      } else {
        throw new Error("Ошибка сохранения");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки симуляции v2</CardTitle>
        <CardDescription>
          Параметры для расчета производства по новому алгоритму
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="workingHoursPerDay">Рабочих часов в день</Label>
            <Input
              id="workingHoursPerDay"
              type="number"
              step="0.1"
              value={settings.workingHoursPerDay}
              onChange={(e) =>
                setSettings({ ...settings, workingHoursPerDay: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restMinutesPerHour">Минут отдыха в час</Label>
            <Input
              id="restMinutesPerHour"
              type="number"
              step="1"
              value={settings.restMinutesPerHour}
              onChange={(e) =>
                setSettings({ ...settings, restMinutesPerHour: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sellingPriceWithVAT">Продажная цена с НДС</Label>
            <Input
              id="sellingPriceWithVAT"
              type="number"
              step="0.01"
              value={settings.sellingPriceWithVAT || ""}
              onChange={(e) =>
                setSettings({ ...settings, sellingPriceWithVAT: parseFloat(e.target.value) || undefined })
              }
              placeholder="Не указана"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vatRate">Ставка НДС, %</Label>
            <Input
              id="vatRate"
              type="number"
              step="0.1"
              value={settings.vatRate}
              onChange={(e) =>
                setSettings({ ...settings, vatRate: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profitTaxRate">Ставка налога на прибыль, %</Label>
            <Input
              id="profitTaxRate"
              type="number"
              step="0.1"
              value={settings.profitTaxRate}
              onChange={(e) =>
                setSettings({ ...settings, profitTaxRate: parseFloat(e.target.value) || 0 })
              }
            />
          </div>

          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeRecurringExpenses"
                checked={settings.includeRecurringExpenses}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, includeRecurringExpenses: checked as boolean })
                }
              />
              <Label htmlFor="includeRecurringExpenses" className="cursor-pointer">
                Учитывать периодические расходы
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="waitForMaterialDelivery"
                checked={settings.waitForMaterialDelivery}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, waitForMaterialDelivery: checked as boolean })
                }
              />
              <Label htmlFor="waitForMaterialDelivery" className="cursor-pointer">
                Ждать поставку материалов
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="payEmployeesForIdleTime"
                checked={settings.payEmployeesForIdleTime}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, payEmployeesForIdleTime: checked as boolean })
                }
              />
              <Label htmlFor="payEmployeesForIdleTime" className="cursor-pointer">
                Доплачивать сотрудникам за простой (округлять до часа)
              </Label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить настройки"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
