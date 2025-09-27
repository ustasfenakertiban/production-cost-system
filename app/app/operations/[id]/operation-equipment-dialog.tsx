
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  name: string;
  hourlyDepreciation: number;
  maxProductivity: number;
  productivityUnits: string;
}

interface OperationEquipment {
  id: string;
  equipmentId: string;
  machineTime: number;
  hourlyRate: number;
  totalCost: number;
  variance?: number;
  equipment: Equipment;
}

interface OperationEquipmentDialogProps {
  equipment: OperationEquipment | null;
  operationId: string;
  open: boolean;
  onClose: () => void;
}

export function OperationEquipmentDialog({ equipment, operationId, open, onClose }: OperationEquipmentDialogProps) {
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [formData, setFormData] = useState({
    equipmentId: "",
    machineTime: "",
    hourlyRate: "",
    variance: "",
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadEquipment();
    }
  }, [open]);

  useEffect(() => {
    if (equipment) {
      setFormData({
        equipmentId: equipment.equipmentId,
        machineTime: equipment.machineTime.toString(),
        hourlyRate: equipment.hourlyRate.toString(),
        variance: equipment.variance?.toString() || "",
      });
    } else {
      setFormData({
        equipmentId: "",
        machineTime: "",
        hourlyRate: "",
        variance: "",
      });
    }
  }, [equipment]);

  const loadEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        setAvailableEquipment(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки оборудования:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        operationId,
        equipmentId: formData.equipmentId,
        machineTime: formData.machineTime,
        hourlyRate: formData.hourlyRate,
        variance: formData.variance || null,
      };

      const url = equipment ? `/api/operation-equipment/${equipment.id}` : '/api/operation-equipment';
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

  const handleEquipmentChange = (equipmentId: string) => {
    const selectedEquipment = availableEquipment.find(e => e.id === equipmentId);
    if (selectedEquipment) {
      setFormData(prev => ({
        ...prev,
        equipmentId,
        hourlyRate: selectedEquipment.hourlyDepreciation.toString(),
      }));
    }
  };

  const getTotalCost = () => {
    const machineTime = parseFloat(formData.machineTime) || 0;
    const hourlyRate = parseFloat(formData.hourlyRate) || 0;
    return machineTime * hourlyRate;
  };

  const selectedEquipment = availableEquipment.find(e => e.id === formData.equipmentId);

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
            <Label htmlFor="equipmentId">Оборудование *</Label>
            <Select value={formData.equipmentId} onValueChange={handleEquipmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите оборудование" />
              </SelectTrigger>
              <SelectContent>
                {availableEquipment.map((eq) => (
                  <SelectItem key={eq.id} value={eq.id}>
                    {eq.name} ({eq.hourlyDepreciation} ₽/ч)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEquipment && (
              <div className="text-sm text-gray-500 mt-1">
                Производительность: {selectedEquipment.maxProductivity} {selectedEquipment.productivityUnits}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="machineTime">Машинное время (часы) *</Label>
            <Input
              id="machineTime"
              type="number"
              step="0.01"
              value={formData.machineTime}
              onChange={(e) => handleChange('machineTime', e.target.value)}
              placeholder="Время работы оборудования"
              required
            />
          </div>

          <div>
            <Label htmlFor="hourlyRate">Ставка в час *</Label>
            <Input
              id="hourlyRate"
              type="number"
              step="0.01"
              value={formData.hourlyRate}
              onChange={(e) => handleChange('hourlyRate', e.target.value)}
              placeholder="Стоимость часа работы"
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

          {formData.machineTime && formData.hourlyRate && (
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
            <Button type="submit" disabled={loading || !formData.equipmentId || !formData.machineTime || !formData.hourlyRate}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
