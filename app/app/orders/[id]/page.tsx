
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { OrderItemDialog } from "./order-item-dialog";
import SimulationPanel from "./simulation-panel";

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
    product: {
      name: string;
    };
  };
}

interface Order {
  id: string;
  name: string;
  orderDate: string;
  orderItems: OrderItem[];
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки заказа:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить заказ",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Удалить позицию из заказа?")) return;

    try {
      const response = await fetch(`/api/order-items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Позиция удалена",
        });
        fetchOrder();
      }
    } catch (error) {
      console.error("Ошибка удаления позиции:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить позицию",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = (item: OrderItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedItem(null);
    fetchOrder();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Заказ не найден</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Link href="/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к заказам
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{order.name}</CardTitle>
          <CardDescription>
            Дата приёма: {new Date(order.orderDate).toLocaleDateString("ru-RU")}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Позиции заказа</CardTitle>
              <CardDescription>
                Товары и тиражи в заказе
              </CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Добавить товар
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!order.orderItems || order.orderItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Нет товаров в заказе. Добавьте первый товар.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Товар</TableHead>
                  <TableHead>Тираж</TableHead>
                  <TableHead>Технологический процесс</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.orderItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.product?.name || "—"}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {item.productionProcess?.name || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditItem(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <OrderItemDialog
        orderItem={selectedItem}
        orderId={params.id}
        open={dialogOpen}
        onClose={handleDialogClose}
      />

      <div className="mt-8">
        <SimulationPanel orderId={params.id} />
      </div>
    </div>
  );
}
