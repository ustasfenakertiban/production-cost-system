
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  name: string;
  orderDate: string;
}

interface OrderDialogProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function OrderDialog({ order, open, onClose }: OrderDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    orderDate: "",
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (order) {
      const date = new Date(order.orderDate);
      const formattedDate = date.toISOString().split("T")[0];
      setFormData({
        name: order.name,
        orderDate: formattedDate,
      });
    } else {
      // Устанавливаем дату только на клиенте, чтобы избежать ошибки гидратации
      const today = new Date().toISOString().split("T")[0];
      setFormData({
        name: "",
        orderDate: today,
      });
    }
  }, [order, open]); // Добавили open в зависимости

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = order ? `/api/orders/${order.id}` : "/api/orders";
      const method = order ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: order ? "Заказ обновлён" : "Заказ создан",
        });
        onClose();
      } else {
        throw new Error("Ошибка сохранения");
      }
    } catch (error) {
      console.error("Ошибка сохранения заказа:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить заказ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {order ? "Редактировать заказ" : "Создать заказ"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название заказа *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Введите название заказа"
              required
            />
          </div>

          <div>
            <Label htmlFor="orderDate">Дата приёма *</Label>
            <Input
              id="orderDate"
              type="date"
              value={formData.orderDate}
              onChange={(e) => handleChange("orderDate", e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
