

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MaterialDialog } from "./material-dialog";

interface MaterialCategory {
  id: string;
  name: string;
}

interface Material {
  id: string;
  name: string;
  categoryId: string;
  unit: string;
  cost: number;
  vatPercentage: number;
  comment?: string;
  category: MaterialCategory;
  createdAt: string;
  updatedAt: string;
}

export function MaterialsTable() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список материалов",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот материал?')) {
      return;
    }

    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Материал удален",
        });
        loadMaterials();
      } else {
        throw new Error('Ошибка удаления');
      }
    } catch (error) {
      console.error('Ошибка удаления материала:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить материал",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingMaterial(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingMaterial(null);
    loadMaterials();
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
          <Package className="w-5 h-5 text-green-600" />
          <span className="font-medium">Всего материалов: {materials.length}</span>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить материал
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-3 font-semibold">Название</th>
              <th className="text-left p-3 font-semibold">Категория</th>
              <th className="text-center p-3 font-semibold">Единица</th>
              <th className="text-right p-3 font-semibold">Стоимость</th>
              <th className="text-center p-3 font-semibold">НДС</th>
              <th className="text-left p-3 font-semibold">Комментарий</th>
              <th className="text-center p-3 font-semibold">Действия</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr key={material.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium">{material.name}</div>
                </td>
                <td className="p-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    {material.category.name}
                  </Badge>
                </td>
                <td className="p-3 text-center">
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {material.unit}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="font-medium text-green-600">
                    {material.cost.toLocaleString('ru-RU', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} ₽
                  </div>
                  <div className="text-xs text-gray-500">за {material.unit}</div>
                </td>
                <td className="p-3 text-center">
                  <div className="text-sm">
                    <div className="font-medium text-orange-600">
                      {material.vatPercentage}%
                    </div>
                    {material.vatPercentage > 0 && (
                      <div className="text-xs text-gray-500">
                        {((material.cost * material.vatPercentage) / 100).toLocaleString('ru-RU', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })} ₽
                      </div>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="text-sm text-gray-600 max-w-xs truncate">
                    {material.comment || "—"}
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(material)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(material.id)}
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

      {materials.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Материалы не найдены</p>
          <Button variant="outline" className="mt-4" onClick={handleAdd}>
            Добавить первый материал
          </Button>
        </div>
      )}

      <MaterialDialog
        material={editingMaterial}
        open={dialogOpen}
        onClose={handleDialogClose}
      />
    </>
  );
}
