
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  name: string;
  estimatedCost: number;
  hourlyDepreciation: number;
  maxProductivity: number;
  productivityUnits: string;
  comment?: string;
}

interface EquipmentDialogProps {
  equipment: Equipment | null;
  open: boolean;
  onClose: () => void;
}

export function EquipmentDialog({ equipment, open, onClose }: EquipmentDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    estimatedCost: "",
    hourlyDepreciation: "",
    maxProductivity: "",
    productivityUnits: "",
    comment: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        estimatedCost: equipment.estimatedCost.toString(),
        hourlyDepreciation: equipment.hourlyDepreciation.toString(),
        maxProductivity: equipment.maxProductivity.toString(),
        productivityUnits: equipment.productivityUnits,
        comment: equipment.comment || "",
      });
    } else {
      setFormData({
        name: "",
        estimatedCost: "",
        hourlyDepreciation: "",
        maxProductivity: "",
        productivityUnits: "",
        comment: "",
      });
    }
  }, [equipment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        estimatedCost: parseFloat(formData.estimatedCost),
        hourlyDepreciation: parseFloat(formData.hourlyDepreciation),
        maxProductivity: parseFloat(formData.maxProductivity),
        productivityUnits: formData.productivityUnits,
        comment: formData.comment || null,
      };

      const url = equipment ? `/api/equipment/${equipment.id}` : '/api/equipment';
      const method = equipment ? 'PUT' : 'POST';

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
          description: equipment ? "Оборудование обновлено" : "Оборудование добавлено",
        });
        onClose();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения оборудования:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить оборудование",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {equipment ? 'Редактировать оборудование' : 'Добавить оборудование'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Введите название оборудования"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimatedCost">Стоимость (₽) *</Label>
              <Input
                id="estimatedCost"
                type="number"
                step="0.01"
                value={formData.estimatedCost}
                onChange={(e) => handleChange('estimatedCost', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="hourlyDepreciation">Амортизация/час (₽) *</Label>
              <Input
                id="hourlyDepreciation"
                type="number"
                step="0.01"
                value={formData.hourlyDepreciation}
                onChange={(e) => handleChange('hourlyDepreciation', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxProductivity">Производительность *</Label>
              <Input
                id="maxProductivity"
                type="number"
                step="0.01"
                value={formData.maxProductivity}
                onChange={(e) => handleChange('maxProductivity', e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <Label htmlFor="productivityUnits">Единицы *</Label>
              <Input
                id="productivityUnits"
                value={formData.productivityUnits}
                onChange={(e) => handleChange('productivityUnits', e.target.value)}
                placeholder="шт/час, м²/час"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleChange('comment', e.target.value)}
              placeholder="Дополнительная информация"
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
