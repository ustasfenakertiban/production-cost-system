
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PaymentSchedule {
  id?: string;
  orderId: string;
  dayNumber: number;
  percentageOfTotal: number;
  amount?: number;
  description?: string;
}

interface OrderInfo {
  quantity: number;
  sellingPrice: number;
  totalOrderAmount: number;
}

interface Props {
  orderId: string;
}

export function PaymentScheduleTable({ orderId }: Props) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<PaymentSchedule[]>([]);
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<PaymentSchedule>>({
    orderId,
    dayNumber: 1,
    percentageOfTotal: 0,
  });

  useEffect(() => {
    loadSchedules();
    loadOrderInfo();
  }, [orderId]);

  const loadSchedules = async () => {
    try {
      const response = await fetch(`/api/payment-schedules?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки графика платежей:", error);
    }
  };

  const loadOrderInfo = async () => {
    try {
      // Загружаем заказ с позициями
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (!orderResponse.ok) {
        console.error("Ошибка загрузки заказа");
        return;
      }
      const order = await orderResponse.json();
      
      // Загружаем настройки симуляции v2 с ценой продажи
      const settingsResponse = await fetch(`/api/simulation-settings-v2?orderId=${orderId}`);
      let sellingPrice = 0;
      if (settingsResponse.ok) {
        const settings = await settingsResponse.json();
        sellingPrice = settings?.sellingPriceWithVAT || 0;
      }
      
      // Считаем общее количество из всех позиций заказа
      const totalQuantity = (order.orderItems || []).reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      
      const totalOrderAmount = totalQuantity * sellingPrice;
      setOrderInfo({
        quantity: totalQuantity,
        sellingPrice: sellingPrice,
        totalOrderAmount,
      });
    } catch (error) {
      console.error("Ошибка загрузки информации о заказе:", error);
    }
  };

  // Пересчет суммы из процента
  const calculateAmountFromPercentage = (percentage: number): number => {
    if (!orderInfo) return 0;
    return (orderInfo.totalOrderAmount * percentage) / 100;
  };

  // Пересчет процента из суммы
  const calculatePercentageFromAmount = (amount: number): number => {
    if (!orderInfo || orderInfo.totalOrderAmount === 0) return 0;
    return (amount / orderInfo.totalOrderAmount) * 100;
  };

  // Обработчик изменения процента
  const handlePercentageChange = (value: number) => {
    const amount = calculateAmountFromPercentage(value);
    setNewSchedule({
      ...newSchedule,
      percentageOfTotal: value,
      amount,
    });
  };

  // Обработчик изменения суммы
  const handleAmountChange = (value: number) => {
    const percentage = calculatePercentageFromAmount(value);
    setNewSchedule({
      ...newSchedule,
      amount: value,
      percentageOfTotal: percentage,
    });
  };

  const handleAdd = async () => {
    if (!newSchedule.dayNumber || (!newSchedule.percentageOfTotal && !newSchedule.amount)) {
      toast({
        title: "Ошибка",
        description: "Заполните день и процент или сумму",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/payment-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSchedule),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Платеж добавлен",
        });
        setNewSchedule({ orderId, dayNumber: 1, percentageOfTotal: 0 });
        loadSchedules();
      } else {
        throw new Error("Ошибка добавления");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить платеж",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/payment-schedules/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Платеж удален",
        });
        loadSchedules();
      } else {
        throw new Error("Ошибка удаления");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить платеж",
        variant: "destructive",
      });
    }
  };

  const totalPercentage = schedules.reduce((sum, s) => sum + s.percentageOfTotal, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>График платежей</CardTitle>
        <CardDescription>
          {orderInfo && (
            <div className="mb-2">
              Тираж: {orderInfo.quantity} шт. × Продажная цена: {orderInfo.sellingPrice.toFixed(2)} ₽ = 
              <span className="font-semibold ml-1">Сумма заказа: {orderInfo.totalOrderAmount.toFixed(2)} ₽</span>
            </div>
          )}
          Укажите, в какой день и какой процент от суммы заказа должен поступить.
          {totalPercentage > 0 && (
            <span className={`ml-2 font-semibold ${totalPercentage > 100 ? "text-red-500" : "text-green-600"}`}>
              Итого: {totalPercentage.toFixed(1)}%
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>День</TableHead>
              <TableHead>Процент от суммы</TableHead>
              <TableHead>Сумма (₽)</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead className="w-[100px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell>{schedule.dayNumber}</TableCell>
                <TableCell>{schedule.percentageOfTotal.toFixed(2)}%</TableCell>
                <TableCell>
                  {schedule.amount 
                    ? schedule.amount.toFixed(2) 
                    : orderInfo 
                      ? calculateAmountFromPercentage(schedule.percentageOfTotal).toFixed(2)
                      : "—"}
                </TableCell>
                <TableCell>{schedule.description || "—"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => schedule.id && handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  value={newSchedule.dayNumber || ""}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, dayNumber: parseInt(e.target.value) || 1 })
                  }
                  placeholder="День"
                  className="w-24"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={newSchedule.percentageOfTotal?.toFixed(2) || ""}
                  onChange={(e) => handlePercentageChange(parseFloat(e.target.value) || 0)}
                  placeholder="Процент"
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  value={newSchedule.amount?.toFixed(2) || ""}
                  onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
                  placeholder="Сумма"
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="text"
                  value={newSchedule.description || ""}
                  onChange={(e) =>
                    setNewSchedule({ ...newSchedule, description: e.target.value })
                  }
                  placeholder="Описание"
                />
              </TableCell>
              <TableCell>
                <Button size="sm" onClick={handleAdd} disabled={loading || !orderInfo}>
                  <Plus className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
