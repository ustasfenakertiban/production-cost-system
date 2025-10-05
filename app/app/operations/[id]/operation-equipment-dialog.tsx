
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

interface Equipment {
  id: string;
  name: string;
  hourlyDepreciation: number;
  maxProductivity?: number | null;
  productivityUnits?: string | null;
}

interface OperationEquipment {
  id: string;
  equipmentId: string;
  machineTime: number;
  machineTimeSeconds?: number;
  piecesPerHour?: number;
  hourlyRate: number;
  totalCost: number;
  variance?: number;
  comment?: string;
  enabled: boolean;
  requiresContinuousOperation: boolean;
  equipment: Equipment;
}

interface OperationEquipmentDialogProps {
  equipment: OperationEquipment | null;
  operationId: string;
  estimatedProductivityPerHour?: number;
  open: boolean;
  onClose: () => void;
}

export function OperationEquipmentDialog({ equipment, operationId, estimatedProductivityPerHour, open, onClose }: OperationEquipmentDialogProps) {
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]);
  const [formData, setFormData] = useState({
    equipmentId: "",
    machineTime: "",
    machineTimeSeconds: "",
    piecesPerHour: "",
    hourlyRate: "",
    variance: "",
    comment: "",
    enabled: true,
    requiresContinuousOperation: true,
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
        machineTimeSeconds: equipment.machineTimeSeconds?.toString() || "",
        piecesPerHour: equipment.piecesPerHour?.toString() || "",
        hourlyRate: equipment.hourlyRate.toString(),
        variance: equipment.variance?.toString() || "",
        comment: equipment.comment || "",
        enabled: equipment.enabled ?? true,
        requiresContinuousOperation: equipment.requiresContinuousOperation ?? true,
      });
    } else {
      setFormData({
        equipmentId: "",
        machineTime: "",
        machineTimeSeconds: "",
        piecesPerHour: "",
        hourlyRate: "",
        variance: "",
        comment: "",
        enabled: true,
        requiresContinuousOperation: true,
      });
    }
  }, [equipment]);

  const loadEquipment = async () => {
    try {
      const response = await fetch('/api/equipment');
      if (response.ok) {
        const data = await response.json();
        // Сортируем по алфавиту
        const sortedData = data.sort((a: Equipment, b: Equipment) => 
          a.name.localeCompare(b.name, 'ru')
        );
        setAvailableEquipment(sortedData);
      }
    } catch (error) {
      console.error('Ошибка загрузки оборудования:', error);
    }
  };

  // Функции для преобразования времени
  // Обработчик изменения поля времени в часах
  const handleMachineTimeChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, machineTime: value };
      const hours = parseFloat(value);
      if (!isNaN(hours) && hours > 0) {
        // Пересчитываем секунды: секунды = часы * 3600
        newData.machineTimeSeconds = (hours * 3600).toFixed(2);
        // Пересчитываем штук в час: штук_в_час = 1 / часы
        newData.piecesPerHour = (1 / hours).toFixed(2);
      } else {
        newData.machineTimeSeconds = "";
        newData.piecesPerHour = "";
      }
      return newData;
    });
  };

  // Обработчик изменения поля времени в секундах
  const handleMachineTimeSecondsChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, machineTimeSeconds: value };
      const seconds = parseFloat(value);
      if (!isNaN(seconds) && seconds > 0) {
        // Пересчитываем часы: часы = секунды / 3600
        newData.machineTime = (seconds / 3600).toFixed(6);
        // Пересчитываем штук в час: штук_в_час = 3600 / секунды
        newData.piecesPerHour = (3600 / seconds).toFixed(2);
      } else {
        newData.machineTime = "";
        newData.piecesPerHour = "";
      }
      return newData;
    });
  };

  // Обработчик изменения поля штук в час
  const handlePiecesPerHourChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, piecesPerHour: value };
      const pieces = parseFloat(value);
      if (!isNaN(pieces) && pieces > 0) {
        // Пересчитываем часы: часы = 1 / штук_в_час
        newData.machineTime = (1 / pieces).toFixed(6);
        // Пересчитываем секунды: секунды = 3600 / штук_в_час
        newData.machineTimeSeconds = (3600 / pieces).toFixed(2);
      } else {
        newData.machineTime = "";
        newData.machineTimeSeconds = "";
      }
      return newData;
    });
  };

  // Заполнить время по расчётной производительности
  const fillByEstimatedProductivity = () => {
    if (estimatedProductivityPerHour && estimatedProductivityPerHour > 0) {
      const timePerOperationHours = 1 / estimatedProductivityPerHour;
      const timePerOperationSeconds = 3600 / estimatedProductivityPerHour;
      
      setFormData(prev => ({
        ...prev,
        machineTime: timePerOperationHours.toFixed(6),
        machineTimeSeconds: timePerOperationSeconds.toFixed(2),
        piecesPerHour: estimatedProductivityPerHour.toFixed(2)
      }));
      
      toast({
        title: "Время заполнено",
        description: `Рассчитано исходя из производительности ${estimatedProductivityPerHour} циклов/час`,
      });
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
        machineTimeSeconds: formData.machineTimeSeconds || null,
        piecesPerHour: formData.piecesPerHour || null,
        hourlyRate: formData.hourlyRate,
        variance: formData.variance || null,
        comment: formData.comment || null,
        enabled: formData.enabled,
        requiresContinuousOperation: formData.requiresContinuousOperation,
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

  const handleChange = (field: string, value: string | boolean) => {
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
                Производительность: {
                  selectedEquipment.maxProductivity && selectedEquipment.productivityUnits
                    ? `${selectedEquipment.maxProductivity} ${selectedEquipment.productivityUnits}`
                    : "Не указана"
                }
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="machineTime">Машинное время *</Label>
              {estimatedProductivityPerHour && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={fillByEstimatedProductivity}
                  className="text-xs h-7"
                >
                  Заполнить по расчётной
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="machineTime" className="text-sm text-gray-600">Часы</Label>
                <Input
                  id="machineTime"
                  type="number"
                  step="0.000001"
                  min="0"
                  value={formData.machineTime}
                  onChange={(e) => handleMachineTimeChange(e.target.value)}
                  placeholder="0.000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="machineTimeSeconds" className="text-sm text-gray-600">Секунды</Label>
                <Input
                  id="machineTimeSeconds"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.machineTimeSeconds}
                  onChange={(e) => handleMachineTimeSecondsChange(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="piecesPerHour" className="text-sm text-gray-600">Штук в час</Label>
                <Input
                  id="piecesPerHour"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.piecesPerHour}
                  onChange={(e) => handlePiecesPerHourChange(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            {estimatedProductivityPerHour && (
              <p className="text-xs text-gray-500">
                Расчётная производительность: {estimatedProductivityPerHour} циклов/час
              </p>
            )}
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

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => handleChange('enabled', checked)}
              />
              <Label htmlFor="enabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Включить в расчеты
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              (отключенное оборудование не учитывается при расчете стоимости)
            </p>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresContinuousOperation"
                checked={formData.requiresContinuousOperation}
                onCheckedChange={(checked) => handleChange('requiresContinuousOperation', checked)}
              />
              <Label htmlFor="requiresContinuousOperation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Требуется непрерывная работа
              </Label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              (если отключено, оборудование освобождается после начальной настройки, иначе занято до конца операции)
            </p>
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
