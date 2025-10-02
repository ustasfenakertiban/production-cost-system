
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

interface EmployeeRole {
  id: string;
  name: string;
  paymentType: string;
  hourlyRate: number;
}

interface OperationRole {
  id: string;
  roleId: string;
  timeSpent: number;
  timeSpentSeconds?: number;
  piecesPerHour?: number;
  paymentType: string;
  rate: number;
  totalCost: number;
  variance?: number;
  comment?: string;
  enabled: boolean;
  role: EmployeeRole;
}

interface OperationRoleDialogProps {
  role: OperationRole | null;
  operationId: string;
  estimatedProductivityPerHour?: number;
  open: boolean;
  onClose: () => void;
}

export function OperationRoleDialog({ role, operationId, estimatedProductivityPerHour, open, onClose }: OperationRoleDialogProps) {
  const [availableRoles, setAvailableRoles] = useState<EmployeeRole[]>([]);
  const [formData, setFormData] = useState({
    roleId: "",
    timeSpent: "",
    timeSpentSeconds: "",
    piecesPerHour: "",
    paymentType: "",
    rate: "",
    variance: "",
    comment: "",
    enabled: true,
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadRoles();
    }
  }, [open]);

  useEffect(() => {
    if (role) {
      setFormData({
        roleId: role.roleId,
        timeSpent: role.timeSpent.toString(),
        timeSpentSeconds: role.timeSpentSeconds?.toString() || "",
        piecesPerHour: role.piecesPerHour?.toString() || "",
        paymentType: role.paymentType,
        rate: role.rate.toString(),
        variance: role.variance?.toString() || "",
        comment: role.comment || "",
        enabled: role.enabled ?? true,
      });
    } else {
      setFormData({
        roleId: "",
        timeSpent: "",
        timeSpentSeconds: "",
        piecesPerHour: "",
        paymentType: "",
        rate: "",
        variance: "",
        comment: "",
        enabled: true,
      });
    }
  }, [role]);

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setAvailableRoles(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки ролей:', error);
    }
  };

  // Функции для преобразования времени
  // Обработчик изменения поля времени в часах
  const handleTimeSpentChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, timeSpent: value };
      const hours = parseFloat(value);
      if (!isNaN(hours) && hours > 0) {
        // Пересчитываем секунды: секунды = часы * 3600
        newData.timeSpentSeconds = (hours * 3600).toFixed(2);
        // Пересчитываем штук в час: штук_в_час = 1 / часы
        newData.piecesPerHour = (1 / hours).toFixed(2);
      } else {
        newData.timeSpentSeconds = "";
        newData.piecesPerHour = "";
      }
      return newData;
    });
  };

  // Обработчик изменения поля времени в секундах
  const handleTimeSpentSecondsChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, timeSpentSeconds: value };
      const seconds = parseFloat(value);
      if (!isNaN(seconds) && seconds > 0) {
        // Пересчитываем часы: часы = секунды / 3600
        newData.timeSpent = (seconds / 3600).toFixed(6);
        // Пересчитываем штук в час: штук_в_час = 3600 / секунды
        newData.piecesPerHour = (3600 / seconds).toFixed(2);
      } else {
        newData.timeSpent = "";
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
        newData.timeSpent = (1 / pieces).toFixed(6);
        // Пересчитываем секунды: секунды = 3600 / штук_в_час
        newData.timeSpentSeconds = (3600 / pieces).toFixed(2);
      } else {
        newData.timeSpent = "";
        newData.timeSpentSeconds = "";
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
        timeSpent: timePerOperationHours.toFixed(6),
        timeSpentSeconds: timePerOperationSeconds.toFixed(2),
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
        roleId: formData.roleId,
        timeSpent: formData.timeSpent,
        timeSpentSeconds: formData.timeSpentSeconds || null,
        piecesPerHour: formData.piecesPerHour || null,
        paymentType: formData.paymentType,
        rate: formData.rate,
        variance: formData.variance || null,
        comment: formData.comment || null,
        enabled: formData.enabled,
      };

      const url = role ? `/api/operation-roles/${role.id}` : '/api/operation-roles';
      const method = role ? 'PUT' : 'POST';

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
          description: role ? "Роль обновлена" : "Роль добавлена",
        });
        onClose();
      } else {
        throw new Error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения роли:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить роль",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (roleId: string) => {
    const selectedRole = availableRoles.find(r => r.id === roleId);
    if (selectedRole) {
      setFormData(prev => ({
        ...prev,
        roleId,
        paymentType: selectedRole.paymentType,
        rate: selectedRole.hourlyRate.toString(),
      }));
    }
  };

  const getTotalCost = () => {
    const timeSpent = parseFloat(formData.timeSpent) || 0;
    const rate = parseFloat(formData.rate) || 0;
    return timeSpent * rate;
  };

  const getPaymentTypeLabel = (paymentType: string) => {
    switch (paymentType) {
      case 'HOURLY': return 'Почасовая';
      case 'PIECE_RATE': return 'Сдельная';
      default: return paymentType;
    }
  };

  const selectedRole = availableRoles.find(r => r.id === formData.roleId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {role ? 'Редактировать роль' : 'Добавить роль'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="roleId">Роль сотрудника *</Label>
            <Select value={formData.roleId} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите роль" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name} ({getPaymentTypeLabel(r.paymentType)} - {r.hourlyRate} ₽/ч)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="timeSpent">Время работы *</Label>
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
                <Label htmlFor="timeSpent" className="text-sm text-gray-600">Часы</Label>
                <Input
                  id="timeSpent"
                  type="number"
                  step="0.000001"
                  min="0"
                  value={formData.timeSpent}
                  onChange={(e) => handleTimeSpentChange(e.target.value)}
                  placeholder="0.000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="timeSpentSeconds" className="text-sm text-gray-600">Секунды</Label>
                <Input
                  id="timeSpentSeconds"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.timeSpentSeconds}
                  onChange={(e) => handleTimeSpentSecondsChange(e.target.value)}
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
            <Label htmlFor="paymentType">Тип оплаты *</Label>
            <Select value={formData.paymentType} onValueChange={(value) => handleChange('paymentType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип оплаты" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOURLY">Почасовая</SelectItem>
                <SelectItem value="PIECE_RATE">Сдельная</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="rate">Ставка *</Label>
            <Input
              id="rate"
              type="number"
              step="0.01"
              value={formData.rate}
              onChange={(e) => handleChange('rate', e.target.value)}
              placeholder="Ставка оплаты"
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
              (отключенные роли не учитываются при расчете стоимости)
            </p>
          </div>

          {formData.timeSpent && formData.rate && (
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
            <Button type="submit" disabled={loading || !formData.roleId || !formData.timeSpent || !formData.paymentType || !formData.rate}>
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
