
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
}

interface ProductionProcess {
  id: string;
  name: string;
  productId: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
  };
  productionProcess: {
    id: string;
    name: string;
  };
}

interface OrderItemDialogProps {
  orderItem: OrderItem | null;
  orderId: string;
  open: boolean;
  onClose: () => void;
}

export function OrderItemDialog({
  orderItem,
  orderId,
  open,
  onClose,
}: OrderItemDialogProps) {
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    productionProcessId: "",
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [productionProcesses, setProductionProcesses] = useState<
    ProductionProcess[]
  >([]);
  const [filteredProcesses, setFilteredProcesses] = useState<
    ProductionProcess[]
  >([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchProductionProcesses();
  }, []);

  useEffect(() => {
    if (orderItem) {
      setFormData({
        productId: orderItem.product?.id || "",
        quantity: orderItem.quantity?.toString() || "",
        productionProcessId: orderItem.productionProcess?.id || "",
      });
    } else {
      setFormData({
        productId: "",
        quantity: "",
        productionProcessId: "",
      });
    }
  }, [orderItem]);

  useEffect(() => {
    if (formData.productId) {
      const filtered = productionProcesses.filter(
        (p) => p.productId === formData.productId
      );
      setFilteredProcesses(filtered);
      
      // Если выбранный процесс не подходит к выбранному продукту, сбрасываем
      if (formData.productionProcessId) {
        const isValid = filtered.some(p => p.id === formData.productionProcessId);
        if (!isValid) {
          setFormData(prev => ({ ...prev, productionProcessId: "" }));
        }
      }
    } else {
      setFilteredProcesses([]);
    }
  }, [formData.productId, productionProcesses]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки товаров:", error);
    }
  };

  const fetchProductionProcesses = async () => {
    try {
      const response = await fetch("/api/production-processes");
      if (response.ok) {
        const data = await response.json();
        setProductionProcesses(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки процессов:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        orderId,
        ...formData,
      };

      const url = orderItem
        ? `/api/order-items/${orderItem.id}`
        : "/api/order-items";
      const method = orderItem ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: orderItem ? "Позиция обновлена" : "Позиция добавлена",
        });
        onClose();
      } else {
        throw new Error("Ошибка сохранения");
      }
    } catch (error) {
      console.error("Ошибка сохранения позиции:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить позицию",
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
            {orderItem ? "Редактировать позицию" : "Добавить товар в заказ"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="productId">Товар *</Label>
            <Select
              value={formData.productId}
              onValueChange={(value) => handleChange("productId", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите товар" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Тираж (количество) *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
              placeholder="Введите количество"
              required
            />
          </div>

          <div>
            <Label htmlFor="productionProcessId">Технологический процесс *</Label>
            <Select
              value={formData.productionProcessId}
              onValueChange={(value) =>
                handleChange("productionProcessId", value)
              }
              required
              disabled={!formData.productId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите процесс" />
              </SelectTrigger>
              <SelectContent>
                {filteredProcesses.length === 0 ? (
                  <SelectItem value="no-processes" disabled>
                    Нет процессов для выбранного товара
                  </SelectItem>
                ) : (
                  filteredProcesses.map((process) => (
                    <SelectItem key={process.id} value={process.id}>
                      {process.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!formData.productId && (
              <p className="text-xs text-gray-500 mt-1">
                Сначала выберите товар
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.productId ||
                !formData.quantity ||
                !formData.productionProcessId
              }
            >
              {loading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
