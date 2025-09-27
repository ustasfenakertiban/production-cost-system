
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  paymentType: string;
  rate: number;
  totalCost: number;
  variance?: number;
  role: EmployeeRole;
}

interface OperationRoleDialogProps {
  role: OperationRole | null;
  operationId: string;
  open: boolean;
  onClose: () => void;
}

export function OperationRoleDialog({ role, operationId, open, onClose }: OperationRoleDialogProps) {
  const [availableRoles, setAvailableRoles] = useState<EmployeeRole[]>([]);
  const [formData, setFormData] = useState({
    roleId: "",
    timeSpent: "",
    paymentType: "",
    rate: "",
    variance: "",
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
        paymentType: role.paymentType,
        rate: role.rate.toString(),
        variance: role.variance?.toString() || "",
      });
    } else {
      setFormData({
        roleId: "",
        timeSpent: "",
        paymentType: "",
        rate: "",
        variance: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        operationId,
        roleId: formData.roleId,
        timeSpent: formData.timeSpent,
        paymentType: formData.paymentType,
        rate: formData.rate,
        variance: formData.variance || null,
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

  const handleChange = (field: string, value: string) => {
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

          <div>
            <Label htmlFor="timeSpent">Время работы (часы) *</Label>
            <Input
              id="timeSpent"
              type="number"
              step="0.01"
              value={formData.timeSpent}
              onChange={(e) => handleChange('timeSpent', e.target.value)}
              placeholder="Время работы на операции"
              required
            />
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
