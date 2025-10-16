
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Material {
  id: string;
  name: string;
  unit: string;
  cost: number;
}

interface MaterialPurchaseBatch {
  id?: string;
  orderId: string;
  materialId: string;
  material?: Material;
  quantity: number;
  pricePerUnit: number;
  totalCost: number;
  deliveryDay: number;
  status: string;
}

interface Props {
  orderId: string;
}

export function MaterialPurchaseBatchTable({ orderId }: Props) {
  const { toast } = useToast();
  const [batches, setBatches] = useState<MaterialPurchaseBatch[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [newBatch, setNewBatch] = useState<Partial<MaterialPurchaseBatch>>({
    orderId,
    deliveryDay: 1,
    quantity: 0,
    pricePerUnit: 0,
    status: "planned",
  });

  useEffect(() => {
    loadBatches();
    loadMaterials();
  }, [orderId]);

  const loadBatches = async () => {
    try {
      const response = await fetch(`/api/material-purchase-batches?orderId=${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки партий закупки:", error);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await fetch("/api/materials");
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Ошибка загрузки материалов:", error);
    }
  };

  const handleAdd = async () => {
    if (!newBatch.materialId || !newBatch.quantity || !newBatch.pricePerUnit || !newBatch.deliveryDay) {
      toast({
        title: "Ошибка",
        description: "Заполните все обязательные поля",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/material-purchase-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBatch),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Партия добавлена",
        });
        setNewBatch({ orderId, deliveryDay: 1, quantity: 0, pricePerUnit: 0, status: "planned" });
        loadBatches();
      } else {
        throw new Error("Ошибка добавления");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить партию",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/material-purchase-batches/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Партия удалена",
        });
        loadBatches();
      } else {
        throw new Error("Ошибка удаления");
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить партию",
        variant: "destructive",
      });
    }
  };

  const handleMaterialChange = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    setNewBatch({
      ...newBatch,
      materialId,
      pricePerUnit: material?.cost || 0,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Партии закупки материалов</CardTitle>
        <CardDescription>
          Укажите, в какой день какой материал и в каком количестве поступит
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Материал</TableHead>
              <TableHead>Количество</TableHead>
              <TableHead>Цена/ед.</TableHead>
              <TableHead>Итого</TableHead>
              <TableHead>День поступления</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[100px]">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>{batch.material?.name || "—"}</TableCell>
                <TableCell>
                  {batch.quantity} {batch.material?.unit || ""}
                </TableCell>
                <TableCell>{batch.pricePerUnit.toFixed(2)} ₽</TableCell>
                <TableCell>{batch.totalCost.toFixed(2)} ₽</TableCell>
                <TableCell>{batch.deliveryDay}</TableCell>
                <TableCell>
                  <span className={batch.status === "delivered" ? "text-green-600" : "text-orange-600"}>
                    {batch.status === "delivered" ? "Поступил" : "Запланирован"}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => batch.id && handleDelete(batch.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>
                <Select value={newBatch.materialId || ""} onValueChange={handleMaterialChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите материал" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.name} ({material.unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newBatch.quantity || ""}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, quantity: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Кол-во"
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newBatch.pricePerUnit || ""}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, pricePerUnit: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="Цена"
                  className="w-32"
                />
              </TableCell>
              <TableCell>
                {newBatch.quantity && newBatch.pricePerUnit
                  ? (newBatch.quantity * newBatch.pricePerUnit).toFixed(2)
                  : "—"}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="1"
                  value={newBatch.deliveryDay || ""}
                  onChange={(e) =>
                    setNewBatch({ ...newBatch, deliveryDay: parseInt(e.target.value) || 1 })
                  }
                  placeholder="День"
                  className="w-24"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={newBatch.status || "planned"}
                  onValueChange={(value) => setNewBatch({ ...newBatch, status: value })}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Запланирован</SelectItem>
                    <SelectItem value="delivered">Поступил</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button size="sm" onClick={handleAdd} disabled={loading}>
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
