
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Material {
  id: string;
  name: string;
  unit: string;
  cost: number;
  category: {
    name: string;
  };
}

interface OperationMaterial {
  id: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  variance?: number;
  comment?: string;
  enabled: boolean;
  material: Material;
}

interface OperationMaterialDialogProps {
  material: OperationMaterial | null;
  operationId: string;
  open: boolean;
  onClose: () => void;
}

export function OperationMaterialDialog({ material, operationId, open, onClose }: OperationMaterialDialogProps) {
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [formData, setFormData] = useState({
    materialId: "",
    quantity: "",
    unitPrice: "",
    variance: "",
    comment: "",
    enabled: true,
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadMaterials();
    }
  }, [open]);

  useEffect(() => {
    if (material) {
      setFormData({
        materialId: material.materialId,
        quantity: material.quantity.toString(),
        unitPrice: material.unitPrice.toString(),
        variance: material.variance?.toString() || "",
        comment: material.comment || "",
        enabled: material.enabled ?? true,
      });
    } else {
      setFormData({
        materialId: "",
        quantity: "",
        unitPrice: "",
        variance: "",
        comment: "",
        enabled: true,
      });
    }
  }, [material]);

  const loadMaterials = async () => {
    try {
      const response = await fetch('/api/materials');
      if (response.ok) {
        const data = await response.json();
        setAvailableMaterials(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        operationId,
        materialId: formData.materialId,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        variance: formData.variance || null,
        comment: formData.comment || null,
        enabled: formData.enabled,
      };

      const url = material ? `/api/operation-materials/${material.id}` : '/api/operation-materials';
      const method = material ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: "Успешно",
          description: material ? "Материал обновлен" : "Материал добавлен",
        });
        onClose();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения материала:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить материал",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialChange = (materialId: string) => {
    const selectedMaterial = availableMaterials.find(m => m.id === materialId);
    if (selectedMaterial) {
      setFormData(prev => ({
        ...prev,
        materialId,
        unitPrice: selectedMaterial.cost.toString(),
      }));
    }
  };

  const getTotalCost = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    return quantity * unitPrice;
  };

  const selectedMaterial = availableMaterials.find(m => m.id === formData.materialId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {material ? 'Редактировать материал' : 'Добавить материал'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="materialId">Материал *</Label>
            <Select value={formData.materialId} onValueChange={handleMaterialChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите материал" />
              </SelectTrigger>
              <SelectContent>
                {availableMaterials.map((mat) => (
                  <SelectItem key={mat.id} value={mat.id}>
                    {mat.name} ({mat.category.name}) - {mat.cost} ₽/{mat.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMaterial && (
              <div className="text-sm text-gray-500 mt-1">
                Единица измерения: {selectedMaterial.unit}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="quantity">Количество *</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              placeholder="Введите количество"
              required
            />
          </div>

          <div>
            <Label htmlFor="unitPrice">Цена за единицу *</Label>
            <Input
              id="unitPrice"
              type="number"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => handleChange('unitPrice', e.target.value)}
              placeholder="Цена за единицу"
              required
            />
          </div>

          <div>
            <Label htmlFor="variance">Разброс (%)</Label>
            <Input
              id="variance"
              type="number"
              step="0.1"
              value={formData.variance}
              onChange={(e) => handleChange('variance', e.target.value)}
              placeholder="Разброс в процентах"
            />
          </div>

          <div>
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              placeholder="Дополнительные комментарии"
              rows={2}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) => handleChange('enabled', checked)}
            />
            <Label htmlFor="enabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Включить в расчеты
            </Label>
            <p className="text-sm text-gray-500">
              (отключенные материалы не учитываются при расчете стоимости)
            </p>
          </div>

          {formData.quantity && formData.unitPrice && (
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm text-gray-600">Общая стоимость:</div>
              <div className="text-lg font-bold text-green-600">
                {getTotalCost().toLocaleString('ru-RU', {
                  style: 'currency',
                  currency: 'RUB',
                })}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !formData.materialId || !formData.quantity || !formData.unitPrice}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
