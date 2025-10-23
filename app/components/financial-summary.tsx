
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface FinancialSummaryProps {
  orderId: string;
  orderQuantity: number;
  cashEnding: number;
  totalDays: number;
  totalPeriodicCost: number;
  includeRecurringExpenses?: boolean;
}

interface SimulationSettings {
  sellingPriceWithVAT?: number;
  vatRate: number;
  profitTaxRate: number;
  includeRecurringExpenses: boolean;
}

interface PeriodicExpense {
  id: string;
  name: string;
  period: "DAY" | "WEEK" | "MONTH" | "QUARTER" | "YEAR";
  amount: number;
  isActive: boolean;
  vatRate: number;
}

export default function FinancialSummary({
  orderId,
  orderQuantity,
  cashEnding,
  totalDays,
  totalPeriodicCost,
  includeRecurringExpenses: includeRecurringExpensesProp,
}: FinancialSummaryProps) {
  const [settings, setSettings] = useState<SimulationSettings | null>(null);
  const [periodicExpenses, setPeriodicExpenses] = useState<PeriodicExpense[]>([]);
  const [includeRecurringExpenses, setIncludeRecurringExpenses] = useState(includeRecurringExpensesProp ?? false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [orderId]);

  const loadData = async () => {
    try {
      // Загружаем настройки симуляции
      const settingsResponse = await fetch(`/api/simulation-settings-v2?orderId=${orderId}`);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
        setIncludeRecurringExpenses(settingsData?.includeRecurringExpenses ?? false);
      }

      // Загружаем периодические расходы
      const expensesResponse = await fetch("/api/recurring-expenses");
      if (expensesResponse.ok) {
        const expensesData = await expensesResponse.json();
        setPeriodicExpenses(expensesData.filter((e: PeriodicExpense) => e.isActive));
      }
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Загрузка финансовых данных...
        </CardContent>
      </Card>
    );
  }

  // Расчет суммы заказа
  const orderTotal = settings.sellingPriceWithVAT 
    ? settings.sellingPriceWithVAT * orderQuantity
    : 0;

  // Остаток средств после производства
  const remainingAfterProduction = cashEnding;

  // Расчет периодических расходов с приведением к дням
  let dailyPeriodicExpenses = 0;
  const periodicExpenseDetails: Array<{
    name: string;
    amount: number;
    period: string;
    dailyAmount: number;
    totalForPeriod: number;
  }> = [];

  if (includeRecurringExpenses) {
    periodicExpenses.forEach((expense) => {
      let divisor = 1;
      let periodName = "";
      
      switch (expense.period) {
        case "DAY":
          divisor = 1;
          periodName = "день";
          break;
        case "WEEK":
          divisor = 7;
          periodName = "неделя";
          break;
        case "MONTH":
          divisor = 30;
          periodName = "месяц";
          break;
        case "QUARTER":
          divisor = 90;
          periodName = "квартал";
          break;
        case "YEAR":
          divisor = 365;
          periodName = "год";
          break;
      }

      const dailyAmount = expense.amount / divisor;
      const totalForPeriod = dailyAmount * totalDays;
      
      dailyPeriodicExpenses += dailyAmount;
      periodicExpenseDetails.push({
        name: expense.name,
        amount: expense.amount,
        period: periodName,
        dailyAmount,
        totalForPeriod,
      });
    });
  }

  const totalPeriodicExpensesForOrder = dailyPeriodicExpenses * totalDays;

  // Остаток после вычитания периодических расходов
  const remainingAfterPeriodic = includeRecurringExpenses
    ? remainingAfterProduction - totalPeriodicExpensesForOrder
    : remainingAfterProduction;

  // Сумма НДС от общей суммы заказа
  const vatAmount = orderTotal * (settings.vatRate / 100) / (1 + settings.vatRate / 100);

  // Прибыль - НДС
  const profitBeforeTax = remainingAfterPeriodic - vatAmount;

  // Налог на прибыль
  const profitTaxAmount = profitBeforeTax > 0 ? profitBeforeTax * (settings.profitTaxRate / 100) : 0;

  // Чистая прибыль
  const netProfit = profitBeforeTax - profitTaxAmount;

  // Маржа в %
  const marginPercent = orderTotal > 0 ? (netProfit / orderTotal) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Финансовые итоги</CardTitle>
        <CardDescription>
          Детальный анализ финансовых результатов выполнения заказа
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Сумма заказа */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Сумма заказа</span>
            <span className="text-2xl font-bold text-blue-600">
              {orderTotal.toFixed(2)} ₽
            </span>
          </div>
          {!settings.sellingPriceWithVAT && (
            <p className="text-sm text-muted-foreground">
              ⚠️ Продажная цена с НДС не указана в настройках симуляции v2
            </p>
          )}
        </div>

        <Separator />

        {/* Остаток средств после производства */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Остаток средств после производства</span>
            <span className={`text-xl font-semibold ${remainingAfterProduction >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {remainingAfterProduction.toFixed(2)} ₽
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Денежные средства на счету после всех производственных расходов
          </p>
        </div>

        <Separator />

        {/* Чекбокс учитывать периодические расходы */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeRecurringExpenses"
              checked={includeRecurringExpenses}
              onCheckedChange={(checked) => setIncludeRecurringExpenses(checked as boolean)}
            />
            <Label htmlFor="includeRecurringExpenses" className="cursor-pointer font-medium">
              Учитывать периодические расходы
            </Label>
          </div>

          {includeRecurringExpenses && (
            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
              <div className="text-sm font-medium">Расчет периодических расходов:</div>
              
              {periodicExpenseDetails.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {periodicExpenseDetails.map((detail, idx) => (
                      <div key={idx} className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{detail.name}</span>
                          <span>{detail.amount.toFixed(2)} ₽ / {detail.period}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground pl-4">
                          <span>В день: {detail.dailyAmount.toFixed(2)} ₽</span>
                          <span>За {totalDays} дн.: {detail.totalForPeriod.toFixed(2)} ₽</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Сумма периодических расходов</span>
                    <span className="text-red-600">
                      {totalPeriodicExpensesForOrder.toFixed(2)} ₽
                    </span>
                  </div>

                  <div className="flex justify-between font-semibold pt-2">
                    <span>Остаток после вычитания периодических расходов</span>
                    <span className={remainingAfterPeriodic >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {remainingAfterPeriodic.toFixed(2)} ₽
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Нет активных периодических расходов
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Сумма НДС */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Сумма НДС ({settings.vatRate}% от общей суммы заказа)</span>
            <span className="text-lg font-semibold text-orange-600">
              {vatAmount.toFixed(2)} ₽
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            НДС, который необходимо уплатить с выручки
          </p>
        </div>

        <Separator />

        {/* Прибыль - НДС */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Прибыль - НДС</span>
            <span className={`text-lg font-semibold ${profitBeforeTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitBeforeTax.toFixed(2)} ₽
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Остаток средств минус сумма НДС
          </p>
        </div>

        <Separator />

        {/* Налог на прибыль */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Налог на прибыль ({settings.profitTaxRate}%)</span>
            <span className="text-lg font-semibold text-orange-600">
              {profitTaxAmount.toFixed(2)} ₽
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Налог, который необходимо уплатить с прибыли
          </p>
        </div>

        <Separator />

        {/* Чистая прибыль */}
        <div className="space-y-2 bg-primary/5 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">Чистая прибыль</span>
            <span className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netProfit.toFixed(2)} ₽
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Остаток после налога на прибыль
          </p>
        </div>

        <Separator />

        {/* Маржа в % */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Маржа</span>
            <span className={`text-2xl font-bold ${marginPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {marginPercent.toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Чистая прибыль от общей суммы заказа
          </p>
          
          {/* Индикатор маржи */}
          <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
            <div
              className={`h-4 rounded-full transition-all ${
                marginPercent >= 20 ? 'bg-green-500' :
                marginPercent >= 10 ? 'bg-yellow-500' :
                marginPercent >= 0 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(Math.max(marginPercent, 0), 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Примечание */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Примечание:</strong> Все расчеты основаны на данных симуляции и настройках, указанных в форме "Настройки симуляции v2". 
            Для изменения ставок НДС и налога на прибыль, а также продажной цены, перейдите в соответствующую форму настроек.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
