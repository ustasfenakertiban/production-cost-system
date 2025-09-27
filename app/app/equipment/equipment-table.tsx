
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EquipmentDialog } from "./equipment-dialog";

interface Equipment {
  id: string;
  name: string;
  estimatedCost: number;
  hourlyDepreciation: number;
  maxProductivity: number;
  productivityUnits: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export function EquipmentTable() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки оборудования:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список оборудования",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это оборудование?')) {
      return;
    }

    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Оборудование удалено",
        });
        loadEquipment();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления оборудования:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить оборудование",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEquipment(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEquipment(null);
    loadEquipment();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-600" />
          <span className="font-medium">Всего единиц: {equipment.length}</span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить оборудование
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-semibold">Название</th>
              <th className="text-right p-3 font-semibold">Стоимость</th>
              <th className="text-right p-3 font-semibold">Амортизация/час</th>
              <th className="text-right p-3 font-semibold">Производительность</th>
              <th className="text-left p-3 font-semibold">Комментарий</th>
              <th className="text-center p-3 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium">{item.name}</div>
                </td>
                <td className="p-3 text-right">
                  <Badge variant="secondary">
                    {item.estimatedCost.toLocaleString('ru-RU')} ₽
                  </Badge>
                </td>
                <td className="p-3 text-right">
                  {item.hourlyDepreciation.toFixed(2)} ₽
                </td>
                <td className="p-3 text-right">
                  <div className="text-sm">
                    <div className="font-medium">{item.maxProductivity}</div>
                    <div className="text-gray-500">{item.productivityUnits}</div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-600 max-w-xs truncate">
                    {item.comment || "—"}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {equipment.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Оборудование не найдено</p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            Добавить первое оборудование
          </Button>
        </div>
      )}

      <EquipmentDialog
        equipment={editingEquipment}
        open={dialogOpen}
        onClose={handleDialogClose}
      />
    </>
  );
}
